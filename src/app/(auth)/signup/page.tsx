import type { Metadata } from "next";
import Link from "next/link";
import { Heading, Link as ChakraLink, Stack, Text } from "@chakra-ui/react";

import SignupForm from "@/components/auth/signup-form";

export const metadata: Metadata = {
  title: "Sign up · Expense Tracker",
};

export default function SignupPage() {
  return (
    <Stack gap={6}>
      <Stack gap={1}>
        <Heading as="h1" size="2xl" color="fg">
          Create your account
        </Heading>
        <Text color="fg.muted" fontSize="sm">
          Start tracking your expenses in seconds.
        </Text>
      </Stack>

      <SignupForm />

      <Text color="fg.muted" fontSize="sm" textAlign="center">
        Already have an account?{" "}
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
