import * as z from "zod";

export const SignupFormSchema = z.object({
  name: z
    .string()
    .min(2, { error: "Name must be at least 2 characters long." })
    .trim(),
  email: z.email({ error: "Please enter a valid email." }).trim(),
  password: z
    .string()
    .min(8, { error: "Be at least 8 characters long." })
    .regex(/[a-zA-Z]/, { error: "Contain at least one letter." })
    .regex(/[0-9]/, { error: "Contain at least one number." })
    .regex(/[^a-zA-Z0-9]/, {
      error: "Contain at least one special character.",
    }),
});

export type SignupFormState =
  | {
      errors?: {
        name?: string[];
        email?: string[];
        password?: string[];
      };
      message?: string;
      /** What was typed, shown again after an error. Never the password. */
      values?: { name?: string; email?: string };
    }
  | undefined;

export const SignupCodeSchema = z.object({
  code: z
    .string()
    .transform((value) => value.replace(/\s+/g, ""))
    .pipe(
      z.string().regex(/^\d{6}$/, {
        error: "Enter the 6-digit code from your email.",
      }),
    ),
});

export type SignupCodeState =
  | {
      errors?: {
        code?: string[];
      };
      message?: string;
      tone?: "error" | "info";
    }
  | undefined;

export const LoginFormSchema = z.object({
  email: z.email({ error: "Please enter a valid email." }).trim(),
  password: z.string().min(1, { error: "Password is required." }),
});

export type LoginFormState =
  | {
      errors?: {
        email?: string[];
        password?: string[];
      };
      message?: string;
      /** What was typed, shown again after an error. Never the password. */
      values?: { email?: string };
    }
  | undefined;

export const ForgotPasswordSchema = z.object({
  email: z.email({ error: "Please enter a valid email." }).trim(),
});

export type ForgotPasswordState =
  | {
      errors?: {
        email?: string[];
      };
      message?: string;
      tone?: "error" | "info";
      /** What was typed, shown again after an error. */
      values?: { email?: string };
    }
  | undefined;

const PasswordSchema = z
  .string()
  .min(8, { error: "Be at least 8 characters long." })
  .regex(/[a-zA-Z]/, { error: "Contain at least one letter." })
  .regex(/[0-9]/, { error: "Contain at least one number." })
  .regex(/[^a-zA-Z0-9]/, {
    error: "Contain at least one special character.",
  });

export const ResetPasswordSchema = z
  .object({
    token: z.string().min(1, { error: "Reset token is required." }),
    password: PasswordSchema,
    confirmPassword: z
      .string()
      .min(1, { error: "Please confirm your new password." }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    error: "Passwords do not match.",
    path: ["confirmPassword"],
  });

export type ResetPasswordState =
  | {
      errors?: {
        password?: string[];
        confirmPassword?: string[];
      };
      message?: string;
      tone?: "error" | "info";
      requestNewLink?: boolean;
    }
  | undefined;

export const ChangePasswordSchema = z
  .object({
    currentPassword: z
      .string()
      .min(1, { error: "Please enter your current password." }),
    newPassword: PasswordSchema,
    confirmPassword: z
      .string()
      .min(1, { error: "Please confirm your new password." }),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    error: "Passwords do not match.",
    path: ["confirmPassword"],
  });

export type ChangePasswordState =
  | {
      errors?: {
        currentPassword?: string[];
        newPassword?: string[];
        confirmPassword?: string[];
      };
      message?: string;
    }
  | undefined;

export const DeleteAccountSchema = z.object({
  password: z.string().min(1, { error: "Please enter your password." }),
});

export type DeleteAccountState =
  | {
      errors?: {
        password?: string[];
      };
      message?: string;
    }
  | undefined;

export const ChangeEmailSchema = z.object({
  // Trimmed and lowercased before the format check, so " New@Mail.com " works.
  newEmail: z
    .string()
    .trim()
    .toLowerCase()
    .pipe(z.email({ error: "Please enter a valid email." })),
  currentPassword: z
    .string()
    .min(1, { error: "Please enter your current password." }),
});

export type ChangeEmailState =
  | {
      errors?: {
        newEmail?: string[];
        currentPassword?: string[];
      };
      message?: string;
      tone?: "error" | "info";
      /** What was typed, shown again after an error. Never the password. */
      values?: { newEmail?: string };
    }
  | undefined;

export const EmailChangeTokenSchema = z.object({
  token: z.string().min(1, { error: "This link is invalid." }),
});

export type EmailChangeTokenState =
  | {
      message?: string;
    }
  | undefined;
