"use client";

import {
  Box,
  Flex,
  Grid,
  Heading,
  Link as ChakraLink,
  Progress,
  Stack,
  Text,
} from "@chakra-ui/react";
import Link from "next/link";

const monthlySpending = [
  { month: "Jan", height: 24 },
  { month: "Feb", height: 40 },
  { month: "Mar", height: 28 },
  { month: "Apr", height: 52 },
  { month: "May", height: 44 },
  { month: "Jun", height: 64 },
];

const categories = [
  { name: "Food", value: 35, color: "danger.solid" },
  { name: "Transport", value: 20, color: "brand.solid" },
  { name: "Entertainment", value: 15, color: "accent.solid" },
];

const transactions = [
  {
    name: "Uber",
    category: "Transport",
    amount: "-R120",
    color: "danger.solid",
  },
  {
    name: "Checkers",
    category: "Groceries",
    amount: "-R450",
    color: "danger.solid",
  },
  {
    name: "Salary",
    category: "Income",
    amount: "+R5000",
    color: "success.solid",
  },
];

/** Chart, category, budget and transaction sections (still mock data).
 */
export function DashboardSections() {
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
        {/* Spending Categories */}
        <Box
          bg="bg.panel"
          p="6"
          borderRadius="2xl"
          shadow="md"
          border="1px solid"
          borderColor="border"
        >
          <Heading size="lg" color="fg">
            Spending Categories
          </Heading>

          <Stack gap="5" mt="6">
            {categories.map((category) => (
              <Box key={category.name}>
                <Flex justify="space-between" mb="2">
                  <Text fontWeight="medium">{category.name}</Text>

                  <Text color="fg.muted">{category.value}%</Text>
                </Flex>

                <Box h="3" bg="bg.muted" borderRadius="full" overflow="hidden">
                  <Box
                    h="full"
                    width={`${category.value}%`}
                    bg={category.color}
                    borderRadius="full"
                  />
                </Box>
              </Box>
            ))}
          </Stack>
        </Box>

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

      {/* Recent Transactions */}
      <Box
        mt="8"
        bg="bg.panel"
        p="6"
        borderRadius="2xl"
        shadow="md"
        border="1px solid"
        borderColor="border"
      >
        <Flex justify="space-between" align="center" mb="6">
          <Heading size="lg" color="fg">
            Recent Transactions
          </Heading>

          <Text fontSize="sm" color="brand.fg" fontWeight="semibold">
            Latest activity
          </Text>
        </Flex>

        <Stack gap="0">
          {transactions.map((transaction, index) => (
            <Flex
              key={transaction.name}
              align="center"
              justify="space-between"
              py="4"
              borderBottom={
                index !== transactions.length - 1 ? "1px solid" : "none"
              }
              borderColor="border"
            >
              <Box>
                <Text fontWeight="semibold">{transaction.name}</Text>

                <Text css={{ fontSize: "sm", color: "fg.muted" }}>
                  {transaction.category}
                </Text>
              </Box>

              <Text fontWeight="bold" color={transaction.color}>
                {transaction.amount}
              </Text>
            </Flex>
          ))}
        </Stack>
      </Box>
    </>
  );
}
