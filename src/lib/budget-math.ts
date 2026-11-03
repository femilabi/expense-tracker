export interface BudgetProgress {
  /** Budgeted amount, or null when the category has no budget. */
  budget: number | null;
  spent: number;
  /** Budget minus spent; negative when over budget. */
  remaining: number | null;
  /** Unclamped share of the budget used, e.g. 120 when 20% over. */
  percentUsed: number | null;
  /** Progress bar fill, clamped to 0-100. */
  fill: number;
  isOverBudget: boolean;
}

function roundToCents(value: number): number {
  return Math.round(value * 100) / 100;
}

export function getBudgetProgress(
  budget: number | null,
  spent: number,
): BudgetProgress {
  if (budget === null || budget <= 0) {
    return {
      budget: null,
      spent,
      remaining: null,
      percentUsed: null,
      fill: 0,
      isOverBudget: false,
    };
  }

  const percentUsed = (spent / budget) * 100;

  return {
    budget,
    spent,
    remaining: roundToCents(budget - spent),
    percentUsed,
    fill: Math.min(Math.max(percentUsed, 0), 100),
    isOverBudget: spent > budget,
  };
}

export interface BudgetSummary {
  /** Totals across budgeted categories only. */
  total: BudgetProgress;
  budgetedCount: number;
  overBudgetCount: number;
  /** Spending in categories that have no budget. */
  unbudgetedSpent: number;
}

export function summarizeBudgets(
  items: readonly { progress: BudgetProgress }[],
): BudgetSummary {
  let budgeted = 0;
  let spent = 0;
  let unbudgetedSpent = 0;
  let budgetedCount = 0;
  let overBudgetCount = 0;

  for (const { progress } of items) {
    if (progress.budget === null) {
      unbudgetedSpent += progress.spent;
      continue;
    }

    budgeted += progress.budget;
    spent += progress.spent;
    budgetedCount += 1;
    if (progress.isOverBudget) {
      overBudgetCount += 1;
    }
  }

  return {
    total: getBudgetProgress(
      budgetedCount > 0 ? roundToCents(budgeted) : null,
      roundToCents(spent),
    ),
    budgetedCount,
    overBudgetCount,
    unbudgetedSpent: roundToCents(unbudgetedSpent),
  };
}

export function formatPercentUsed(percentUsed: number): string {
  return `${Math.round(percentUsed)}%`;
}

/** Budgeted items only, highest share used first. */
export function rankByPercentUsed<T extends { progress: BudgetProgress }>(
  items: readonly T[],
): T[] {
  return items
    .filter((item) => item.progress.percentUsed !== null)
    .sort(
      (a, b) => (b.progress.percentUsed ?? 0) - (a.progress.percentUsed ?? 0),
    );
}
