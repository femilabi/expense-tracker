import { Box, Flex, Text } from "@chakra-ui/react";

import { formatPercentUsed, summarizeBudgets } from "@/lib/budget-math";
import type { BudgetMonth } from "@/lib/budgets";
import { formatCurrency } from "@/lib/format";

import { BudgetProgressBar } from "@/components/budget/budget-progress-bar";
import { COLORS, CSS_COLORS } from "@/components/shared/colors";

import { DashboardCard, DashboardCardHeader } from "./dashboard-card";
import { EmptyState } from "./empty-state";

interface BudgetProgressCardProps {
  budgetMonth: BudgetMonth;
}

/** Overall progress for the month, summed across every category budget. */
export function BudgetProgressCard({ budgetMonth }: BudgetProgressCardProps) {
  const { currency } = budgetMonth;
  const { total, unbudgetedSpent } = summarizeBudgets(budgetMonth.categories);

  return (
    <DashboardCard>
      <DashboardCardHeader title="Budget progress" />

      <Box mt="5">
        {total.budget === null ||
        total.remaining === null ||
        total.percentUsed === null ? (
          <EmptyState message="No budget set for this month. Add budgets on the Budget page to track your progress." />
        ) : (
          <>
            <Flex justify="space-between" align="flex-end" gap="3" mb="3">
              <Text
                fontSize="sm"
                lineHeight="1.5"
                color={CSS_COLORS.muted}
                fontVariantNumeric="tabular-nums"
              >
                {formatCurrency(total.spent, currency)} of{" "}
                {formatCurrency(total.budget, currency)} used
              </Text>

              <Text
                fontSize="2xl"
                fontWeight="bold"
                lineHeight="1"
                letterSpacing="tight"
                color={total.isOverBudget ? COLORS.danger : COLORS.primary}
                fontVariantNumeric="tabular-nums"
              >
                {formatPercentUsed(total.percentUsed)}
              </Text>
            </Flex>

            <BudgetProgressBar label="Monthly" progress={total} />

            <Text
              mt="3"
              fontSize="sm"
              fontWeight="medium"
              color={total.isOverBudget ? COLORS.danger : CSS_COLORS.foreground}
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
                lineHeight="1.5"
                color={CSS_COLORS.muted}
                fontVariantNumeric="tabular-nums"
              >
                + {formatCurrency(unbudgetedSpent, currency)} spent in
                unbudgeted categories
              </Text>
            ) : null}
          </>
        )}
      </Box>
    </DashboardCard>
  );
}
