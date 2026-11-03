import { Box, Flex, Skeleton, Stack } from "@chakra-ui/react";

import { COLORS } from "@/components/shared/colors";

export default function Loading() {
  return (
    <Box
      as="main"
      minH="100dvh"
      bg={COLORS.page}
      color={COLORS.text}
      fontFamily="var(--font-geist-sans), Arial, Helvetica, sans-serif"
      px={{ base: 4, md: 6 }}
      py={{ base: 8, md: 10 }}
    >
      <Stack maxW="6xl" mx="auto" gap={6}>
        <Flex
          direction={{ base: "column", sm: "row" }}
          justify="space-between"
          align={{ base: "stretch", sm: "flex-start" }}
          gap={4}
        >
          <Box>
            <Skeleton h="8" w="40" bg={COLORS.border} />
            <Skeleton mt={3} h="4" w="72" maxW="full" bg={COLORS.border} />
          </Box>
          <Skeleton h="10" w="32" borderRadius="lg" bg={COLORS.border} />
        </Flex>

        <Skeleton
          h={{ base: "64", xl: "28" }}
          borderRadius="xl"
          bg={COLORS.border}
        />

        <Stack gap={4}>
          <Skeleton
            h={{ base: "44", lg: "10" }}
            borderRadius="lg"
            bg={COLORS.border}
          />
          <Skeleton h="96" borderRadius="xl" bg={COLORS.border} />
        </Stack>
      </Stack>
    </Box>
  );
}
