import { Box, SimpleGrid, Text } from "@chakra-ui/react";

import type { CurrencyTotal, ExpenseSummary } from "@/app/expenses/types";
import {
  formatCurrency,
  formatPercentChange,
  getCategoryOption,
} from "@/app/expenses/utils";

import { COLORS } from "@/components/shared/colors";
import { metaLabelStyles, surfaceStyles } from "@/components/shared/styles";

interface SummaryOverviewProps {
  summary: ExpenseSummary;
}

export interface SummaryMetric {
  label: string;
  value: string;
  caption: string;
  valueColor?: string;
  emphasis?: boolean;
  comparison?: boolean;
}

function formatOtherTotals(totals: CurrencyTotal[]): string {
  return totals
    .map((entry) => formatCurrency(entry.total, entry.currency))
    .join(" · ");
}

export function SummaryOverview({ summary }: SummaryOverviewProps) {
  const primaryMonth = summary.monthTotals[0];
  const primaryYear = summary.yearTotals[0];
  const comparisonCurrency =
    primaryMonth?.currency ?? summary.lastMonthTotals[0]?.currency;
  const currentComparisonTotal = comparisonCurrency
    ? (summary.monthTotals.find(
        (entry) => entry.currency === comparisonCurrency,
      )?.total ?? 0)
    : 0;
  const previousComparisonTotal = comparisonCurrency
    ? (summary.lastMonthTotals.find(
        (entry) => entry.currency === comparisonCurrency,
      )?.total ?? 0)
    : 0;
  const change =
    comparisonCurrency && previousComparisonTotal > 0
      ? ((currentComparisonTotal - previousComparisonTotal) /
          previousComparisonTotal) *
        100
      : null;
  const monthOthers = summary.monthTotals.slice(1);
  const yearOthers = summary.yearTotals.slice(1);
  const hasOtherMonthCurrencies = monthOthers.length > 0;
  const hasOtherComparisonCurrencies =
    hasOtherMonthCurrencies || summary.lastMonthTotals.length > 1;

  const monthCaption = `${summary.monthCount} expense${
    summary.monthCount === 1 ? "" : "s"
  }${hasOtherMonthCurrencies ? ` · also ${formatOtherTotals(monthOthers)}` : ""}`;
  const yearCaption = `${summary.yearCount} expense${
    summary.yearCount === 1 ? "" : "s"
  } this year${
    yearOthers.length > 0 ? ` · also ${formatOtherTotals(yearOthers)}` : ""
  }`;
  const comparisonCaption = comparisonCurrency
    ? previousComparisonTotal > 0
      ? `${comparisonCurrency} · vs. ${formatCurrency(
          previousComparisonTotal,
          comparisonCurrency,
        )} last month${
          hasOtherComparisonCurrencies ? ` · ${comparisonCurrency} only` : ""
        }`
      : `No ${comparisonCurrency} spending last month.`
    : "No spending recorded yet.";
  const topCategoryCaption = summary.topCategory
    ? `${formatCurrency(
        summary.topCategory.total,
        summary.topCategory.currency,
      )} · ${summary.topCategory.count} expense${
        summary.topCategory.count === 1 ? "" : "s"
      }${hasOtherMonthCurrencies ? ` · ${summary.topCategory.currency} only` : ""}`
    : "No spending this month.";
  const topCategoryLabel = summary.topCategory
    ? getCategoryOption(summary.topCategory.category).label
    : "—";

  const metrics: SummaryMetric[] = [
    {
      label: "This month",
      value: formatCurrency(
        primaryMonth?.total ?? 0,
        primaryMonth?.currency ?? "USD",
      ),
      caption: monthCaption,
      emphasis: true,
    },
    {
      label: "Top category",
      value: topCategoryLabel,
      caption: topCategoryCaption,
    },
    {
      label: "Month vs last month",
      value: change === null ? "—" : formatPercentChange(change),
      caption: comparisonCaption,
      valueColor:
        change === null
          ? COLORS.muted
          : change > 0
            ? COLORS.danger
            : change < 0
              ? COLORS.success
              : COLORS.muted,
      comparison: true,
    },
    {
      label: "Year to date",
      value: formatCurrency(
        primaryYear?.total ?? 0,
        primaryYear?.currency ?? "USD",
      ),
      caption: yearCaption,
    },
  ];

  return <SummaryMetrics metrics={metrics} />;
}

/** Four-up summary card row shared by the Expenses page and the dashboard. */
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
