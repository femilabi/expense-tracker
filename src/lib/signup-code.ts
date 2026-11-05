import { createHmac, randomInt, timingSafeEqual } from "node:crypto";

export const SIGNUP_CODE_TTL_MS = 10 * 60 * 1000;
export const SIGNUP_CODE_MAX_ATTEMPTS = 5;
export const SIGNUP_CODE_RESEND_COOLDOWN_MS = 60 * 1000;
/** Codes per address per hour, shared by signing up and resending. */
export const SIGNUP_CODE_EMAIL_LIMIT = 5;

/** Holds the id of the pending signup this browser is verifying. */
export const PENDING_SIGNUP_COOKIE = "pending-signup";

export function generateSignupCode(): string {
  return randomInt(0, 1_000_000).toString().padStart(6, "0");
}

/**
 * Six digits are quick to brute force from a plain hash, so the hash is keyed
 * with the app secret. The email is mixed in so a code only fits its signup.
 */
export function hashSignupCode(email: string, code: string): string {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error("AUTH_SECRET is not set.");
  }

  return createHmac("sha256", secret)
    .update(`${email.toLowerCase()}:${code}`)
    .digest("hex");
}

export function signupCodeMatches(
  email: string,
  code: string,
  codeHash: string,
): boolean {
  const expected = Buffer.from(codeHash, "hex");
  const actual = Buffer.from(hashSignupCode(email, code), "hex");

  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

export function getSignupCodeExpiry(): Date {
  return new Date(Date.now() + SIGNUP_CODE_TTL_MS);
}
