"use client";

import { Stack, Toast, Toaster, createToaster } from "@chakra-ui/react";

import { COLORS } from "@/components/shared/colors";

export const appToaster = createToaster({
  placement: "bottom-end",
  duration: 6000,
  removeDelay: 200,
});

export function AppToaster() {
  return (
    <Toaster
      toaster={appToaster}
      width={{ base: "calc(100vw - 2rem)", sm: "360px" }}
      maxW="360px"
      zIndex="9999"
    >
      {(toast) => {
        const isError = toast.type === "error";

        return (
          <Toast.Root
            w="full"
            alignItems="flex-start"
            gap={3}
            bg={COLORS.card}
            color={COLORS.text}
            borderWidth="1px"
            borderColor={isError ? COLORS.dangerBorder : COLORS.successBorder}
            borderRadius="lg"
            boxShadow="lg"
            p={{ base: 3.5, sm: 4 }}
          >
            <Toast.Indicator
              flexShrink={0}
              color={isError ? COLORS.danger : COLORS.success}
            />
            <Stack flex="1" minW="0" gap="1">
              <Toast.Title
                me={0}
                fontSize="sm"
                fontWeight="medium"
                lineHeight="short"
                overflowWrap="anywhere"
              >
                {toast.title}
              </Toast.Title>
              {toast.description ? (
                <Toast.Description
                  fontSize="sm"
                  lineHeight="tall"
                  color={COLORS.muted}
                  overflowWrap="anywhere"
                >
                  {toast.description}
                </Toast.Description>
              ) : null}
            </Stack>
            <Toast.CloseTrigger
              flexShrink={0}
              position="static"
              alignSelf="flex-start"
              color={COLORS.muted}
              aria-label="Dismiss notification"
            />
          </Toast.Root>
        );
      }}
    </Toaster>
  );
}
