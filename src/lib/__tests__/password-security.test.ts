import bcrypt from "bcryptjs";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { fakeDb } from "./fake-db";

type Token = Record<string, unknown>;
type Authorize = (
  credentials: Record<string, unknown>,
) => Promise<{ id: string } | null>;
type Jwt = (params: { token: Token; user?: unknown }) => Promise<Token | null>;

const mocks = vi.hoisted(() => {
  class RedirectError extends Error {
    constructor(public url: string) {
      super(`NEXT_REDIRECT ${url}`);
    }
  }

  return {
    RedirectError,
    authorize: undefined as Authorize | undefined,
    jwt: undefined as Jwt | undefined,
    currentUserId: null as string | null,
    resetLinks: [] as string[],
  };
});

vi.mock("@/lib/prisma", () => ({ prisma: fakeDb.client }));

vi.mock("next-auth", () => ({
  default: (config: {
    providers: { authorize: Authorize }[];
    callbacks: { jwt: Jwt };
  }) => {
    mocks.authorize = config.providers[0].authorize;
    mocks.jwt = config.callbacks.jwt;
    return {
      handlers: {},
      auth: async () =>
        mocks.currentUserId ? { user: { id: mocks.currentUserId } } : null,
      signIn: vi.fn(),
      signOut: async ({ redirectTo }: { redirectTo: string }) => {
        throw new mocks.RedirectError(redirectTo);
      },
    };
  },
}));

// Expose the options passed to Credentials() so `authorize` can be called.
vi.mock("next-auth/providers/credentials", () => ({
  default: (options: unknown) => options,
}));

vi.mock("next/navigation", () => ({
  redirect: (url: string) => {
    throw new mocks.RedirectError(url);
  },
}));

vi.mock("next/server", () => ({
  after: (callback: () => Promise<void>) => {
    void callback();
  },
}));

vi.mock("@/lib/email", () => ({
  sendPasswordResetEmail: async (_to: string, token: string) => {
    mocks.resetLinks.push(token);
  },
  sendPasswordChangedEmail: async () => {},
  sendSignInNotificationEmail: async () => {},
}));

vi.mock("@/lib/rate-limit", () => ({
  RATE_LIMIT_MESSAGE: "Too many attempts, please try again later.",
  checkRateLimit: async () => ({ limited: false, count: 1 }),
  getClientIp: async () => "127.0.0.1",
}));

// Imported after the mocks so they pick up the fakes above.
const { changePassword } = await import("@/lib/actions/change-password");
const { requestPasswordReset, resetPassword } =
  await import("@/lib/actions/reset-password");
const { generateResetToken, getResetTokenExpiry, hashResetToken } =
  await import("@/lib/reset-token");
const { getSessionVersion, isSessionStale } =
  await import("@/lib/session-invalidation");
await import("@/auth");

const OLD_PASSWORD = "OldPass1!";
const NEW_PASSWORD = "NewPass2!";
const OTHER_PASSWORD = "Other3!x";

let email: string;
let userId: string;
let emailCounter = 0;

async function signIn(password: string): Promise<Token | null> {
  const user = await mocks.authorize!({ email, password });
  if (!user) {
    return null;
  }
  return mocks.jwt!({ token: { sub: user.id }, user });
}

/** Runs the jwt callback like every request does. */
async function checkSession(token: Token): Promise<Token | null> {
  return mocks.jwt!({ token: { ...token } });
}

async function run<T>(action: Promise<T>): Promise<T | { redirect: string }> {
  try {
    return await action;
  } catch (error) {
    if (error instanceof mocks.RedirectError) {
      return { redirect: error.url };
    }
    throw error;
  }
}

function form(fields: Record<string, string>): FormData {
  const data = new FormData();
  for (const [key, value] of Object.entries(fields)) {
    data.set(key, value);
  }
  return data;
}

function changePasswordAsUser(currentPassword: string, newPassword: string) {
  mocks.currentUserId = userId;
  return run(
    changePassword(
      undefined,
      form({ currentPassword, newPassword, confirmPassword: newPassword }),
    ),
  );
}

function useResetLink(token: string, password: string) {
  return run(
    resetPassword(
      undefined,
      form({ token, password, confirmPassword: password }),
    ),
  );
}

async function requestResetLink(): Promise<string> {
  const before = mocks.resetLinks.length;
  await requestPasswordReset(undefined, form({ email }));
  // `after` callbacks run without being awaited, give them a tick to finish.
  await new Promise((resolve) => setTimeout(resolve, 0));
  expect(mocks.resetLinks.length).toBe(before + 1);
  return mocks.resetLinks[mocks.resetLinks.length - 1];
}

/** Stores an extra unused link, like two requests that ran concurrently. */
function addUnusedResetLink(): string {
  const token = generateResetToken();
  fakeDb.addResetToken({
    userId,
    tokenHash: hashResetToken(token),
    expiresAt: getResetTokenExpiry(),
  });
  return token;
}

async function passwordIs(password: string): Promise<boolean> {
  const hash = fakeDb.getUser(userId)?.passwordHash;
  return Boolean(hash) && bcrypt.compare(password, hash!);
}

const RESET_ALREADY_USED = {
  message:
    "This reset link has already been used. Request a new one to continue.",
  tone: "error",
  requestNewLink: true,
};

beforeEach(async () => {
  fakeDb.reset();
  mocks.currentUserId = null;
  mocks.resetLinks = [];
  // Every test happens inside one wall-clock second.
  vi.useFakeTimers({ toFake: ["Date"], now: new Date("2026-10-28T12:00:00Z") });

  email = `user${++emailCounter}@example.com`;
  userId = fakeDb.addUser({
    name: "Test User",
    email,
    passwordHash: await bcrypt.hash(OLD_PASSWORD, 4),
  }).id;
});

afterEach(() => {
  vi.useRealTimers();
});

describe("session revocation", () => {
  it("rejects a session from before a password change in the same second", async () => {
    const laptop = await signIn(OLD_PASSWORD);
    const phone = await signIn(OLD_PASSWORD);
    expect(await checkSession(laptop!)).not.toBeNull();

    expect(await changePasswordAsUser(OLD_PASSWORD, NEW_PASSWORD)).toEqual({
      redirect: "/login?passwordChanged=1",
    });

    expect(await checkSession(laptop!)).toBeNull();
    expect(await checkSession(phone!)).toBeNull();
  });

  it("accepts a new login right after a password change in the same second", async () => {
    await changePasswordAsUser(OLD_PASSWORD, NEW_PASSWORD);

    expect(await signIn(OLD_PASSWORD)).toBeNull();
    const session = await signIn(NEW_PASSWORD);
    expect(session).not.toBeNull();
    expect(await checkSession(session!)).not.toBeNull();
  });

  it("rejects a session from before a password reset in the same second", async () => {
    const session = await signIn(OLD_PASSWORD);
    const link = await requestResetLink();

    expect(await useResetLink(link, NEW_PASSWORD)).toEqual({
      redirect: "/login?reset=1",
    });

    expect(await checkSession(session!)).toBeNull();
  });

  it("accepts a new login right after a password reset in the same second", async () => {
    await useResetLink(await requestResetLink(), NEW_PASSWORD);

    const session = await signIn(NEW_PASSWORD);
    expect(session).not.toBeNull();
    expect(await checkSession(session!)).not.toBeNull();
  });

  it("rejects tokens without a version once the password has changed", async () => {
    const legacy = { sub: userId, id: userId };
    expect(await checkSession(legacy)).not.toBeNull();

    await changePasswordAsUser(OLD_PASSWORD, NEW_PASSWORD);

    expect(await checkSession(legacy)).toBeNull();
  });

  it("reads the current session version from the database for every check", async () => {
    expect(await getSessionVersion(userId)).toBe(0);

    await fakeDb.client.user.update({
      where: { id: userId },
      data: { sessionVersion: { increment: 1 } },
    });

    expect(await getSessionVersion(userId)).toBe(1);
  });

  it("does not reject a token newer than the current version", () => {
    expect(isSessionStale(1, 0)).toBe(false);
    expect(isSessionStale(0, 1)).toBe(true);
    expect(isSessionStale(undefined, 1)).toBe(true);
    expect(isSessionStale(undefined, 0)).toBe(false);
  });

  it("rejects a session whose user no longer exists", async () => {
    const session = await signIn(OLD_PASSWORD);
    const orphan = { ...session!, id: "deleted-user" };

    expect(isSessionStale(0, null)).toBe(true);
    expect(await checkSession(orphan)).toBeNull();
  });
});

describe("reset link invalidation", () => {
  it("accepts a valid unused reset link", async () => {
    const link = await requestResetLink();

    expect(await useResetLink(link, NEW_PASSWORD)).toEqual({
      redirect: "/login?reset=1",
    });
    expect(await passwordIs(NEW_PASSWORD)).toBe(true);
  });

  it("rejects the other of two requested links after one is used", async () => {
    const first = await requestResetLink();
    const second = await requestResetLink();

    expect(await useResetLink(second, NEW_PASSWORD)).toEqual({
      redirect: "/login?reset=1",
    });
    expect(await useResetLink(first, OTHER_PASSWORD)).toEqual(
      RESET_ALREADY_USED,
    );
    expect(await passwordIs(NEW_PASSWORD)).toBe(true);
  });

  it("rejects sibling links that were both unused when one is used", async () => {
    const first = addUnusedResetLink();
    const second = addUnusedResetLink();

    await useResetLink(first, NEW_PASSWORD);

    expect(await useResetLink(second, OTHER_PASSWORD)).toEqual(
      RESET_ALREADY_USED,
    );
    expect(await passwordIs(NEW_PASSWORD)).toBe(true);
    expect(fakeDb.getResetTokens(userId).every((t) => t.usedAt)).toBe(true);
  });

  it("rejects an outstanding link after a password change in settings", async () => {
    const link = await requestResetLink();

    await changePasswordAsUser(OLD_PASSWORD, NEW_PASSWORD);

    expect(await useResetLink(link, OTHER_PASSWORD)).toEqual(
      RESET_ALREADY_USED,
    );
    expect(await passwordIs(NEW_PASSWORD)).toBe(true);
  });

  it("does not let the same link set the password twice", async () => {
    const link = await requestResetLink();

    await useResetLink(link, NEW_PASSWORD);

    expect(await useResetLink(link, OTHER_PASSWORD)).toEqual(
      RESET_ALREADY_USED,
    );
    expect(await passwordIs(NEW_PASSWORD)).toBe(true);
    expect(fakeDb.getUser(userId)?.sessionVersion).toBe(1);
  });

  it("lets only one of two concurrent uses of the same link succeed", async () => {
    const link = await requestResetLink();

    const results = await Promise.all([
      useResetLink(link, NEW_PASSWORD),
      useResetLink(link, OTHER_PASSWORD),
    ]);

    expect(results).toContainEqual({ redirect: "/login?reset=1" });
    expect(results).toContainEqual(RESET_ALREADY_USED);
    expect(fakeDb.getUser(userId)?.sessionVersion).toBe(1);
  });

  it("lets only one of two concurrent sibling links succeed", async () => {
    const first = addUnusedResetLink();
    const second = addUnusedResetLink();

    const results = await Promise.all([
      useResetLink(first, NEW_PASSWORD),
      useResetLink(second, OTHER_PASSWORD),
    ]);

    expect(results).toContainEqual({ redirect: "/login?reset=1" });
    expect(results).toContainEqual(RESET_ALREADY_USED);
    expect(fakeDb.getUser(userId)?.sessionVersion).toBe(1);
  });
});

describe("atomic password updates", () => {
  it("keeps reset links and sessions when the settings update fails", async () => {
    const session = await signIn(OLD_PASSWORD);
    const link = await requestResetLink();
    fakeDb.failNext("user.update");

    expect(await changePasswordAsUser(OLD_PASSWORD, NEW_PASSWORD)).toEqual({
      message: "Something went wrong. Please try again.",
    });

    expect(await passwordIs(OLD_PASSWORD)).toBe(true);
    expect(fakeDb.getResetTokens(userId).some((t) => !t.usedAt)).toBe(true);
    expect(await checkSession(session!)).not.toBeNull();
    expect(await useResetLink(link, NEW_PASSWORD)).toEqual({
      redirect: "/login?reset=1",
    });
  });

  it("keeps the reset link usable when the reset update fails", async () => {
    const link = await requestResetLink();
    fakeDb.failNext("user.update");

    await useResetLink(link, NEW_PASSWORD);

    expect(await passwordIs(OLD_PASSWORD)).toBe(true);
    expect(fakeDb.getResetTokens(userId).some((t) => !t.usedAt)).toBe(true);
    expect(await useResetLink(link, NEW_PASSWORD)).toEqual({
      redirect: "/login?reset=1",
    });
  });
});
