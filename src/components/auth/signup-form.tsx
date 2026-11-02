"use client";

import { useActionState } from "react";
import { Button, Field, Input, Stack, Text } from "@chakra-ui/react";

import PasswordInput from "@/components/auth/password-input";
import { signup } from "@/lib/actions/auth";

const inputStyles = {
  borderColor: "border",
  focusRingColor: "brand.solid",
  _invalid: {
    borderColor: "border.error",
    focusRingColor: "fg.error",
  },
} as const;

export default function SignupForm() {
  const [state, formAction, pending] = useActionState(signup, undefined);

  return (
    <form action={formAction}>
      <Stack gap={4}>
        <Field.Root invalid={Boolean(state?.errors?.name)}>
          <Field.Label htmlFor="name">Name</Field.Label>
          <Input
            id="name"
            name="name"
            type="text"
            autoComplete="name"
            placeholder="Oriyomi Adeosun"
            {...inputStyles}
            aria-invalid={state?.errors?.name ? true : undefined}
          />
          <Field.ErrorText aria-live="polite">
            {state?.errors?.name?.[0]}
          </Field.ErrorText>
        </Field.Root>

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
            <Field.HelperText>
              At least 8 characters with a letter, a number, and a special
              character.
            </Field.HelperText>
          )}
        </Field.Root>

        {state?.message ? (
          <Text aria-live="polite" color="fg.error" fontSize="sm">
            {state.message}
          </Text>
        ) : null}

        <Button
          type="submit"
          loading={pending}
          loadingText="Creating account…"
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
          Create account
        </Button>
      </Stack>
    </form>
  );
}
