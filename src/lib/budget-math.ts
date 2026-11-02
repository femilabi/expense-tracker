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
