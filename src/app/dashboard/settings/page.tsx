import type { Metadata } from "next";
import { Box, Heading, Stack, Text } from "@chakra-ui/react";

import ChangePasswordForm from "@/components/auth/change-password-form";
import DeleteAccountForm from "@/components/auth/delete-account-form";

export const metadata: Metadata = {
  title: "Settings · Expense Tracker",
};

export default function SettingsPage() {
  return (
    <Stack gap={6} maxW="md">
      <Stack gap={1}>
        <Heading as="h1" size="2xl" color="brand.navy">
          Settings
        </Heading>
        <Text color="brand.slate" fontSize="sm">
          Manage your account security.
        </Text>
      </Stack>

      <Box
        bg="white"
        borderWidth="1px"
        borderColor="brand.mist"
        borderRadius="2xl"
        px={{ base: 6, sm: 8 }}
        py={8}
      >
        <Stack gap={6}>
          <Stack gap={1}>
            <Heading as="h2" size="lg" color="brand.navy">
              Change password
            </Heading>
            <Text color="brand.slate" fontSize="sm">
              You&apos;ll be signed out on every device, including this one, and
              asked to log in again.
            </Text>
          </Stack>

          <ChangePasswordForm />
        </Stack>
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
        <Stack gap={6}>
          <Stack gap={1}>
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
        </Stack>
      </Box>
    </Stack>
  );
}
