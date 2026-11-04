import type { BudgetSummary as BudgetSummaryData } from "@/lib/budget-math";
import { formatPercentUsed } from "@/lib/budget-math";
import { formatCurrency } from "@/lib/format";

import { COLORS } from "@/components/shared/colors";
import {
  SummaryMetrics,
  type SummaryMetric,
} from "@/components/shared/summary-metrics";

interface BudgetSummaryProps {
  summary: BudgetSummaryData;
  currency: string;
}

function pluralize(count: number, singular: string, plural: string): string {
  return `${count} ${count === 1 ? singular : plural}`;
}

export function BudgetSummary({ summary, currency }: BudgetSummaryProps) {
  const { total, budgetedCount, overBudgetCount, unbudgetedSpent } = summary;
  const hasBudgets = total.budget !== null;
  const remaining = total.remaining ?? 0;

  const metrics: SummaryMetric[] = [
    {
      label: "Budgeted",
      value: formatCurrency(total.budget ?? 0, currency),
      caption: hasBudgets
        ? `Across ${pluralize(budgetedCount, "category", "categories")}`
        : "No budgets set this month",
      emphasis: true,
    },
    {
      label: "Spent",
      value: formatCurrency(total.spent, currency),
      caption:
        unbudgetedSpent > 0
          ? `+ ${formatCurrency(unbudgetedSpent, currency)} in categories without a budget`
          : "In budgeted categories",
    },
    {
      label: "Remaining",
      value: hasBudgets ? formatCurrency(Math.abs(remaining), currency) : "—",
      caption: !hasBudgets
        ? "Set a budget to track what's left"
        : total.isOverBudget
          ? "Over budget"
          : "Left to spend this month",
      valueColor: total.isOverBudget ? COLORS.danger : undefined,
    },
    {
      label: "Used",
      value:
        total.percentUsed === null ? "—" : formatPercentUsed(total.percentUsed),
      caption: !hasBudgets
        ? "Of your monthly budget"
        : overBudgetCount > 0
          ? `${pluralize(overBudgetCount, "category", "categories")} over budget`
          : "All categories within budget",
      valueColor: total.isOverBudget
        ? COLORS.danger
        : hasBudgets
          ? COLORS.text
          : COLORS.muted,
      comparison: true,
    },
  ];

  return <SummaryMetrics metrics={metrics} />;
}
