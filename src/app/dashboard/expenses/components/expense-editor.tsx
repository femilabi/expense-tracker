"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Box,
  Button,
  Heading,
  SimpleGrid,
  Skeleton,
  Stack,
  Text,
} from "@chakra-ui/react";

import type { ExpenseInput } from "@/app/dashboard/expenses/expense-form/expense-schema";
import { COLORS } from "@/components/shared/colors";
import {
  secondaryButtonStyles,
  surfaceStyles,
} from "@/components/shared/styles";

import { ExpenseForm } from "./expense-form";
import { createExpense, updateExpense } from "../actions";
import type { ExpenseRecord } from "../types";

interface ExpenseEditorProps {
  expense?: ExpenseRecord | null;
}

function ExpenseEditorFrame({ children }: { children: React.ReactNode }) {
  return (
    <Box
      minH="100dvh"
      display="grid"
      placeItems="center"
      bg={COLORS.page}
      color={COLORS.text}
      fontFamily="var(--font-geist-sans), Arial, Helvetica, sans-serif"
      p={6}
    >
      <Box {...surfaceStyles} w="full" maxW="27rem" p={{ base: 5, md: 6 }}>
        {children}
      </Box>
    </Box>
  );
}

function ExpenseEditorSkeleton() {
  return (
    <Stack role="status" aria-live="polite" gap="4">
      <Text srOnly>Loading expense…</Text>
      <Skeleton h="6" w="40" borderRadius="md" bg={COLORS.border} />
      <Skeleton h="10" w="full" borderRadius="lg" bg={COLORS.border} />
      <SimpleGrid columns={{ base: 1, sm: 2 }} gap="4">
        <Skeleton h="10" borderRadius="lg" bg={COLORS.border} />
        <Skeleton h="10" borderRadius="lg" bg={COLORS.border} />
      </SimpleGrid>
      <Skeleton h="22" borderRadius="lg" bg={COLORS.border} />
      <Skeleton h="10" borderRadius="lg" bg={COLORS.border} />
    </Stack>
  );
}

export function ExpenseEditorLoading() {
  return (
    <ExpenseEditorFrame>
      <ExpenseEditorSkeleton />
    </ExpenseEditorFrame>
  );
}

export function ExpenseNotFound() {
  return (
    <ExpenseEditorFrame>
      <Stack gap="4" align="flex-start">
        <Box>
          <Heading
            as="h2"
            fontSize="lg"
            fontWeight="semibold"
            letterSpacing="tight"
            color={COLORS.text}
          >
            Expense not found
          </Heading>
          <Text mt="2" fontSize="sm" lineHeight="1.6" color={COLORS.muted}>
            This expense may have been deleted or does not exist.
          </Text>
        </Box>
        <Button asChild {...secondaryButtonStyles}>
          <Link href="/dashboard/expenses">Back to expenses</Link>
        </Button>
      </Stack>
    </ExpenseEditorFrame>
  );
}

export function ExpenseEditor({ expense = null }: ExpenseEditorProps) {
  const router = useRouter();

  const handleSubmit = async (values: ExpenseInput) => {
    const result = expense
      ? await updateExpense(expense.id, values)
      : await createExpense(values);

    if (!result.success) {
      throw new Error(result.error);
    }

    router.push("/dashboard/expenses");
    router.refresh();
  };

  return (
    <ExpenseEditorFrame>
      <ExpenseForm
        key={expense?.id ?? "new"}
        heading={expense ? "Edit expense" : "Add expense"}
        submitLabel={expense ? "Save changes" : "Save expense"}
        initialCategory={expense?.category}
        initialAmount={expense ? String(expense.amount) : undefined}
        initialDescription={expense?.description ?? undefined}
        initialExpenseDate={expense?.expenseDate}
        onSubmit={handleSubmit}
        onCancel={() => router.push("/dashboard/expenses")}
      />
    </ExpenseEditorFrame>
  );
}
