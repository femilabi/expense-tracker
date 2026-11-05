import { Flex, Text } from "@chakra-ui/react";

import { CSS_COLORS } from "@/components/shared/colors";

interface EmptyStateProps {
  message: string;
  /** Optional link shown under the message. */
  children?: React.ReactNode;
}

export function EmptyState({ message, children }: EmptyStateProps) {
  return (
    <Flex
      direction="column"
      align="center"
      justify="center"
      gap="2"
      py="10"
      px="6"
      textAlign="center"
      borderRadius="xl"
      bg={CSS_COLORS.background}
    >
      <Text maxW="sm" fontSize="sm" lineHeight="1.6" color={CSS_COLORS.muted}>
        {message}
      </Text>
      {children}
    </Flex>
  );
}
