"use client";

import {
  Box,
  Flex,
  Grid,
  Heading,
  Link as ChakraLink,
  Progress,
  Text,
} from "@chakra-ui/react";
import Link from "next/link";

import type { BudgetMonth } from "@/lib/budgets";
import type { RecentTransaction } from "@/lib/recent-transactions";

import { RecentTransactionsCard } from "./recent-transactions-card";
import { SpendingCategoriesCard } from "./spending-categories-card";

const monthlySpending = [
  { month: "Jan", height: 24 },
  { month: "Feb", height: 40 },
  { month: "Mar", height: 28 },
  { month: "Apr", height: 52 },
  { month: "May", height: 44 },
  { month: "Jun", height: 64 },
];

interface DashboardSectionsProps {
  budgetMonth: BudgetMonth;
  recentTransactions: RecentTransaction[];
  currency: string;
}

/**
 * Chart, budget and transaction sections. The categories and recent
 * transactions cards are live; the trend chart and budget progress are not.
 */
export function DashboardSections({
  budgetMonth,
  recentTransactions,
  currency,
}: DashboardSectionsProps) {
  return (
    <>
      {/* Monthly Spending */}
      <Box
        mt="8"
        bg="bg.panel"
        p="6"
        borderRadius="2xl"
        shadow="md"
        border="1px solid"
        borderColor="border"
      >
        <Heading size="lg" color="fg">
          Monthly Spending Trend
        </Heading>

        <Text mt="2" color="fg.muted">
          Overview of expenses throughout the month
        </Text>

        <Box mt="6" h="320px" bg="bg.subtle" p="6" borderRadius="xl">
          <Flex h="full" align="end" justify="space-between" gap="4">
            {monthlySpending.map((item) => (
              <Flex
                key={item.month}
                direction="column"
                align="center"
                justify="end"
                h="full"
                flex="1"
              >
                <Box
                  h={`${item.height * 4}px`}
                  maxH="260px"
                  w={{ base: "28px", md: "48px" }}
                  bg="brand.solid"
                  borderTopRadius="md"
                  transition="0.2s"
                  _hover={{
                    bg: "brand.hover",
                    transform: "translateY(-4px)",
                  }}
                />

                <Text mt="2" css={{ fontSize: "sm", color: "fg.muted" }}>
                  {item.month}
                </Text>
              </Flex>
            ))}
          </Flex>
        </Box>
      </Box>

      {/* Categories and Budget */}
      <Grid
        mt="8"
        templateColumns={{
          base: "1fr",
          lg: "repeat(2, 1fr)",
        }}
        gap="6"
      >
        <SpendingCategoriesCard budgetMonth={budgetMonth} />

        {/* Budget Progress */}
        <Box
          bg="bg.panel"
          p="6"
          borderRadius="2xl"
          shadow="md"
          border="1px solid"
          borderColor="border"
        >
          <Flex justify="space-between" align="center" mb="6">
            <Heading size="lg" color="fg">
              Budget progress
            </Heading>
            <ChakraLink
              asChild
              css={{
                fontSize: "sm",
                fontWeight: "semibold",
                color: "brand.fg",
                "&:hover": { textDecoration: "underline" },
              }}
            >
              <Link href="/expenses">Expenses</Link>
            </ChakraLink>
          </Flex>

          <Box>
            <Flex justify="space-between" mb="3">
              <Text color="fg.muted">R8,500 of R10,000 used</Text>

              <Text fontWeight="bold" color="fg.success">
                85%
              </Text>
            </Flex>

            <Progress.Root value={85} colorPalette="success" size="lg">
              <Progress.Track>
                <Progress.Range />
              </Progress.Track>
            </Progress.Root>

            <Text mt="4" css={{ fontSize: "sm", color: "fg.muted" }}>
              85% of monthly budget used
            </Text>
          </Box>
        </Box>
      </Grid>

      <RecentTransactionsCard
        transactions={recentTransactions}
        currency={currency}
      />
    </>
  );
}
