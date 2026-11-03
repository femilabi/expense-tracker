"use client";

import { useActionState } from "react";
import {
  Avatar,
  Box,
  Button,
  Field,
  Flex,
  Heading,
  Input,
  Stack,
  Text,
} from "@chakra-ui/react";

import { CURRENCY_OPTIONS } from "@/app/expenses/expense-form/constants/currencies";
import { controlStyles, primaryButtonStyles } from "@/components/shared/styles";
import {
  updateProfile,
  type ProfileFormState,
  type ProfileFormValues,
} from "@/lib/actions/update-profile";

const labelProps = {
  color: "brand.slate",
  fontSize: "sm",
  fontWeight: "medium",
} as const;

export function ProfileForm({
  email,
  initialProfile,
}: {
  email: string;
  initialProfile: ProfileFormValues;
}) {
  const [state, formAction, pending] = useActionState<
    ProfileFormState,
    FormData
  >(updateProfile, { values: initialProfile });

  const values = state?.values ?? initialProfile;
  const displayName = [values.firstName, values.lastName]
    .filter(Boolean)
    .join(" ");

  return (
    <Box
      bg="white"
      borderWidth="1px"
      borderColor="brand.mist"
      borderRadius="2xl"
      px={{ base: 6, sm: 8 }}
      py={8}
    >
      <Stack gap={8}>
        <Flex align="center" gap={5}>
          <Avatar.Root size="2xl" colorPalette="teal">
            {values.avatarUrl ? (
              <Avatar.Image src={values.avatarUrl} alt={displayName} />
            ) : null}
            <Avatar.Fallback name={displayName || undefined} />
          </Avatar.Root>

          <Stack gap={1} minW={0}>
            {displayName ? (
              <Heading as="h2" size="lg" color="brand.navy">
                {displayName}
              </Heading>
            ) : null}
            <Text color="brand.slate" fontSize="sm" overflowWrap="anywhere">
              {email}
            </Text>
          </Stack>
        </Flex>

        <form action={formAction}>
          <Stack gap={5}>
            {state?.message ? (
              <Text
                aria-live="polite"
                bg="brand.teal/10"
                borderRadius="lg"
                color="brand.navy"
                fontSize="sm"
                fontWeight="medium"
                px={3}
                py={2}
              >
                {state.message}
              </Text>
            ) : null}

            <Flex gap={4} direction={{ base: "column", md: "row" }}>
              <Field.Root invalid={Boolean(state?.errors?.firstName)} flex="1">
                <Field.Label {...labelProps}>First name</Field.Label>
                <Input
                  {...controlStyles}
                  name="firstName"
                  defaultValue={values.firstName}
                  aria-label="First name"
                />
                <Field.ErrorText>
                  {state?.errors?.firstName?.[0]}
                </Field.ErrorText>
              </Field.Root>

              <Field.Root invalid={Boolean(state?.errors?.lastName)} flex="1">
                <Field.Label {...labelProps}>Last name</Field.Label>
                <Input
                  {...controlStyles}
                  name="lastName"
                  defaultValue={values.lastName}
                  aria-label="Last name"
                />
                <Field.ErrorText>
                  {state?.errors?.lastName?.[0]}
                </Field.ErrorText>
              </Field.Root>
            </Flex>

            <Field.Root invalid={Boolean(state?.errors?.avatarUrl)}>
              <Field.Label {...labelProps}>Avatar URL</Field.Label>
              <Input
                {...controlStyles}
                name="avatarUrl"
                type="url"
                defaultValue={values.avatarUrl}
                placeholder="https://example.com/avatar.jpg"
                aria-label="Avatar URL"
              />
              <Field.ErrorText>{state?.errors?.avatarUrl?.[0]}</Field.ErrorText>
            </Field.Root>

            <Field.Root invalid={Boolean(state?.errors?.currency)}>
              <Field.Label {...labelProps}>Preferred currency</Field.Label>
              <select
                name="currency"
                defaultValue={values.currency || "USD"}
                aria-label="Preferred currency"
                style={{
                  width: "100%",
                  height: "2.75rem",
                  borderRadius: "0.75rem",
                  border: "1px solid #dfe7f5",
                  background: "white",
                  padding: "0 0.875rem",
                  color: "#1f2937",
                  fontSize: "0.875rem",
                  outline: "none",
                }}
              >
                {CURRENCY_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <Field.ErrorText>{state?.errors?.currency?.[0]}</Field.ErrorText>
            </Field.Root>

            <Button
              type="submit"
              loading={pending}
              loadingText="Saving…"
              disabled={pending}
              {...primaryButtonStyles}
              alignSelf="flex-end"
            >
              Save profile
            </Button>
          </Stack>
        </form>
      </Stack>
    </Box>
  );
}
