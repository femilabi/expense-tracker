import { Box, SimpleGrid, Text } from "@chakra-ui/react";

import { COLORS } from "./colors";
import { metaLabelStyles, surfaceStyles } from "./styles";

export interface SummaryMetric {
  label: string;
  value: string;
  caption: string;
  valueColor?: string;
  emphasis?: boolean;
  comparison?: boolean;
}

/** Four-up summary card row shared by the Expenses, Budget and dashboard pages. */
export function SummaryMetrics({ metrics }: { metrics: SummaryMetric[] }) {
  return (
    <Box {...surfaceStyles} overflow="hidden">
      <SimpleGrid columns={{ base: 2, xl: 4 }}>
        {metrics.map((metric, index) => (
          <Box
            key={metric.label}
            px={{ base: 3, md: 5 }}
            py={{ base: 4, md: 5 }}
            borderColor={COLORS.border}
            borderTopWidth={{
              base: index < 2 ? "0" : "1px",
              xl: "0",
            }}
            borderLeftWidth={{
              base: index % 2 === 1 ? "1px" : "0",
              xl: index === 0 ? "0" : "1px",
            }}
          >
            <Text {...metaLabelStyles}>{metric.label}</Text>
            <Text
              mt={2}
              fontSize={
                metric.emphasis
                  ? { base: "xl", sm: "2xl", md: "3xl" }
                  : metric.comparison
                    ? { base: "xl", sm: "2xl", md: "2xl" }
                    : { base: "lg", sm: "xl", md: "2xl" }
              }
              fontWeight={metric.comparison ? "bold" : "semibold"}
              lineHeight="1.2"
              letterSpacing="tight"
              color={metric.valueColor ?? COLORS.text}
              fontVariantNumeric="tabular-nums"
            >
              {metric.value}
            </Text>
            <Text mt={2} fontSize="xs" lineHeight="1.5" color={COLORS.muted}>
              {metric.caption}
            </Text>
          </Box>
        ))}
      </SimpleGrid>
    </Box>
  );
}
