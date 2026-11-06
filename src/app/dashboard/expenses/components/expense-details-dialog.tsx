"use client";

import { Box, Button, Dialog, Flex, IconButton, Text } from "@chakra-ui/react";

import type { ExpenseRecord } from "@/app/dashboard/expenses/types";
import {
  formatCurrency,
  formatDate,
  getCategoryOption,
} from "@/app/dashboard/expenses/utils";

import { COLORS } from "@/components/shared/colors";
import { CloseIcon } from "@/components/shared/icons";
import {
  dangerOutlineButtonStyles,
  dialogSurfaceStyles,
  focusRing,
  primaryButtonStyles,
} from "@/components/shared/styles";

interface ExpenseDetailsDialogProps {
  open: boolean;
  expense: ExpenseRecord | null;
  onClose: () => void;
  onEdit: (expense: ExpenseRecord) => void;
  onDelete: (expense: ExpenseRecord) => void;
  onExitComplete?: () => void;
}

export function ExpenseDetailsDialog({
  open,
  expense,
  onClose,
  onEdit,
  onDelete,
  onExitComplete,
}: ExpenseDetailsDialogProps) {
  const category = expense ? getCategoryOption(expense.category) : null;
  const description = expense?.description?.trim() || "No description";

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(details) => {
        if (!details.open) {
          onClose();
        }
      }}
      onExitComplete={onExitComplete}
      size="sm"
      placement="center"
      lazyMount
      unmountOnExit
    >
      <Dialog.Backdrop bg={COLORS.backdrop} />
      <Dialog.Positioner p={4}>
        <Dialog.Content {...dialogSurfaceStyles}>
          <Flex align="flex-start" justify="space-between" gap={3}>
            <Box>
              <Dialog.Title
                fontSize="lg"
                fontWeight="semibold"
                letterSpacing="tight"
                color={COLORS.text}
              >
                Expense details
              </Dialog.Title>
              <Dialog.Description mt={1} fontSize="sm" color={COLORS.muted}>
                Review this expense, then edit or delete it.
              </Dialog.Description>
            </Box>
            <IconButton
              type="button"
              aria-label="Close expense details"
              title="Close"
              size="sm"
              variant="ghost"
              flexShrink={0}
              color={COLORS.muted}
              _hover={{ bg: COLORS.raised, color: COLORS.text }}
              _focusVisible={focusRing}
              onClick={onClose}
            >
              <CloseIcon />
            </IconButton>
          </Flex>

          {expense && category ? (
            <>
              <Flex mt={6} align="flex-start" justify="space-between" gap={4}>
                <Box minW={0}>
                  <Text
                    fontSize="lg"
                    fontWeight="medium"
                    lineHeight="1.5"
                    color={COLORS.text}
                    fontStyle={expense.description ? undefined : "italic"}
                  >
                    {description}
                  </Text>
                  <Text mt={2} fontSize="sm" color={COLORS.muted}>
                    {category.label} · {formatDate(expense.expenseDate)}
                  </Text>
                </Box>
                <Text
                  flexShrink={0}
                  fontSize="xl"
                  fontWeight="semibold"
                  color={COLORS.text}
                  fontVariantNumeric="tabular-nums"
                >
                  {formatCurrency(expense.amount, expense.currency)}
                </Text>
              </Flex>

              <Flex
                mt={6}
                pt={5}
                borderTopWidth="1px"
                borderColor={COLORS.border}
                gap={3}
                align="stretch"
              >
                <Button
                  type="button"
                  flex="1"
                  onClick={() => onEdit(expense)}
                  {...primaryButtonStyles}
                >
                  Edit
                </Button>
                <Button
                  type="button"
                  flex="1"
                  onClick={() => onDelete(expense)}
                  {...dangerOutlineButtonStyles}
                >
                  Delete
                </Button>
              </Flex>
            </>
          ) : null}
        </Dialog.Content>
      </Dialog.Positioner>
    </Dialog.Root>
  );
}
