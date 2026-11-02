import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { Heading, Link as ChakraLink, Stack, Text } from "@chakra-ui/react";

import ResetPasswordForm from "@/components/auth/reset-password-form";

export const metadata: Metadata = {
  title: "Reset password · Expense Tracker",
};

export const instant = false;

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  await connection();

  const { token = "" } = await searchParams;

  return (
    <Stack gap={6}>
      <Stack gap={1}>
        <Heading as="h1" size="2xl" color="fg">
          Choose a new password
        </Heading>
        <Text color="fg.muted" fontSize="sm">
          This link works once and expires after 15 minutes.
        </Text>
      </Stack>

      <ResetPasswordForm token={token} />

      <Text color="fg.muted" fontSize="sm" textAlign="center">
        Need a new link?{" "}
        <ChakraLink
          asChild
          color="brand.fg"
          fontWeight="medium"
          textDecoration="underline"
        >
          <Link href="/forgot-password">Request a reset link</Link>
        </ChakraLink>
      </Text>
    </Stack>
  );
}
