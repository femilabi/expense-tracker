"use client";

import {
  Box,
  Button,
  Flex,
  HStack,
  IconButton,
  Stack,
  Table,
  Text,
} from "@chakra-ui/react";

import type { ExpenseRecord } from "@/app/expenses/types";
import {
  formatCurrency,
  formatDate,
  getCategoryOption,
} from "@/app/expenses/utils";

import { COLORS } from "@/components/shared/colors";
import { ChevronLeftIcon, ChevronRightIcon } from "@/components/shared/icons";
import {
  focusRing,
  primaryButtonStyles,
  secondaryButtonStyles,
  surfaceStyles,
  tableHeaderStyles,
} from "@/components/shared/styles";

interface ExpensesTableProps {
  expenses: ExpenseRecord[];
  totalCount: number;
  page: number;
  pageCount: number;
  pageSize: number;
  hasFilters: boolean;
  hasAnyExpenses: boolean;
  onPageChange: (page: number) => void;
  onClearFilters: () => void;
  onViewExpense: (expense: ExpenseRecord) => void;
  onAddExpense: () => void;
}

export function ExpensesTable({
  expenses,
  totalCount,
  page,
  pageCount,
  pageSize,
  hasFilters,
  hasAnyExpenses,
  onPageChange,
  onClearFilters,
  onViewExpense,
  onAddExpense,
}: ExpensesTableProps) {
  const start = totalCount === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, totalCount);

  return (
    <Box {...surfaceStyles} overflow="hidden">
      <Flex
        align="center"
        justify="space-between"
        gap={3}
        px={{ base: 4, md: 5 }}
        py={4}
      >
        <Box>
          <Text fontWeight="semibold" color={COLORS.text}>
            Expense history
          </Text>
          <Text mt={0.5} fontSize="sm" color={COLORS.muted}>
            {hasAnyExpenses
              ? `${totalCount} ${totalCount === 1 ? "expense" : "expenses"}${
                  hasFilters ? " matching your filters" : " saved"
                }`
              : "No expenses recorded yet"}
          </Text>
        </Box>
      </Flex>

      <Table.ScrollArea borderTopWidth="1px" borderColor={COLORS.border}>
        <Table.Root
          size="md"
          variant="line"
          aria-label="Expense history"
          bg="transparent"
          css={{
            "& th, & td": { borderColor: COLORS.border },
          }}
        >
          <Table.Header>
            <Table.Row bg={COLORS.raised}>
              <Table.ColumnHeader {...tableHeaderStyles}>
                Description
              </Table.ColumnHeader>
              <Table.ColumnHeader
                display={{ base: "none", md: "table-cell" }}
                {...tableHeaderStyles}
              >
                Category
              </Table.ColumnHeader>
              <Table.ColumnHeader
                display={{ base: "none", md: "table-cell" }}
                {...tableHeaderStyles}
              >
                Date
              </Table.ColumnHeader>
              <Table.ColumnHeader textAlign="right" {...tableHeaderStyles}>
                Amount
              </Table.ColumnHeader>
              <Table.ColumnHeader {...tableHeaderStyles} w="12">
                <Text srOnly>Actions</Text>
              </Table.ColumnHeader>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {expenses.length === 0 ? (
              <Table.Row>
                <Table.Cell colSpan={5} px={4}>
                  <Stack align="center" gap={3} py={12} textAlign="center">
                    <Box>
                      <Text fontWeight="semibold" color={COLORS.text}>
                        {hasAnyExpenses
                          ? "No expenses match your filters"
                          : "No expenses yet"}
                      </Text>
                      <Text mt={1} fontSize="sm" color={COLORS.muted}>
                        {hasAnyExpenses
                          ? "Try a different search, category, or date range."
                          : "Add your first expense to start tracking your spending."}
                      </Text>
                    </Box>
                    {hasAnyExpenses && hasFilters ? (
                      <Button
                        type="button"
                        onClick={onClearFilters}
                        {...secondaryButtonStyles}
                      >
                        Clear filters
                      </Button>
                    ) : (
                      <Button
                        type="button"
                        onClick={onAddExpense}
                        {...primaryButtonStyles}
                      >
                        Add expense
                      </Button>
                    )}
                  </Stack>
                </Table.Cell>
              </Table.Row>
            ) : (
              expenses.map((expense) => {
                const category = getCategoryOption(expense.category);
                const description =
                  expense.description?.trim() || "Untitled expense";
                const formattedAmount = formatCurrency(
                  expense.amount,
                  expense.currency,
                );

                return (
                  <Table.Row
                    key={expense.id}
                    data-expense-id={expense.id}
                    bg={COLORS.card}
                    _hover={{ bg: COLORS.raised }}
                    cursor="pointer"
                    onClick={() => onViewExpense(expense)}
                    transition="background-color 0.15s ease"
                  >
                    <Table.Cell>
                      {expense.description ? (
                        <Text
                          display="block"
                          maxW={{ base: "11rem", md: "24rem" }}
                          truncate
                          color={COLORS.text}
                          title={expense.description}
                        >
                          {expense.description}
                        </Text>
                      ) : (
                        <Text as="span" color={COLORS.muted} fontStyle="italic">
                          No description
                        </Text>
                      )}
                      <Text
                        display={{ base: "block", md: "none" }}
                        mt={1}
                        fontSize="xs"
                        color={COLORS.muted}
                      >
                        {category.label} · {formatDate(expense.expenseDate)}
                      </Text>
                    </Table.Cell>
                    <Table.Cell
                      display={{ base: "none", md: "table-cell" }}
                      whiteSpace="nowrap"
                      fontSize="sm"
                      color={COLORS.muted}
                    >
                      {category.label}
                    </Table.Cell>
                    <Table.Cell
                      display={{ base: "none", md: "table-cell" }}
                      whiteSpace="nowrap"
                      fontSize="sm"
                      color={COLORS.muted}
                    >
                      {formatDate(expense.expenseDate)}
                    </Table.Cell>
                    <Table.Cell
                      textAlign="right"
                      whiteSpace="nowrap"
                      fontWeight="medium"
                      color={COLORS.text}
                      fontVariantNumeric="tabular-nums"
                    >
                      {formattedAmount}
                    </Table.Cell>
                    <Table.Cell textAlign="right" pr={{ base: 3, md: 4 }}>
                      <IconButton
                        type="button"
                        size="sm"
                        variant="ghost"
                        aria-label={`View details for ${description}, ${formattedAmount}`}
                        aria-haspopup="dialog"
                        color={COLORS.muted}
                        _hover={{ bg: COLORS.raisedHover, color: COLORS.text }}
                        _focusVisible={focusRing}
                        onClick={(event) => {
                          event.stopPropagation();
                          onViewExpense(expense);
                        }}
                      >
                        <ChevronRightIcon size={18} />
                      </IconButton>
                    </Table.Cell>
                  </Table.Row>
                );
              })
            )}
          </Table.Body>
        </Table.Root>
      </Table.ScrollArea>

      {totalCount > 0 ? (
        <Flex
          direction={{ base: "column", sm: "row" }}
          align={{ base: "flex-start", sm: "center" }}
          justify="space-between"
          gap={3}
          borderTopWidth="1px"
          borderColor={COLORS.border}
          px={{ base: 4, md: 5 }}
          py={3}
        >
          <Text css={{ fontSize: "sm", color: COLORS.muted }}>
            Showing {start}–{end} of {totalCount}
          </Text>
          <HStack gap={2}>
            <IconButton
              type="button"
              size="sm"
              variant="ghost"
              aria-label="Previous page"
              color={COLORS.muted}
              disabled={page <= 1}
              _hover={{ bg: COLORS.raised, color: COLORS.text }}
              _focusVisible={focusRing}
              onClick={() => onPageChange(page - 1)}
            >
              <ChevronLeftIcon />
            </IconButton>
            <Text
              minW="20"
              textAlign="center"
              fontSize="sm"
              color={COLORS.muted}
              fontVariantNumeric="tabular-nums"
            >
              Page {page} of {pageCount}
            </Text>
            <IconButton
              type="button"
              size="sm"
              variant="ghost"
              aria-label="Next page"
              color={COLORS.muted}
              disabled={page >= pageCount}
              _hover={{ bg: COLORS.raised, color: COLORS.text }}
              _focusVisible={focusRing}
              onClick={() => onPageChange(page + 1)}
            >
              <ChevronRightIcon />
            </IconButton>
          </HStack>
        </Flex>
      ) : null}
    </Box>
  );
}
