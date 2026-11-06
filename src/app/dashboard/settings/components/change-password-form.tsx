"use client";

import { useActionState } from "react";
import { Button, Field, Stack, Text } from "@chakra-ui/react";

import PasswordInput from "@/components/auth/password-input";
import { changePassword } from "@/lib/actions/change-password";

const inputStyles = {
  borderColor: "brand.mist",
  focusRingColor: "brand.teal",
  _invalid: {
    borderColor: "brand.red",
    focusRingColor: "brand.red",
  },
} as const;

export default function ChangePasswordForm() {
  const [state, formAction, pending] = useActionState(
    changePassword,
    undefined,
  );

  return (
    <form action={formAction} style={{ display: "flex", flex: 1 }}>
      <Stack gap={4} flex="1">
        {state?.message ? (
          <Text
            aria-live="polite"
            bg="brand.red/10"
            borderRadius="lg"
            color="brand.red"
            fontSize="sm"
            fontWeight="medium"
            px={3}
            py={2}
          >
            {state.message}
          </Text>
        ) : null}

        <Field.Root invalid={Boolean(state?.errors?.currentPassword)}>
          <Field.Label htmlFor="currentPassword" color="brand.slate">
            Current password
          </Field.Label>
          <PasswordInput
            id="currentPassword"
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

        <Field.Root invalid={Boolean(state?.errors?.newPassword)}>
          <Field.Label htmlFor="newPassword" color="brand.slate">
            New password
          </Field.Label>
          <PasswordInput
            id="newPassword"
            name="newPassword"
            autoComplete="new-password"
            placeholder="••••••••"
            {...inputStyles}
            aria-invalid={state?.errors?.newPassword ? true : undefined}
          />
          {state?.errors?.newPassword ? (
            <Field.ErrorText
              as="div"
              aria-live="polite"
              display="flex"
              flexDirection="column"
              alignItems="flex-start"
            >
              <ul>
                {state.errors.newPassword.map((error) => (
                  <li key={error}>{error}</li>
                ))}
              </ul>
            </Field.ErrorText>
          ) : (
            <Field.HelperText color="brand.slate">
              At least 8 characters with a letter, a number, and a special
              character.
            </Field.HelperText>
          )}
        </Field.Root>

        <Field.Root invalid={Boolean(state?.errors?.confirmPassword)}>
          <Field.Label htmlFor="confirmPassword" color="brand.slate">
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
          mt="auto"
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
          Update password
        </Button>
      </Stack>
    </form>
  );
}
