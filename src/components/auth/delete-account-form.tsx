"use client";

import { useActionState, useState } from "react";
import { Button, Dialog, Field, Flex, Stack, Text } from "@chakra-ui/react";

import PasswordInput from "@/components/auth/password-input";
import { COLORS } from "@/components/shared/colors";
import { dialogSurfaceStyles } from "@/components/shared/styles";
import { deleteAccount } from "@/lib/actions/delete-account";

const inputStyles = {
  borderColor: "brand.mist",
  focusRingColor: "brand.teal",
  _invalid: {
    borderColor: "brand.red",
    focusRingColor: "brand.red",
  },
} as const;

const buttonStyles = {
  h: 11,
  borderRadius: "full",
  fontSize: "sm",
  fontWeight: "medium",
} as const;

const deleteButtonStyles = {
  ...buttonStyles,
  bg: "brand.red",
  color: "white",
  _hover: { bg: "brand.red", opacity: 0.9 },
  _active: { opacity: 0.8 },
} as const;

export default function DeleteAccountForm() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        type="button"
        onClick={() => setOpen(true)}
        variant="outline"
        w="full"
        borderColor="brand.red"
        color="brand.red"
        {...buttonStyles}
        _hover={{ bg: "brand.red/10" }}
        _active={{ bg: "brand.red/20" }}
      >
        Delete account
      </Button>

      <Dialog.Root
        open={open}
        onOpenChange={(details) => setOpen(details.open)}
        size="sm"
        placement="center"
        lazyMount
        unmountOnExit
      >
        <Dialog.Backdrop bg={COLORS.backdrop} />
        <Dialog.Positioner p={4}>
          <Dialog.Content role="alertdialog" {...dialogSurfaceStyles}>
            <Dialog.Title
              fontSize="lg"
              fontWeight="semibold"
              letterSpacing="tight"
              color="brand.navy"
            >
              Delete your account?
            </Dialog.Title>
            <Dialog.Description mt={2} fontSize="sm" color="brand.slate">
              This permanently deletes your account and all of your expenses,
              income, and settings, and signs you out on every device. This
              cannot be undone.
            </Dialog.Description>

            <DeleteAccountDialogForm onCancel={() => setOpen(false)} />
          </Dialog.Content>
        </Dialog.Positioner>
      </Dialog.Root>
    </>
  );
}

/**
 * Lives inside the dialog so its form state is cleared every time the dialog
 * closes.
 */
function DeleteAccountDialogForm({ onCancel }: { onCancel: () => void }) {
  const [state, formAction, pending] = useActionState(deleteAccount, undefined);

  return (
    <form action={formAction}>
      <Stack gap={4} mt={5}>
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

        <Field.Root invalid={Boolean(state?.errors?.password)}>
          <Field.Label htmlFor="deleteAccountPassword" color="brand.slate">
            Current password
          </Field.Label>
          <PasswordInput
            id="deleteAccountPassword"
            name="password"
            autoComplete="current-password"
            placeholder="••••••••"
            {...inputStyles}
            aria-invalid={state?.errors?.password ? true : undefined}
          />
          <Field.ErrorText aria-live="polite">
            {state?.errors?.password?.[0]}
          </Field.ErrorText>
        </Field.Root>

        <Flex mt={1} gap={3} direction={{ base: "column-reverse", sm: "row" }}>
          <Button
            type="button"
            flex="1"
            autoFocus
            onClick={onCancel}
            disabled={pending}
            variant="outline"
            borderColor="brand.mist"
            color="brand.navy"
            {...buttonStyles}
            _hover={{ bg: "brand.soft-white" }}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            flex="1"
            loading={pending}
            loadingText="Deleting…"
            {...deleteButtonStyles}
          >
            Delete account
          </Button>
        </Flex>
      </Stack>
    </form>
  );
}
