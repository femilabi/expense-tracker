import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { Heading, Link as ChakraLink, Stack, Text } from "@chakra-ui/react";

import ForgotPasswordForm from "@/components/auth/forgot-password-form";

export const metadata: Metadata = {
  title: "Forgot password · Expense Tracker",
};

export const instant = false;

export default async function ForgotPasswordPage() {
  await connection();

  return (
    <Stack gap={6}>
      <Stack gap={1}>
        <Heading as="h1" size="2xl" color="fg">
          Forgot your password?
        </Heading>
        <Text color="fg.muted" fontSize="sm">
          Enter your email and we&apos;ll send you a link to choose a new
          password.
        </Text>
      </Stack>

      <ForgotPasswordForm />

      <Text color="fg.muted" fontSize="sm" textAlign="center">
        Remembered it?{" "}
        <ChakraLink
          asChild
          color="brand.fg"
          fontWeight="medium"
          textDecoration="underline"
        >
          <Link href="/login">Log in</Link>
        </ChakraLink>
      </Text>
    </Stack>
  );
}
