import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { Heading, Link as ChakraLink, Stack, Text } from "@chakra-ui/react";

import VerifySignupForm from "@/components/auth/verify-signup-form";
import { getPendingSignupId } from "@/lib/pending-signup";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Verify your email · Expense Tracker",
};

export const instant = false;

async function getPendingEmail(): Promise<string | null> {
  const id = await getPendingSignupId();
  if (!id) {
    return null;
  }

  const pending = await prisma.pendingSignup.findUnique({
    where: { id },
    select: { email: true },
  });
  return pending?.email ?? null;
}

function SignupLink({ children }: { children: string }) {
  return (
    <ChakraLink
      asChild
      color="brand.fg"
      fontWeight="medium"
      textDecoration="underline"
    >
      <Link href="/signup">{children}</Link>
    </ChakraLink>
  );
}

export default async function VerifyEmailPage() {
  await connection();

  const email = await getPendingEmail();

  if (!email) {
    return (
      <Stack gap={6}>
        <Stack gap={1}>
          <Heading as="h1" size="2xl" color="fg">
            No signup to verify
          </Heading>
          <Text color="fg.muted" fontSize="sm">
            Your signup has expired or was already completed.
          </Text>
        </Stack>

        <Text color="fg.muted" fontSize="sm" textAlign="center">
          <SignupLink>Sign up again</SignupLink> or{" "}
          <ChakraLink
            asChild
            color="brand.fg"
            fontWeight="medium"
            textDecoration="underline"
          >
            <Link href="/login">log in</Link>
          </ChakraLink>
          .
        </Text>
      </Stack>
    );
  }

  return (
    <Stack gap={6}>
      <Stack gap={1}>
        <Heading as="h1" size="2xl" color="fg">
          Check your email
        </Heading>
        <Text color="fg.muted" fontSize="sm">
          We sent a 6-digit code to{" "}
          <Text as="span" color="fg" fontWeight="medium">
            {email}
          </Text>
          . Enter it below to finish creating your account.
        </Text>
      </Stack>

      <VerifySignupForm />

      <Text color="fg.muted" fontSize="sm" textAlign="center">
        Wrong email? <SignupLink>Sign up again</SignupLink>
      </Text>
    </Stack>
  );
}
