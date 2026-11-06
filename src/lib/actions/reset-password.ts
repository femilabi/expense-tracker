"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { after } from "next/server";
import * as z from "zod";

import {
  ForgotPasswordSchema,
  ResetPasswordSchema,
  type ForgotPasswordState,
  type ResetPasswordState,
} from "@/lib/definitions";
import { sendPasswordChangedEmail, sendPasswordResetEmail } from "@/lib/email";
import { keepFormValues } from "@/lib/form-values";
import { prisma } from "@/lib/prisma";
import {
  checkRateLimit,
  getClientIp,
  RATE_LIMIT_MESSAGE,
} from "@/lib/rate-limit";
import {
  generateResetToken,
  getResetTokenExpiry,
  hashResetToken,
} from "@/lib/reset-token";

const NEUTRAL_MESSAGE =
  "If an account exists for that email, we've sent a reset link";

const FORGOT_PASSWORD_IP_LIMIT = 10;
const FORGOT_PASSWORD_EMAIL_LIMIT = 3;
const RESET_PASSWORD_IP_LIMIT = 10;

/**
 * A real bcrypt hash of a throwaway value. Comparing against it costs the same
 * as a real password check, so unknown addresses take about as long as known
 * ones.
 */
const DUMMY_PASSWORD_HASH =
  "$2b$10$QjDF7D7XaJSjV5fgcTOixe4g5OKXSUJFWCNnKGOwUngy.pS1/nhUe";

export async function requestPasswordReset(
  _state: ForgotPasswordState,
  formData: FormData,
): Promise<ForgotPasswordState> {
  const result = await sendResetLink(formData);
  // After an error the email is shown again. After a send it clears.
  if (result?.tone === "info") {
    return result;
  }
  return { ...result, values: keepFormValues(formData, ["email"]) };
}

async function sendResetLink(formData: FormData): Promise<ForgotPasswordState> {
  const validatedFields = ForgotPasswordSchema.safeParse({
    email: formData.get("email"),
  });

  if (!validatedFields.success) {
    return { errors: z.flattenError(validatedFields.error).fieldErrors };
  }

  const email = validatedFields.data.email;
  const ip = await getClientIp();

  const ipLimit = await checkRateLimit({
    scope: "forgot-password:ip",
    identifier: ip,
    limit: FORGOT_PASSWORD_IP_LIMIT,
  });
  if (ipLimit.limited) {
    return { message: RATE_LIMIT_MESSAGE, tone: "error" };
  }

  const emailLimit = await checkRateLimit({
    scope: "forgot-password:email",
    identifier: email.toLowerCase(),
    limit: FORGOT_PASSWORD_EMAIL_LIMIT,
  });
  if (emailLimit.limited) {
    return { message: RATE_LIMIT_MESSAGE, tone: "error" };
  }

  // Run a real bcrypt comparison for every request so known and unknown
  // addresses take about the same time.
  await bcrypt.compare(
    "reset-password-timing-placeholder",
    DUMMY_PASSWORD_HASH,
  );

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, email: true, name: true },
  });

  if (!user) {
    return { message: NEUTRAL_MESSAGE, tone: "info" };
  }

  const token = generateResetToken();
  const now = new Date();

  await prisma.$transaction([
    // Older unused tokens are invalidated by marking them as used.
    prisma.passwordResetToken.updateMany({
      where: { userId: user.id, usedAt: null },
      data: { usedAt: now },
    }),
    prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash: hashResetToken(token),
        expiresAt: getResetTokenExpiry(),
      },
    }),
  ]);

  // Send after the response so the email provider's latency is not visible to
  // the caller (and does not leak whether the address exists).
  after(async () => {
    await sendPasswordResetEmail(user.email, token, user.name);
  });

  return { message: NEUTRAL_MESSAGE, tone: "info" };
}

export async function resetPassword(
  _state: ResetPasswordState,
  formData: FormData,
): Promise<ResetPasswordState> {
  const validatedFields = ResetPasswordSchema.safeParse({
    token: formData.get("token"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!validatedFields.success) {
    return { errors: z.flattenError(validatedFields.error).fieldErrors };
  }

  const { token, password } = validatedFields.data;
  const ip = await getClientIp();

  const ipLimit = await checkRateLimit({
    scope: "reset-password:ip",
    identifier: ip,
    limit: RESET_PASSWORD_IP_LIMIT,
  });
  if (ipLimit.limited) {
    return { message: RATE_LIMIT_MESSAGE, tone: "error" };
  }

  const record = await prisma.passwordResetToken.findUnique({
    where: { tokenHash: hashResetToken(token) },
    select: { id: true, userId: true, expiresAt: true, usedAt: true },
  });

  if (!record) {
    return {
      message: "This reset link is invalid. Request a new one to continue.",
      tone: "error",
      requestNewLink: true,
    };
  }

  if (record.usedAt) {
    return {
      message:
        "This reset link has already been used. Request a new one to continue.",
      tone: "error",
      requestNewLink: true,
    };
  }

  if (record.expiresAt.getTime() < Date.now()) {
    return {
      message: "This reset link has expired. Request a new one to continue.",
      tone: "error",
      requestNewLink: true,
    };
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const changedAt = new Date();

  let updatedUser: { id: string; email: string; name: string };
  try {
    updatedUser = await prisma.$transaction(async (tx) => {
      // Claiming the token and updating the password happen in one transaction.
      const claimed = await tx.passwordResetToken.updateMany({
        where: { id: record.id, usedAt: null },
        data: { usedAt: changedAt },
      });

      if (claimed.count !== 1) {
        throw new Error("RESET_TOKEN_ALREADY_USED");
      }

      // Any other unused link for this user stops working as well.
      await tx.passwordResetToken.updateMany({
        where: { userId: record.userId, usedAt: null },
        data: { usedAt: changedAt },
      });

      // Bumping `sessionVersion` makes every existing session stale.
      return tx.user.update({
        where: { id: record.userId },
        data: {
          passwordHash,
          passwordChangedAt: changedAt,
          sessionVersion: { increment: 1 },
        },
        select: { id: true, email: true, name: true },
      });
    });
  } catch {
    return {
      message:
        "This reset link has already been used. Request a new one to continue.",
      tone: "error",
      requestNewLink: true,
    };
  }

  after(async () => {
    await sendPasswordChangedEmail(updatedUser.email, updatedUser.name);
  });

  redirect("/login?reset=1");
}
