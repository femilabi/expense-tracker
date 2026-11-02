"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { after } from "next/server";
import * as z from "zod";

import { auth, signOut } from "@/auth";
import {
  DeleteAccountSchema,
  type DeleteAccountState,
} from "@/lib/definitions";
import { sendAccountDeletedEmail } from "@/lib/email";
import { prisma } from "@/lib/prisma";
import { checkRateLimit, RATE_LIMIT_MESSAGE } from "@/lib/rate-limit";

const DELETE_ACCOUNT_USER_LIMIT = 5;

export async function deleteAccount(
  _state: DeleteAccountState,
  formData: FormData,
): Promise<DeleteAccountState> {
  // The account to delete always comes from the session, never the form.
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    redirect("/login");
  }

  const validatedFields = DeleteAccountSchema.safeParse({
    password: formData.get("password"),
  });

  if (!validatedFields.success) {
    return { errors: z.flattenError(validatedFields.error).fieldErrors };
  }

  const { password } = validatedFields.data;

  // Limits guessing of the password from a hijacked session.
  const userLimit = await checkRateLimit({
    scope: "delete-account:user",
    identifier: userId,
    limit: DELETE_ACCOUNT_USER_LIMIT,
  });
  if (userLimit.limited) {
    return { message: RATE_LIMIT_MESSAGE };
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true, passwordHash: true },
  });

  if (!user?.passwordHash) {
    return { message: "Something went wrong. Please try again." };
  }

  const passwordsMatch = await bcrypt.compare(password, user.passwordHash);
  if (!passwordsMatch) {
    return { errors: { password: ["Password is incorrect."] } };
  }

  try {
    await prisma.$transaction(async (tx) => {
      // The foreign keys cascade as well, deleting each table explicitly keeps
      // the deletion complete even if a relation loses its cascade later.
      await tx.passwordResetToken.deleteMany({ where: { userId } });
      await tx.monthlySummary.deleteMany({ where: { userId } });
      await tx.expense.deleteMany({ where: { userId } });
      await tx.income.deleteMany({ where: { userId } });
      await tx.profile.deleteMany({ where: { userId } });

      // Without the user row every existing session is stale, so this also
      // signs the account out on every device.
      await tx.user.delete({ where: { id: userId } });
    });
  } catch {
    return { message: "Something went wrong. Please try again." };
  }

  after(async () => {
    await sendAccountDeletedEmail(user.email);
  });

  // Clears the session cookie on this device too, then redirects.
  await signOut({ redirectTo: "/" });
}
