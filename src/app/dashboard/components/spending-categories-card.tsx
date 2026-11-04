"use client";

import * as React from "react";
import Link from "next/link";
import { Box, Button, Flex, Heading, Stack, Text } from "@chakra-ui/react";

import { rankByPercentUsed } from "@/lib/budget-math";
import type { BudgetMonth } from "@/lib/budgets";

import { BudgetCategoryProgress } from "@/components/budget/budget-category-progress";
import { COLORS } from "@/components/shared/colors";
import { secondaryButtonStyles } from "@/components/shared/styles";

import { BudgetBreakdownDialog } from "./budget-breakdown-dialog";

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
    <Box
      bg={COLORS.card}
      p="6"
      borderRadius="2xl"
      shadow="md"
      border="1px solid"
      borderColor={COLORS.border}
    >
      <Flex justify="space-between" align="center" gap={3}>
        <Heading size="lg" color={COLORS.text}>
          Spending Categories
        </Heading>
        {ranked.length > 0 ? (
          <Button
            type="button"
            size="sm"
            onClick={() => setIsBreakdownOpen(true)}
            {...secondaryButtonStyles}
            h="9"
          >
            View all
          </Button>
        ) : null}
      </Flex>

      {topCategories.length > 0 ? (
        <Stack gap="5" mt="6">
          {topCategories.map((item) => (
            <BudgetCategoryProgress
              key={item.category}
              item={item}
              currency={budgetMonth.currency}
            />
          ))}
        </Stack>
      ) : (
        <Box mt="6">
          <Text fontSize="sm" color={COLORS.muted}>
            No budgets set for this month.
          </Text>
          <Text
            asChild
            mt="2"
            display="inline-block"
            fontSize="sm"
            fontWeight="semibold"
            color={COLORS.link}
          >
            <Link href="/budget">Set up budgets</Link>
          </Text>
        </Box>
      )}

      <BudgetBreakdownDialog
        open={isBreakdownOpen}
        budgetMonth={budgetMonth}
        onClose={() => setIsBreakdownOpen(false)}
      />
    </Box>
  );
}
