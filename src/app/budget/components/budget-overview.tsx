"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Box,
  Button,
  Flex,
  Heading,
  HStack,
  Stack,
  Text,
} from "@chakra-ui/react";

import { summarizeBudgets } from "@/lib/budget-math";
import type { BudgetMonth, CategoryBudget } from "@/lib/budgets";
import type { Category } from "@/lib/categories";
import { formatMonth } from "@/lib/format";
import { getCurrentMonth, monthStart, toMonthKey } from "@/lib/month";

import {
  ExpenseToaster,
  expenseToaster,
} from "@/components/expense/expense-toaster";
import { COLORS } from "@/components/shared/colors";
import { PlusIcon } from "@/components/shared/icons";
import { primaryButtonStyles } from "@/components/shared/styles";

import { deleteBudget, saveBudget } from "../actions";
import type { BudgetActionResult } from "../types";
import {
  BudgetDialog,
  type BudgetDialogMode,
  type CategoryChoice,
} from "./budget-dialog";
import { BudgetSummary } from "./budget-summary";
import { BudgetTable } from "./budget-table";
import { DeleteBudgetDialog } from "./delete-budget-dialog";
import { MonthSelector } from "./month-selector";

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

  const budgets = categories.filter((item) => item.progress.budget !== null);
  const availableCategories: CategoryChoice[] = categories
    .filter((item) => item.progress.budget === null)
    .map((item) => ({ value: item.category, label: item.label }));
  const canAddBudget = availableCategories.length > 0;
  const summary = summarizeBudgets(categories);

  const [dialogMode, setDialogMode] = React.useState<BudgetDialogMode | null>(
    null,
  );
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [deletingItem, setDeletingItem] = React.useState<CategoryBudget | null>(
    null,
  );
  const [isDeleteOpen, setIsDeleteOpen] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);

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

  const openAdd = () => {
    setDialogMode({ kind: "add", choices: availableCategories });
    setIsDialogOpen(true);
  };

  const openEdit = (item: CategoryBudget) => {
    setDialogMode({
      kind: "edit",
      category: { value: item.category, label: item.label },
      amount: item.progress.budget ?? 0,
    });
    setIsDialogOpen(true);
  };

  const openDelete = (item: CategoryBudget) => {
    setDeletingItem(item);
    setIsDeleteOpen(true);
  };

  const handleSave = async (category: Category, amount: string) => {
    const isNewBudget = dialogMode?.kind !== "edit";
    let result: BudgetActionResult;

    try {
      result = await saveBudget({ category, month: monthKey, amount });
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

    setIsDialogOpen(false);
    expenseToaster.create({
      title: isNewBudget
        ? "Budget added successfully."
        : "Budget updated successfully.",
      type: "success",
    });
  };

  const handleDelete = async () => {
    if (!deletingItem) {
      return;
    }

    setIsDeleting(true);
    try {
      const result = await deleteBudget({
        category: deletingItem.category,
        month: monthKey,
      });

      if (!result.success) {
        expenseToaster.create({ title: result.error, type: "error" });
        return;
      }

      setIsDeleteOpen(false);
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
      setIsDeleting(false);
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
                Set monthly limits for your spending categories.
              </Text>
            </Box>

            <Stack
              gap={2}
              align={{ base: "stretch", sm: "flex-end" }}
              flexShrink={0}
            >
              <Button
                type="button"
                onClick={openAdd}
                disabled={!canAddBudget}
                aria-describedby={canAddBudget ? undefined : "add-budget-hint"}
                {...primaryButtonStyles}
              >
                <HStack gap={2}>
                  <PlusIcon />
                  <Text as="span">Add budget</Text>
                </HStack>
              </Button>
              {canAddBudget ? null : (
                <Text
                  id="add-budget-hint"
                  maxW={{ sm: "15rem" }}
                  fontSize="xs"
                  color={COLORS.muted}
                  textAlign={{ base: "left", sm: "right" }}
                >
                  Every category has a budget for {monthLabel}.
                </Text>
              )}
            </Stack>
          </Flex>

          <Stack gap={4}>
            <BudgetSummary summary={summary} currency={currency} />

            <Flex
              role="group"
              aria-label="Budget controls"
              direction={{ base: "column", sm: "row" }}
              align={{ sm: "center" }}
              gap={2}
            >
              <MonthSelector month={month} />
            </Flex>

            <BudgetTable
              budgets={budgets}
              categoryCount={categories.length}
              currency={currency}
              monthLabel={monthLabel}
              onAdd={openAdd}
              onEdit={openEdit}
              onDelete={openDelete}
            />
          </Stack>
        </Stack>
      </Box>

      <BudgetDialog
        open={isDialogOpen}
        mode={dialogMode}
        monthLabel={monthLabel}
        onClose={() => setIsDialogOpen(false)}
        onSubmit={handleSave}
      />

      <DeleteBudgetDialog
        open={isDeleteOpen}
        item={deletingItem}
        currency={currency}
        monthLabel={monthLabel}
        isDeleting={isDeleting}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDelete}
      />

      <ExpenseToaster />
    </Box>
  );
}
