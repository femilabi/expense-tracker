import { Box, Flex, Text } from "@chakra-ui/react";

import type { MonthlyPoint } from "@/lib/dashboard";

interface MonthlyTrendProps {
  points: MonthlyPoint[];
}

export function MonthlyTrendCard({ points }: MonthlyTrendProps) {
  const max = Math.max(
    ...points.flatMap((point) => [point.income, point.expenses]),
    1,
  );

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
          Cash flow
        </Text>
        <Text fontSize="xs" color="fg.muted">
          Last {points.length} months
        </Text>
      </Flex>

      <Flex align="flex-end" gap={2} h="44" mb={3}>
        {points.map((point) => (
          <Flex
            key={point.key}
            direction="column"
            align="center"
            justify="flex-end"
            gap={2}
            flex="1"
            h="full"
          >
            <Flex align="flex-end" gap="4px" w="full" h="full">
              <Box
                flex="1"
                h={`${(point.income / max) * 100}%`}
                minH="4px"
                borderRadius="md"
                bg="brand.solid"
                title={`Income ${point.income}`}
              />
              <Box
                flex="1"
                h={`${(point.expenses / max) * 100}%`}
                minH="4px"
                borderRadius="md"
                bg="accent.solid"
                title={`Expenses ${point.expenses}`}
              />
            </Flex>
            <Text fontSize="xs" color="fg.muted">
              {point.label}
            </Text>
          </Flex>
        ))}
      </Flex>

      <Flex align="center" gap={4}>
        <Flex align="center" gap={2}>
          <Box boxSize="2.5" borderRadius="full" bg="brand.solid" />
          <Text fontSize="xs" color="fg.muted">
            Income
          </Text>
        </Flex>
        <Flex align="center" gap={2}>
          <Box boxSize="2.5" borderRadius="full" bg="accent.solid" />
          <Text fontSize="xs" color="fg.muted">
            Expenses
          </Text>
        </Flex>
      </Flex>
    </Box>
  );
}
