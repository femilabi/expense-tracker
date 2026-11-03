"use client";

import * as React from "react";
import {
  Box,
  Button,
  createListCollection,
  Dialog,
  Field,
  Flex,
  Heading,
  HStack,
  IconButton,
  Input,
  Select,
  Text,
  VStack,
} from "@chakra-ui/react";

import type { Category } from "@/lib/categories";

import { COLORS } from "@/components/shared/colors";
import { CloseIcon } from "@/components/shared/icons";
import {
  controlGroupStyles,
  controlStyles,
  dialogSurfaceStyles,
  errorTextStyles,
  focusRing,
  primaryButtonStyles,
  secondaryButtonStyles,
} from "@/components/shared/styles";

import { budgetAmountSchema } from "../budget-schema";

export interface CategoryChoice {
  value: Category;
  label: string;
}

/** Add offers the categories without a budget; edit is locked to one. */
export type BudgetDialogMode =
  | { kind: "add"; choices: CategoryChoice[] }
  | { kind: "edit"; category: CategoryChoice; amount: number };

interface BudgetDialogProps {
  open: boolean;
  mode: BudgetDialogMode | null;
  currency: string;
  monthLabel: string;
  onClose: () => void;
  /** Rejects when saving fails; the dialog then stays open. */
  onSubmit: (category: Category, amount: string) => Promise<void>;
}

export function BudgetDialog({
  open,
  mode,
  currency,
  monthLabel,
  onClose,
  onSubmit,
}: BudgetDialogProps) {
  const title = mode?.kind === "edit" ? "Edit budget" : "Add budget";

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
        <Dialog.Content
          {...dialogSurfaceStyles}
          w="full"
          maxW="27rem"
          maxH="calc(100dvh - 2rem)"
          overflowY="auto"
        >
          <Flex align="flex-start" justify="space-between" gap={3}>
            <Box>
              <Dialog.Title asChild>
                <Heading
                  as="h2"
                  fontSize="lg"
                  fontWeight="semibold"
                  letterSpacing="tight"
                  color={COLORS.text}
                >
                  {title}
                </Heading>
              </Dialog.Title>
              <Dialog.Description mt={1} fontSize="sm" color={COLORS.muted}>
                {monthLabel}
              </Dialog.Description>
            </Box>
            <Dialog.CloseTrigger asChild position="static">
              <IconButton
                type="button"
                aria-label="Close"
                title="Close"
                size="sm"
                variant="ghost"
                flexShrink={0}
                color={COLORS.muted}
                _hover={{ bg: COLORS.raised, color: COLORS.text }}
                _focusVisible={focusRing}
              >
                <CloseIcon />
              </IconButton>
            </Dialog.CloseTrigger>
          </Flex>

          {mode ? (
            <BudgetForm
              key={mode.kind === "edit" ? mode.category.value : "add"}
              mode={mode}
              currency={currency}
              onSubmit={onSubmit}
              onCancel={onClose}
            />
          ) : null}
        </Dialog.Content>
      </Dialog.Positioner>
    </Dialog.Root>
  );
}

interface BudgetFormProps {
  mode: BudgetDialogMode;
  currency: string;
  onSubmit: (category: Category, amount: string) => Promise<void>;
  onCancel: () => void;
}

type FormErrors = Partial<Record<"category" | "amount", string>>;

const labelProps = {
  fontSize: "sm",
  fontWeight: "medium",
  color: COLORS.text,
} as const;

function BudgetForm({ mode, currency, onSubmit, onCancel }: BudgetFormProps) {
  const isEditing = mode.kind === "edit";
  const [category, setCategory] = React.useState<Category | null>(
    isEditing ? mode.category.value : null,
  );
  const [amount, setAmount] = React.useState(
    isEditing ? String(mode.amount) : "",
  );
  const [errors, setErrors] = React.useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    const amountResult = budgetAmountSchema.safeParse(amount);
    const nextErrors: FormErrors = {
      category: category ? undefined : "Select a category",
      amount: amountResult.success
        ? undefined
        : amountResult.error.issues[0]?.message,
    };

    if (!category || !amountResult.success) {
      setErrors(nextErrors);
      return;
    }

    setErrors({});
    setIsSubmitting(true);
    try {
      await onSubmit(category, amountResult.data);
    } catch {
      // The caller reports the failure; keep the form open for another try.
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <VStack as="form" mt={5} gap={4} align="stretch" onSubmit={handleSubmit}>
      {mode.kind === "edit" ? (
        <Box>
          <Text {...labelProps}>Category</Text>
          <Text mt={2} fontSize="sm" color={COLORS.text}>
            {mode.category.label}
          </Text>
        </Box>
      ) : (
        <CategorySelect
          choices={mode.choices}
          value={category}
          error={errors.category}
          onChange={setCategory}
        />
      )}

      <Field.Root gap="2" invalid={Boolean(errors.amount)}>
        <Field.Label {...labelProps}>Monthly budget</Field.Label>
        <Flex align="center" {...controlGroupStyles}>
          <Input
            type="number"
            step="0.01"
            min="0.01"
            inputMode="decimal"
            borderWidth="0"
            bg="transparent"
            color={COLORS.text}
            h="full"
            px="3"
            fontSize="sm"
            placeholder="0.00"
            autoFocus={isEditing}
            fontVariantNumeric="tabular-nums"
            _placeholder={{ color: COLORS.subtle }}
            _focusVisible={{ outline: "none", boxShadow: "none" }}
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
          />
          <Box
            h="6"
            borderLeftWidth="1px"
            borderColor={COLORS.border}
            flexShrink={0}
          />
          <Text
            px="3"
            fontSize="sm"
            fontWeight="medium"
            color={COLORS.muted}
            flexShrink={0}
          >
            {currency}
          </Text>
        </Flex>
        {errors.amount ? (
          <Field.ErrorText {...errorTextStyles}>
            {errors.amount}
          </Field.ErrorText>
        ) : null}
      </Field.Root>

      <HStack gap={3} mt={1} align="stretch">
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
          {isEditing ? "Save changes" : "Save budget"}
        </Button>
      </HStack>
    </VStack>
  );
}

interface CategorySelectProps {
  choices: CategoryChoice[];
  value: Category | null;
  error: string | undefined;
  onChange: (category: Category | null) => void;
}

function CategorySelect({
  choices,
  value,
  error,
  onChange,
}: CategorySelectProps) {
  const collection = React.useMemo(
    () => createListCollection({ items: choices }),
    [choices],
  );

  return (
    <Field.Root gap="2" invalid={Boolean(error)}>
      <Select.Root
        collection={collection}
        value={value ? [value] : []}
        onValueChange={(details) => onChange(details.items[0]?.value ?? null)}
        positioning={{ sameWidth: true }}
        w="full"
        gap="2"
      >
        <Select.HiddenSelect />
        <Select.Label {...labelProps}>Category</Select.Label>
        <Select.Control>
          <Select.Trigger {...controlStyles} px="3" pe="9" cursor="pointer">
            <Select.ValueText
              placeholder="Select category"
              color={value ? COLORS.text : COLORS.subtle}
            />
          </Select.Trigger>
          <Select.IndicatorGroup pe="3">
            <Select.Indicator color={COLORS.muted} />
          </Select.IndicatorGroup>
        </Select.Control>
        <Select.Positioner>
          <Select.Content
            bg={COLORS.card}
            borderWidth="1px"
            borderColor={COLORS.border}
            borderRadius="lg"
            boxShadow="md"
            p={1}
          >
            {collection.items.map((choice) => (
              <Select.Item
                key={choice.value}
                item={choice}
                px={3}
                py={2}
                fontSize="sm"
                color={COLORS.text}
                borderRadius="md"
                _highlighted={{ bg: COLORS.raised }}
              >
                {choice.label}
                <Select.ItemIndicator color={COLORS.link} />
              </Select.Item>
            ))}
          </Select.Content>
        </Select.Positioner>
      </Select.Root>
      {error ? (
        <Field.ErrorText {...errorTextStyles}>{error}</Field.ErrorText>
      ) : null}
    </Field.Root>
  );
}
