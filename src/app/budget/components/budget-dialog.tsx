"use client";

import * as React from "react";
import {
  Button,
  Dialog,
  Field,
  HStack,
  Input,
  Text,
  VStack,
} from "@chakra-ui/react";

import type { CategoryBudget } from "@/lib/budgets";

import { COLORS } from "@/components/shared/colors";
import {
  controlStyles,
  dialogSurfaceStyles,
  errorTextStyles,
  primaryButtonStyles,
  secondaryButtonStyles,
} from "@/components/shared/styles";

import { budgetAmountSchema } from "../budget-schema";

interface BudgetDialogProps {
  open: boolean;
  item: CategoryBudget | null;
  currency: string;
  monthLabel: string;
  onClose: () => void;
  /** Rejects when saving fails; the dialog then stays open. */
  onSubmit: (amount: string) => Promise<void>;
}

export function BudgetDialog({
  open,
  item,
  currency,
  monthLabel,
  onClose,
  onSubmit,
}: BudgetDialogProps) {
  const isEditing = item?.progress.budget != null;
  const title = item
    ? `${isEditing ? "Edit" : "Set"} ${item.label} budget`
    : "Set budget";

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
        <Dialog.Content {...dialogSurfaceStyles} w="full" maxW="24rem">
          <Dialog.Title
            fontSize="lg"
            fontWeight="semibold"
            letterSpacing="tight"
            color={COLORS.text}
          >
            {title}
          </Dialog.Title>
          <Dialog.Description mt={1} fontSize="sm" color={COLORS.muted}>
            {monthLabel}
          </Dialog.Description>

          {item ? (
            <BudgetAmountForm
              key={item.category}
              initialAmount={
                item.progress.budget === null
                  ? ""
                  : String(item.progress.budget)
              }
              currency={currency}
              submitLabel={isEditing ? "Save changes" : "Save budget"}
              onSubmit={onSubmit}
              onCancel={onClose}
            />
          ) : null}
        </Dialog.Content>
      </Dialog.Positioner>
    </Dialog.Root>
  );
}

interface BudgetAmountFormProps {
  initialAmount: string;
  currency: string;
  submitLabel: string;
  onSubmit: (amount: string) => Promise<void>;
  onCancel: () => void;
}

function BudgetAmountForm({
  initialAmount,
  currency,
  submitLabel,
  onSubmit,
  onCancel,
}: BudgetAmountFormProps) {
  const [amount, setAmount] = React.useState(initialAmount);
  const [error, setError] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    const result = budgetAmountSchema.safeParse(amount);

    if (!result.success) {
      setError(result.error.issues[0]?.message ?? "Enter a valid amount");
      return;
    }

    setError(null);
    setIsSubmitting(true);
    try {
      await onSubmit(result.data);
    } catch {
      // The caller reports the failure; keep the form open for another try.
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <VStack as="form" mt={5} gap={5} align="stretch" onSubmit={handleSubmit}>
      <Field.Root gap="2" invalid={Boolean(error)}>
        <Field.Label fontSize="sm" fontWeight="medium" color={COLORS.text}>
          Monthly amount
          <Text as="span" ml={1} fontSize="xs" color={COLORS.subtle}>
            {currency}
          </Text>
        </Field.Label>
        <Input
          {...controlStyles}
          type="number"
          step="0.01"
          min="0.01"
          inputMode="decimal"
          placeholder="0.00"
          autoFocus
          value={amount}
          onChange={(event) => setAmount(event.target.value)}
        />
        {error ? (
          <Field.ErrorText {...errorTextStyles}>{error}</Field.ErrorText>
        ) : null}
      </Field.Root>

      <HStack gap={3} align="stretch">
        <Button
          type="button"
          flex="0 0 34%"
          onClick={onCancel}
          {...secondaryButtonStyles}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          flex="1"
          loading={isSubmitting}
          loadingText="Saving…"
          disabled={isSubmitting}
          {...primaryButtonStyles}
        >
          {submitLabel}
        </Button>
      </HStack>
    </VStack>
  );
}
