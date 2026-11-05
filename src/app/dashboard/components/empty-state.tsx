import { Box, Flex, Text } from "@chakra-ui/react";

import { CSS_COLORS, cssTint } from "@/components/shared/colors";
import { glassIconBadgeStyles } from "@/components/shared/styles";

interface EmptyStateProps {
  message: string;
  /** Soft icon shown above the message. */
  icon?: React.ReactNode;
  /** Optional link shown under the message. */
  children?: React.ReactNode;
}

export function EmptyState({ message, icon, children }: EmptyStateProps) {
  return (
    <Flex
      direction="column"
      align="center"
      justify="center"
      gap="3"
      py="10"
      px="6"
      textAlign="center"
      borderRadius="xl"
      borderWidth="1px"
      borderStyle="dashed"
      borderColor={cssTint(CSS_COLORS.secondary, 22)}
      bg={`radial-gradient(120% 90% at 50% 0%, ${cssTint(CSS_COLORS.secondary, 6)}, transparent 70%)`}
    >
      {icon ? (
        <Box
          {...glassIconBadgeStyles}
          boxSize="12"
          borderRadius="full"
          aria-hidden="true"
        >
          {icon}
        </Box>
      ) : null}
      <Text maxW="xs" fontSize="sm" lineHeight="1.6" color={CSS_COLORS.muted}>
        {message}
      </Text>
      {children}
    </Flex>
  );
}
