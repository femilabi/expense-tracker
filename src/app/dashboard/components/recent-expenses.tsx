import { Box, Flex, Text } from "@chakra-ui/react";

import type { RecentExpense } from "@/lib/dashboard";
import { formatCurrency, formatDate } from "@/lib/format";
import { EmptyState } from "./empty-state";

interface RecentExpensesProps {
  expenses: RecentExpense[];
  currency: string;
}

export function RecentExpensesCard({
  expenses,
  currency,
}: RecentExpensesProps) {
  return (
    <Box
      bg="bg.panel"
      borderWidth="1px"
      borderColor="border"
      borderRadius="2xl"
      boxShadow="sm"
      p={{ base: 5, md: 6 }}
    >
      <Flex align="baseline" justify="space-between" gap={4} mb={4}>
        <Text fontSize="md" fontWeight="bold" color="fg">
          Recent transactions
        </Text>
        <Text fontSize="xs" color="fg.muted">
          Latest activity
        </Text>
      </Flex>

      {expenses.length === 0 ? (
        <EmptyState message="Nothing logged yet. Add your first expense to see it here." />
      ) : (
        <Flex direction="column">
          {expenses.map((expense, index) => (
            <Flex
              key={expense.id}
              align="center"
              justify="space-between"
              gap={4}
              py={3}
              borderTopWidth={index === 0 ? "1px" : "0"}
              borderBottomWidth="1px"
              borderColor="border"
            >
              <Flex align="center" gap={3} minW={0}>
                <Flex
                  align="center"
                  justify="center"
                  boxSize="10"
                  borderRadius="full"
                  bg={expense.tint}
                  fontSize="md"
                  lineHeight="1"
                  flexShrink={0}
                  aria-hidden="true"
                >
                  {expense.emoji}
                </Flex>

                <Box minW={0}>
                  <Text fontSize="sm" fontWeight="medium" color="fg" truncate>
                    {expense.description ?? expense.label}
                  </Text>
                  <Text fontSize="xs" color="fg.muted">
                    {expense.label} · {formatDate(expense.date)}
                  </Text>
                </Box>
              </Flex>

              <Text
                fontSize="sm"
                fontWeight="semibold"
                color="fg"
                whiteSpace="nowrap"
              >
                −{formatCurrency(expense.amount, currency)}
              </Text>
            </Flex>
          ))}
        </Flex>
      )}
    </Box>
  );
}
