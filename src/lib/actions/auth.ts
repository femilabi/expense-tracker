"use server";

import { AuthError } from "next-auth";
import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import * as z from "zod";

import { signIn, signOut } from "@/auth";
import { keepFormValues } from "@/lib/form-values";
import { prisma } from "@/lib/prisma";
import {
  LoginFormSchema,
  SignupFormSchema,
  type LoginFormState,
  type SignupFormState,
} from "@/lib/definitions";
import { issueSignupCode, setPendingSignupCookie } from "@/lib/pending-signup";
import {
  checkRateLimit,
  getClientIp,
  RATE_LIMIT_MESSAGE,
} from "@/lib/rate-limit";
import { getServerSession } from "@/lib/session";
import { SIGNUP_CODE_EMAIL_LIMIT } from "@/lib/signup-code";

const SIGNUP_IP_LIMIT = 10;

export async function signup(
  _state: SignupFormState,
  formData: FormData,
): Promise<SignupFormState> {
  // Success redirects, so every result that reaches the form is an error.
  const result = await startSignup(formData);
  return { ...result, values: keepFormValues(formData, ["name", "email"]) };
}

async function startSignup(formData: FormData): Promise<SignupFormState> {
  const validatedFields = SignupFormSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!validatedFields.success) {
    return { errors: z.flattenError(validatedFields.error).fieldErrors };
  }

  const { name, email, password } = validatedFields.data;

  const ipLimit = await checkRateLimit({
    scope: "signup:ip",
    identifier: await getClientIp(),
    limit: SIGNUP_IP_LIMIT,
  });
  if (ipLimit.limited) {
    return { message: RATE_LIMIT_MESSAGE };
  }

  const emailLimit = await checkRateLimit({
    scope: "signup-code:email",
    identifier: email.toLowerCase(),
    limit: SIGNUP_CODE_EMAIL_LIMIT,
  });
  if (emailLimit.limited) {
    return { message: RATE_LIMIT_MESSAGE };
  }

  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    return { message: "An account with this email already exists." };
  }

  const passwordHash = await bcrypt.hash(password, 10);

  // The account is only created once the emailed code is confirmed.
  const pendingId = await issueSignupCode({ email, name, passwordHash });
  if (!pendingId) {
    return {
      message: "We couldn't send the verification email. Please try again.",
    };
  }

  await setPendingSignupCookie(pendingId);
  redirect("/verify-email");
}

export async function login(
  _state: LoginFormState,
  formData: FormData,
): Promise<LoginFormState> {
  // Success redirects, so every result that reaches the form is an error.
  const result = await signInWithPassword(formData);
  return { ...result, values: keepFormValues(formData, ["email"]) };
}

async function signInWithPassword(formData: FormData): Promise<LoginFormState> {
  const validatedFields = LoginFormSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!validatedFields.success) {
    return { errors: z.flattenError(validatedFields.error).fieldErrors };
  }

  try {
    await signIn("credentials", {
      email: validatedFields.data.email,
      password: validatedFields.data.password,
      redirectTo: "/dashboard",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      if (error.type === "CredentialsSignin") {
        return { message: "Invalid email or password." };
      }
      return { message: "Something went wrong. Please try again." };
    }
    throw error;
  }
}

export async function logout() {
  const session = await getServerSession();

  if (!session?.user) {
    redirect("/login");
  }

  await signOut({ redirectTo: "/" });
}
