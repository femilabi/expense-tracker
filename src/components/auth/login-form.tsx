"use client";

import { useActionState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Button,
  Field,
  Input,
  Link as ChakraLink,
  Stack,
  Text,
} from "@chakra-ui/react";

import PasswordInput from "@/components/auth/password-input";
import { login } from "@/lib/actions/auth";

const inputStyles = {
  borderColor: "brand.mist",
  focusRingColor: "brand.teal",
  _invalid: {
    borderColor: "brand.red",
    focusRingColor: "brand.red",
  },
} as const;

export default function LoginForm() {
  const [state, formAction, pending] = useActionState(login, undefined);
  const searchParams = useSearchParams();
  const notice =
    searchParams.get("registered") === "1"
      ? "Account created. You can log in now."
      : searchParams.get("passwordChanged") === "1"
        ? "Password updated. Please log in again."
        : searchParams.get("reset") === "1"
          ? "Password reset. You can log in with your new password."
          : searchParams.get("emailChanged") === "1"
            ? "Email updated. Please log in with your new email."
            : searchParams.get("emailRestored") === "1"
              ? "Email restored. Please log in and reset your password."
              : null;

  return (
    <form action={formAction}>
      <Stack gap={4}>
        {notice ? (
          <Text
            aria-live="polite"
            bg="brand.green/10"
            borderRadius="lg"
            color="brand.green"
            fontSize="sm"
            fontWeight="medium"
            px={3}
            py={2}
          >
            {notice}
          </Text>
        ) : null}

        <Field.Root invalid={Boolean(state?.errors?.email)}>
          <Field.Label htmlFor="email">Email</Field.Label>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            {...inputStyles}
            aria-invalid={state?.errors?.email ? true : undefined}
          />
          <Field.ErrorText aria-live="polite">
            {state?.errors?.email?.[0]}
          </Field.ErrorText>
        </Field.Root>

        <Field.Root invalid={Boolean(state?.errors?.password)}>
          <Field.Label htmlFor="password">Password</Field.Label>
          <PasswordInput
            id="password"
            name="password"
            autoComplete="current-password"
            placeholder="••••••••"
            {...inputStyles}
            aria-invalid={state?.errors?.password ? true : undefined}
          />
          <Field.ErrorText aria-live="polite">
            {state?.errors?.password?.[0]}
          </Field.ErrorText>
          <ChakraLink
            asChild
            alignSelf="flex-end"
            color="brand.teal"
            fontSize="sm"
            fontWeight="medium"
            textDecoration="underline"
          >
            <Link href="/forgot-password">Forgot password?</Link>
          </ChakraLink>
        </Field.Root>

        {state?.message ? (
          <Text aria-live="polite" color="brand.red" fontSize="sm">
            {state.message}
          </Text>
        ) : null}

        <Button
          type="submit"
          loading={pending}
          loadingText="Logging in…"
          mt={1}
          w="full"
          h={11}
          borderRadius="full"
          bg="brand.teal"
          color="white"
          fontSize="sm"
          fontWeight="medium"
          _hover={{ bg: "brand.teal", opacity: 0.9 }}
          _active={{ opacity: 0.8 }}
        >
          Log in
        </Button>
      </Stack>
    </form>
  );
}
