"use client";

import * as React from "react";
import { Chart, useChart } from "@chakra-ui/charts";
import { Box, Flex, Heading, HStack, Stack, Text } from "@chakra-ui/react";
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  ReferenceDot,
  ReferenceLine,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import {
  formatCompactCurrency,
  formatCurrency,
  formatWholeCurrency,
} from "@/lib/format";
import {
  getLastMonthComparison,
  getSpendingStatus,
  type SpendingPace,
  type SpendingPacePoint,
  type SpendingStatus,
} from "@/lib/spending-pace";

import { COLORS } from "@/components/shared/colors";

import { EmptyState } from "./empty-state";

export interface SpendingPaceLabels {
  /** Short month names, e.g. "Nov" and "Oct". */
  thisMonth: string;
  lastMonth: string;
  daysInMonth: number;
}

interface SpendingPaceCardProps {
  pace: SpendingPace;
  summary: string;
  labels: SpendingPaceLabels;
  currency: string;
}

/** Line colour, pill tint and pill text for each status. */
const STATUS_STYLES: Record<
  SpendingStatus,
  { line: string; pillBg: string; pillText: string; label: string }
> = {
  under: {
    line: COLORS.success,
    pillBg: COLORS.successSurface,
    pillText: "success.hover",
    label: "Under budget",
  },
  over: {
    line: COLORS.danger,
    pillBg: COLORS.dangerSurface,
    pillText: "danger.hover",
    label: "Over budget",
  },
  none: {
    line: COLORS.primary,
    pillBg: COLORS.raisedHover,
    pillText: COLORS.muted,
    label: "No budget set",
  },
};

const LAST_MONTH_COLOR = COLORS.muted;
const BUDGET_COLOR = COLORS.muted;

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

export function SpendingPaceCard({
  pace,
  summary,
  labels,
  currency,
}: SpendingPaceCardProps) {
  const id = React.useId();
  const reduceMotion = usePrefersReducedMotion();
  const status = getSpendingStatus(pace);
  const comparison = getLastMonthComparison(pace);
  const styles = STATUS_STYLES[status];
  const format = (amount: number) => formatCurrency(amount, currency);

  const figureId = `${id}-figure`;
  const summaryId = `${id}-summary`;
  // useId contains colons, which aren't safe inside an SVG url(#...) reference.
  const gradientId = `pace-fill-${id.replace(/[^a-zA-Z0-9-]/g, "")}`;

  const chart = useChart({
    data: pace.points,
    series: [
      { name: "thisMonth", label: "This month", color: styles.line },
      { name: "lastMonth", label: "Last month", color: LAST_MONTH_COLOR },
    ],
  });

  const today = pace.points.findLast((point) => point.thisMonth !== null);
  const remaining =
    pace.budget === null
      ? null
      : (Math.round(pace.budget * 100) - Math.round(pace.spentSoFar * 100)) /
        100;
  const animate = !reduceMotion;

  return (
    <Box
      as="section"
      aria-labelledby={`${id}-title`}
      mt="8"
      bg="bg.panel"
      p="6"
      borderRadius="2xl"
      shadow="md"
      border="1px solid"
      borderColor="border"
    >
      <Flex justify="space-between" align="center" gap="3" wrap="wrap">
        <Heading id={`${id}-title`} size="lg" color="fg">
          Your spending this month
        </Heading>
        {!pace.isEmpty ? (
          <Text
            as="span"
            px="3"
            py="1"
            borderRadius="full"
            bg={styles.pillBg}
            color={styles.pillText}
            fontSize="sm"
            fontWeight="semibold"
            whiteSpace="nowrap"
          >
            {styles.label}
          </Text>
        ) : null}
      </Flex>

      {pace.isEmpty ? (
        <Box mt="6">
          <EmptyState message="No spending this month or last month yet." />
        </Box>
      ) : (
        <>
          <Box id={figureId} mt="5">
            <Text
              fontSize={{ base: "3xl", md: "4xl" }}
              fontWeight="bold"
              lineHeight="1.1"
              color="fg"
              fontVariantNumeric="tabular-nums"
            >
              {format(pace.spentSoFar)}
            </Text>
            <Text mt="1" color="fg.muted" fontVariantNumeric="tabular-nums">
              {pace.budget === null
                ? "spent so far"
                : `of ${format(pace.budget)} budget`}
            </Text>
          </Box>

          <HStack mt="4" gap="2" wrap="wrap">
            {remaining !== null ? (
              remaining < 0 ? (
                <StatChip bg={COLORS.dangerSurface} color="danger.hover">
                  {format(-remaining)} over
                </StatChip>
              ) : (
                <StatChip bg={COLORS.raised} color="fg">
                  {format(remaining)} left
                </StatChip>
              )
            ) : null}
            {comparison ? (
              comparison.direction === "same" ? (
                <StatChip bg={COLORS.raised} color="fg">
                  Same as last month
                </StatChip>
              ) : (
                <StatChip
                  bg={
                    comparison.direction === "less"
                      ? COLORS.successSurface
                      : COLORS.accentSurface
                  }
                  color={
                    comparison.direction === "less"
                      ? "success.hover"
                      : "accent.fg"
                  }
                >
                  <span aria-hidden="true">
                    {comparison.direction === "less" ? "↓" : "↑"}{" "}
                    {format(comparison.amount)} vs last month
                  </span>
                  <Text as="span" srOnly>
                    {format(comparison.amount)} {comparison.direction} than last
                    month
                  </Text>
                </StatChip>
              )
            ) : null}
          </HStack>

          <Text
            id={summaryId}
            mt="4"
            color="fg"
            fontVariantNumeric="tabular-nums"
          >
            {summary}
          </Text>

          <Box mt="5" role="img" aria-labelledby={`${figureId} ${summaryId}`}>
            <Chart.Root
              chart={chart}
              h={{ base: "220px", md: "280px" }}
              aspectRatio="auto"
            >
              <ComposedChart
                data={chart.data}
                responsive
                accessibilityLayer={false}
                margin={{ top: 24, right: 12, bottom: 0, left: 0 }}
              >
                <defs>
                  <Chart.Gradient
                    id={gradientId}
                    stops={[
                      { offset: "0%", color: styles.line, opacity: 0.25 },
                      { offset: "100%", color: styles.line, opacity: 0 },
                    ]}
                  />
                </defs>
                <CartesianGrid
                  stroke={chart.color(COLORS.border)}
                  strokeOpacity={0.7}
                  vertical={false}
                />
                <XAxis
                  dataKey={chart.key("day")}
                  type="number"
                  domain={[1, pace.points.length]}
                  ticks={[1, 10, 20, labels.daysInMonth]}
                  tickFormatter={(day: number) =>
                    day === 1 ? `${labels.thisMonth} 1` : String(day)
                  }
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                />
                <YAxis
                  width={48}
                  tickCount={4}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value: number) =>
                    formatCompactCurrency(value, currency)
                  }
                />
                <Tooltip
                  cursor={{
                    stroke: chart.color(COLORS.borderStrong),
                    strokeWidth: 1,
                  }}
                  animationDuration={animate ? 150 : 0}
                  content={(props) => (
                    <PaceTooltip
                      active={props.active}
                      payload={props.payload}
                      labels={labels}
                      currency={currency}
                    />
                  )}
                />
                {pace.budget !== null ? (
                  <ReferenceLine
                    y={pace.budget}
                    stroke={chart.color(BUDGET_COLOR)}
                    strokeDasharray="4 4"
                    strokeWidth={1}
                    ifOverflow="extendDomain"
                    label={(props) => (
                      <BudgetLabel
                        viewBox={props.viewBox}
                        text={`Budget ${formatWholeCurrency(pace.budget ?? 0, currency)}`}
                        fill={chart.color(COLORS.raisedHover)}
                        textColor={chart.color(COLORS.text)}
                      />
                    )}
                  />
                ) : null}
                <Line
                  type="monotone"
                  dataKey={chart.key("lastMonth")}
                  stroke={chart.color(LAST_MONTH_COLOR)}
                  strokeWidth={1.5}
                  dot={false}
                  activeDot={{
                    r: 4,
                    fill: chart.color(LAST_MONTH_COLOR),
                    stroke: chart.color(COLORS.card),
                    strokeWidth: 2,
                  }}
                  isAnimationActive={animate}
                  animationDuration={800}
                />
                <Area
                  type="monotone"
                  dataKey={chart.key("thisMonth")}
                  stroke={chart.color(styles.line)}
                  strokeWidth={3}
                  fill={`url(#${gradientId})`}
                  dot={false}
                  activeDot={{
                    r: 5,
                    fill: chart.color(styles.line),
                    stroke: chart.color(COLORS.card),
                    strokeWidth: 2,
                  }}
                  isAnimationActive={animate}
                  animationDuration={800}
                />
                {today && today.thisMonth !== null ? (
                  <ReferenceDot
                    x={today.day}
                    y={today.thisMonth}
                    ifOverflow="extendDomain"
                    shape={(props: { cx?: number; cy?: number }) => (
                      <TodayMarker
                        cx={props.cx}
                        cy={props.cy}
                        color={chart.color(styles.line)}
                        ring={chart.color(COLORS.card)}
                        textColor={chart.color(COLORS.text)}
                        label={formatWholeCurrency(
                          today.thisMonth ?? 0,
                          currency,
                        )}
                      />
                    )}
                  />
                ) : null}
              </ComposedChart>
            </Chart.Root>
          </Box>

          <HStack mt="3" gap="4" wrap="wrap" aria-hidden="true">
            <LegendDot color={styles.line} label="This month" />
            <LegendDot color={LAST_MONTH_COLOR} label="Last month" />
          </HStack>
        </>
      )}
    </Box>
  );
}

function StatChip({
  bg,
  color,
  children,
}: {
  bg: string;
  color: string;
  children: React.ReactNode;
}) {
  return (
    <Text
      as="span"
      px="3"
      py="1.5"
      borderRadius="lg"
      bg={bg}
      color={color}
      fontSize="sm"
      fontWeight="medium"
      fontVariantNumeric="tabular-nums"
    >
      {children}
    </Text>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <Flex align="center" gap="2">
      <Box boxSize="2.5" borderRadius="full" bg={color} />
      <Text fontSize="xs" color="fg.muted">
        {label}
      </Text>
    </Flex>
  );
}

interface PaceTooltipProps {
  active?: boolean;
  payload?: ReadonlyArray<{ payload?: unknown }>;
  labels: SpendingPaceLabels;
  currency: string;
}

function PaceTooltip({ active, payload, labels, currency }: PaceTooltipProps) {
  const point = payload?.[0]?.payload as SpendingPacePoint | undefined;

  if (!active || !point) {
    return null;
  }

  return (
    <Stack
      gap="1"
      maxW="15rem"
      px="3"
      py="2"
      bg="bg.panel"
      borderWidth="1px"
      borderColor="border"
      borderRadius="lg"
      shadow="md"
      fontSize="xs"
      fontVariantNumeric="tabular-nums"
    >
      {point.thisMonth !== null ? (
        <Text color="fg">
          <Text as="span" fontWeight="semibold">
            {labels.thisMonth} {point.day}:
          </Text>{" "}
          You&apos;d spent {formatCurrency(point.thisMonth, currency)} so far.
        </Text>
      ) : null}
      {point.lastMonth !== null ? (
        <Text color="fg.muted">
          Last month by {labels.lastMonth} {point.day}:{" "}
          {formatCurrency(point.lastMonth, currency)}.
        </Text>
      ) : null}
    </Stack>
  );
}

interface ChartViewBox {
  x?: number;
  y?: number;
  width?: number;
}

/** Rounded "Budget $1,200" tag at the right end of the budget line. */
function BudgetLabel({
  viewBox,
  text,
  fill,
  textColor,
}: {
  viewBox?: ChartViewBox;
  text: string;
  fill: string;
  textColor: string;
}) {
  if (viewBox?.x === undefined || viewBox.y === undefined) {
    return null;
  }

  const width = text.length * 6.4 + 16;
  const height = 20;
  const right = viewBox.x + (viewBox.width ?? 0);

  return (
    <g>
      <rect
        x={right - width}
        y={viewBox.y - height - 4}
        width={width}
        height={height}
        rx={10}
        fill={fill}
      />
      <text
        x={right - width / 2}
        y={viewBox.y - 4 - height / 2}
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={11}
        fontWeight={600}
        fill={textColor}
      >
        {text}
      </text>
    </g>
  );
}

/** Today's point: a dot with a soft halo and today's amount above it. */
function TodayMarker({
  cx,
  cy,
  color,
  ring,
  textColor,
  label,
}: {
  cx?: number;
  cy?: number;
  color: string;
  ring: string;
  textColor: string;
  label: string;
}) {
  if (cx === undefined || cy === undefined) {
    return <g />;
  }

  return (
    <g>
      <circle cx={cx} cy={cy} r={11} fill={color} fillOpacity={0.2} />
      <circle
        cx={cx}
        cy={cy}
        r={5}
        fill={color}
        stroke={ring}
        strokeWidth={2}
      />
      <text
        x={cx}
        y={cy - 16}
        textAnchor="middle"
        fontSize={12}
        fontWeight={700}
        fill={textColor}
      >
        {label}
      </text>
    </g>
  );
}
