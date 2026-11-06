"use client";

import { Box, Button, Dialog, Flex, Text } from "@chakra-ui/react";

import type { ExpenseRecord } from "@/app/dashboard/expenses/types";
import {
  formatCurrency,
  formatDate,
  getCategoryOption,
} from "@/app/dashboard/expenses/utils";

import { COLORS } from "@/components/shared/colors";
import {
  dangerButtonStyles,
  dialogSurfaceStyles,
  secondaryButtonStyles,
} from "@/components/shared/styles";

interface DeleteExpenseDialogProps {
  open: boolean;
  expense: ExpenseRecord | null;
  onClose: () => void;
  onConfirm: () => void;
}

export function DeleteExpenseDialog({
  open,
  expense,
  onClose,
  onConfirm,
}: DeleteExpenseDialogProps) {
  const category = expense ? getCategoryOption(expense.category) : null;
  const description = expense?.description?.trim() || "Untitled expense";

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(details) => {
        if (!details.open) {
          onClose();
        }
      }}
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
            color={COLORS.text}
          >
            Delete expense?
          </Dialog.Title>
          <Dialog.Description mt={2} fontSize="sm" color={COLORS.muted}>
            This will permanently remove the expense. This action cannot be
            undone.
          </Dialog.Description>

          {expense ? (
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
                    {description}
                  </Text>
                  <Text mt={1.5} fontSize="sm" color={COLORS.muted}>
                    {category ? `${category.label} · ` : ""}
                    {formatDate(expense.expenseDate)}
                  </Text>
                </Box>
                <Text
                  flexShrink={0}
                  fontWeight="semibold"
                  color={COLORS.text}
                  fontVariantNumeric="tabular-nums"
                >
                  {formatCurrency(expense.amount, expense.currency)}
                </Text>
              </Flex>
            </Box>
          ) : null}

          <Flex mt={6} gap={3} align="stretch">
            <Button
              type="button"
              flex="1"
              autoFocus
              onClick={onClose}
              {...secondaryButtonStyles}
            >
              Cancel
            </Button>
            <Button
              type="button"
              flex="1"
              onClick={onConfirm}
              {...dangerButtonStyles}
            >
              Delete expense
            </Button>
          </Flex>
        </Dialog.Content>
      </Dialog.Positioner>
    </Dialog.Root>
  );
}
