import type { Metadata } from "next";
import { connection } from "next/server";
import { Heading, Stack, Text } from "@chakra-ui/react";

import EmailChangeLinkForm from "@/components/auth/email-change-link-form";
import { undoEmailChange } from "@/lib/actions/change-email";

export const metadata: Metadata = {
  title: "Undo email change · Expense Tracker",
};

export const instant = false;

export default async function UndoEmailChangePage({
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
          Undo email change
        </Heading>
        <Text color="brand.slate" fontSize="sm">
          Your account will go back to your previous email and every device will
          be signed out. We&apos;ll email you a link to reset your password.
        </Text>
      </Stack>

      <EmailChangeLinkForm
        token={token}
        action={undoEmailChange}
        submitLabel="Restore my email"
        pendingLabel="Restoring…"
      />
    </Stack>
  );
}
