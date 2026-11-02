"use client";

import { useActionState } from "react";
import { Button, Stack, Text } from "@chakra-ui/react";

import type { EmailChangeTokenState } from "@/lib/definitions";

interface EmailChangeLinkFormProps {
  token: string;
  action: (
    state: EmailChangeTokenState,
    formData: FormData,
  ) => Promise<EmailChangeTokenState>;
  submitLabel: string;
  pendingLabel: string;
}

/**
 * The confirm and undo links open a page with this button instead of acting
 * on the GET request, so email scanners that open links cannot use them up.
 */
export default function EmailChangeLinkForm({
  token,
  action,
  submitLabel,
  pendingLabel,
}: EmailChangeLinkFormProps) {
  const [state, formAction, pending] = useActionState(action, undefined);

  return (
    <form action={formAction}>
      <Stack gap={4}>
        <input type="hidden" name="token" value={token} />

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

        <Button
          type="submit"
          loading={pending}
          loadingText={pendingLabel}
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
          {submitLabel}
        </Button>
      </Stack>
    </form>
  );
}
