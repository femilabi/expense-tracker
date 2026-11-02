"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Box,
  Flex,
  Heading,
  Portal,
  Stack,
  Text,
  Toast,
  Toaster,
} from "@chakra-ui/react";

import type { BudgetMonth, CategoryBudget } from "@/lib/budgets";
import { formatMonth } from "@/lib/format";
import { getCurrentMonth, monthStart, toMonthKey } from "@/lib/month";

import { COLORS } from "@/components/shared/colors";

import { deleteBudget, saveBudget } from "../actions";
import { toaster } from "../toaster";
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

    const result = await saveBudget({
      category: editingItem.category,
      month: monthKey,
      amount,
    });

    if (!result.success) {
      toaster.create({ title: result.error, type: "error" });
      throw new Error(result.error);
    }

    toaster.create({
      title: `${editingItem.label} budget saved.`,
      type: "success",
    });
    setIsEditOpen(false);
  };

  const handleRemove = async () => {
    if (!removingItem) {
      return;
    }

    setIsRemoving(true);
    const result = await deleteBudget({
      category: removingItem.category,
      month: monthKey,
    });
    setIsRemoving(false);

    if (!result.success) {
      toaster.create({ title: result.error, type: "error" });
      return;
    }

    toaster.create({
      title: `${removingItem.label} budget removed.`,
      type: "success",
    });
    setIsRemoveOpen(false);
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

      <Portal>
        <Toaster toaster={toaster} w="calc(100vw - 2rem)" maxW="sm">
          {(toast) => (
            <Toast.Root key={toast.id} data-type={toast.type}>
              <Toast.Title>{toast.title}</Toast.Title>
            </Toast.Root>
          )}
        </Toaster>
      </Portal>
    </Box>
  );
}
