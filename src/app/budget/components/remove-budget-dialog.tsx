"use client";

import { Button, Dialog, Flex } from "@chakra-ui/react";

import type { CategoryBudget } from "@/lib/budgets";
import { formatCurrency } from "@/lib/format";

import { COLORS } from "@/components/shared/colors";
import {
  dangerButtonStyles,
  dialogSurfaceStyles,
  secondaryButtonStyles,
} from "@/components/shared/styles";

interface RemoveBudgetDialogProps {
  open: boolean;
  item: CategoryBudget | null;
  currency: string;
  monthLabel: string;
  isRemoving: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function RemoveBudgetDialog({
  open,
  item,
  currency,
  monthLabel,
  isRemoving,
  onClose,
  onConfirm,
}: RemoveBudgetDialogProps) {
  const budget = item?.progress.budget;

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(details) => {
        if (!details.open && !isRemoving) {
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
            Remove {item?.label} budget?
          </Dialog.Title>
          <Dialog.Description mt={2} fontSize="sm" color={COLORS.muted}>
            {budget != null
              ? `The ${formatCurrency(budget, currency)} budget for ${monthLabel} will be removed. Your expenses are not affected.`
              : "This budget will be removed. Your expenses are not affected."}
          </Dialog.Description>

          <Flex mt={6} justify="flex-end" gap={3}>
            <Button
              type="button"
              onClick={onClose}
              disabled={isRemoving}
              {...secondaryButtonStyles}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={onConfirm}
              loading={isRemoving}
              loadingText="Removing…"
              {...dangerButtonStyles}
            >
              Remove budget
            </Button>
          </Flex>
        </Dialog.Content>
      </Dialog.Positioner>
    </Dialog.Root>
  );
}
