"use client";

import { useActionState } from "react";
import { Button, Field, Input, Stack, Text } from "@chakra-ui/react";

import PasswordInput from "@/components/auth/password-input";
import { requestEmailChange } from "@/lib/actions/change-email";

const inputStyles = {
  borderColor: "brand.mist",
  focusRingColor: "brand.teal",
  _invalid: {
    borderColor: "brand.red",
    focusRingColor: "brand.red",
  },
} as const;

export default function ChangeEmailForm() {
  const [state, formAction, pending] = useActionState(
    requestEmailChange,
    undefined,
  );

  return (
    <form action={formAction}>
      <Stack gap={4}>
        {state?.message ? (
          <Text
            aria-live="polite"
            bg={state.tone === "info" ? "brand.green/10" : "brand.red/10"}
            borderRadius="lg"
            color={state.tone === "info" ? "brand.green" : "brand.red"}
            fontSize="sm"
            fontWeight="medium"
            px={3}
            py={2}
          >
            {state.message}
          </Text>
        ) : null}

        <Field.Root invalid={Boolean(state?.errors?.newEmail)}>
          <Field.Label htmlFor="newEmail" color="brand.slate">
            New email
          </Field.Label>
          <Input
            id="newEmail"
            name="newEmail"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            {...inputStyles}
            aria-invalid={state?.errors?.newEmail ? true : undefined}
          />
          <Field.ErrorText aria-live="polite">
            {state?.errors?.newEmail?.[0]}
          </Field.ErrorText>
        </Field.Root>

        <Field.Root invalid={Boolean(state?.errors?.currentPassword)}>
          <Field.Label htmlFor="changeEmailPassword" color="brand.slate">
            Current password
          </Field.Label>
          <PasswordInput
            id="changeEmailPassword"
            name="currentPassword"
            autoComplete="current-password"
            placeholder="••••••••"
            {...inputStyles}
            aria-invalid={state?.errors?.currentPassword ? true : undefined}
          />
          <Field.ErrorText aria-live="polite">
            {state?.errors?.currentPassword?.[0]}
          </Field.ErrorText>
        </Field.Root>

        <Button
          type="submit"
          loading={pending}
          loadingText="Sending…"
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
          Send confirmation link
        </Button>
      </Stack>
    </form>
  );
}
