"use client";

import { useActionState } from "react";
import { Button, Field, PinInput, Stack, Text } from "@chakra-ui/react";

import {
  resendSignupCode,
  verifySignupCode,
} from "@/lib/actions/verify-signup";
import type { SignupCodeState } from "@/lib/definitions";

const CODE_LENGTH = 6;

/** The boxes share the row and stay square, up to 48px each. */
const codeBoxStyles = {
  flex: "1",
  minW: 0,
  maxW: 12,
  h: "auto",
  aspectRatio: "1",
  borderRadius: "lg",
  borderColor: "border",
  focusRingColor: "brand.solid",
  color: "fg",
  fontSize: "xl",
  fontWeight: "semibold",
  _invalid: {
    borderColor: "border.error",
    focusRingColor: "fg.error",
  },
} as const;

function StatusMessage({ state }: { state: SignupCodeState }) {
  if (!state?.message) {
    return null;
  }

  return (
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
  );
}

export default function VerifySignupForm() {
  const [state, formAction, pending] = useActionState(
    verifySignupCode,
    undefined,
  );
  const [resendState, resendAction, resending] = useActionState(
    resendSignupCode,
    undefined,
  );

  return (
    <Stack gap={4}>
      <form action={formAction}>
        <Stack gap={4}>
          <StatusMessage state={state} />

          <Field.Root invalid={Boolean(state?.errors?.code)}>
            {/* One box per digit. The hidden input submits them as `code`. */}
            <PinInput.Root
              name="code"
              count={CODE_LENGTH}
              type="numeric"
              otp
              autoFocus
              placeholder=""
              invalid={Boolean(state?.errors?.code)}
              w="full"
            >
              <PinInput.HiddenInput />
              <PinInput.Label color="fg.muted" fontSize="sm" mb={1.5}>
                Verification code
              </PinInput.Label>
              <PinInput.Control
                display="flex"
                w="full"
                justifyContent="space-between"
                gap={2}
              >
                {Array.from({ length: CODE_LENGTH }, (_, index) => (
                  <PinInput.Input
                    key={index}
                    index={index}
                    {...codeBoxStyles}
                  />
                ))}
              </PinInput.Control>
            </PinInput.Root>
            <Field.ErrorText aria-live="polite">
              {state?.errors?.code?.[0]}
            </Field.ErrorText>
          </Field.Root>

          <Button
            type="submit"
            loading={pending}
            loadingText="Verifying…"
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
            Verify email
          </Button>
        </Stack>
      </form>

      <form action={resendAction}>
        <Stack gap={3} align="center">
          <StatusMessage state={resendState} />

          <Button
            type="submit"
            variant="plain"
            loading={resending}
            loadingText="Sending…"
            color="brand.fg"
            fontSize="sm"
            fontWeight="medium"
            textDecoration="underline"
            h="auto"
            p={0}
          >
            Send a new code
          </Button>
        </Stack>
      </form>
    </Stack>
  );
}
