import { Box, Flex, Text } from "@chakra-ui/react";

import type { CategoryBreakdown } from "@/lib/dashboard";
import { formatCurrency } from "@/lib/format";
import { EmptyState } from "./empty-state";

interface CategoryBreakdownProps {
  items: CategoryBreakdown[];
  currency: string;
}

export function CategoryBreakdownCard({
  items,
  currency,
}: CategoryBreakdownProps) {
  return (
    <Box
      bg="bg.panel"
      borderWidth="1px"
      borderColor="border"
      borderRadius="2xl"
      boxShadow="sm"
      p={{ base: 5, md: 6 }}
    >
      <Flex align="baseline" justify="space-between" gap={4} mb={5}>
        <Text fontSize="md" fontWeight="bold" color="fg">
          Spending by category
        </Text>
        <Text fontSize="xs" color="fg.muted">
          This month
        </Text>
      </Flex>

      {items.length === 0 ? (
        <EmptyState message="No expenses recorded for this month yet." />
      ) : (
        <Flex direction="column" gap={4}>
          {items.map((item) => (
            <Box key={item.category}>
              <Flex align="center" gap={3}>
                <Flex
                  align="center"
                  justify="center"
                  boxSize="9"
                  borderRadius="full"
                  bg={item.tint}
                  fontSize="md"
                  lineHeight="1"
                  flexShrink={0}
                  aria-hidden="true"
                >
                  {item.emoji}
                </Flex>

                <Box flex="1" minW={0}>
                  <Flex align="baseline" justify="space-between" gap={3}>
                    <Text fontSize="sm" fontWeight="medium" color="fg" truncate>
                      {item.label}
                    </Text>
                    <Text
                      fontSize="sm"
                      fontWeight="semibold"
                      color="fg"
                      whiteSpace="nowrap"
                    >
                      {formatCurrency(item.total, currency)}
                    </Text>
                  </Flex>

                  <Box
                    mt={2}
                    h="8px"
                    borderRadius="full"
                    bg="bg.subtle"
                    overflow="hidden"
                  >
                    <Box
                      h="full"
                      w={`${Math.max(item.share * 100, item.total > 0 ? 4 : 0)}%`}
                      borderRadius="full"
                      bg={item.color}
                    />
                  </Box>
                </Box>
              </Flex>

              <Text fontSize="xs" color="fg.muted" mt={1} ps="12">
                {Math.round(item.share * 100)}% · {item.count} transaction
                {item.count === 1 ? "" : "s"}
              </Text>
            </Box>
          ))}
        </Flex>
      )}
    </Box>
  );
}
