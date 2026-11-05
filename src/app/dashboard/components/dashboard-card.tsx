import { Box, Flex, Heading, Text, type BoxProps } from "@chakra-ui/react";

import { CSS_COLORS } from "@/components/shared/colors";
import {
  glassCardStyles,
  glassIconBadgeStyles,
} from "@/components/shared/styles";

const STAGGER_MS = 80;

interface DashboardCardProps extends BoxProps {
  /** Position in the entrance order; each card rises a little later. */
  index?: number;
}

/** Soft-glass surface shared by the dashboard cards below the summary row. */
export function DashboardCard({ index = 0, ...props }: DashboardCardProps) {
  return (
    <Box
      as="section"
      {...glassCardStyles}
      animationDelay={`${index * STAGGER_MS}ms`}
      {...props}
    />
  );
}

interface DashboardCardHeaderProps {
  title: string;
  icon: React.ReactNode;
  titleId?: string;
  subtitle?: React.ReactNode;
  /** Shown at the top right: a pill, button or link. */
  action?: React.ReactNode;
}

export function DashboardCardHeader({
  title,
  icon,
  titleId,
  subtitle,
  action,
}: DashboardCardHeaderProps) {
  return (
    <Flex justify="space-between" align="center" gap="3" wrap="wrap">
      <Flex align="center" gap="3" minW={0}>
        <Box {...glassIconBadgeStyles} aria-hidden="true">
          {icon}
        </Box>
        <Box minW={0}>
          <Heading
            as="h2"
            id={titleId}
            fontSize="md"
            fontWeight="semibold"
            letterSpacing="-0.01em"
            lineHeight="1.4"
            color={CSS_COLORS.foreground}
          >
            {title}
          </Heading>
          {subtitle ? (
            <Text fontSize="sm" lineHeight="1.5" color={CSS_COLORS.muted}>
              {subtitle}
            </Text>
          ) : null}
        </Box>
      </Flex>
      {action}
    </Flex>
  );
}
