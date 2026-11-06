"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { after } from "next/server";
import * as z from "zod";

import { auth, signOut } from "@/auth";
import {
  ChangePasswordSchema,
  type ChangePasswordState,
} from "@/lib/definitions";
import { sendPasswordChangedEmail } from "@/lib/email";
import { prisma } from "@/lib/prisma";
import { checkRateLimit, RATE_LIMIT_MESSAGE } from "@/lib/rate-limit";

const CHANGE_PASSWORD_USER_LIMIT = 10;

export async function changePassword(
  _state: ChangePasswordState,
  formData: FormData,
): Promise<ChangePasswordState> {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    redirect("/login");
  }

  const validatedFields = ChangePasswordSchema.safeParse({
    currentPassword: formData.get("currentPassword"),
    newPassword: formData.get("newPassword"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!validatedFields.success) {
    return { errors: z.flattenError(validatedFields.error).fieldErrors };
  }

  const { currentPassword, newPassword } = validatedFields.data;

  // Limits guessing of the current password from a hijacked session.
  const userLimit = await checkRateLimit({
    scope: "change-password:user",
    identifier: userId,
    limit: CHANGE_PASSWORD_USER_LIMIT,
  });
  if (userLimit.limited) {
    return { message: RATE_LIMIT_MESSAGE };
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true, name: true, passwordHash: true },
  });

  if (!user?.passwordHash) {
    return { message: "Something went wrong. Please try again." };
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

  const passwordHash = await bcrypt.hash(newPassword, 10);
  const changedAt = new Date();

  try {
    await prisma.$transaction(async (tx) => {
      // Reset links issued before the change must not be able to set another
      // password, so unused ones are marked as used together with the update.
      await tx.passwordResetToken.updateMany({
        where: { userId, usedAt: null },
        data: { usedAt: changedAt },
      });

      // Bumping `sessionVersion` makes every existing session stale.
      await tx.user.update({
        where: { id: userId },
        data: {
          passwordHash,
          passwordChangedAt: changedAt,
          sessionVersion: { increment: 1 },
        },
      });
    });
  } catch {
    return { message: "Something went wrong. Please try again." };
  }

  after(async () => {
    await sendPasswordChangedEmail(user.email, user.name);
  });

  // Clears the session cookie on this device too, then redirects.
  await signOut({ redirectTo: "/login?passwordChanged=1" });
}
