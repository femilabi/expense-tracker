"use client";

import * as React from "react";
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
import { PencilIcon, PlusIcon } from "@/components/shared/icons";
import {
  controlStyles,
  primaryButtonStyles,
  secondaryButtonStyles,
} from "@/components/shared/styles";
import {
  updateProfile,
  type ProfileFormState,
  type ProfileFormValues,
} from "@/lib/actions/update-profile";

interface ProfileFormInitialValues extends ProfileFormValues {
  avatarUrl: string;
}

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
  initialProfile: ProfileFormInitialValues;
}) {
  const [state, formAction, pending] = useActionState<
    ProfileFormState,
    FormData
  >(updateProfile, { values: initialProfile });

  const values = state?.values ?? initialProfile;
  const [avatarUrl, setAvatarUrl] = React.useState(initialProfile.avatarUrl);
  const [isUploadingAvatar, setIsUploadingAvatar] = React.useState(false);
  const [avatarUploadError, setAvatarUploadError] = React.useState<
    string | null
  >(null);
  const avatarInputRef = React.useRef<HTMLInputElement>(null);
  const displayName = [values.firstName, values.lastName]
    .filter(Boolean)
    .join(" ");

  const handleAvatarChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.currentTarget.files?.[0];
    event.currentTarget.value = "";

    if (!file) {
      return;
    }

    if (file.size > 500 * 1024) {
      setAvatarUploadError("Choose an image no larger than 500 KB.");
      return;
    }

    setAvatarUploadError(null);
    setIsUploadingAvatar(true);

    try {
      const formData = new FormData();
      formData.set("file", file);
      const response = await fetch("/api/profile/avatar", {
        method: "POST",
        body: formData,
      });
      const result: { avatarUrl?: string; error?: string } =
        await response.json();

      if (!response.ok || !result.avatarUrl) {
        setAvatarUploadError(
          result.error ?? "We couldn't upload your photo. Please try again.",
        );
        return;
      }

      setAvatarUrl(result.avatarUrl);
    } catch {
      setAvatarUploadError("We couldn't upload your photo. Please try again.");
    } finally {
      setIsUploadingAvatar(false);
    }
  };

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
          <Box position="relative" flexShrink={0}>
            <Avatar.Root size="2xl" colorPalette="teal">
              {avatarUrl ? (
                <Avatar.Image src={avatarUrl} alt={displayName} />
              ) : null}
              <Avatar.Fallback name={displayName || undefined} />
            </Avatar.Root>
            <Button
              type="button"
              size="xs"
              aria-label={
                avatarUrl ? "Change profile photo" : "Add profile photo"
              }
              title={avatarUrl ? "Change profile photo" : "Add profile photo"}
              {...secondaryButtonStyles}
              position="absolute"
              right="-1"
              bottom="-1"
              minW="8"
              h="8"
              p="0"
              borderRadius="full"
              disabled={isUploadingAvatar || pending}
              loading={isUploadingAvatar}
              onClick={() => avatarInputRef.current?.click()}
            >
              {avatarUrl ? <PencilIcon size={15} /> : <PlusIcon size={16} />}
            </Button>
            <Input
              ref={avatarInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              aria-label="Choose profile photo"
              display="none"
              onChange={handleAvatarChange}
            />
          </Box>

          <Stack gap={1} minW={0}>
            {displayName ? (
              <Heading as="h2" size="lg" color="brand.navy">
                {displayName}
              </Heading>
            ) : null}
            <Text color="brand.slate" fontSize="sm" overflowWrap="anywhere">
              {email}
            </Text>
            <Text color="brand.slate" fontSize="sm">
              Add or change your profile photo. JPEG, PNG, or WebP up to 500 KB.
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

            {avatarUploadError ? (
              <Text aria-live="polite" color="red.600" fontSize="sm">
                {avatarUploadError}
              </Text>
            ) : null}
            <Field.Root invalid={Boolean(state?.errors?.currency)}>
              <Field.Label {...labelProps}>Preferred currency</Field.Label>
              <select
                key={values.currency}
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
              disabled={pending || isUploadingAvatar}
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
