"use server";

import { revalidatePath } from "next/cache";
import * as z from "zod";

import { CURRENCY_CODES } from "@/app/dashboard/expenses/expense-form/constants/currencies";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";

export type ProfileFormValues = {
  firstName: string;
  lastName: string;
  currency: string;
};

export type ProfileFormErrors = Partial<{
  firstName: string[];
  lastName: string[];
  currency: string[];
}>;

export type ProfileFormState =
  | {
      values?: ProfileFormValues;
      errors?: ProfileFormErrors;
      message?: string;
    }
  | undefined;

const profileSchema = z.object({
  firstName: z
    .string()
    .trim()
    .max(100, { error: "First name must be 100 characters or fewer." })
    .transform((value) => value || "")
    .optional()
    .default(""),
  lastName: z
    .string()
    .trim()
    .max(100, { error: "Last name must be 100 characters or fewer." })
    .transform((value) => value || "")
    .optional()
    .default(""),
  currency: z.enum(CURRENCY_CODES, {
    error: "Please select a valid currency.",
  }),
});

function readValues(formData: FormData): ProfileFormValues {
  return {
    firstName: String(formData.get("firstName") ?? ""),
    lastName: String(formData.get("lastName") ?? ""),
    currency: String(formData.get("currency") ?? "USD"),
  };
}

export async function updateProfile(
  previousState: ProfileFormState,
  formData: FormData,
): Promise<ProfileFormState> {
  const user = await getCurrentUser();
  const values = readValues(formData);
  const parsed = profileSchema.safeParse(values);

  if (!parsed.success) {
    return {
      values,
      errors: z.flattenError(parsed.error).fieldErrors,
    };
  }

  const { firstName, lastName, currency } = parsed.data;

  await prisma.profile.upsert({
    where: { userId: user.id },
    update: {
      firstName: firstName || null,
      lastName: lastName || null,
      currency,
    },
    create: {
      userId: user.id,
      firstName: firstName || null,
      lastName: lastName || null,
      currency,
    },
  });

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/profile");

  return {
    values: {
      firstName,
      lastName,
      currency,
    },
    message: "Profile updated successfully.",
  };
}
