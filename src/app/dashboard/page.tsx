import { Box, Heading, Stack, Text } from "@chakra-ui/react";
import type { Metadata } from "next";
import { connection } from "next/server";

import { glassPageStyles, metaLabelStyles } from "@/components/shared/styles";
import { getBudgetMonth } from "@/lib/budgets";
import { getDashboardData } from "@/lib/dashboard";
import { formatMonth, formatShortMonth } from "@/lib/format";
import { getCurrentMonth, monthStart, shiftMonth } from "@/lib/month";
import { getCurrentUser } from "@/lib/session";
import {
  buildSpendingPace,
  describeSpendingPace,
  getPaceBudget,
} from "@/lib/spending-pace";

import { DashboardSections } from "./components/dashboard-sections";
import { SummaryCards } from "./components/summary-cards";

export const metadata: Metadata = {
  title: "Dashboard | Expense Tracker",
  description: "This month's income, spending, and savings at a glance.",
};

export const instant = false;

export default async function Dashboard() {
  await connection();

  const user = await getCurrentUser();
  // One reference time so every card agrees on "this month" and "today".
  const now = new Date();
  const currentMonth = getCurrentMonth(now);
  const [
    { month, summary, topCategory, recentTransactions, dailySpending },
    budgetMonth,
  ] = await Promise.all([
    getDashboardData(user.id, now),
    getBudgetMonth(user.id, currentMonth),
  ]);

  const spendingPace = buildSpendingPace({
    month: currentMonth,
    today: now.getDate(),
    thisMonth: dailySpending.thisMonth,
    lastMonth: dailySpending.lastMonth,
    budget: getPaceBudget(budgetMonth.categories),
  });
  const spendingPaceLabels = {
    thisMonth: formatShortMonth(monthStart(currentMonth)),
    lastMonth: formatShortMonth(monthStart(shiftMonth(currentMonth, -1))),
    daysInMonth: new Date(
      Date.UTC(currentMonth.year, currentMonth.month, 0),
    ).getUTCDate(),
  };

  return (
    <Box
      w="full"
      px={{ base: 4, md: 6 }}
      py={{ base: 4, md: 6 }}
      bg="bg.subtle"
      {...glassPageStyles}
    >
      {/* Header */}
      <Box
        mb="8"
        bg="bg.inverted"
        color="fg.inverted"
        p={{ base: 6, md: 8 }}
        borderRadius="2xl"
        shadow="lg"
      >
        <Heading size="2xl">Expense Tracker Dashboard</Heading>

        <Text mt="2" color="fg.inverted/75">
          Track spending, monitor budgets, and manage your finances.
        </Text>
      </Box>

      {/* Summary Cards */}
      <Stack as="section" gap="3" aria-label="This month's summary">
        <Text {...metaLabelStyles}>{formatMonth(month)}</Text>
        <SummaryCards summary={summary} topCategory={topCategory} />
      </Stack>

      <DashboardSections
        spendingPace={spendingPace}
        spendingPaceSummary={describeSpendingPace(
          spendingPace,
          summary.currency,
        )}
        spendingPaceLabels={spendingPaceLabels}
        budgetMonth={budgetMonth}
        recentTransactions={recentTransactions}
        currency={summary.currency}
      />
    </Box>
  );
}
