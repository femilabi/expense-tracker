import Link from "next/link";
import { Box, Flex, Stack, Text } from "@chakra-ui/react";

import { formatCurrency, formatShortDate } from "@/lib/format";
import type { RecentTransaction } from "@/lib/recent-transactions";

import { CSS_COLORS, cssTint } from "@/components/shared/colors";
import { focusRing } from "@/components/shared/styles";

import { DashboardCard, DashboardCardHeader } from "./dashboard-card";
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
    <DashboardCard>
      <DashboardCardHeader title="Recent Transactions" />

      <Box mt="5">
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
                  borderBottomWidth={
                    index !== transactions.length - 1 ? "1px" : "0"
                  }
                  borderColor={CSS_COLORS.border}
                >
                  <Flex
                    asChild
                    align="center"
                    gap="3"
                    py="3"
                    px="3"
                    mx="-3"
                    borderRadius="lg"
                    transition="background-color 0.15s ease"
                    _motionReduce={{ transition: "none" }}
                    _hover={{ bg: CSS_COLORS.background }}
                    _focusVisible={focusRing}
                  >
                    <Link href={transaction.href}>
                      <Flex
                        align="center"
                        justify="center"
                        boxSize="9"
                        flexShrink={0}
                        borderRadius="full"
                        bg={cssTint(
                          isExpense ? CSS_COLORS.danger : CSS_COLORS.success,
                        )}
                        color={CSS_COLORS.foreground}
                        fontSize="sm"
                        fontWeight="semibold"
                        aria-hidden="true"
                      >
                        {transaction.label.charAt(0)}
                      </Flex>

                      <Box flex="1" minW={0}>
                        <Text
                          fontSize="sm"
                          fontWeight="semibold"
                          lineHeight="1.4"
                          color={CSS_COLORS.foreground}
                          truncate
                        >
                          {transaction.title}
                        </Text>

                        <Text
                          mt="0.5"
                          fontSize="xs"
                          lineHeight="1.4"
                          color={CSS_COLORS.muted}
                        >
                          {transaction.label} ·{" "}
                          {formatShortDate(transaction.date)}
                        </Text>
                      </Box>

                      <Text
                        flexShrink={0}
                        textAlign="right"
                        fontSize="sm"
                        fontWeight="semibold"
                        whiteSpace="nowrap"
                        fontVariantNumeric="tabular-nums"
                        color={isExpense ? "danger.hover" : "success.hover"}
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
    </DashboardCard>
  );
}
