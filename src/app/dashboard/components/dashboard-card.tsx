import { Box, Flex, Heading, Text, type BoxProps } from "@chakra-ui/react";

import { CSS_COLORS } from "@/components/shared/colors";

/**
 * Shared surface for the dashboard cards below the summary row: one radius,
 * padding, border and soft layered shadow. Colours read globals.css directly.
 */
export function DashboardCard(props: BoxProps) {
  return (
    <Box
      as="section"
      bg={CSS_COLORS.card}
      borderWidth="1px"
      borderColor={CSS_COLORS.border}
      borderRadius="2xl"
      boxShadow="xs"
      p={{ base: 5, md: 6 }}
      minW={0}
      {...props}
    />
  );
}

interface DashboardCardHeaderProps {
  title: string;
  titleId?: string;
  subtitle?: React.ReactNode;
  /** Shown at the top right: a pill, button or link. */
  action?: React.ReactNode;
}

export function DashboardCardHeader({
  title,
  titleId,
  subtitle,
  action,
}: DashboardCardHeaderProps) {
  return (
    <Flex justify="space-between" align="flex-start" gap="3" wrap="wrap">
      <Box minW={0}>
        <Heading
          as="h2"
          id={titleId}
          fontSize="lg"
          fontWeight="semibold"
          letterSpacing="tight"
          lineHeight="1.4"
          color={CSS_COLORS.foreground}
        >
          {title}
        </Heading>
        {subtitle ? (
          <Text mt="1" fontSize="sm" lineHeight="1.5" color={CSS_COLORS.muted}>
            {subtitle}
          </Text>
        ) : null}
      </Box>
      {action}
    </Flex>
  );
}

/** One pill shape for every status label and stat chip on the dashboard. */
export const pillStyles = {
  display: "inline-flex",
  alignItems: "center",
  gap: "1.5",
  px: "2.5",
  py: "1",
  borderRadius: "full",
  fontSize: "xs",
  fontWeight: "semibold",
  lineHeight: "1rem",
  whiteSpace: "nowrap",
  fontVariantNumeric: "tabular-nums",
  color: CSS_COLORS.foreground,
} as const;
