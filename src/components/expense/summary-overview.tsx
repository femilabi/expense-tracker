import type { CurrencyTotal, ExpenseSummary } from "@/app/expenses/types";
import {
  formatCurrency,
  formatPercentChange,
  getCategoryOption,
} from "@/app/expenses/utils";

import { COLORS } from "@/components/shared/colors";
import {
  SummaryMetrics,
  type SummaryMetric,
} from "@/components/shared/summary-metrics";

interface SummaryOverviewProps {
  summary: ExpenseSummary;
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
