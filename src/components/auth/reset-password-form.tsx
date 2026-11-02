"use client";

import { useActionState } from "react";
import Link from "next/link";
import {
  Button,
  Field,
  Link as ChakraLink,
  Stack,
  Text,
} from "@chakra-ui/react";

import PasswordInput from "@/components/auth/password-input";
import { resetPassword } from "@/lib/actions/reset-password";

const inputStyles = {
  borderColor: "border",
  focusRingColor: "brand.solid",
  _invalid: {
    borderColor: "border.error",
    focusRingColor: "fg.error",
  },
} as const;

export default function ResetPasswordForm({ token }: { token: string }) {
  const [state, formAction, pending] = useActionState(resetPassword, undefined);

  return (
    <form action={formAction}>
      <Stack gap={4}>
        <input type="hidden" name="token" value={token} />

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

        {state?.requestNewLink ? (
          <ChakraLink
            asChild
            color="brand.fg"
            fontSize="sm"
            fontWeight="medium"
            textDecoration="underline"
          >
            <Link href="/forgot-password">Request a new reset link</Link>
          </ChakraLink>
        ) : null}

        <Field.Root invalid={Boolean(state?.errors?.password)}>
          <Field.Label htmlFor="password" color="fg.muted">
            New password
          </Field.Label>
          <PasswordInput
            id="password"
            name="password"
            autoComplete="new-password"
            placeholder="••••••••"
            {...inputStyles}
            aria-invalid={state?.errors?.password ? true : undefined}
          />
          {state?.errors?.password ? (
            <Field.ErrorText
              as="div"
              aria-live="polite"
              display="flex"
              flexDirection="column"
              alignItems="flex-start"
            >
              <ul>
                {state.errors.password.map((error) => (
                  <li key={error}>{error}</li>
                ))}
              </ul>
            </Field.ErrorText>
          ) : (
            <Field.HelperText color="fg.muted">
              At least 8 characters with a letter, a number, and a special
              character.
            </Field.HelperText>
          )}
        </Field.Root>

        <Field.Root invalid={Boolean(state?.errors?.confirmPassword)}>
          <Field.Label htmlFor="confirmPassword" color="fg.muted">
            Confirm new password
          </Field.Label>
          <PasswordInput
            id="confirmPassword"
            name="confirmPassword"
            autoComplete="new-password"
            placeholder="••••••••"
            {...inputStyles}
            aria-invalid={state?.errors?.confirmPassword ? true : undefined}
          />
          <Field.ErrorText aria-live="polite">
            {state?.errors?.confirmPassword?.[0]}
          </Field.ErrorText>
        </Field.Root>

        <Button
          type="submit"
          loading={pending}
          loadingText="Saving…"
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
          Reset password
        </Button>
      </Stack>
    </form>
  );
}
