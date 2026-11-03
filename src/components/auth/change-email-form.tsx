"use client";

import { useActionState } from "react";
import { Button, Field, Input, Stack, Text } from "@chakra-ui/react";

import PasswordInput from "@/components/auth/password-input";
import { requestEmailChange } from "@/lib/actions/change-email";

const inputStyles = {
  borderColor: "border",
  focusRingColor: "brand.solid",
  _invalid: {
    borderColor: "border.error",
    focusRingColor: "fg.error",
  },
} as const;

export default function ChangeEmailForm() {
  const [state, formAction, pending] = useActionState(
    requestEmailChange,
    undefined,
  );

  return (
    <form action={formAction} style={{ display: "flex", flex: 1 }}>
      <Stack gap={4} flex="1">
        {state?.message ? (
          <Text
            aria-live="polite"
            bg={state.tone === "info" ? "success.subtle" : "danger.subtle"}
            borderRadius="lg"
            color={state.tone === "info" ? "fg.success" : "fg.error"}
            fontSize="sm"
            fontWeight="medium"
            px={3}
            py={2}
          >
            {state.message}
          </Text>
        ) : null}

        <Field.Root invalid={Boolean(state?.errors?.newEmail)}>
          <Field.Label htmlFor="newEmail" color="fg.muted">
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
          <Field.Label htmlFor="changeEmailPassword" color="fg.muted">
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
          mt="auto"
          w="full"
          h={11}
          borderRadius="full"
          bg="brand.solid"
          color="brand.contrast"
          fontSize="sm"
          fontWeight="medium"
          _hover={{ bg: "brand.hover" }}
          _active={{ opacity: 0.8 }}
        >
          Send confirmation link
        </Button>
      </Stack>
    </form>
  );
}
