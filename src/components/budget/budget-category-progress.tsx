"use client";

import { Box, Flex, Text } from "@chakra-ui/react";

import { formatPercentUsed } from "@/lib/budget-math";
import type { CategoryBudget } from "@/lib/budgets";
import { formatCurrency } from "@/lib/format";

import { COLORS } from "@/components/shared/colors";

import { BudgetProgressBar } from "./budget-progress-bar";

interface BudgetCategoryProgressProps {
  item: CategoryBudget;
  currency: string;
  /** Show spent, budget and remaining amounts under the bar. */
  showAmounts?: boolean;
}

export function BudgetCategoryProgress({
  item,
  currency,
  showAmounts = false,
}: BudgetCategoryProgressProps) {
  const { label, progress } = item;
  const { budget, spent, remaining, percentUsed, isOverBudget } = progress;

  if (budget === null || remaining === null || percentUsed === null) {
    return (
      <Box>
        <Flex justify="space-between" align="baseline" gap={3}>
          <Text fontWeight="medium" color={COLORS.text}>
            {label}
          </Text>
          <Text fontSize="sm" color={COLORS.muted}>
            No budget set
          </Text>
        </Flex>
        {showAmounts && spent > 0 ? (
          <Text mt={1} fontSize="xs" color={COLORS.muted}>
            {formatCurrency(spent, currency)} spent
          </Text>
        ) : null}
      </Box>
    );
  }

  const statusColor = isOverBudget ? COLORS.danger : COLORS.muted;

  return (
    <Box>
      <Flex justify="space-between" align="baseline" gap={3} mb={2}>
        <Text fontWeight="medium" color={COLORS.text}>
          {label}
        </Text>
        <Text
          fontSize="sm"
          fontWeight={isOverBudget ? "semibold" : "normal"}
          color={statusColor}
          fontVariantNumeric="tabular-nums"
        >
          {formatPercentUsed(percentUsed)}
        </Text>
      </Flex>

      <BudgetProgressBar label={label} progress={progress} />

      {showAmounts ? (
        <Flex
          mt={2}
          justify="space-between"
          gap={3}
          fontSize="xs"
          fontVariantNumeric="tabular-nums"
        >
          <Text color={COLORS.muted}>
            {formatCurrency(spent, currency)} of{" "}
            {formatCurrency(budget, currency)}
          </Text>
          <Text color={statusColor}>
            {isOverBudget
              ? `${formatCurrency(-remaining, currency)} over`
              : `${formatCurrency(remaining, currency)} left`}
          </Text>
        </Flex>
      ) : null}
    </Box>
  );
}
