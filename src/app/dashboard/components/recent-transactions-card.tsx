import Link from "next/link";
import { Box, Flex, Stack, Text } from "@chakra-ui/react";

import { formatCurrency, formatShortDate } from "@/lib/format";
import type { RecentTransaction } from "@/lib/recent-transactions";

import { CSS_COLORS, cssTint } from "@/components/shared/colors";
import { ReceiptIcon } from "@/components/shared/icons";
import {
  focusRing,
  glassIconBadgeStyles,
  glassTransition,
} from "@/components/shared/styles";

import { TransactionIcon } from "./category-icon";
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
    <DashboardCard index={3}>
      <DashboardCardHeader title="Recent Transactions" icon={<ReceiptIcon />} />

      <Box mt="4">
        {transactions.length === 0 ? (
          <EmptyState
            message="No transactions yet. Add an expense or income to see it here."
            icon={<ReceiptIcon size={22} />}
          />
        ) : (
          <Stack as="ul" gap="1" listStyleType="none">
            {transactions.map((transaction) => {
              const isExpense = transaction.kind === "expense";
              const tone = isExpense
                ? CSS_COLORS.secondary
                : CSS_COLORS.success;

              return (
                <Box as="li" key={`${transaction.kind}-${transaction.id}`}>
                  <Flex
                    asChild
                    align="center"
                    gap="3"
                    py="2.5"
                    px="3"
                    mx="-3"
                    borderRadius="xl"
                    {...glassTransition}
                    _hover={{
                      bg: cssTint(CSS_COLORS.secondary, 6),
                      transform: "translateX(2px)",
                    }}
                    _focusVisible={focusRing}
                  >
                    <Link href={transaction.href}>
                      <Box
                        {...glassIconBadgeStyles}
                        color={tone}
                        bg={`linear-gradient(145deg, ${cssTint(tone, 18)}, ${cssTint(tone, 6)})`}
                        borderColor={cssTint(tone, 20)}
                        aria-hidden="true"
                      >
                        <TransactionIcon
                          kind={transaction.kind}
                          label={transaction.label}
                        />
                      </Box>

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
                        minW="20"
                        textAlign="right"
                        fontSize="sm"
                        fontWeight="semibold"
                        letterSpacing="-0.01em"
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
