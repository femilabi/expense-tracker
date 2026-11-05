"use client";

import * as React from "react";
import {
  Box,
  Button,
  Flex,
  Heading,
  HStack,
  Stack,
  Text,
} from "@chakra-ui/react";

import type { ExpenseInput } from "@/app/expenses/expense-form/expense-schema";
import { COLORS } from "@/components/shared/colors";
import { DeleteExpenseDialog } from "@/components/expense/delete-expense-dialog";
import { ExpenseDetailsDialog } from "@/components/expense/expense-details-dialog";
import { ExpenseDialog } from "@/components/expense/expense-dialog";
import {
  ExpenseToaster,
  expenseToaster,
} from "@/components/expense/expense-toaster";
import { ExpensesTable } from "@/components/expense/expenses-table";
import { ExpensesToolbar } from "@/components/expense/expenses-toolbar";
import { PlusIcon } from "@/components/shared/icons";
import { primaryButtonStyles } from "@/components/shared/styles";
import { SummaryOverview } from "@/components/expense/summary-overview";

import { createExpense, deleteExpense, updateExpense } from "../actions";
import type { ExpenseFilters, ExpenseRecord } from "../types";
import {
  filterAndSortExpenses,
  parseDateKey,
  summarizeExpenses,
} from "../utils";

const PAGE_SIZE = 8;

const DEFAULT_FILTERS: ExpenseFilters = {
  search: "",
  category: "all",
  dateRange: "all",
  sort: "date-desc",
};

interface ExpensesHistoryProps {
  /** YYYY-MM-DD reference date supplied by the server render. */
  referenceDate: string;
  initialExpenses: ExpenseRecord[];
  currency: ExpenseRecord["currency"];
}

export function ExpensesHistory({
  referenceDate,
  initialExpenses,
  currency,
}: ExpensesHistoryProps) {
  const [expenses, setExpenses] =
    React.useState<ExpenseRecord[]>(initialExpenses);
  const [filters, setFilters] = React.useState<ExpenseFilters>(DEFAULT_FILTERS);
  const [page, setPage] = React.useState(1);
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [viewedExpense, setViewedExpense] =
    React.useState<ExpenseRecord | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = React.useState(false);
  const [editingExpense, setEditingExpense] =
    React.useState<ExpenseRecord | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false);
  const [deletingExpense, setDeletingExpense] =
    React.useState<ExpenseRecord | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);
  const pendingDetailsActionRef = React.useRef<(() => void) | null>(null);

  const reference = React.useMemo(
    () => parseDateKey(referenceDate),
    [referenceDate],
  );

  const summary = React.useMemo(
    () => summarizeExpenses(expenses, reference),
    [expenses, reference],
  );

  const filteredExpenses = React.useMemo(
    () => filterAndSortExpenses(expenses, filters, reference),
    [expenses, filters, reference],
  );

  const pageCount = Math.max(1, Math.ceil(filteredExpenses.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const visibleExpenses = filteredExpenses.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  const hasFilters =
    filters.search.trim() !== "" ||
    filters.category !== "all" ||
    filters.dateRange !== "all";

  const updateFilters = (patch: Partial<ExpenseFilters>) => {
    setFilters((current) => ({ ...current, ...patch }));
    setPage(1);
  };

  const clearFilters = () => {
    setFilters(DEFAULT_FILTERS);
    setPage(1);
  };

  const openDetails = (expense: ExpenseRecord) => {
    pendingDetailsActionRef.current = null;
    setViewedExpense(expense);
    setIsDetailsOpen(true);
  };

  const closeDetails = () => {
    setIsDetailsOpen(false);
  };

  const closeDetailsThen = (action: () => void) => {
    pendingDetailsActionRef.current = action;
    setIsDetailsOpen(false);
  };

  const handleDetailsExitComplete = () => {
    const pendingAction = pendingDetailsActionRef.current;
    pendingDetailsActionRef.current = null;
    pendingAction?.();
  };

  const handleAddExpense = async (values: ExpenseInput) => {
    const result = await createExpense(values);

    if (!result.success) {
      expenseToaster.create({ title: result.error, type: "error" });
      throw new Error(result.error);
    }

    setExpenses((current) => [result.expense, ...current]);
    setFilters(DEFAULT_FILTERS);
    setPage(1);
    setIsDialogOpen(false);
    expenseToaster.create({
      title: "Expense added successfully.",
      type: "success",
    });
  };

  const handleUpdateExpense = async (values: ExpenseInput) => {
    if (!editingExpense) {
      return;
    }

    const result = await updateExpense(editingExpense.id, values);

    if (!result.success) {
      expenseToaster.create({ title: result.error, type: "error" });
      throw new Error(result.error);
    }

    setExpenses((current) =>
      current.map((expense) =>
        expense.id === result.expense.id ? result.expense : expense,
      ),
    );
    setIsEditDialogOpen(false);
    expenseToaster.create({
      title: "Expense updated successfully.",
      type: "success",
    });
  };

  const handleDeleteExpense = async () => {
    if (!deletingExpense) {
      return;
    }

    try {
      const result = await deleteExpense(deletingExpense.id);

      if (!result.success) {
        expenseToaster.create({ title: result.error, type: "error" });
        return;
      }

      setExpenses((current) =>
        current.filter((expense) => expense.id !== deletingExpense.id),
      );
      setIsDeleteDialogOpen(false);
      expenseToaster.create({
        title: "Expense deleted successfully.",
        type: "success",
      });
    } catch {
      expenseToaster.create({
        title: "We couldn't delete this expense. Please try again.",
        type: "error",
      });
    }
  };

  const openEditDialog = (expense: ExpenseRecord) => {
    setEditingExpense(expense);
    setIsEditDialogOpen(true);
  };

  const openDeleteDialog = (expense: ExpenseRecord) => {
    setDeletingExpense(expense);
    setIsDeleteDialogOpen(true);
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
                Expenses
              </Heading>
              <Text mt={2} fontSize="sm" lineHeight="1.6" color={COLORS.muted}>
                Review and manage your saved expenses.
              </Text>
            </Box>

            <Button
              type="button"
              flexShrink={0}
              onClick={() => setIsDialogOpen(true)}
              {...primaryButtonStyles}
            >
              <HStack gap={2}>
                <PlusIcon />
                <Text as="span">Add expense</Text>
              </HStack>
            </Button>
          </Flex>

          <Stack gap={4}>
            <SummaryOverview summary={summary} currency={currency} />

            <ExpensesToolbar
              filters={filters}
              hasFilters={hasFilters}
              onFilterChange={updateFilters}
              onClearFilters={clearFilters}
            />

            <ExpensesTable
              expenses={visibleExpenses}
              totalCount={filteredExpenses.length}
              page={currentPage}
              pageCount={pageCount}
              pageSize={PAGE_SIZE}
              hasFilters={hasFilters}
              hasAnyExpenses={expenses.length > 0}
              onPageChange={setPage}
              onClearFilters={clearFilters}
              onViewExpense={openDetails}
              onAddExpense={() => setIsDialogOpen(true)}
            />
          </Stack>
        </Stack>
      </Box>

      <ExpenseDetailsDialog
        open={isDetailsOpen}
        expense={viewedExpense}
        onClose={closeDetails}
        onEdit={(expense) => closeDetailsThen(() => openEditDialog(expense))}
        onDelete={(expense) =>
          closeDetailsThen(() => openDeleteDialog(expense))
        }
        onExitComplete={handleDetailsExitComplete}
      />

      <ExpenseDialog
        open={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        onSubmit={handleAddExpense}
      />

      <ExpenseDialog
        open={isEditDialogOpen}
        expense={editingExpense}
        onClose={() => setIsEditDialogOpen(false)}
        onSubmit={handleUpdateExpense}
      />

      <DeleteExpenseDialog
        open={isDeleteDialogOpen}
        expense={deletingExpense}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleDeleteExpense}
      />

      <ExpenseToaster />
    </Box>
  );
}
