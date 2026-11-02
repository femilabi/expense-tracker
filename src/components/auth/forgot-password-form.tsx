"use client";

import { useActionState } from "react";
import { Button, Field, Input, Stack, Text } from "@chakra-ui/react";

import { requestPasswordReset } from "@/lib/actions/reset-password";

const inputStyles = {
  borderColor: "border",
  focusRingColor: "brand.solid",
  _invalid: {
    borderColor: "border.error",
    focusRingColor: "fg.error",
  },
} as const;

export default function ForgotPasswordForm() {
  const [state, formAction, pending] = useActionState(
    requestPasswordReset,
    undefined,
  );

  return (
    <form action={formAction}>
      <Stack gap={4}>
        {state?.message ? (
          <Text
            aria-live="polite"
            bg={state.tone === "error" ? "danger.subtle" : "success.subtle"}
            borderRadius="lg"
            color={state.tone === "error" ? "fg.error" : "fg.success"}
            fontSize="sm"
            fontWeight="medium"
            px={3}
            py={2}
          >
            {state.message}
          </Text>
        ) : null}

        <Field.Root invalid={Boolean(state?.errors?.email)}>
          <Field.Label htmlFor="email" color="fg.muted">
            Email
          </Field.Label>
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

        <Button
          type="submit"
          loading={pending}
          loadingText="Sending link…"
          mt={1}
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
          Send reset link
        </Button>
      </Stack>
    </form>
  );
}
