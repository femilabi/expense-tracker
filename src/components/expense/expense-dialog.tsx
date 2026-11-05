"use client";

import { Dialog } from "@chakra-ui/react";

import type { ExpenseInput } from "@/app/expenses/expense-form/expense-schema";
import type { ExpenseRecord } from "@/app/expenses/types";

import { COLORS } from "@/components/shared/colors";
import { ExpenseForm } from "./expense-form";
import { dialogSurfaceStyles } from "@/components/shared/styles";

interface ExpenseDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (values: ExpenseInput) => void | Promise<void>;
  expense?: ExpenseRecord | null;
}

export function ExpenseDialog({
  open,
  onClose,
  onSubmit,
  expense = null,
}: ExpenseDialogProps) {
  const isEditing = expense !== null;
  const title = isEditing ? "Edit expense" : "Add expense";

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(details) => {
        if (!details.open) {
          onClose();
        }
      }}
      size="lg"
      placement="center"
      lazyMount
      unmountOnExit
    >
      <Dialog.Backdrop bg={COLORS.backdrop} />
      <Dialog.Positioner p={4}>
        <Dialog.Content
          {...dialogSurfaceStyles}
          w="full"
          maxW="27rem"
          maxH="calc(100dvh - 2rem)"
          overflowY="auto"
        >
          <Dialog.Title
            position="absolute"
            w="1px"
            h="1px"
            p="0"
            m="-1px"
            overflow="hidden"
            whiteSpace="nowrap"
            borderWidth="0"
            clip="rect(0, 0, 0, 0)"
          >
            {title}
          </Dialog.Title>
          <ExpenseForm
            key={expense?.id ?? "new"}
            heading={title}
            submitLabel={isEditing ? "Save changes" : "Save expense"}
            initialCategory={expense?.category}
            initialAmount={expense ? String(expense.amount) : undefined}
            initialDescription={expense?.description ?? undefined}
            initialExpenseDate={expense?.expenseDate}
            onSubmit={onSubmit}
            onCancel={onClose}
          />
        </Dialog.Content>
      </Dialog.Positioner>
    </Dialog.Root>
  );
}
