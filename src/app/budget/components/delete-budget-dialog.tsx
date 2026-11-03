"use client";

import { Box, Button, Dialog, Flex, Text } from "@chakra-ui/react";

import type { CategoryBudget } from "@/lib/budgets";
import { formatCurrency } from "@/lib/format";

import { COLORS } from "@/components/shared/colors";
import {
  dangerButtonStyles,
  dialogSurfaceStyles,
  secondaryButtonStyles,
} from "@/components/shared/styles";

interface DeleteBudgetDialogProps {
  open: boolean;
  item: CategoryBudget | null;
  currency: string;
  monthLabel: string;
  isDeleting: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function DeleteBudgetDialog({
  open,
  item,
  currency,
  monthLabel,
  isDeleting,
  onClose,
  onConfirm,
}: DeleteBudgetDialogProps) {
  return (
    <Dialog.Root
      open={open}
      onOpenChange={(details) => {
        if (!details.open && !isDeleting) {
          onClose();
        }
      }}
      size="sm"
      placement="center"
      role="alertdialog"
      lazyMount
      unmountOnExit
    >
      <Dialog.Backdrop bg={COLORS.backdrop} />
      <Dialog.Positioner p={4}>
        <Dialog.Content {...dialogSurfaceStyles}>
          <Dialog.Title
            fontSize="lg"
            fontWeight="semibold"
            letterSpacing="tight"
            color={COLORS.text}
          >
            Delete budget?
          </Dialog.Title>
          <Dialog.Description mt={2} fontSize="sm" color={COLORS.muted}>
            This removes the budget for this month only. Your expenses are not
            affected.
          </Dialog.Description>

          {item?.progress.budget != null ? (
            <Box
              mt={5}
              py={4}
              borderTopWidth="1px"
              borderBottomWidth="1px"
              borderColor={COLORS.border}
            >
              <Flex align="flex-start" justify="space-between" gap={4}>
                <Box minW={0}>
                  <Text fontWeight="medium" color={COLORS.text}>
                    {item.label}
                  </Text>
                  <Text mt={1.5} fontSize="sm" color={COLORS.muted}>
                    {monthLabel}
                  </Text>
                </Box>
                <Text
                  flexShrink={0}
                  fontWeight="semibold"
                  color={COLORS.text}
                  fontVariantNumeric="tabular-nums"
                >
                  {formatCurrency(item.progress.budget, currency)}
                </Text>
              </Flex>
            </Box>
          ) : null}

          <Flex mt={6} justify="flex-end" gap={3}>
            <Button
              type="button"
              onClick={onClose}
              disabled={isDeleting}
              {...secondaryButtonStyles}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={onConfirm}
              loading={isDeleting}
              loadingText="Deleting…"
              {...dangerButtonStyles}
            >
              Delete budget
            </Button>
          </Flex>
        </Dialog.Content>
      </Dialog.Positioner>
    </Dialog.Root>
  );
}
