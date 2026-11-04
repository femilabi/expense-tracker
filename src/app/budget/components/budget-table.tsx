"use client";

import {
  Box,
  Button,
  Flex,
  HStack,
  IconButton,
  Portal,
  Stack,
  Table,
  Text,
  Tooltip,
} from "@chakra-ui/react";

import { formatPercentUsed } from "@/lib/budget-math";
import type { CategoryBudget } from "@/lib/budgets";
import { formatCurrency } from "@/lib/format";

import { BudgetProgressBar } from "@/components/budget/budget-progress-bar";
import { COLORS } from "@/components/shared/colors";
import { PencilIcon, TrashIcon } from "@/components/shared/icons";
import {
  focusRing,
  primaryButtonStyles,
  surfaceStyles,
  tableHeaderStyles,
} from "@/components/shared/styles";

interface BudgetTableProps {
  budgets: CategoryBudget[];
  categoryCount: number;
  currency: string;
  monthLabel: string;
  onAdd: () => void;
  onEdit: (item: CategoryBudget) => void;
  onDelete: (item: CategoryBudget) => void;
}

export function BudgetTable({
  budgets,
  categoryCount,
  currency,
  monthLabel,
  onAdd,
  onEdit,
  onDelete,
}: BudgetTableProps) {
  return (
    <Box {...surfaceStyles} overflow="hidden">
      <Box px={{ base: 4, md: 5 }} py={4}>
        <Text fontWeight="semibold" color={COLORS.text}>
          Budgets
        </Text>
        <Text mt={0.5} fontSize="sm" color={COLORS.muted}>
          {budgets.length > 0
            ? `${budgets.length} of ${categoryCount} categories budgeted`
            : "No budgets set yet"}
        </Text>
      </Box>

      <Table.ScrollArea borderTopWidth="1px" borderColor={COLORS.border}>
        <Table.Root
          size="md"
          variant="line"
          aria-label={`Budgets for ${monthLabel}`}
          bg="transparent"
          css={{ "& th, & td": { borderColor: COLORS.border } }}
        >
          <Table.Header>
            <Table.Row bg={COLORS.raised}>
              <Table.ColumnHeader {...tableHeaderStyles}>
                Category
              </Table.ColumnHeader>
              <Table.ColumnHeader
                display={{ base: "none", md: "table-cell" }}
                textAlign="right"
                {...tableHeaderStyles}
              >
                Spent / Budget
              </Table.ColumnHeader>
              <Table.ColumnHeader textAlign="right" {...tableHeaderStyles}>
                Remaining
              </Table.ColumnHeader>
              <Table.ColumnHeader
                display={{ base: "none", md: "table-cell" }}
                w="30%"
                {...tableHeaderStyles}
              >
                Progress
              </Table.ColumnHeader>
              <Table.ColumnHeader w="24" {...tableHeaderStyles}>
                <Text srOnly>Actions</Text>
              </Table.ColumnHeader>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {budgets.length === 0 ? (
              <Table.Row>
                <Table.Cell colSpan={5} px={4}>
                  <Stack align="center" gap={3} py={12} textAlign="center">
                    <Box>
                      <Text fontWeight="semibold" color={COLORS.text}>
                        No budgets for {monthLabel}
                      </Text>
                      <Text mt={1} fontSize="sm" color={COLORS.muted}>
                        Add a budget to start tracking spending against it.
                      </Text>
                    </Box>
                    <Button
                      type="button"
                      onClick={onAdd}
                      {...primaryButtonStyles}
                    >
                      Add budget
                    </Button>
                  </Stack>
                </Table.Cell>
              </Table.Row>
            ) : (
              budgets.map((item) => (
                <BudgetTableRow
                  key={item.category}
                  item={item}
                  currency={currency}
                  onEdit={onEdit}
                  onDelete={onDelete}
                />
              ))
            )}
          </Table.Body>
        </Table.Root>
      </Table.ScrollArea>
    </Box>
  );
}

interface BudgetTableRowProps {
  item: CategoryBudget;
  currency: string;
  onEdit: (item: CategoryBudget) => void;
  onDelete: (item: CategoryBudget) => void;
}

function BudgetTableRow({
  item,
  currency,
  onEdit,
  onDelete,
}: BudgetTableRowProps) {
  const { label, progress } = item;
  const budget = progress.budget ?? 0;
  const remaining = progress.remaining ?? 0;
  const percentText = formatPercentUsed(progress.percentUsed ?? 0);
  const statusColor = progress.isOverBudget ? COLORS.danger : COLORS.muted;
  const spentOfBudget = `${formatCurrency(progress.spent, currency)} of ${formatCurrency(budget, currency)}`;

  return (
    <Table.Row
      bg={COLORS.card}
      _hover={{ bg: COLORS.raised }}
      transition="background-color 0.15s ease"
    >
      <Table.Cell>
        <Text fontWeight="medium" color={COLORS.text}>
          {label}
        </Text>
        <Box display={{ base: "block", md: "none" }} mt={2}>
          <BudgetProgressBar label={label} progress={progress} />
          <Text
            mt={1.5}
            fontSize="xs"
            color={COLORS.muted}
            fontVariantNumeric="tabular-nums"
          >
            {spentOfBudget} ·{" "}
            <Text as="span" color={statusColor}>
              {percentText}
            </Text>
          </Text>
        </Box>
      </Table.Cell>
      <Table.Cell
        display={{ base: "none", md: "table-cell" }}
        textAlign="right"
        whiteSpace="nowrap"
        fontSize="sm"
        color={COLORS.muted}
        fontVariantNumeric="tabular-nums"
      >
        <Text as="span" color={COLORS.text}>
          {formatCurrency(progress.spent, currency)}
        </Text>{" "}
        / {formatCurrency(budget, currency)}
      </Table.Cell>
      <Table.Cell
        textAlign="right"
        whiteSpace="nowrap"
        fontVariantNumeric="tabular-nums"
      >
        <Text
          fontWeight="medium"
          color={progress.isOverBudget ? COLORS.danger : COLORS.text}
        >
          {formatCurrency(Math.abs(remaining), currency)}
        </Text>
        {progress.isOverBudget ? (
          <Text fontSize="xs" color={COLORS.danger}>
            over budget
          </Text>
        ) : null}
      </Table.Cell>
      <Table.Cell display={{ base: "none", md: "table-cell" }}>
        <Flex align="center" gap={3}>
          <Box flex="1">
            <BudgetProgressBar label={label} progress={progress} />
          </Box>
          <Text
            w="12"
            textAlign="right"
            fontSize="sm"
            fontWeight={progress.isOverBudget ? "semibold" : "normal"}
            color={statusColor}
            fontVariantNumeric="tabular-nums"
          >
            {percentText}
          </Text>
        </Flex>
      </Table.Cell>
      <Table.Cell textAlign="right" pr={{ base: 3, md: 4 }}>
        <HStack gap={1} justify="flex-end">
          <RowActionButton
            label={`Edit ${label} budget`}
            tooltip="Edit"
            onClick={() => onEdit(item)}
          >
            <PencilIcon />
          </RowActionButton>
          <RowActionButton
            label={`Delete ${label} budget`}
            tooltip="Delete"
            onClick={() => onDelete(item)}
          >
            <TrashIcon />
          </RowActionButton>
        </HStack>
      </Table.Cell>
    </Table.Row>
  );
}

interface RowActionButtonProps {
  label: string;
  tooltip: string;
  onClick: () => void;
  children: React.ReactNode;
}

function RowActionButton({
  label,
  tooltip,
  onClick,
  children,
}: RowActionButtonProps) {
  return (
    <Tooltip.Root openDelay={300} closeDelay={0}>
      <Tooltip.Trigger asChild>
        <IconButton
          type="button"
          size="sm"
          variant="ghost"
          aria-label={label}
          aria-haspopup="dialog"
          color={COLORS.muted}
          _hover={{ bg: COLORS.raisedHover, color: COLORS.text }}
          _focusVisible={focusRing}
          onClick={onClick}
        >
          {children}
        </IconButton>
      </Tooltip.Trigger>
      <Portal>
        <Tooltip.Positioner>
          <Tooltip.Content
            bg={COLORS.inverted}
            color={COLORS.onInverted}
            fontSize="xs"
            px={2}
            py={1}
            borderRadius="md"
          >
            {tooltip}
          </Tooltip.Content>
        </Tooltip.Positioner>
      </Portal>
    </Tooltip.Root>
  );
}
