import type { Metadata } from "next";
import { connection } from "next/server";
import { Box, Flex, Heading, Stack, Text } from "@chakra-ui/react";

import ChangeEmailForm from "@/components/auth/change-email-form";
import ChangePasswordForm from "@/components/auth/change-password-form";
import DeleteAccountForm from "@/components/auth/delete-account-form";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";

export const metadata: Metadata = {
  title: "Settings · Expense Tracker",
};

export const instant = false;

/** Time left until a link expires, e.g. "in 55 minutes". */
function formatTimeLeft(msLeft: number): string {
  const minutes = Math.ceil(msLeft / 60_000);
  return minutes === 1 ? "in 1 minute" : `in ${minutes} minutes`;
}

/** The current email and the pending change, if its link still works. */
async function getEmailSettings(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      email: true,
      emailChangeRequest: { select: { newEmail: true, expiresAt: true } },
    },
  });
  const request = user?.emailChangeRequest;
  const msLeft = request ? request.expiresAt.getTime() - Date.now() : 0;

  return {
    email: user?.email ?? "",
    pendingChange:
      request && msLeft > 0
        ? { newEmail: request.newEmail, expiresIn: formatTimeLeft(msLeft) }
        : null,
  };
}

export default async function SettingsPage() {
  await connection();

  const { id } = await getCurrentUser();
  const { email, pendingChange } = await getEmailSettings(id);

  return (
    <Stack gap={6} maxW="5xl" mx="auto">
      <Stack gap={1}>
        <Heading as="h1" size="2xl" color="brand.navy">
          Settings
        </Heading>
        <Text color="brand.slate" fontSize="sm">
          Manage your account security.
        </Text>
      </Stack>

      <Box
        display="grid"
        gridTemplateColumns={{
          base: "minmax(0, 1fr)",
          lg: "repeat(2, minmax(0, 1fr))",
        }}
        gap={6}
      >
        <Box
          display="flex"
          flexDirection="column"
          bg="white"
          borderWidth="1px"
          borderColor="brand.mist"
          borderRadius="2xl"
          px={{ base: 6, sm: 8 }}
          py={8}
        >
          <Stack gap={6} flex="1">
            <Stack gap={1}>
              <Heading as="h2" size="lg" color="brand.navy">
                Change password
              </Heading>
              <Text color="brand.slate" fontSize="sm">
                You&apos;ll be signed out on every device, including this one,
                and asked to log in again.
              </Text>
            </Stack>

            <ChangePasswordForm />
          </Stack>
        </Box>

        <Box
          display="flex"
          flexDirection="column"
          bg="white"
          borderWidth="1px"
          borderColor="brand.mist"
          borderRadius="2xl"
          px={{ base: 6, sm: 8 }}
          py={8}
        >
          <Stack gap={6} flex="1">
            <Stack gap={1}>
              <Heading as="h2" size="lg" color="brand.navy">
                Change email
              </Heading>
              <Text color="brand.slate" fontSize="sm">
                Current email:{" "}
                <Text as="span" color="brand.navy" fontWeight="medium">
                  {email}
                </Text>
              </Text>
              <Text color="brand.slate" fontSize="sm">
                We&apos;ll send a confirmation link to the new address. Your old
                address can undo the change for 3 days.
              </Text>
            </Stack>

            {pendingChange ? (
              <Text
                bg="brand.teal/10"
                borderRadius="lg"
                color="brand.navy"
                fontSize="sm"
                px={3}
                py={2}
              >
                Waiting for confirmation of{" "}
                <Text as="span" fontWeight="medium">
                  {pendingChange.newEmail}
                </Text>
                . The link expires {pendingChange.expiresIn}.
              </Text>
            ) : null}

            <ChangeEmailForm />
          </Stack>
        </Box>
      </Box>

      <Box
        as="section"
        aria-labelledby="danger-zone-heading"
        bg="white"
        borderWidth="1px"
        borderColor="brand.red/40"
        borderRadius="2xl"
        px={{ base: 6, sm: 8 }}
        py={8}
      >
        <Flex
          direction={{ base: "column", md: "row" }}
          align={{ base: "stretch", md: "center" }}
          justify="space-between"
          gap={6}
        >
          <Stack gap={1} flex="1">
            <Heading
              as="h2"
              id="danger-zone-heading"
              size="lg"
              color="brand.navy"
            >
              Delete account
            </Heading>
            <Text color="brand.slate" fontSize="sm">
              Permanently delete your account and all of your data. This cannot
              be undone.
            </Text>
          </Stack>

          <DeleteAccountForm />
        </Flex>
      </Box>
    </Stack>
  );
}
