"use client";

import * as React from "react";
import { Chart, useChart } from "@chakra-ui/charts";
import { Box, HStack, Stack, Text } from "@chakra-ui/react";
import {
  Area,
  CartesianGrid,
  ComposedChart,
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

import { AnimatedNumber } from "@/components/shared/animated-number";
import { CSS_COLORS, cssTint } from "@/components/shared/colors";
import { TrendUpIcon } from "@/components/shared/icons";
import { glassPillStyles } from "@/components/shared/styles";
import { usePrefersReducedMotion } from "@/components/shared/use-prefers-reduced-motion";

import { DashboardCard, DashboardCardHeader } from "./dashboard-card";
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

/**
 * Every colour on this card comes from the variables in globals.css. Pill and
 * chip text stays in --foreground: the lighter status colours are too faint
 * for small text, so they colour the tint, dot and lines instead.
 */
const STATUS_STYLES: Record<
  SpendingStatus,
  { line: string; pillBg: string; label: string }
> = {
  under: {
    line: CSS_COLORS.success,
    pillBg: cssTint(CSS_COLORS.success),
    label: "Under budget",
  },
  over: {
    line: CSS_COLORS.danger,
    pillBg: cssTint(CSS_COLORS.danger),
    label: "Over budget",
  },
  none: {
    line: CSS_COLORS.secondary,
    pillBg: cssTint(CSS_COLORS.muted),
    label: "No budget set",
  },
};

const BUDGET_COLOR = CSS_COLORS.muted;

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

  // Only this month is drawn, so the axis stops at this month's last day.
  const chart = useChart({
    data: pace.points.slice(0, labels.daysInMonth),
    series: [{ name: "thisMonth", label: "This month", color: styles.line }],
  });

  const today = pace.points.findLast((point) => point.thisMonth !== null);
  const remaining =
    pace.budget === null
      ? null
      : (Math.round(pace.budget * 100) - Math.round(pace.spentSoFar * 100)) /
        100;
  const animate = !reduceMotion;

  return (
    <DashboardCard index={0} aria-labelledby={`${id}-title`}>
      <DashboardCardHeader
        title="Your spending this month"
        titleId={`${id}-title`}
        icon={<TrendUpIcon />}
        action={
          !pace.isEmpty ? (
            <Text as="span" {...glassPillStyles} bg={styles.pillBg}>
              <Box
                as="span"
                boxSize="2"
                borderRadius="full"
                bg={styles.line}
                aria-hidden="true"
              />
              {styles.label}
            </Text>
          ) : null
        }
      />

      {pace.isEmpty ? (
        <Box mt="5">
          <EmptyState
            message="No spending this month or last month yet."
            icon={<TrendUpIcon size={22} />}
          />
        </Box>
      ) : (
        <>
          <Box id={figureId} mt="5">
            <Text
              fontSize={{ base: "4xl", md: "5xl" }}
              fontWeight="bold"
              lineHeight="1"
              letterSpacing="-0.03em"
              color={CSS_COLORS.foreground}
              fontVariantNumeric="tabular-nums"
            >
              <AnimatedNumber value={pace.spentSoFar} format={format} />
            </Text>
            <Text
              mt="2"
              fontSize="sm"
              color={CSS_COLORS.muted}
              fontVariantNumeric="tabular-nums"
            >
              {pace.budget === null
                ? "spent so far"
                : `of ${format(pace.budget)} budget`}
            </Text>
          </Box>

          <HStack mt="4" gap="2" wrap="wrap">
            {remaining !== null ? (
              remaining < 0 ? (
                <StatChip bg={cssTint(CSS_COLORS.danger)}>
                  {format(-remaining)} over
                </StatChip>
              ) : (
                <StatChip bg={CSS_COLORS.background}>
                  {format(remaining)} left
                </StatChip>
              )
            ) : null}
            {comparison ? (
              comparison.direction === "same" ? (
                <StatChip bg={CSS_COLORS.background}>
                  Same as last month
                </StatChip>
              ) : (
                <StatChip
                  bg={cssTint(
                    comparison.direction === "less"
                      ? CSS_COLORS.success
                      : CSS_COLORS.warning,
                    18,
                  )}
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
            lineHeight="1.6"
            color={CSS_COLORS.foreground}
            fontVariantNumeric="tabular-nums"
          >
            {summary}
          </Text>

          <Box mt="5" role="img" aria-labelledby={`${figureId} ${summaryId}`}>
            <Chart.Root
              chart={chart}
              h={{ base: "220px", md: "280px" }}
              aspectRatio="auto"
              css={{
                "& .recharts-cartesian-axis-tick-value": { fontSize: "11px" },
                // Soft glow under this month's line.
                "& .recharts-area-curve": {
                  filter: `drop-shadow(0 6px 10px ${cssTint(styles.line, 35)})`,
                },
              }}
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
                      { offset: "0%", color: styles.line, opacity: 0.32 },
                      { offset: "55%", color: styles.line, opacity: 0.1 },
                      { offset: "100%", color: styles.line, opacity: 0 },
                    ]}
                  />
                </defs>
                <CartesianGrid
                  stroke={CSS_COLORS.border}
                  strokeDasharray="3 5"
                  vertical={false}
                />
                <XAxis
                  dataKey={chart.key("day")}
                  type="number"
                  domain={[1, labels.daysInMonth]}
                  ticks={[1, 10, 20, labels.daysInMonth]}
                  tickFormatter={(day: number) =>
                    day === 1 ? `${labels.thisMonth} 1` : String(day)
                  }
                  tick={{ fill: CSS_COLORS.muted }}
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                />
                <YAxis
                  width={48}
                  tickCount={4}
                  tick={{ fill: CSS_COLORS.muted }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value: number) =>
                    formatCompactCurrency(value, currency)
                  }
                />
                <Tooltip
                  cursor={{
                    stroke: cssTint(styles.line, 55),
                    strokeWidth: 1,
                    strokeDasharray: "3 3",
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
                    stroke={BUDGET_COLOR}
                    strokeDasharray="4 4"
                    strokeWidth={1}
                    ifOverflow="extendDomain"
                    label={(props) => (
                      <BudgetLabel
                        viewBox={props.viewBox}
                        text={`Budget ${formatWholeCurrency(pace.budget ?? 0, currency)}`}
                        fill={CSS_COLORS.card}
                        stroke={CSS_COLORS.border}
                        textColor={CSS_COLORS.foreground}
                      />
                    )}
                  />
                ) : null}
                <Area
                  type="monotone"
                  dataKey={chart.key("thisMonth")}
                  stroke={styles.line}
                  strokeWidth={3}
                  fill={`url(#${gradientId})`}
                  dot={false}
                  activeDot={{
                    r: 5,
                    fill: styles.line,
                    stroke: CSS_COLORS.card,
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
                        color={styles.line}
                        ring={CSS_COLORS.card}
                        textColor={CSS_COLORS.foreground}
                        pulse={animate}
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
        </>
      )}
    </DashboardCard>
  );
}

function StatChip({ bg, children }: { bg: string; children: React.ReactNode }) {
  return (
    <Text as="span" {...glassPillStyles} fontWeight="medium" bg={bg}>
      {children}
    </Text>
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
      px="3.5"
      py="2.5"
      bg={`color-mix(in srgb, ${CSS_COLORS.card} 92%, transparent)`}
      backdropFilter="blur(12px)"
      borderWidth="1px"
      borderColor={CSS_COLORS.border}
      borderRadius="xl"
      boxShadow="glass"
      fontSize="xs"
      fontVariantNumeric="tabular-nums"
    >
      {point.thisMonth !== null ? (
        <Text color={CSS_COLORS.foreground}>
          <Text as="span" fontWeight="semibold">
            {labels.thisMonth} {point.day}:
          </Text>{" "}
          You&apos;d spent {formatCurrency(point.thisMonth, currency)} so far.
        </Text>
      ) : null}
      {point.lastMonth !== null ? (
        <Text color={CSS_COLORS.muted}>
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
  stroke,
  textColor,
}: {
  viewBox?: ChartViewBox;
  text: string;
  fill: string;
  stroke: string;
  textColor: string;
}) {
  if (viewBox?.x === undefined || viewBox.y === undefined) {
    return null;
  }

  const width = text.length * 6.4 + 18;
  const height = 22;
  const right = viewBox.x + (viewBox.width ?? 0);

  return (
    <g>
      <rect
        x={right - width}
        y={viewBox.y - height - 4}
        width={width}
        height={height}
        rx={11}
        fill={fill}
        stroke={stroke}
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

/**
 * Today's point: a glowing dot with today's amount above it. With motion on,
 * a soft ring pulses out three times after the line has drawn in.
 */
function TodayMarker({
  cx,
  cy,
  color,
  ring,
  textColor,
  label,
  pulse,
}: {
  cx?: number;
  cy?: number;
  color: string;
  ring: string;
  textColor: string;
  label: string;
  pulse: boolean;
}) {
  if (cx === undefined || cy === undefined) {
    return <g />;
  }

  return (
    <g>
      {pulse ? (
        <circle
          cx={cx}
          cy={cy}
          r={8}
          fill={color}
          style={{
            transformBox: "fill-box",
            transformOrigin: "center",
            opacity: 0,
            animation: "today-pulse 1.6s ease-out 0.9s 3",
          }}
        />
      ) : null}
      <circle cx={cx} cy={cy} r={12} fill={color} fillOpacity={0.16} />
      <circle cx={cx} cy={cy} r={8} fill={color} fillOpacity={0.24} />
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
        y={cy - 18}
        textAnchor="middle"
        fontSize={12}
        fontWeight={700}
        fill={textColor}
        // A card-coloured outline keeps the label legible over the line.
        stroke={ring}
        strokeWidth={4}
        paintOrder="stroke"
        strokeLinejoin="round"
      >
        {label}
      </text>
    </g>
  );
}
