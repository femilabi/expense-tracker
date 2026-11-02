import { Box, Flex } from "@chakra-ui/react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Flex
      as="main"
      position="relative"
      flex="1"
      minH="100dvh"
      alignItems="center"
      justifyContent="center"
      overflow="hidden"
      bg="bg.subtle"
      px={4}
      py={{ base: 10, sm: 16 }}
    >
      <Box
        position="absolute"
        top="-120px"
        left="-100px"
        boxSize="320px"
        borderRadius="full"
        bg="brand.solid"
        opacity={0.1}
        filter="blur(90px)"
      />
      <Box
        position="absolute"
        bottom="-140px"
        right="-110px"
        boxSize="340px"
        borderRadius="full"
        bg="accent.solid"
        opacity={0.12}
        filter="blur(100px)"
      />

      <Box
        position="relative"
        w="full"
        maxW="sm"
        overflow="hidden"
        bg="bg.panel"
        borderWidth="1px"
        borderColor="border"
        borderRadius="2xl"
        boxShadow="lg"
      >
        <Box
          h="1.5"
          bgGradient="to-r"
          gradientFrom="brand.solid"
          gradientTo="accent.solid"
        />
        <Box px={{ base: 6, sm: 8 }} py={8}>
          {children}
        </Box>
      </Box>
    </Flex>
  );
}
