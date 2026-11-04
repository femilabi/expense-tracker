import Link from "next/link";
import { Box, Flex, Heading, Stack, Text } from "@chakra-ui/react";

import { formatCurrency, formatShortDate } from "@/lib/format";
import type { RecentTransaction } from "@/lib/recent-transactions";

import { focusRing } from "@/components/shared/styles";

import { EmptyState } from "./empty-state";

interface RecentTransactionsCardProps {
  transactions: RecentTransaction[];
  currency: string;
}

export function RecentTransactionsCard({
  transactions,
  currency,
}: RecentTransactionsCardProps) {
  return (
    <Box
      mt="8"
      bg="bg.panel"
      p="6"
      borderRadius="2xl"
      shadow="md"
      border="1px solid"
      borderColor="border"
    >
      <Heading size="lg" color="fg" mb="6">
        Recent Transactions
      </Heading>

      {transactions.length === 0 ? (
        <EmptyState message="No transactions yet. Add an expense or income to see it here." />
      ) : (
        <Stack as="ul" gap="0" listStyleType="none">
          {transactions.map((transaction, index) => {
            const isExpense = transaction.kind === "expense";

            return (
              <Box
                as="li"
                key={`${transaction.kind}-${transaction.id}`}
                borderBottom={
                  index !== transactions.length - 1 ? "1px solid" : "none"
                }
                borderColor="border"
              >
                <Flex
                  asChild
                  align="center"
                  justify="space-between"
                  gap="4"
                  py="4"
                  px="2"
                  mx="-2"
                  borderRadius="md"
                  _hover={{ bg: "bg.subtle" }}
                  _focusVisible={focusRing}
                >
                  <Link href={transaction.href}>
                    <Box minW={0}>
                      <Text fontWeight="semibold" truncate>
                        {transaction.title}
                      </Text>

                      <Text css={{ fontSize: "sm", color: "fg.muted" }}>
                        {transaction.label} ·{" "}
                        {formatShortDate(transaction.date)}
                      </Text>
                    </Box>

                    <Text
                      fontWeight="bold"
                      whiteSpace="nowrap"
                      color={isExpense ? "danger.solid" : "success.solid"}
                    >
                      {isExpense ? "-" : "+"}
                      {formatCurrency(transaction.amount, currency)}
                    </Text>
                  </Link>
                </Flex>
              </Box>
            );
          })}
        </Stack>
      )}
    </Box>
  );
}
