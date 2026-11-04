"use client";

import * as React from "react";
import { Chart, useChart } from "@chakra-ui/charts";
import { Box, Flex, Heading, HStack, Text } from "@chakra-ui/react";
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  ReferenceLine,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { formatCompactCurrency, formatCurrency } from "@/lib/format";
import type { SpendingPace } from "@/lib/spending-pace";

import { COLORS } from "@/components/shared/colors";

import { EmptyState } from "./empty-state";

interface SpendingPaceCardProps {
  pace: SpendingPace;
  summary: string;
  currency: string;
}

const THIS_MONTH_COLOR = COLORS.primary;
const THIS_MONTH_FILL = COLORS.primarySurface;
const LAST_MONTH_COLOR = COLORS.muted;
const BUDGET_COLOR = COLORS.danger;
const DASH = "5 4";

const subscribeToMotionPreference = (onChange: () => void) => {
  const query = window.matchMedia("(prefers-reduced-motion: reduce)");
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
};

/** True when the user asks for reduced motion; also true during SSR. */
function usePrefersReducedMotion(): boolean {
  return React.useSyncExternalStore(
    subscribeToMotionPreference,
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    () => true,
  );
}

function dayTicks(dayCount: number): number[] {
  return [1, 5, 10, 15, 20, 25, dayCount].filter(
    (day, index, days) => day <= dayCount && days.indexOf(day) === index,
  );
}

export function SpendingPaceCard({
  pace,
  summary,
  currency,
}: SpendingPaceCardProps) {
  const summaryId = React.useId();
  const reduceMotion = usePrefersReducedMotion();
  const chart = useChart({
    data: pace.points,
    series: [
      { name: "thisMonth", label: "This month", color: THIS_MONTH_COLOR },
      {
        name: "lastMonth",
        label: "Last month",
        color: LAST_MONTH_COLOR,
        strokeDasharray: DASH,
      },
    ],
  });

  const subtitle =
    pace.scope === "budgeted"
      ? "Spending in budgeted categories, day by day"
      : "All spending, day by day";

  return (
    <Box
      mt="8"
      bg="bg.panel"
      p="6"
      borderRadius="2xl"
      shadow="md"
      border="1px solid"
      borderColor="border"
    >
      <Heading size="lg" color="fg">
        Spending Pace
      </Heading>

      {pace.isEmpty ? (
        <Box mt="6">
          <EmptyState message="No spending this month or last month yet." />
        </Box>
      ) : (
        <>
          <Text mt="2" color="fg.muted">
            {subtitle}
          </Text>

          <Text
            id={summaryId}
            mt="4"
            fontSize="sm"
            fontWeight="medium"
            color="fg"
            fontVariantNumeric="tabular-nums"
          >
            {summary}
          </Text>

          <Box mt="4" bg="bg.subtle" p={{ base: 3, md: 6 }} borderRadius="xl">
            <Box role="img" aria-labelledby={summaryId}>
              <Chart.Root chart={chart} h="260px" aspectRatio="auto">
                <ComposedChart
                  data={chart.data}
                  responsive
                  accessibilityLayer={false}
                  margin={{ top: 8, right: 8, bottom: 0, left: 0 }}
                >
                  <CartesianGrid
                    stroke={chart.color(COLORS.border)}
                    vertical={false}
                  />
                  <XAxis
                    dataKey={chart.key("day")}
                    type="number"
                    domain={[1, pace.points.length]}
                    ticks={dayTicks(pace.points.length)}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    width={56}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value: number) =>
                      formatCompactCurrency(value, currency)
                    }
                  />
                  <Tooltip
                    cursor={{ stroke: chart.color(COLORS.border) }}
                    animationDuration={reduceMotion ? 0 : 100}
                    content={
                      <Chart.Tooltip
                        labelFormatter={(day) => `Day ${day}`}
                        formatter={(value: number) =>
                          formatCurrency(value, currency)
                        }
                      />
                    }
                  />
                  {pace.budget !== null ? (
                    <ReferenceLine
                      y={pace.budget}
                      stroke={chart.color(BUDGET_COLOR)}
                      strokeDasharray={DASH}
                      ifOverflow="extendDomain"
                    />
                  ) : null}
                  <Line
                    type="stepAfter"
                    dataKey={chart.key("lastMonth")}
                    stroke={chart.color(LAST_MONTH_COLOR)}
                    strokeWidth={2}
                    strokeDasharray={DASH}
                    dot={false}
                    activeDot={false}
                    isAnimationActive={!reduceMotion}
                  />
                  <Area
                    type="stepAfter"
                    dataKey={chart.key("thisMonth")}
                    stroke={chart.color(THIS_MONTH_COLOR)}
                    strokeWidth={2}
                    fill={chart.color(THIS_MONTH_FILL)}
                    fillOpacity={1}
                    dot={false}
                    isAnimationActive={!reduceMotion}
                  />
                </ComposedChart>
              </Chart.Root>
            </Box>

            <HStack mt="4" gap="5" wrap="wrap" aria-hidden="true">
              <LegendItem color={THIS_MONTH_COLOR} label="This month" />
              <LegendItem color={LAST_MONTH_COLOR} label="Last month" dashed />
              {pace.budget !== null ? (
                <LegendItem color={BUDGET_COLOR} label="Budget" dashed />
              ) : null}
            </HStack>
          </Box>
        </>
      )}
    </Box>
  );
}

function LegendItem({
  color,
  label,
  dashed = false,
}: {
  color: string;
  label: string;
  dashed?: boolean;
}) {
  return (
    <Flex align="center" gap="2">
      <Box
        w="5"
        borderTopWidth="2px"
        borderTopStyle={dashed ? "dashed" : "solid"}
        borderColor={color}
      />
      <Text fontSize="xs" color="fg.muted">
        {label}
      </Text>
    </Flex>
  );
}
