import { cookies } from "next/headers";

import { sendSignupCodeEmail } from "@/lib/email";
import { prisma } from "@/lib/prisma";
import {
  generateSignupCode,
  getSignupCodeExpiry,
  hashSignupCode,
  PENDING_SIGNUP_COOKIE,
} from "@/lib/signup-code";

const PENDING_SIGNUP_COOKIE_MAX_AGE_S = 60 * 60;

type PendingSignupInput = {
  email: string;
  name: string;
  passwordHash: string;
};

/**
 * Emails a new code and saves it as the only valid one for this address,
 * resetting the attempt counter. Nothing is saved when the email can't be
 * sent. Returns the pending signup's id, or null if sending failed.
 */
export async function issueSignupCode({
  email,
  name,
  passwordHash,
}: PendingSignupInput): Promise<string | null> {
  const code = generateSignupCode();

  const sent = await sendSignupCodeEmail(email, code);
  if (!sent) {
    return null;
  }

  const codeFields = {
    codeHash: hashSignupCode(email, code),
    attempts: 0,
    expiresAt: getSignupCodeExpiry(),
    lastSentAt: new Date(),
  };

  const pending = await prisma.pendingSignup.upsert({
    where: { email },
    create: { email, name, passwordHash, ...codeFields },
    update: { name, passwordHash, ...codeFields },
    select: { id: true },
  });

  return pending.id;
}

export async function setPendingSignupCookie(id: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(PENDING_SIGNUP_COOKIE, id, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: PENDING_SIGNUP_COOKIE_MAX_AGE_S,
  });
}

export async function getPendingSignupId(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(PENDING_SIGNUP_COOKIE)?.value ?? null;
}

export async function clearPendingSignupCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(PENDING_SIGNUP_COOKIE);
}
