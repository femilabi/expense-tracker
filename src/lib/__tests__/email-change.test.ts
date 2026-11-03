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
    afterCallbacks: [] as Promise<void>[],
    verificationSendSucceeds: true,
    verificationEmails: [] as { to: string; token: string }[],
    changedNotices: [] as {
      to: string;
      newEmail: string;
      undoToken: string;
      undoExpiresAt: string;
    }[],
    restoredEmails: [] as {
      to: string;
      restoredEmail: string;
      resetToken?: string;
    }[],
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

vi.mock("next/cache", () => ({ revalidatePath: () => {} }));

vi.mock("next/server", () => ({
  after: (callback: () => Promise<void>) => {
    mocks.afterCallbacks.push(callback());
  },
}));

vi.mock("@/lib/email", () => ({
  sendEmailChangeVerificationEmail: async (to: string, token: string) => {
    if (!mocks.verificationSendSucceeds) {
      return false;
    }
    mocks.verificationEmails.push({ to, token });
    return true;
  },
  sendEmailChangedNoticeEmail: async (
    to: string,
    newEmail: string,
    undoToken: string,
    undoExpiresAt: string,
  ) => {
    mocks.changedNotices.push({ to, newEmail, undoToken, undoExpiresAt });
  },
  sendEmailRestoredEmail: async (
    to: string,
    restoredEmail: string,
    resetToken?: string,
  ) => {
    mocks.restoredEmails.push({ to, restoredEmail, resetToken });
  },
}));

vi.mock("@/lib/rate-limit", () => ({
  RATE_LIMIT_MESSAGE: "Too many attempts, please try again later.",
  checkRateLimit: async () => ({ limited: false, count: 1 }),
  getClientIp: async () => "127.0.0.1",
}));

// Imported after the mocks so they pick up the fakes above.
const { confirmEmailChange, requestEmailChange, undoEmailChange } =
  await import("@/lib/actions/change-email");
const { generateEmailChangeToken, hashEmailChangeToken } =
  await import("@/lib/email-change-token");
const { hashResetToken } = await import("@/lib/reset-token");
await import("@/auth");

const PASSWORD = "OldPass1!";
const START = new Date("2026-11-02T12:00:00Z");
const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;

const CONFIRM_LINK_INVALID = {
  message:
    "This link is invalid or has already been used. Request a new one from Settings.",
};
const UNDO_LINK_USED = {
  message: "This undo link has already been used or is no longer valid.",
};

let email: string;
let userId: string;
let otherEmail: string;
let emailCounter = 0;

function form(fields: Record<string, string>): FormData {
  const data = new FormData();
  for (const [key, value] of Object.entries(fields)) {
    data.set(key, value);
  }
  return data;
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

/** Lets the `after` callbacks (the emails) finish. */
async function flushAfter() {
  await Promise.all(mocks.afterCallbacks.splice(0));
}

function advanceTime(ms: number) {
  vi.setSystemTime(new Date(Date.now() + ms));
}

async function signIn(
  loginEmail: string,
  password: string,
): Promise<Token | null> {
  const user = await mocks.authorize!({ email: loginEmail, password });
  if (!user) {
    return null;
  }
  return mocks.jwt!({ token: { sub: user.id }, user });
}

/** Runs the jwt callback like every request does. */
async function checkSession(token: Token): Promise<Token | null> {
  return mocks.jwt!({ token: { ...token } });
}

function requestChange(newEmail: string, currentPassword = PASSWORD) {
  mocks.currentUserId = userId;
  return run(
    requestEmailChange(undefined, form({ newEmail, currentPassword })),
  );
}

function confirm(token: string) {
  return run(confirmEmailChange(undefined, form({ token })));
}

function undo(token: string) {
  return run(undoEmailChange(undefined, form({ token })));
}

function lastVerificationToken(): string {
  return mocks.verificationEmails[mocks.verificationEmails.length - 1].token;
}

/** Requests and confirms a change, returns the undo token sent to the old address. */
async function changeEmail(newEmail: string): Promise<string> {
  await requestChange(newEmail);
  expect(await confirm(lastVerificationToken())).toEqual({
    redirect: "/login?emailChanged=1",
  });
  await flushAfter();
  return mocks.changedNotices[mocks.changedNotices.length - 1].undoToken;
}

function currentEmail(): string | undefined {
  return fakeDb.getUser(userId)?.email;
}

beforeEach(async () => {
  fakeDb.reset();
  vi.useFakeTimers({ toFake: ["Date"], now: START });
  mocks.currentUserId = null;
  mocks.afterCallbacks = [];
  mocks.verificationSendSucceeds = true;
  mocks.verificationEmails = [];
  mocks.changedNotices = [];
  mocks.restoredEmails = [];

  const passwordHash = await bcrypt.hash(PASSWORD, 4);
  emailCounter++;
  email = `user${emailCounter}@example.com`;
  otherEmail = `other${emailCounter}@example.com`;
  userId = fakeDb.addUser({ name: "Test User", email, passwordHash }).id;
  fakeDb.addUser({ name: "Other User", email: otherEmail, passwordHash });
});

afterEach(() => {
  vi.useRealTimers();
});

describe("requesting an email change", () => {
  it("rejects a wrong password", async () => {
    expect(await requestChange("new@example.com", "WrongPass9!")).toEqual({
      errors: { currentPassword: ["Current password is incorrect."] },
    });

    expect(fakeDb.getEmailChangeRequest(userId)).toBeUndefined();
    expect(mocks.verificationEmails).toEqual([]);
  });

  it("rejects an email that is already in use, whatever its case", async () => {
    expect(await requestChange(`  ${otherEmail.toUpperCase()} `)).toEqual({
      errors: { newEmail: ["An account with this email already exists."] },
    });

    expect(fakeDb.getEmailChangeRequest(userId)).toBeUndefined();
    expect(mocks.verificationEmails).toEqual([]);
  });

  it("saves nothing when the verification email cannot be sent", async () => {
    mocks.verificationSendSucceeds = false;

    expect(await requestChange("new@example.com")).toEqual({
      message: "We couldn't send the confirmation email. Please try again.",
      tone: "error",
    });

    expect(fakeDb.getEmailChangeRequest(userId)).toBeUndefined();
  });

  it("normalizes the new email and sends the link to it", async () => {
    expect(await requestChange("  New@Example.COM ")).toEqual({
      message:
        "We sent a confirmation link to new@example.com. It expires in 1 hour.",
      tone: "info",
    });

    const [sent] = mocks.verificationEmails;
    expect(sent.to).toBe("new@example.com");
    // Only the hash of the token is stored.
    expect(fakeDb.getEmailChangeRequest(userId)).toMatchObject({
      newEmail: "new@example.com",
      tokenHash: hashEmailChangeToken(sent.token),
      expiresAt: new Date(START.getTime() + HOUR_MS),
    });
  });

  it("replaces an earlier request so only the newest link works", async () => {
    await requestChange("first@example.com");
    const firstToken = lastVerificationToken();
    await requestChange("second@example.com");
    const secondToken = lastVerificationToken();

    expect(await confirm(firstToken)).toEqual(CONFIRM_LINK_INVALID);
    expect(await confirm(secondToken)).toEqual({
      redirect: "/login?emailChanged=1",
    });
    expect(currentEmail()).toBe("second@example.com");
  });

  it("blocks another change while the undo link is still active", async () => {
    await changeEmail("new@example.com");

    const blocked = await requestChange("again@example.com");
    expect(blocked).toMatchObject({ tone: "error" });
    expect((blocked as { message: string }).message).toMatch(
      /^You changed your email recently/,
    );
    expect(mocks.verificationEmails).toHaveLength(1);

    advanceTime(3 * DAY_MS + 1000);

    expect(await requestChange("again@example.com")).toMatchObject({
      tone: "info",
    });
  });
});

describe("confirming an email change", () => {
  it("rejects an expired link", async () => {
    await requestChange("new@example.com");
    advanceTime(HOUR_MS + 1000);

    expect(await confirm(lastVerificationToken())).toEqual({
      message: "This link has expired. Request a new one from Settings.",
    });
    expect(currentEmail()).toBe(email);
  });

  it("rejects a link that was already used", async () => {
    await requestChange("new@example.com");
    const token = lastVerificationToken();

    expect(await confirm(token)).toEqual({
      redirect: "/login?emailChanged=1",
    });
    expect(await confirm(token)).toEqual(CONFIRM_LINK_INVALID);

    expect(currentEmail()).toBe("new@example.com");
    expect(fakeDb.getUser(userId)?.sessionVersion).toBe(1);
    expect(fakeDb.getEmailChangeUndos(userId)).toHaveLength(1);
  });

  it("rejects the change if the email was taken in the meantime", async () => {
    await requestChange("new@example.com");
    fakeDb.addUser({
      name: "Quick User",
      email: "new@example.com",
      passwordHash: null,
    });

    expect(await confirm(lastVerificationToken())).toEqual({
      message:
        "This email is now used by another account. Choose a different one in Settings.",
    });
    expect(currentEmail()).toBe(email);
  });

  it("signs out old sessions and sends the undo link to the old address", async () => {
    const laptop = await signIn(email, PASSWORD);
    const phone = await signIn(email, PASSWORD);
    expect(await checkSession(laptop!)).not.toBeNull();

    const undoToken = await changeEmail("new@example.com");

    expect(await checkSession(laptop!)).toBeNull();
    expect(await checkSession(phone!)).toBeNull();
    expect(await signIn(email, PASSWORD)).toBeNull();
    const fresh = await signIn("new@example.com", PASSWORD);
    expect(await checkSession(fresh!)).not.toBeNull();

    expect(mocks.changedNotices).toEqual([
      {
        to: email,
        newEmail: "new@example.com",
        undoToken,
        undoExpiresAt: "Thu, 5 Nov 2026, 12:00 UTC",
      },
    ]);
    expect(fakeDb.getEmailChangeUndos(userId)).toMatchObject([
      {
        oldEmail: email,
        newEmail: "new@example.com",
        tokenHash: hashEmailChangeToken(undoToken),
        usedAt: null,
      },
    ]);
    expect(fakeDb.getEmailChangeRequest(userId)).toBeUndefined();
  });

  it("invalidates an earlier undo link", async () => {
    const firstUndo = await changeEmail("first@example.com");

    // A later change confirmed while the first undo link is still active.
    const token = generateEmailChangeToken();
    fakeDb.addEmailChangeRequest({
      userId,
      newEmail: "second@example.com",
      tokenHash: hashEmailChangeToken(token),
      expiresAt: new Date(Date.now() + HOUR_MS),
    });
    expect(await confirm(token)).toEqual({
      redirect: "/login?emailChanged=1",
    });

    expect(await undo(firstUndo)).toEqual(UNDO_LINK_USED);
    expect(currentEmail()).toBe("second@example.com");
  });
});

describe("undoing an email change", () => {
  it("restores the old email and signs everyone out", async () => {
    const undoToken = await changeEmail("new@example.com");
    const intruder = await signIn("new@example.com", PASSWORD);
    // A change the intruder started after taking over.
    fakeDb.addEmailChangeRequest({
      userId,
      newEmail: "intruder@example.com",
      tokenHash: "pending-hash",
      expiresAt: new Date(Date.now() + HOUR_MS),
    });

    expect(await undo(undoToken)).toEqual({
      redirect: "/login?emailRestored=1",
    });
    await flushAfter();

    expect(currentEmail()).toBe(email);
    expect(fakeDb.getUser(userId)?.sessionVersion).toBe(2);
    expect(await checkSession(intruder!)).toBeNull();
    expect(fakeDb.getEmailChangeRequest(userId)).toBeUndefined();

    // Both addresses are told, only the restored one gets a reset link.
    const [toOld, toNew] = mocks.restoredEmails;
    expect(toOld).toMatchObject({ to: email, restoredEmail: email });
    expect(toNew).toEqual({
      to: "new@example.com",
      restoredEmail: email,
      resetToken: undefined,
    });
    const unusedResetTokens = fakeDb
      .getResetTokens(userId)
      .filter((token) => !token.usedAt);
    expect(unusedResetTokens).toMatchObject([
      { tokenHash: hashResetToken(toOld.resetToken!) },
    ]);
  });

  it("rejects an undo link after 3 days", async () => {
    const undoToken = await changeEmail("new@example.com");
    advanceTime(3 * DAY_MS + 1000);

    expect(await undo(undoToken)).toEqual({
      message:
        "This undo link has expired. If you no longer have access to your account, reset your password or contact support.",
    });
    expect(currentEmail()).toBe("new@example.com");
  });

  it("rejects an undo link used twice", async () => {
    const undoToken = await changeEmail("new@example.com");

    expect(await undo(undoToken)).toEqual({
      redirect: "/login?emailRestored=1",
    });
    expect(await undo(undoToken)).toEqual(UNDO_LINK_USED);

    expect(currentEmail()).toBe(email);
    expect(fakeDb.getUser(userId)?.sessionVersion).toBe(2);
  });

  it("fails clearly and keeps the link unused when the old email is taken", async () => {
    const undoToken = await changeEmail("new@example.com");
    fakeDb.addUser({ name: "Someone Else", email, passwordHash: null });

    expect(await undo(undoToken)).toEqual({
      message:
        "Your original email is now used by another account, so it can't be restored. Please contact support.",
    });

    expect(currentEmail()).toBe("new@example.com");
    expect(fakeDb.getEmailChangeUndos(userId)[0].usedAt).toBeNull();
    expect(mocks.restoredEmails).toEqual([]);
  });
});
