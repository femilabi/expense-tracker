"use client";

import * as React from "react";
import Link from "next/link";
import { Box, Button, Stack, Text } from "@chakra-ui/react";

import { rankByPercentUsed } from "@/lib/budget-math";
import type { BudgetMonth } from "@/lib/budgets";

import { COLORS } from "@/components/shared/colors";
import { PieChartIcon } from "@/components/shared/icons";
import { focusRing, secondaryButtonStyles } from "@/components/shared/styles";

import { BudgetCategoryProgress } from "./budget/budget-category-progress";
import { BudgetBreakdownDialog } from "./budget-breakdown-dialog";
import { DashboardCard, DashboardCardHeader } from "./dashboard-card";
import { EmptyState } from "./empty-state";

const TOP_CATEGORY_COUNT = 3;

interface SpendingCategoriesCardProps {
  budgetMonth: BudgetMonth;
}

export function SpendingCategoriesCard({
  budgetMonth,
}: SpendingCategoriesCardProps) {
  const [isBreakdownOpen, setIsBreakdownOpen] = React.useState(false);
  const ranked = rankByPercentUsed(budgetMonth.categories);
  const topCategories = ranked.slice(0, TOP_CATEGORY_COUNT);

  return (
    <DashboardCard index={1}>
      <DashboardCardHeader
        title="Spending Categories"
        icon={<PieChartIcon />}
        action={
          ranked.length > 0 ? (
            <Button
              type="button"
              size="sm"
              onClick={() => setIsBreakdownOpen(true)}
              {...secondaryButtonStyles}
              h="8"
              px="3"
              transition="background-color 0.15s ease"
              _motionReduce={{ transition: "none" }}
            >
              View all
            </Button>
          ) : null
        }
      />

      <Box mt="5">
        {topCategories.length > 0 ? (
          <Stack gap="5">
            {topCategories.map((item) => (
              <BudgetCategoryProgress
                key={item.category}
                item={item}
                currency={budgetMonth.currency}
                barVariant="glow"
              />
            ))}
          </Stack>
        ) : (
          <EmptyState
            message="No budgets set for this month."
            icon={<PieChartIcon size={22} />}
          >
            <Text
              asChild
              fontSize="sm"
              fontWeight="semibold"
              color={COLORS.link}
              borderRadius="sm"
              _hover={{ textDecoration: "underline" }}
              _focusVisible={focusRing}
            >
              <Link href="/dashboard/budget">Set up budgets</Link>
            </Text>
          </EmptyState>
        )}
      </Box>

      <BudgetBreakdownDialog
        open={isBreakdownOpen}
        budgetMonth={budgetMonth}
        onClose={() => setIsBreakdownOpen(false)}
      />
    </DashboardCard>
  );
}
