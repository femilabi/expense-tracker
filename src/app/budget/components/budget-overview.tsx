"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Box, Flex, Heading, Stack, Text } from "@chakra-ui/react";

import type { BudgetMonth, CategoryBudget } from "@/lib/budgets";
import { formatMonth } from "@/lib/format";
import { getCurrentMonth, monthStart, toMonthKey } from "@/lib/month";

import {
  ExpenseToaster,
  expenseToaster,
} from "@/components/expense/expense-toaster";
import { COLORS } from "@/components/shared/colors";

import { deleteBudget, saveBudget } from "../actions";
import type { BudgetActionResult } from "../types";
import { BudgetDialog } from "./budget-dialog";
import { BudgetList } from "./budget-list";
import { MonthSelector } from "./month-selector";
import { RemoveBudgetDialog } from "./remove-budget-dialog";

interface BudgetOverviewProps {
  budgetMonth: BudgetMonth;
  /** False when the server picked the month, so the browser may correct it. */
  isMonthRequested: boolean;
}

export function BudgetOverview({
  budgetMonth,
  isMonthRequested,
}: BudgetOverviewProps) {
  const router = useRouter();
  const { month, currency, categories } = budgetMonth;
  const monthKey = toMonthKey(month);
  const monthLabel = formatMonth(monthStart(month));

  const [editingItem, setEditingItem] = React.useState<CategoryBudget | null>(
    null,
  );
  const [isEditOpen, setIsEditOpen] = React.useState(false);
  const [removingItem, setRemovingItem] = React.useState<CategoryBudget | null>(
    null,
  );
  const [isRemoveOpen, setIsRemoveOpen] = React.useState(false);
  const [isRemoving, setIsRemoving] = React.useState(false);

  // The server only knows its own time zone; default to the viewer's month.
  React.useEffect(() => {
    if (isMonthRequested) {
      return;
    }

    const localMonthKey = toMonthKey(getCurrentMonth());
    if (localMonthKey !== monthKey) {
      router.replace(`/budget?month=${localMonthKey}`);
    }
  }, [isMonthRequested, monthKey, router]);

  const openEdit = (item: CategoryBudget) => {
    setEditingItem(item);
    setIsEditOpen(true);
  };

  const openRemove = (item: CategoryBudget) => {
    setRemovingItem(item);
    setIsRemoveOpen(true);
  };

  const handleSave = async (amount: string) => {
    if (!editingItem) {
      return;
    }

    const isNewBudget = editingItem.progress.budget === null;
    let result: BudgetActionResult;

    try {
      result = await saveBudget({
        category: editingItem.category,
        month: monthKey,
        amount,
      });
    } catch {
      result = {
        success: false,
        error: "We couldn't save this budget. Please try again.",
      };
    }

    if (!result.success) {
      expenseToaster.create({ title: result.error, type: "error" });
      throw new Error(result.error);
    }

    setIsEditOpen(false);
    expenseToaster.create({
      title: isNewBudget
        ? "Budget added successfully."
        : "Budget updated successfully.",
      type: "success",
    });
  };

  const handleRemove = async () => {
    if (!removingItem) {
      return;
    }

    setIsRemoving(true);
    try {
      const result = await deleteBudget({
        category: removingItem.category,
        month: monthKey,
      });

      if (!result.success) {
        expenseToaster.create({ title: result.error, type: "error" });
        return;
      }

      setIsRemoveOpen(false);
      expenseToaster.create({
        title: "Budget deleted successfully.",
        type: "success",
      });
    } catch {
      expenseToaster.create({
        title: "We couldn't delete this budget. Please try again.",
        type: "error",
      });
    } finally {
      setIsRemoving(false);
    }
  };

  return (
    <Box
      as="main"
      minH="100dvh"
      bg={COLORS.page}
      color={COLORS.text}
      fontFamily="var(--font-geist-sans), Arial, Helvetica, sans-serif"
    >
      <Box
        maxW="6xl"
        mx="auto"
        px={{ base: 4, md: 6 }}
        py={{ base: 8, md: 10 }}
      >
        <Stack gap={6}>
          <Flex
            as="header"
            direction={{ base: "column", sm: "row" }}
            align={{ base: "stretch", sm: "flex-start" }}
            justify="space-between"
            gap={4}
          >
            <Box>
              <Heading
                as="h1"
                fontSize={{ base: "2xl", md: "3xl" }}
                fontWeight="semibold"
                letterSpacing="tight"
                color={COLORS.text}
              >
                Budget
              </Heading>
              <Text mt={2} fontSize="sm" lineHeight="1.6" color={COLORS.muted}>
                Set a monthly limit for each category and track your spending
                against it.
              </Text>
            </Box>

            <MonthSelector month={month} />
          </Flex>

          <BudgetList
            categories={categories}
            currency={currency}
            onEdit={openEdit}
            onRemove={openRemove}
          />
        </Stack>
      </Box>

      <BudgetDialog
        open={isEditOpen}
        item={editingItem}
        currency={currency}
        monthLabel={monthLabel}
        onClose={() => setIsEditOpen(false)}
        onSubmit={handleSave}
      />

      <RemoveBudgetDialog
        open={isRemoveOpen}
        item={removingItem}
        currency={currency}
        monthLabel={monthLabel}
        isRemoving={isRemoving}
        onClose={() => setIsRemoveOpen(false)}
        onConfirm={handleRemove}
      />

      <ExpenseToaster />
    </Box>
  );
}
