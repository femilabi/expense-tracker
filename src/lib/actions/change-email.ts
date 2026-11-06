"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { after } from "next/server";
import * as z from "zod";

import { auth, signOut } from "@/auth";
import {
  ChangeEmailSchema,
  EmailChangeTokenSchema,
  type ChangeEmailState,
  type EmailChangeTokenState,
} from "@/lib/definitions";
import {
  sendEmailChangeCompletedEmail,
  sendEmailChangedNoticeEmail,
  sendEmailChangeVerificationEmail,
  sendEmailRestoredEmail,
} from "@/lib/email";
import {
  formatExpiry,
  generateEmailChangeToken,
  getEmailChangeExpiry,
  getEmailChangeUndoExpiry,
  hashEmailChangeToken,
} from "@/lib/email-change-token";
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

const CHANGE_EMAIL_USER_LIMIT = 5;
const EMAIL_CHANGE_LINK_IP_LIMIT = 10;

const SOMETHING_WENT_WRONG = "Something went wrong. Please try again.";
const EMAIL_IN_USE = "An account with this email already exists.";
const CONFIRM_LINK_INVALID =
  "This link is invalid or has already been used. Request a new one from Settings.";
const CONFIRM_LINK_EXPIRED =
  "This link has expired. Request a new one from Settings.";
const CONFIRM_EMAIL_TAKEN =
  "This email is now used by another account. Choose a different one in Settings.";
const UNDO_LINK_INVALID = "This undo link is invalid.";
const UNDO_LINK_USED =
  "This undo link has already been used or is no longer valid.";
const UNDO_LINK_EXPIRED =
  "This undo link has expired. If you no longer have access to your account, reset your password or contact support.";
const UNDO_EMAIL_TAKEN =
  "Your original email is now used by another account, so it can't be restored. Please contact support.";

const ALREADY_USED = "EMAIL_CHANGE_LINK_ALREADY_USED";
const OLD_EMAIL_TAKEN = "EMAIL_CHANGE_OLD_EMAIL_TAKEN";

function isErrorWithMessage(error: unknown, message: string): boolean {
  return error instanceof Error && error.message === message;
}

/** Prisma reports a unique constraint violation, here on `users.email`. */
function isUniqueViolation(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "P2002"
  );
}

export async function requestEmailChange(
  _state: ChangeEmailState,
  formData: FormData,
): Promise<ChangeEmailState> {
  const result = await sendEmailChangeLink(formData);
  // After an error the new email is shown again. After a send it clears.
  if (result?.tone === "info") {
    return result;
  }
  return { ...result, values: keepFormValues(formData, ["newEmail"]) };
}

async function sendEmailChangeLink(
  formData: FormData,
): Promise<ChangeEmailState> {
  // The account always comes from the session, never the form.
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    redirect("/login");
  }

  const validatedFields = ChangeEmailSchema.safeParse({
    newEmail: formData.get("newEmail"),
    currentPassword: formData.get("currentPassword"),
  });

  if (!validatedFields.success) {
    return { errors: z.flattenError(validatedFields.error).fieldErrors };
  }

  const { newEmail, currentPassword } = validatedFields.data;

  // Limits guessing of the password from a hijacked session.
  const userLimit = await checkRateLimit({
    scope: "change-email:user",
    identifier: userId,
    limit: CHANGE_EMAIL_USER_LIMIT,
  });
  if (userLimit.limited) {
    return { message: RATE_LIMIT_MESSAGE, tone: "error" };
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true, passwordHash: true },
  });

  if (!user?.passwordHash) {
    return { message: SOMETHING_WENT_WRONG, tone: "error" };
  }

  const passwordsMatch = await bcrypt.compare(
    currentPassword,
    user.passwordHash,
  );
  if (!passwordsMatch) {
    return {
      errors: { currentPassword: ["Current password is incorrect."] },
    };
  }

  if (newEmail === user.email.toLowerCase()) {
    return { errors: { newEmail: ["This is already your email."] } };
  }

  // While the old address can still undo the last change, another change
  // would let whoever made it cancel that undo link.
  const activeUndo = await prisma.emailChangeUndo.findFirst({
    where: { userId, usedAt: null, expiresAt: { gt: new Date() } },
    select: { expiresAt: true },
  });
  if (activeUndo) {
    return {
      message: `You changed your email recently. For your security you can change it again after ${formatExpiry(activeUndo.expiresAt)}.`,
      tone: "error",
    };
  }

  const existingUser = await prisma.user.findUnique({
    where: { email: newEmail },
    select: { id: true },
  });
  if (existingUser) {
    return { errors: { newEmail: [EMAIL_IN_USE] } };
  }

  // Sent before saving, so a failed send leaves no pending request behind.
  const token = generateEmailChangeToken();
  const sent = await sendEmailChangeVerificationEmail(newEmail, token);
  if (!sent) {
    return {
      message: "We couldn't send the confirmation email. Please try again.",
      tone: "error",
    };
  }

  const request = {
    newEmail,
    tokenHash: hashEmailChangeToken(token),
    expiresAt: getEmailChangeExpiry(),
  };

  try {
    // One pending request per user, a new one replaces the earlier link.
    await prisma.emailChangeRequest.upsert({
      where: { userId },
      create: { userId, ...request },
      update: request,
    });
  } catch {
    return { message: SOMETHING_WENT_WRONG, tone: "error" };
  }

  revalidatePath("/dashboard/settings");

  return {
    message: `We sent a confirmation link to ${newEmail}. It expires in 1 hour.`,
    tone: "info",
  };
}

export async function confirmEmailChange(
  _state: EmailChangeTokenState,
  formData: FormData,
): Promise<EmailChangeTokenState> {
  const validatedFields = EmailChangeTokenSchema.safeParse({
    token: formData.get("token"),
  });

  if (!validatedFields.success) {
    return { message: CONFIRM_LINK_INVALID };
  }

  const ipLimit = await checkRateLimit({
    scope: "confirm-email-change:ip",
    identifier: await getClientIp(),
    limit: EMAIL_CHANGE_LINK_IP_LIMIT,
  });
  if (ipLimit.limited) {
    return { message: RATE_LIMIT_MESSAGE };
  }

  const request = await prisma.emailChangeRequest.findUnique({
    where: { tokenHash: hashEmailChangeToken(validatedFields.data.token) },
    select: { id: true, userId: true, newEmail: true, expiresAt: true },
  });

  if (!request) {
    return { message: CONFIRM_LINK_INVALID };
  }

  if (request.expiresAt.getTime() < Date.now()) {
    return { message: CONFIRM_LINK_EXPIRED };
  }

  const existingUser = await prisma.user.findUnique({
    where: { email: request.newEmail },
    select: { id: true },
  });
  if (existingUser) {
    return { message: CONFIRM_EMAIL_TAKEN };
  }

  const undoToken = generateEmailChangeToken();
  const undoExpiresAt = getEmailChangeUndoExpiry();
  const changedAt = new Date();

  /** The account as it was before the change. */
  let previous: { email: string; name: string };
  try {
    previous = await prisma.$transaction(async (tx) => {
      // Removing the request claims the link, so it works only once.
      const claimed = await tx.emailChangeRequest.deleteMany({
        where: { id: request.id },
      });
      if (claimed.count !== 1) {
        throw new Error(ALREADY_USED);
      }

      const user = await tx.user.findUnique({
        where: { id: request.userId },
        select: { email: true, name: true },
      });
      if (!user) {
        throw new Error(ALREADY_USED);
      }

      // A newer change replaces any earlier undo link.
      await tx.emailChangeUndo.updateMany({
        where: { userId: request.userId, usedAt: null },
        data: { usedAt: changedAt },
      });

      // Reset links sent to the old address stop working for this account.
      await tx.passwordResetToken.updateMany({
        where: { userId: request.userId, usedAt: null },
        data: { usedAt: changedAt },
      });

      // Bumping `sessionVersion` makes every existing session stale.
      await tx.user.update({
        where: { id: request.userId },
        data: { email: request.newEmail, sessionVersion: { increment: 1 } },
      });

      await tx.emailChangeUndo.create({
        data: {
          userId: request.userId,
          oldEmail: user.email,
          newEmail: request.newEmail,
          tokenHash: hashEmailChangeToken(undoToken),
          expiresAt: undoExpiresAt,
        },
      });

      return user;
    });
  } catch (error) {
    if (isErrorWithMessage(error, ALREADY_USED)) {
      return { message: CONFIRM_LINK_INVALID };
    }
    if (isUniqueViolation(error)) {
      return { message: CONFIRM_EMAIL_TAKEN };
    }
    return { message: SOMETHING_WENT_WRONG };
  }

  after(async () => {
    await sendEmailChangedNoticeEmail(
      previous.email,
      request.newEmail,
      undoToken,
      formatExpiry(undoExpiresAt),
      previous.name,
    );
    await sendEmailChangeCompletedEmail(request.newEmail, previous.name);
  });

  // Clears the session cookie on this device too, then redirects.
  await signOut({ redirectTo: "/login?emailChanged=1" });
}

export async function undoEmailChange(
  _state: EmailChangeTokenState,
  formData: FormData,
): Promise<EmailChangeTokenState> {
  const validatedFields = EmailChangeTokenSchema.safeParse({
    token: formData.get("token"),
  });

  if (!validatedFields.success) {
    return { message: UNDO_LINK_INVALID };
  }

  const ipLimit = await checkRateLimit({
    scope: "undo-email-change:ip",
    identifier: await getClientIp(),
    limit: EMAIL_CHANGE_LINK_IP_LIMIT,
  });
  if (ipLimit.limited) {
    return { message: RATE_LIMIT_MESSAGE };
  }

  const undo = await prisma.emailChangeUndo.findUnique({
    where: { tokenHash: hashEmailChangeToken(validatedFields.data.token) },
    select: {
      id: true,
      userId: true,
      oldEmail: true,
      usedAt: true,
      expiresAt: true,
    },
  });

  if (!undo) {
    return { message: UNDO_LINK_INVALID };
  }

  if (undo.usedAt) {
    return { message: UNDO_LINK_USED };
  }

  if (undo.expiresAt.getTime() < Date.now()) {
    return { message: UNDO_LINK_EXPIRED };
  }

  const resetToken = generateResetToken();
  const restoredAt = new Date();

  /** The account as it was before the undo. */
  let replaced: { email: string; name: string };
  try {
    replaced = await prisma.$transaction(async (tx) => {
      // Checked before claiming the link, so it stays usable if this fails.
      const owner = await tx.user.findUnique({
        where: { email: undo.oldEmail },
        select: { id: true },
      });
      if (owner && owner.id !== undo.userId) {
        throw new Error(OLD_EMAIL_TAKEN);
      }

      const claimed = await tx.emailChangeUndo.updateMany({
        where: { id: undo.id, usedAt: null },
        data: { usedAt: restoredAt },
      });
      if (claimed.count !== 1) {
        throw new Error(ALREADY_USED);
      }

      const user = await tx.user.findUnique({
        where: { id: undo.userId },
        select: { email: true, name: true },
      });
      if (!user) {
        throw new Error(ALREADY_USED);
      }

      // A pending change could otherwise still be confirmed after the undo.
      await tx.emailChangeRequest.deleteMany({
        where: { userId: undo.userId },
      });

      // Reset links sent to the replaced address stop working, a fresh one is
      // created for the restored address.
      await tx.passwordResetToken.updateMany({
        where: { userId: undo.userId, usedAt: null },
        data: { usedAt: restoredAt },
      });
      await tx.passwordResetToken.create({
        data: {
          userId: undo.userId,
          tokenHash: hashResetToken(resetToken),
          expiresAt: getResetTokenExpiry(),
        },
      });

      // Bumping `sessionVersion` makes every existing session stale.
      await tx.user.update({
        where: { id: undo.userId },
        data: { email: undo.oldEmail, sessionVersion: { increment: 1 } },
      });

      return user;
    });
  } catch (error) {
    if (
      isErrorWithMessage(error, OLD_EMAIL_TAKEN) ||
      isUniqueViolation(error)
    ) {
      return { message: UNDO_EMAIL_TAKEN };
    }
    if (isErrorWithMessage(error, ALREADY_USED)) {
      return { message: UNDO_LINK_USED };
    }
    return { message: SOMETHING_WENT_WRONG };
  }

  after(async () => {
    // Only the restored address gets a reset link, the other one may belong to
    // whoever made the change.
    await sendEmailRestoredEmail(
      undo.oldEmail,
      undo.oldEmail,
      resetToken,
      replaced.name,
    );
    if (replaced.email.toLowerCase() !== undo.oldEmail.toLowerCase()) {
      await sendEmailRestoredEmail(replaced.email, undo.oldEmail);
    }
  });

  // Clears the session cookie on this device too, then redirects.
  await signOut({ redirectTo: "/login?emailRestored=1" });
}
