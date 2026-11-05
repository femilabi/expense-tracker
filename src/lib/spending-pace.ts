import type { BudgetProgress } from "@/lib/budget-math";
import type { Category } from "@/lib/categories";
import { formatCurrency } from "@/lib/format";
import { shiftMonth, type CalendarMonth } from "@/lib/month";

/** Spending on one calendar date (UTC midnight) in one category. */
export interface DailySpend {
  date: Date;
  category: Category;
  amount: number;
}

export interface PaceBudget {
  categories: readonly Category[];
  total: number;
}

export interface SpendingPacePoint {
  day: number;
  /** Running total through this day; null after today. */
  thisMonth: number | null;
  /** Running total through this day; null past the end of last month. */
  lastMonth: number | null;
}

export interface SpendingPace {
  /** Budgeted categories when budgets exist, otherwise all spending. */
  scope: "budgeted" | "all";
  /** Total budget for the month; null when no budgets are set. */
  budget: number | null;
  points: SpendingPacePoint[];
  /** Spending up to and including today. */
  spentSoFar: number;
  /** Last month's spending up to the same day of the month. */
  lastMonthSoFar: number;
  lastMonthTotal: number;
  /** Nothing to plot: no spending so far this month or at all last month. */
  isEmpty: boolean;
}

interface BuildSpendingPaceInput {
  month: CalendarMonth;
  /** Today's day of the month (1-31). */
  today: number;
  thisMonth: readonly DailySpend[];
  lastMonth: readonly DailySpend[];
  budget: PaceBudget | null;
}

function daysInMonth({ year, month }: CalendarMonth): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

/** Budgeted categories and their total, or null when nothing is budgeted. */
export function getPaceBudget(
  categories: readonly { category: Category; progress: BudgetProgress }[],
): PaceBudget | null {
  const budgeted = categories.filter((item) => item.progress.budget !== null);

  if (budgeted.length === 0) {
    return null;
  }

  const totalCents = budgeted.reduce(
    (sum, item) => sum + Math.round((item.progress.budget ?? 0) * 100),
    0,
  );

  return {
    categories: budgeted.map((item) => item.category),
    total: totalCents / 100,
  };
}

/** Running totals by day of the month, summed in cents to avoid drift. */
function runningTotals(
  spends: readonly DailySpend[],
  dayCount: number,
  includes: (category: Category) => boolean,
): number[] {
  const centsByDay = new Array<number>(dayCount).fill(0);

  for (const spend of spends) {
    const day = spend.date.getUTCDate();
    if (day <= dayCount && includes(spend.category)) {
      centsByDay[day - 1] += Math.round(spend.amount * 100);
    }
  }

  let runningCents = 0;
  return centsByDay.map((cents) => {
    runningCents += cents;
    return runningCents / 100;
  });
}

export function buildSpendingPace({
  month,
  today,
  thisMonth,
  lastMonth,
  budget,
}: BuildSpendingPaceInput): SpendingPace {
  const thisMonthDays = daysInMonth(month);
  const lastMonthDays = daysInMonth(shiftMonth(month, -1));
  const todayDay = Math.min(Math.max(today, 1), thisMonthDays);

  const budgeted = budget ? new Set(budget.categories) : null;
  const includes = (category: Category) =>
    budgeted ? budgeted.has(category) : true;

  const thisTotals = runningTotals(thisMonth, thisMonthDays, includes);
  const lastTotals = runningTotals(lastMonth, lastMonthDays, includes);

  const points: SpendingPacePoint[] = Array.from(
    { length: Math.max(thisMonthDays, lastMonthDays) },
    (_, index) => ({
      day: index + 1,
      thisMonth: index < todayDay ? thisTotals[index] : null,
      lastMonth: index < lastMonthDays ? lastTotals[index] : null,
    }),
  );

  const spentSoFar = thisTotals[todayDay - 1];
  const lastMonthTotal = lastTotals[lastMonthDays - 1];

  return {
    scope: budget ? "budgeted" : "all",
    budget: budget?.total ?? null,
    points,
    spentSoFar,
    lastMonthSoFar: lastTotals[Math.min(todayDay, lastMonthDays) - 1],
    lastMonthTotal,
    isEmpty: spentSoFar === 0 && lastMonthTotal === 0,
  };
}

export type SpendingStatus = "under" | "over" | "none";

/** "Over" only once spending actually exceeds the budget. */
export function getSpendingStatus(pace: SpendingPace): SpendingStatus {
  if (pace.budget === null) {
    return "none";
  }

  return Math.round(pace.spentSoFar * 100) > Math.round(pace.budget * 100)
    ? "over"
    : "under";
}

export interface LastMonthComparison {
  direction: "more" | "less" | "same";
  /** Absolute difference, in currency units. */
  amount: number;
}

/** Spending so far against the same point last month; null with nothing to compare. */
export function getLastMonthComparison(
  pace: SpendingPace,
): LastMonthComparison | null {
  if (pace.lastMonthTotal === 0) {
    return null;
  }

  const differenceCents =
    Math.round(pace.spentSoFar * 100) - Math.round(pace.lastMonthSoFar * 100);

  return {
    direction:
      differenceCents > 0 ? "more" : differenceCents < 0 ? "less" : "same",
    amount: Math.abs(differenceCents) / 100,
  };
}

/** Plain-language sentence under the key figure; also the chart's label. */
export function describeSpendingPace(
  pace: SpendingPace,
  currency: string,
): string {
  const format = (amount: number) => formatCurrency(amount, currency);
  const comparison = getLastMonthComparison(pace);

  if (pace.spentSoFar === 0) {
    const nothingYet =
      pace.scope === "budgeted"
        ? "You haven't spent anything in budgeted categories yet this month."
        : "You haven't spent anything yet this month.";

    return comparison && pace.lastMonthSoFar > 0
      ? `${nothingYet} By this point last month you'd spent ${format(pace.lastMonthSoFar)}.`
      : nothingYet;
  }

  if (comparison) {
    return comparison.direction === "same"
      ? "You've spent the same as at this point last month."
      : `You've spent ${format(comparison.amount)} ${comparison.direction} than at this point last month.`;
  }

  if (pace.budget === null) {
    return "There's no spending from last month to compare with yet.";
  }

  const leftCents =
    Math.round(pace.budget * 100) - Math.round(pace.spentSoFar * 100);

  return leftCents < 0
    ? `You're ${format(-leftCents / 100)} over your budget this month.`
    : `You have ${format(leftCents / 100)} left to spend this month.`;
}
