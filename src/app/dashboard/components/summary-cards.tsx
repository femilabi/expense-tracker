import {
  SummaryMetrics,
  type SummaryMetric,
} from "@/components/expense/summary-overview";
import { COLORS } from "@/components/shared/colors";
import type { CategoryBreakdown, DashboardSummary } from "@/lib/dashboard";
import { formatCurrency } from "@/lib/format";

interface SummaryCardsProps {
  summary: DashboardSummary;
  topCategory: CategoryBreakdown | null;
}

export function SummaryCards({ summary, topCategory }: SummaryCardsProps) {
  const metrics: SummaryMetric[] = [
    {
      label: "Income",
      value: formatCurrency(summary.income, summary.currency),
      caption: `${summary.incomeEntries} income ${
        summary.incomeEntries === 1 ? "entry" : "entries"
      }`,
    },
    {
      label: "Expenses",
      value: formatCurrency(summary.expenses, summary.currency),
      caption: `${summary.transactions} transaction${
        summary.transactions === 1 ? "" : "s"
      } logged`,
    },
    {
      label: "Net savings",
      value: formatCurrency(summary.net, summary.currency),
      caption:
        summary.savingsRate === null
          ? "—"
          : `${summary.savingsRate}% savings rate`,
      valueColor: summary.net >= 0 ? COLORS.success : COLORS.danger,
      comparison: true,
    },
    {
      label: "Top spending category",
      value: topCategory ? topCategory.label : "—",
      caption: topCategory
        ? `${formatCurrency(topCategory.total, summary.currency)} · ${Math.round(
            topCategory.share * 100,
          )}% of expenses`
        : "—",
    },
  ];

  return <SummaryMetrics metrics={metrics} />;
}
