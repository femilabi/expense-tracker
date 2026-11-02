import { Box, Heading, Stack, Text } from "@chakra-ui/react";
import type { Metadata } from "next";
import { connection } from "next/server";

import { metaLabelStyles } from "@/components/shared/styles";
import { getDashboardData } from "@/lib/dashboard";
import { formatMonth } from "@/lib/format";
import { getCurrentUser } from "@/lib/session";

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
  const { month, summary, topCategory } = await getDashboardData(user.id);

  return (
    <Box minH="100vh" bg="bg.subtle" p={{ base: 4, md: 6 }}>
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

      <DashboardSections />
    </Box>
  );
}
