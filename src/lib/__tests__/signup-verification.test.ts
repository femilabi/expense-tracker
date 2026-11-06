import bcrypt from "bcryptjs";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { fakeDb } from "./fake-db";

type Authorize = (
  credentials: Record<string, unknown>,
  request?: Request,
) => Promise<{ id: string } | null>;

const mocks = vi.hoisted(() => {
  class RedirectError extends Error {
    constructor(public url: string) {
      super(`NEXT_REDIRECT ${url}`);
    }
  }

  return {
    RedirectError,
    authorize: undefined as Authorize | undefined,
    afterCallbacks: [] as Promise<void>[],
    cookies: new Map<string, string>(),
    cookieOptions: {} as Record<string, unknown>,
    codeSendSucceeds: true,
    codeEmails: [] as { to: string; code: string }[],
    welcomeEmails: [] as { to: string; name: string }[],
    signInEmails: [] as { to: string; details: unknown }[],
  };
});

vi.mock("@/lib/prisma", () => ({ prisma: fakeDb.client }));

vi.mock("next-auth", () => ({
  default: (config: { providers: { authorize: Authorize }[] }) => {
    mocks.authorize = config.providers[0].authorize;
    return {
      handlers: {},
      auth: async () => null,
      signIn: vi.fn(),
      signOut: vi.fn(),
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
    mocks.afterCallbacks.push(callback());
  },
}));

vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (name: string) => {
      const value = mocks.cookies.get(name);
      return value === undefined ? undefined : { name, value };
    },
    set: (name: string, value: string, options: Record<string, unknown>) => {
      mocks.cookies.set(name, value);
      mocks.cookieOptions = options;
    },
    delete: (name: string) => {
      mocks.cookies.delete(name);
    },
  }),
}));

vi.mock("@/lib/email", () => ({
  sendSignupCodeEmail: async (to: string, code: string) => {
    if (!mocks.codeSendSucceeds) {
      return false;
    }
    mocks.codeEmails.push({ to, code });
    return true;
  },
  sendWelcomeEmail: async (to: string, name: string) => {
    mocks.welcomeEmails.push({ to, name });
  },
  sendSignInNotificationEmail: async (to: string, details: unknown) => {
    mocks.signInEmails.push({ to, details });
  },
}));

vi.mock("@/lib/rate-limit", () => ({
  RATE_LIMIT_MESSAGE: "Too many attempts, please try again later.",
  checkRateLimit: async () => ({ limited: false, count: 1 }),
  getClientIp: async () => "127.0.0.1",
}));

process.env.AUTH_SECRET = "test-secret";

// Imported after the mocks so they pick up the fakes above.
const { signup } = await import("@/lib/actions/auth");
const { resendSignupCode, verifySignupCode } =
  await import("@/lib/actions/verify-signup");
const { PENDING_SIGNUP_COOKIE } = await import("@/lib/signup-code");
await import("@/auth");

const START = new Date("2026-11-05T12:00:00.000Z");
const NAME = "New User";
const EMAIL = "new.user@example.com";
const PASSWORD = "NewPass1!";

const SIGNUP_EXPIRED = {
  message: "Your signup has expired. Please sign up again.",
  tone: "error",
};
const CODE_EXPIRED = {
  message: "This code has expired. Request a new one below.",
  tone: "error",
};
const TOO_MANY_ATTEMPTS = {
  message: "Too many incorrect attempts. Request a new code below.",
  tone: "error",
};

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

function startSignup(email = EMAIL) {
  return run(
    signup(undefined, form({ name: NAME, email, password: PASSWORD })),
  );
}

function verify(code: string) {
  return run(verifySignupCode(undefined, form({ code })));
}

function resend() {
  return run(resendSignupCode());
}

function lastCode(): string {
  return mocks.codeEmails[mocks.codeEmails.length - 1].code;
}

/** A six digit code that is guaranteed not to be the real one. */
function wrongCode(): string {
  return lastCode() === "000000" ? "111111" : "000000";
}

beforeEach(() => {
  fakeDb.reset();
  vi.useFakeTimers({ toFake: ["Date"], now: START });
  mocks.afterCallbacks = [];
  mocks.cookies = new Map();
  mocks.cookieOptions = {};
  mocks.codeSendSucceeds = true;
  mocks.codeEmails = [];
  mocks.welcomeEmails = [];
  mocks.signInEmails = [];
});

afterEach(() => {
  vi.useRealTimers();
});

describe("signup with an email code", () => {
  it("sends a code and creates no account until it is confirmed", async () => {
    expect(await startSignup()).toEqual({ redirect: "/verify-email" });

    expect(fakeDb.countUsers()).toBe(0);
    expect(mocks.codeEmails).toEqual([
      { to: EMAIL, code: expect.stringMatching(/^\d{6}$/) },
    ]);

    const [pending] = fakeDb.getPendingSignups();
    expect(pending).toMatchObject({ email: EMAIL, name: NAME, attempts: 0 });
    // Neither the password nor the code is stored as plain text.
    expect(await bcrypt.compare(PASSWORD, pending.passwordHash)).toBe(true);
    expect(pending.codeHash).not.toContain(lastCode());

    expect(mocks.cookies.get(PENDING_SIGNUP_COOKIE)).toBe(pending.id);
    expect(mocks.cookieOptions).toMatchObject({
      httpOnly: true,
      sameSite: "lax",
    });
  });

  it("rejects an email that already has an account", async () => {
    fakeDb.addUser({ name: "Existing", email: EMAIL, passwordHash: "x" });

    expect(await startSignup(EMAIL.toUpperCase())).toEqual({
      message: "An account with this email already exists.",
      values: { name: NAME, email: EMAIL.toUpperCase() },
    });
    expect(mocks.codeEmails).toEqual([]);
    expect(fakeDb.getPendingSignups()).toEqual([]);
  });

  it("saves nothing when the code email cannot be sent", async () => {
    mocks.codeSendSucceeds = false;

    expect(await startSignup()).toEqual({
      message: "We couldn't send the verification email. Please try again.",
      values: { name: NAME, email: EMAIL },
    });
    expect(fakeDb.getPendingSignups()).toEqual([]);
    expect(mocks.cookies.size).toBe(0);
  });

  it("keeps the name and email, but not the password, after an error", async () => {
    const result = await run(
      signup(undefined, form({ name: NAME, email: EMAIL, password: "abc" })),
    );

    expect(result).toMatchObject({
      errors: { password: expect.any(Array) },
      values: { name: NAME, email: EMAIL },
    });
    expect(JSON.stringify(result)).not.toContain('"abc"');
    expect(fakeDb.getPendingSignups()).toEqual([]);
  });

  it("creates the account with the right code and sends a welcome email", async () => {
    await startSignup();

    expect(await verify(lastCode())).toEqual({
      redirect: "/login?verified=1",
    });

    expect(fakeDb.getUserByEmail(EMAIL)).toMatchObject({
      name: NAME,
      email: EMAIL,
    });
    expect(fakeDb.getPendingSignups()).toEqual([]);
    expect(mocks.cookies.has(PENDING_SIGNUP_COOKIE)).toBe(false);

    await flushAfter();
    expect(mocks.welcomeEmails).toEqual([{ to: EMAIL, name: NAME }]);

    // The password chosen at signup works.
    expect(
      await mocks.authorize!({ email: EMAIL, password: PASSWORD }),
    ).not.toBeNull();
  });

  it("accepts the code with spaces in it", async () => {
    await startSignup();
    const code = lastCode();

    expect(await verify(` ${code.slice(0, 3)} ${code.slice(3)} `)).toEqual({
      redirect: "/login?verified=1",
    });
  });

  it("rejects a wrong code and counts the attempt", async () => {
    await startSignup();

    expect(await verify(wrongCode())).toEqual({
      errors: { code: ["That code isn't right. 4 tries left."] },
    });
    expect(fakeDb.getPendingSignups()[0].attempts).toBe(1);
    expect(fakeDb.countUsers()).toBe(0);
  });

  it("locks the code after 5 wrong attempts, even for the right code", async () => {
    await startSignup();

    for (const triesLeft of ["4 tries", "3 tries", "2 tries", "1 try"]) {
      expect(await verify(wrongCode())).toEqual({
        errors: { code: [`That code isn't right. ${triesLeft} left.`] },
      });
    }
    expect(await verify(wrongCode())).toEqual(TOO_MANY_ATTEMPTS);

    expect(await verify(lastCode())).toEqual(TOO_MANY_ATTEMPTS);
    expect(fakeDb.countUsers()).toBe(0);
  });

  it("rejects a code after 10 minutes", async () => {
    await startSignup();
    advanceTime(10 * 60 * 1000 + 1000);

    expect(await verify(lastCode())).toEqual(CODE_EXPIRED);
    expect(fakeDb.countUsers()).toBe(0);
  });

  it("makes the user wait a minute before sending a new code", async () => {
    await startSignup();

    expect(await resend()).toEqual({
      message: "Please wait 60 seconds before requesting a new code.",
      tone: "error",
    });
    advanceTime(30 * 1000);
    expect(await resend()).toEqual({
      message: "Please wait 30 seconds before requesting a new code.",
      tone: "error",
    });
    expect(mocks.codeEmails).toHaveLength(1);
  });

  it("replaces the old code with a new one and resets the attempts", async () => {
    await startSignup();
    const oldCode = lastCode();
    await verify(wrongCode());
    expect(fakeDb.getPendingSignups()[0].attempts).toBe(1);

    advanceTime(61 * 1000);
    expect(await resend()).toEqual({
      message: `We sent a new code to ${EMAIL}.`,
      tone: "info",
    });
    expect(mocks.codeEmails).toHaveLength(2);
    expect(fakeDb.getPendingSignups()[0].attempts).toBe(0);

    // A brand new code is drawn, so the old one only works by a 1 in a
    // million coincidence.
    if (oldCode !== lastCode()) {
      expect(await verify(oldCode)).toEqual({
        errors: { code: ["That code isn't right. 4 tries left."] },
      });
    }
    expect(await verify(lastCode())).toEqual({
      redirect: "/login?verified=1",
    });
  });

  it("fails clearly if the email gets an account during verification", async () => {
    await startSignup();
    fakeDb.addUser({
      name: "Faster",
      email: EMAIL.toUpperCase(),
      passwordHash: "x",
    });

    expect(await verify(lastCode())).toEqual({
      message:
        "An account with this email already exists. Please log in instead.",
      tone: "error",
    });
    expect(fakeDb.countUsers()).toBe(1);
    expect(fakeDb.getPendingSignups()).toEqual([]);
    expect(mocks.cookies.has(PENDING_SIGNUP_COOKIE)).toBe(false);
  });

  it("creates only one account when the code is submitted twice at once", async () => {
    await startSignup();
    const code = lastCode();

    const results = await Promise.all([verify(code), verify(code)]);

    expect(results).toContainEqual({ redirect: "/login?verified=1" });
    expect(results).toContainEqual({
      message: "Your email is already verified. Please log in.",
      tone: "error",
    });
    expect(fakeDb.countUsers()).toBe(1);
  });

  it("asks to sign up again when there is no signup to verify", async () => {
    expect(await verify("123456")).toEqual(SIGNUP_EXPIRED);
    expect(await resend()).toEqual(SIGNUP_EXPIRED);
  });
});

describe("sign-in notification", () => {
  beforeEach(async () => {
    const passwordHash = await bcrypt.hash(PASSWORD, 4);
    fakeDb.addUser({ name: NAME, email: EMAIL, passwordHash });
  });

  it("emails the account after a successful sign-in", async () => {
    const request = new Request("http://localhost/api/auth/callback", {
      headers: {
        "user-agent": "TestBrowser/1.0",
        "x-forwarded-for": "203.0.113.7, 10.0.0.1",
      },
    });

    expect(
      await mocks.authorize!({ email: EMAIL, password: PASSWORD }, request),
    ).not.toBeNull();
    await flushAfter();

    expect(mocks.signInEmails).toEqual([
      {
        to: EMAIL,
        details: {
          signedInAt: START,
          ip: "203.0.113.7",
          userAgent: "TestBrowser/1.0",
        },
      },
    ]);
  });

  it("sends nothing for a wrong password", async () => {
    expect(
      await mocks.authorize!({ email: EMAIL, password: "WrongPass1!" }),
    ).toBeNull();
    await flushAfter();

    expect(mocks.signInEmails).toEqual([]);
  });
});
