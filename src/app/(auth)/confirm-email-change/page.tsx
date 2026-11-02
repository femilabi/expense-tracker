import type { Metadata } from "next";
import { connection } from "next/server";
import { Heading, Stack, Text } from "@chakra-ui/react";

import EmailChangeLinkForm from "@/components/auth/email-change-link-form";
import { confirmEmailChange } from "@/lib/actions/change-email";

export const metadata: Metadata = {
  title: "Confirm new email · Expense Tracker",
};

export const instant = false;

export default async function ConfirmEmailChangePage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  await connection();

  const { token = "" } = await searchParams;

  return (
    <Stack gap={6}>
      <Stack gap={1}>
        <Heading as="h1" size="2xl" color="brand.navy">
          Confirm your new email
        </Heading>
        <Text color="brand.slate" fontSize="sm">
          Your account will use this address from now on, and you&apos;ll be
          signed out on every device.
        </Text>
      </Stack>

      <EmailChangeLinkForm
        token={token}
        action={confirmEmailChange}
        submitLabel="Confirm new email"
        pendingLabel="Confirming…"
      />
    </Stack>
  );
}
