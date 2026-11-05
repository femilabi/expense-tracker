"use server";

import { redirect } from "next/navigation";
import { after } from "next/server";
import * as z from "zod";

import { SignupCodeSchema, type SignupCodeState } from "@/lib/definitions";
import { sendWelcomeEmail } from "@/lib/email";
import {
  clearPendingSignupCookie,
  getPendingSignupId,
  issueSignupCode,
  setPendingSignupCookie,
} from "@/lib/pending-signup";
import { prisma } from "@/lib/prisma";
import {
  checkRateLimit,
  getClientIp,
  RATE_LIMIT_MESSAGE,
} from "@/lib/rate-limit";
import {
  SIGNUP_CODE_EMAIL_LIMIT,
  SIGNUP_CODE_MAX_ATTEMPTS,
  SIGNUP_CODE_RESEND_COOLDOWN_MS,
  signupCodeMatches,
} from "@/lib/signup-code";

const VERIFY_SIGNUP_IP_LIMIT = 30;
const RESEND_SIGNUP_CODE_IP_LIMIT = 10;

const SIGNUP_EXPIRED = "Your signup has expired. Please sign up again.";
const CODE_EXPIRED = "This code has expired. Request a new one below.";
const CODE_REPLACED =
  "This code is no longer valid. Enter the latest code we sent.";
const TOO_MANY_ATTEMPTS =
  "Too many incorrect attempts. Request a new code below.";
const ALREADY_VERIFIED = "Your email is already verified. Please log in.";
const EMAIL_TAKEN =
  "An account with this email already exists. Please log in instead.";
const SOMETHING_WENT_WRONG = "Something went wrong. Please try again.";

/** Prisma reports a unique constraint violation, here on `users.email`. */
function isUniqueViolation(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "P2002"
  );
}

/** The pending signup this browser started, if it still exists. */
async function findPendingSignup() {
  const id = await getPendingSignupId();
  if (!id) {
    return null;
  }

  return prisma.pendingSignup.findUnique({ where: { id } });
}

export async function verifySignupCode(
  _state: SignupCodeState,
  formData: FormData,
): Promise<SignupCodeState> {
  const validatedFields = SignupCodeSchema.safeParse({
    code: formData.get("code"),
  });

  if (!validatedFields.success) {
    return { errors: z.flattenError(validatedFields.error).fieldErrors };
  }

  const ipLimit = await checkRateLimit({
    scope: "verify-signup:ip",
    identifier: await getClientIp(),
    limit: VERIFY_SIGNUP_IP_LIMIT,
  });
  if (ipLimit.limited) {
    return { message: RATE_LIMIT_MESSAGE, tone: "error" };
  }

  const pending = await findPendingSignup();
  if (!pending) {
    return { message: SIGNUP_EXPIRED, tone: "error" };
  }
  if (pending.attempts >= SIGNUP_CODE_MAX_ATTEMPTS) {
    return { message: TOO_MANY_ATTEMPTS, tone: "error" };
  }
  if (pending.expiresAt <= new Date()) {
    return { message: CODE_EXPIRED, tone: "error" };
  }

  // Counted before comparing, so guesses sent in parallel can't go over the
  // limit. Matching the hash means a code replaced by a resend isn't counted.
  const counted = await prisma.pendingSignup.updateMany({
    where: {
      id: pending.id,
      codeHash: pending.codeHash,
      attempts: { lt: SIGNUP_CODE_MAX_ATTEMPTS },
    },
    data: { attempts: { increment: 1 } },
  });
  if (counted.count !== 1) {
    return { message: CODE_REPLACED, tone: "error" };
  }

  if (
    !signupCodeMatches(
      pending.email,
      validatedFields.data.code,
      pending.codeHash,
    )
  ) {
    const triesLeft = SIGNUP_CODE_MAX_ATTEMPTS - (pending.attempts + 1);
    if (triesLeft === 0) {
      return { message: TOO_MANY_ATTEMPTS, tone: "error" };
    }
    return {
      errors: {
        code: [
          `That code isn't right. ${triesLeft} ${triesLeft === 1 ? "try" : "tries"} left.`,
        ],
      },
    };
  }

  try {
    await prisma.$transaction(async (tx) => {
      // Claiming the signup first means one code can only create one account.
      const claimed = await tx.pendingSignup.deleteMany({
        where: { id: pending.id, codeHash: pending.codeHash },
      });
      if (claimed.count !== 1) {
        throw new Error("ALREADY_USED");
      }

      await tx.user.create({
        data: {
          name: pending.name,
          email: pending.email,
          passwordHash: pending.passwordHash,
        },
      });
    });
  } catch (error) {
    if (isUniqueViolation(error)) {
      // Someone registered this email meanwhile, so the signup can't finish.
      await prisma.pendingSignup.deleteMany({ where: { id: pending.id } });
      await clearPendingSignupCookie();
      return { message: EMAIL_TAKEN, tone: "error" };
    }
    if (error instanceof Error && error.message === "ALREADY_USED") {
      return { message: ALREADY_VERIFIED, tone: "error" };
    }
    return { message: SOMETHING_WENT_WRONG, tone: "error" };
  }

  await clearPendingSignupCookie();

  after(async () => {
    await sendWelcomeEmail(pending.email, pending.name);
  });

  redirect("/login?verified=1");
}

export async function resendSignupCode(): Promise<SignupCodeState> {
  const ipLimit = await checkRateLimit({
    scope: "resend-signup-code:ip",
    identifier: await getClientIp(),
    limit: RESEND_SIGNUP_CODE_IP_LIMIT,
  });
  if (ipLimit.limited) {
    return { message: RATE_LIMIT_MESSAGE, tone: "error" };
  }

  const pending = await findPendingSignup();
  if (!pending) {
    return { message: SIGNUP_EXPIRED, tone: "error" };
  }

  const waitMs =
    pending.lastSentAt.getTime() + SIGNUP_CODE_RESEND_COOLDOWN_MS - Date.now();
  if (waitMs > 0) {
    const seconds = Math.ceil(waitMs / 1000);
    return {
      message: `Please wait ${seconds} seconds before requesting a new code.`,
      tone: "error",
    };
  }

  const emailLimit = await checkRateLimit({
    scope: "signup-code:email",
    identifier: pending.email.toLowerCase(),
    limit: SIGNUP_CODE_EMAIL_LIMIT,
  });
  if (emailLimit.limited) {
    return { message: RATE_LIMIT_MESSAGE, tone: "error" };
  }

  const pendingId = await issueSignupCode({
    email: pending.email,
    name: pending.name,
    passwordHash: pending.passwordHash,
  });
  if (!pendingId) {
    return {
      message: "We couldn't send a new code. Please try again.",
      tone: "error",
    };
  }

  // Also renews the cookie, so a slow signup isn't cut off by it.
  await setPendingSignupCookie(pendingId);

  return { message: `We sent a new code to ${pending.email}.`, tone: "info" };
}
