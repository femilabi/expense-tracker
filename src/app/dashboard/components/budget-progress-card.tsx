import { Box, Flex, Heading, Text } from "@chakra-ui/react";

import { formatPercentUsed, summarizeBudgets } from "@/lib/budget-math";
import type { BudgetMonth } from "@/lib/budgets";
import { formatCurrency } from "@/lib/format";

import { BudgetProgressBar } from "@/components/budget/budget-progress-bar";
import { COLORS } from "@/components/shared/colors";

import { EmptyState } from "./empty-state";

interface BudgetProgressCardProps {
  budgetMonth: BudgetMonth;
}

/** Overall progress for the month, summed across every category budget. */
export function BudgetProgressCard({ budgetMonth }: BudgetProgressCardProps) {
  const { currency } = budgetMonth;
  const { total, unbudgetedSpent } = summarizeBudgets(budgetMonth.categories);

  return (
    <Box
      bg="bg.panel"
      p="6"
      borderRadius="2xl"
      shadow="md"
      border="1px solid"
      borderColor="border"
    >
      <Heading size="lg" color="fg" mb="6">
        Budget progress
      </Heading>

      {total.budget === null ||
      total.remaining === null ||
      total.percentUsed === null ? (
        <EmptyState message="No budget set for this month. Add budgets on the Budget page to track your progress." />
      ) : (
        <Box>
          <Flex justify="space-between" gap="3" mb="3">
            <Text color="fg.muted" fontVariantNumeric="tabular-nums">
              {formatCurrency(total.spent, currency)} of{" "}
              {formatCurrency(total.budget, currency)} used
            </Text>

            <Text
              fontWeight="bold"
              color={total.isOverBudget ? COLORS.danger : COLORS.primary}
              fontVariantNumeric="tabular-nums"
            >
              {formatPercentUsed(total.percentUsed)}
            </Text>
          </Flex>

          <BudgetProgressBar label="Monthly" progress={total} />

          <Text
            mt="4"
            fontSize="sm"
            color={total.isOverBudget ? COLORS.danger : "fg.muted"}
            fontVariantNumeric="tabular-nums"
          >
            {total.isOverBudget
              ? `${formatCurrency(-total.remaining, currency)} over budget`
              : `${formatCurrency(total.remaining, currency)} left this month`}
          </Text>

          {unbudgetedSpent > 0 ? (
            <Text
              mt="1"
              fontSize="xs"
              color="fg.muted"
              fontVariantNumeric="tabular-nums"
            >
              + {formatCurrency(unbudgetedSpent, currency)} spent in
              unbudgeted categories
            </Text>
          ) : null}
        </Box>
      )}
    </Box>
  );
}
