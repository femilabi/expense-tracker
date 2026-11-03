"use client";

import * as React from "react";
import {
  Box,
  Button,
  Field,
  Flex,
  Heading,
  HStack,
  IconButton,
  Input,
  NativeSelect,
  SimpleGrid,
  Text,
  Textarea,
  VStack,
} from "@chakra-ui/react";

import {
  CATEGORY_OPTIONS,
  type Category,
} from "@/app/expenses/expense-form/constants/categories";
import {
  CURRENCY_OPTIONS,
  type Currency,
} from "@/app/expenses/expense-form/constants/currencies";
import {
  expenseSchema,
  type ExpenseInput,
} from "@/app/expenses/expense-form/expense-schema";
import { toLocalDateKey } from "@/app/expenses/utils";

import { COLORS } from "@/components/shared/colors";
import { DatePickerField } from "@/components/shared/date-picker-field";
import { CloseIcon } from "@/components/shared/icons";
import {
  controlGroupStyles,
  controlStyles,
  errorTextStyles,
  focusRing,
  nativeSelectOptionStyles,
  primaryButtonStyles,
  secondaryButtonStyles,
  successTextStyles,
} from "@/components/shared/styles";

export interface ExpenseFormProps {
  initialCategory?: Category;
  initialCurrency?: Currency;
  initialAmount?: string;
  initialDescription?: string;
  initialExpenseDate?: string;
  heading?: string;
  submitLabel?: string;
  onSubmit?: (values: ExpenseInput) => void | Promise<void>;
  onCancel?: () => void;
}

type FormErrors = Partial<
  Record<
    "category" | "currency" | "amount" | "description" | "expenseDate",
    string
  >
>;

const labelProps = {
  fontSize: "sm",
  fontWeight: "medium",
  color: COLORS.text,
} as const;

const subscribeToNothing = () => () => {};

/**
 * Today's date in the browser's local time zone. Empty during SSR, so the
 * server never renders its own (possibly different) date.
 */
function useLocalToday(): string {
  return React.useSyncExternalStore(
    subscribeToNothing,
    () => toLocalDateKey(new Date()),
    () => "",
  );
}

function RequiredMark() {
  return (
    <Text
      as="span"
      ml="1"
      fontSize="xs"
      fontWeight="normal"
      color={COLORS.subtle}
    >
      Required
    </Text>
  );
}

export function ExpenseForm({
  initialCategory,
  initialCurrency,
  initialAmount,
  initialDescription,
  initialExpenseDate,
  heading = "Add expense",
  submitLabel = "Save expense",
  onSubmit,
  onCancel,
}: ExpenseFormProps) {
  const [amount, setAmount] = React.useState(initialAmount ?? "");
  const [currency, setCurrency] = React.useState<Currency>(
    initialCurrency ?? "USD",
  );
  const [category, setCategory] = React.useState<Category | null>(
    initialCategory ?? null,
  );
  const [description, setDescription] = React.useState(
    initialDescription ?? "",
  );
  // null means "untouched": new expenses default to the user's local today.
  const [selectedDate, setSelectedDate] = React.useState<string | null>(
    initialExpenseDate ?? null,
  );
  const today = useLocalToday();
  const expenseDate = selectedDate ?? today;
  const [errors, setErrors] = React.useState<FormErrors>({});
  const [isValid, setIsValid] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [submitError, setSubmitError] = React.useState<string | null>(null);
  const submitGuard = React.useRef(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (submitGuard.current) {
      return;
    }

    setIsValid(false);
    setSubmitError(null);

    const result = expenseSchema.safeParse({
      category: category ?? undefined,
      currency,
      amount,
      description,
      expenseDate,
    });

    if (!result.success) {
      const nextErrors: FormErrors = {};
      for (const issue of result.error.issues) {
        const field = issue.path[0];
        if (
          field === "category" ||
          field === "currency" ||
          field === "amount" ||
          field === "description" ||
          field === "expenseDate"
        ) {
          nextErrors[field] ??= issue.message;
        }
      }
      setErrors(nextErrors);
      return;
    }

    setErrors({});
    setIsValid(true);

    if (!onSubmit) {
      return;
    }

    setIsSubmitting(true);
    submitGuard.current = true;
    try {
      await onSubmit(result.data);
    } catch {
      setSubmitError(
        "We couldn't save this expense. Please check your details and try again.",
      );
    } finally {
      submitGuard.current = false;
      setIsSubmitting(false);
    }
  };

  return (
    <Box w="full">
      <Flex align="center" justify="space-between" gap="3" mb="5">
        <Heading
          as="h2"
          fontSize="lg"
          fontWeight="semibold"
          letterSpacing="tight"
          color={COLORS.text}
        >
          {heading}
        </Heading>
        {onCancel ? (
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
            onClick={onCancel}
          >
            <CloseIcon />
          </IconButton>
        ) : null}
      </Flex>

      <VStack as="form" gap="4" align="stretch" onSubmit={handleSubmit}>
        <Field.Root gap="2" invalid={Boolean(errors.amount)}>
          <Field.Label {...labelProps}>
            Amount
            <RequiredMark />
          </Field.Label>
          <Flex align="center" {...controlGroupStyles}>
            <Input
              type="number"
              step="any"
              inputMode="decimal"
              borderWidth="0"
              bg="transparent"
              color={COLORS.text}
              h="full"
              px="3"
              fontSize="sm"
              placeholder="0.00"
              aria-label="Amount"
              aria-required="true"
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
            <NativeSelect.Root
              size="sm"
              variant="plain"
              w="20"
              h="full"
              flexShrink={0}
            >
              <NativeSelect.Field
                aria-label="Currency"
                value={currency}
                onChange={(event) =>
                  setCurrency(event.target.value as Currency)
                }
                h="full"
                borderWidth="0"
                bg="transparent"
                color={COLORS.text}
                fontSize="sm"
                fontWeight="medium"
                ps="3"
                pe="7"
                cursor="pointer"
                _focusVisible={{ outline: "none", boxShadow: "none" }}
                css={nativeSelectOptionStyles}
              >
                {CURRENCY_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </NativeSelect.Field>
              <NativeSelect.Indicator color={COLORS.muted} right="2" />
            </NativeSelect.Root>
          </Flex>
          {errors.amount || errors.currency ? (
            <Field.ErrorText {...errorTextStyles}>
              {errors.amount ?? errors.currency}
            </Field.ErrorText>
          ) : null}
        </Field.Root>

        <SimpleGrid columns={{ base: 1, sm: 2 }} gap="4">
          <Field.Root gap="2" invalid={Boolean(errors.expenseDate)}>
            <DatePickerField
              label={
                <>
                  Date
                  <RequiredMark />
                </>
              }
              labelProps={labelProps}
              value={expenseDate}
              onChange={setSelectedDate}
              invalid={Boolean(errors.expenseDate)}
              required
            />
            {errors.expenseDate ? (
              <Field.ErrorText {...errorTextStyles}>
                {errors.expenseDate}
              </Field.ErrorText>
            ) : null}
          </Field.Root>

          <Field.Root gap="2" invalid={Boolean(errors.category)}>
            <Field.Label {...labelProps}>
              Category
              <RequiredMark />
            </Field.Label>
            <NativeSelect.Root size="sm" w="full" variant="plain">
              <NativeSelect.Field
                aria-label="Category"
                aria-required="true"
                value={category ?? ""}
                onChange={(event) => {
                  const value = event.target.value;
                  if (value) {
                    setCategory(value as Category);
                  }
                }}
                {...controlStyles}
                color={category ? COLORS.text : COLORS.subtle}
                px="3"
                pe="9"
                cursor="pointer"
                css={nativeSelectOptionStyles}
              >
                <option value="" disabled>
                  Select category
                </option>
                {CATEGORY_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </NativeSelect.Field>
              <NativeSelect.Indicator color={COLORS.muted} />
            </NativeSelect.Root>
            {errors.category ? (
              <Field.ErrorText {...errorTextStyles}>
                {errors.category}
              </Field.ErrorText>
            ) : null}
          </Field.Root>
        </SimpleGrid>

        <Field.Root gap="2" invalid={Boolean(errors.description)}>
          <Field.Label {...labelProps}>
            Description
            <Text
              as="span"
              ml="1"
              fontSize="xs"
              fontWeight="normal"
              color={COLORS.subtle}
            >
              Optional
            </Text>
          </Field.Label>
          <Textarea
            {...controlStyles}
            h="auto"
            minH="22"
            p="3"
            resize="none"
            aria-label="Description"
            placeholder="Add a note (optional)"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
          />
          {errors.description ? (
            <Field.ErrorText {...errorTextStyles}>
              {errors.description}
            </Field.ErrorText>
          ) : null}
        </Field.Root>

        {submitError ? (
          <Text role="alert" {...errorTextStyles} fontSize="sm">
            {submitError}
          </Text>
        ) : null}

        {isValid && !onSubmit ? (
          <Text {...successTextStyles}>
            Expense details are valid. Saving is not connected yet.
          </Text>
        ) : null}

        <HStack gap="3" mt="1" align="stretch">
          {onCancel ? (
            <Button
              type="button"
              flex="0 0 34%"
              onClick={onCancel}
              {...secondaryButtonStyles}
            >
              Cancel
            </Button>
          ) : null}
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
    </Box>
  );
}
