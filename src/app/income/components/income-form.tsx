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
  Text,
  Textarea,
  VStack,
} from "@chakra-ui/react";

import type { IncomeInput } from "../income-schema";
import { incomeSchema } from "../income-schema";
import { toaster } from "../toaster";
import { formatIncomeDate } from "../utils";
import { COLORS } from "@/components/shared/colors";
import { DatePickerField } from "@/components/shared/date-picker-field";
import {
  controlStyles,
  errorTextStyles,
  focusRing,
  primaryButtonStyles,
  secondaryButtonStyles,
} from "@/components/shared/styles";
import { CloseIcon } from "@/components/shared/icons";

import type { IncomeRecord } from "../types";

interface IncomeFormProps {
  today: string;
  initialIncome?: Pick<
    IncomeRecord,
    "amount" | "source" | "description" | "incomeDate"
  > | null;
  onSubmit: (values: IncomeInput) => void | Promise<void>;
  onCancel: () => void;
}

type FormErrors = Partial<
  Record<"amount" | "source" | "description" | "incomeDate", string>
>;

const labelProps = {
  fontSize: "sm",
  fontWeight: "medium",
  color: COLORS.text,
} as const;

function OptionalMark() {
  return (
    <Text
      as="span"
      ml="1"
      fontSize="xs"
      fontWeight="normal"
      color={COLORS.subtle}
    >
      Optional
    </Text>
  );
}

export function IncomeForm({
  today,
  initialIncome = null,
  onSubmit,
  onCancel,
}: IncomeFormProps) {
  const isEditing = initialIncome !== null;
  const [amount, setAmount] = React.useState(
    initialIncome ? String(initialIncome.amount) : "",
  );
  const [source, setSource] = React.useState(initialIncome?.source ?? "");
  const [description, setDescription] = React.useState(
    initialIncome?.description ?? "",
  );
  const [incomeDate, setIncomeDate] = React.useState(
    initialIncome?.incomeDate ?? today,
  );
  const [errors, setErrors] = React.useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const submitGuard = React.useRef(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (submitGuard.current) {
      return;
    }

    const result = incomeSchema.safeParse({
      amount,
      source,
      description,
      incomeDate,
    });

    if (!result.success) {
      const nextErrors: FormErrors = {};
      for (const issue of result.error.issues) {
        const field = issue.path[0];
        if (
          field === "amount" ||
          field === "source" ||
          field === "description" ||
          field === "incomeDate"
        ) {
          nextErrors[field] ??= issue.message;
        }
      }
      setErrors(nextErrors);
      return;
    }

    setErrors({});
    setIsSubmitting(true);
    submitGuard.current = true;

    try {
      await onSubmit(result.data);
    } catch {
      toaster.create({
        title: "Income could not be saved.",
        description: "Please try again.",
        type: "error",
      });
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
          {isEditing ? "Edit income" : "Add income"}
        </Heading>
        <IconButton
          type="button"
          aria-label="Close income form"
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
      </Flex>

      <VStack as="form" gap="4" align="stretch" onSubmit={handleSubmit}>
        <Field.Root gap="2" invalid={Boolean(errors.amount)}>
          <Field.Label {...labelProps}>Amount</Field.Label>
          <Input
            {...controlStyles}
            type="number"
            step="0.01"
            min="0.01"
            inputMode="decimal"
            placeholder="0.00"
            aria-label="Income amount"
            aria-required="true"
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
          />
          {errors.amount ? (
            <Field.ErrorText {...errorTextStyles}>
              {errors.amount}
            </Field.ErrorText>
          ) : null}
        </Field.Root>

        <Field.Root gap="2" invalid={Boolean(errors.source)}>
          <Field.Label {...labelProps}>
            Source
            <OptionalMark />
          </Field.Label>
          <Input
            {...controlStyles}
            maxLength={150}
            aria-label="Income source"
            placeholder="Salary, freelance, investment…"
            value={source}
            onChange={(event) => setSource(event.target.value)}
          />
          {errors.source ? (
            <Field.ErrorText {...errorTextStyles}>
              {errors.source}
            </Field.ErrorText>
          ) : null}
        </Field.Root>

        <Field.Root gap="2" invalid={Boolean(errors.incomeDate)}>
          <DatePickerField
            label="Date"
            labelProps={labelProps}
            value={incomeDate}
            onChange={setIncomeDate}
            invalid={Boolean(errors.incomeDate)}
            required
          />
          {errors.incomeDate ? (
            <Field.ErrorText {...errorTextStyles}>
              {errors.incomeDate}
            </Field.ErrorText>
          ) : null}
          <Text fontSize="xs" color={COLORS.muted}>
            {incomeDate ? formatIncomeDate(incomeDate) : "Select a date"}
          </Text>
        </Field.Root>

        <Field.Root gap="2" invalid={Boolean(errors.description)}>
          <Field.Label {...labelProps}>
            Description
            <OptionalMark />
          </Field.Label>
          <Textarea
            {...controlStyles}
            h="auto"
            minH="22"
            p="3"
            resize="vertical"
            aria-label="Income description"
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

        <HStack gap="3" mt="1" align="stretch">
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
            {isEditing ? "Save changes" : "Save income"}
          </Button>
        </HStack>
      </VStack>
    </Box>
  );
}
