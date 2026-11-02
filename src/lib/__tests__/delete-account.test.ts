import bcrypt from "bcryptjs";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { fakeDb, OWNED_TABLES } from "./fake-db";

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
    deletedEmails: [] as string[],
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
  sendAccountDeletedEmail: async (to: string) => {
    mocks.deletedEmails.push(to);
  },
}));

vi.mock("@/lib/rate-limit", () => ({
  RATE_LIMIT_MESSAGE: "Too many attempts, please try again later.",
  checkRateLimit: async () => ({ limited: false, count: 1 }),
}));

// Imported after the mocks so they pick up the fakes above.
const { deleteAccount } = await import("@/lib/actions/delete-account");
await import("@/auth");

const PASSWORD = "OldPass1!";

let email: string;
let userId: string;
let otherUserId: string;
let emailCounter = 0;

function addUserWithData(userEmail: string, passwordHash: string): string {
  const id = fakeDb.addUser({
    name: "Test User",
    email: userEmail,
    passwordHash,
  }).id;
  for (const table of OWNED_TABLES) {
    fakeDb.addOwnedRow(table, id);
  }
  fakeDb.addResetToken({
    userId: id,
    tokenHash: `hash-${id}`,
    expiresAt: new Date(Date.now() + 60_000),
  });
  return id;
}

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

async function deleteAsUser(
  password: string,
): Promise<Awaited<ReturnType<typeof deleteAccount>> | { redirect: string }> {
  mocks.currentUserId = userId;
  const data = new FormData();
  data.set("password", password);

  try {
    return await deleteAccount(undefined, data);
  } catch (error) {
    if (error instanceof mocks.RedirectError) {
      return { redirect: error.url };
    }
    throw error;
  }
}

const NOTHING_DELETED = {
  resetTokens: 1,
  profiles: 1,
  incomes: 1,
  expenses: 1,
  monthlySummaries: 1,
};

beforeEach(async () => {
  fakeDb.reset();
  mocks.currentUserId = null;
  mocks.deletedEmails = [];

  const passwordHash = await bcrypt.hash(PASSWORD, 4);
  email = `user${++emailCounter}@example.com`;
  userId = addUserWithData(email, passwordHash);
  otherUserId = addUserWithData(
    `other${emailCounter}@example.com`,
    passwordHash,
  );
});

describe("account deletion", () => {
  it("rejects a wrong password and deletes nothing", async () => {
    expect(await deleteAsUser("WrongPass9!")).toEqual({
      errors: { password: ["Password is incorrect."] },
    });

    expect(fakeDb.getUser(userId)).toBeDefined();
    expect(fakeDb.countOwnedRows(userId)).toEqual(NOTHING_DELETED);
    expect(mocks.deletedEmails).toEqual([]);
  });

  it("requires a password and deletes nothing without one", async () => {
    expect(await deleteAsUser("")).toEqual({
      errors: { password: ["Please enter your password."] },
    });

    expect(fakeDb.getUser(userId)).toBeDefined();
    expect(fakeDb.countOwnedRows(userId)).toEqual(NOTHING_DELETED);
  });

  it("sends a logged out user to the login page", async () => {
    const data = new FormData();
    data.set("password", PASSWORD);

    await expect(deleteAccount(undefined, data)).rejects.toEqual(
      new mocks.RedirectError("/login"),
    );
    expect(fakeDb.getUser(userId)).toBeDefined();
  });

  it("deletes the user and all of their data", async () => {
    expect(await deleteAsUser(PASSWORD)).toEqual({ redirect: "/" });

    expect(fakeDb.getUser(userId)).toBeUndefined();
    expect(fakeDb.countOwnedRows(userId)).toEqual({
      resetTokens: 0,
      profiles: 0,
      incomes: 0,
      expenses: 0,
      monthlySummaries: 0,
    });
    expect(mocks.deletedEmails).toEqual([email]);

    // Nobody else's data is touched.
    expect(fakeDb.getUser(otherUserId)).toBeDefined();
    expect(fakeDb.countOwnedRows(otherUserId)).toEqual(NOTHING_DELETED);
  });

  it("keeps everything when the deletion fails part way", async () => {
    fakeDb.failNext("user.delete");

    expect(await deleteAsUser(PASSWORD)).toEqual({
      message: "Something went wrong. Please try again.",
    });

    expect(fakeDb.getUser(userId)).toBeDefined();
    expect(fakeDb.countOwnedRows(userId)).toEqual(NOTHING_DELETED);
    expect(mocks.deletedEmails).toEqual([]);
  });

  it("rejects every existing session afterwards", async () => {
    const laptop = await signIn(PASSWORD);
    const phone = await signIn(PASSWORD);
    expect(await checkSession(laptop!)).not.toBeNull();

    await deleteAsUser(PASSWORD);

    expect(await checkSession(laptop!)).toBeNull();
    expect(await checkSession(phone!)).toBeNull();
    expect(await signIn(PASSWORD)).toBeNull();
  });
});
