import {
  CATEGORY_OPTIONS,
  type Category,
  type CategoryOption,
} from "@/app/dashboard/expenses/expense-form/constants/categories";
import type { Currency } from "@/app/dashboard/expenses/expense-form/constants/currencies";

import type {
  ExpenseFilters,
  ExpenseRecord,
  ExpenseSummary,
  TopCategorySummary,
} from "./types";

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

export function formatCurrency(
  amount: number,
  currency: Currency = "USD",
): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(amount);
}

export function formatDate(dateKey: string): string {
  return dateFormatter.format(parseDateKey(dateKey));
}

/** Parses a YYYY-MM-DD calendar date as local midnight. */
export function parseDateKey(dateKey: string): Date {
  const [year, month, day] = dateKey.split("-").map(Number);
  return new Date(year, month - 1, day);
}

/** Converts a Date to a YYYY-MM-DD calendar date using UTC fields. */
export function toUtcDateKey(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/** Converts a Date to a YYYY-MM-DD calendar date using local fields. */
export function toLocalDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function monthsBetween(date: Date, reference: Date): number {
  return (
    (reference.getFullYear() - date.getFullYear()) * 12 +
    reference.getMonth() -
    date.getMonth()
  );
}

export function summarizeExpenses(
  expenses: ExpenseRecord[],
  referenceDate: Date,
): ExpenseSummary {
  const monthByCurrency = new Map<Currency, number>();
  const monthCategoryByCurrency = new Map<
    Currency,
    Map<Category, { total: number; count: number }>
  >();
  const lastMonthByCurrency = new Map<Currency, number>();
  const yearByCurrency = new Map<Currency, number>();
  let monthCount = 0;
  let yearCount = 0;

  const addTotal = (
    totals: Map<Currency, number>,
    currency: Currency,
    amount: number,
  ) => {
    totals.set(currency, (totals.get(currency) ?? 0) + amount);
  };

  for (const expense of expenses) {
    const date = parseDateKey(expense.expenseDate);
    const monthOffset = monthsBetween(date, referenceDate);

    if (monthOffset === 0) {
      addTotal(monthByCurrency, expense.currency, expense.amount);
      const categoryTotals =
        monthCategoryByCurrency.get(expense.currency) ??
        new Map<Category, { total: number; count: number }>();
      const categoryTotal = categoryTotals.get(expense.category) ?? {
        total: 0,
        count: 0,
      };

      categoryTotal.total += expense.amount;
      categoryTotal.count += 1;
      categoryTotals.set(expense.category, categoryTotal);
      monthCategoryByCurrency.set(expense.currency, categoryTotals);
      monthCount += 1;
    } else if (monthOffset === 1) {
      addTotal(lastMonthByCurrency, expense.currency, expense.amount);
    }

    if (date.getFullYear() === referenceDate.getFullYear()) {
      addTotal(yearByCurrency, expense.currency, expense.amount);
      yearCount += 1;
    }
  }

  const toTotals = (totals: Map<Currency, number>) =>
    Array.from(totals, ([currency, total]) => ({ currency, total }));

  const primaryMonthCurrency = monthByCurrency.keys().next().value;
  const primaryCategoryTotals = primaryMonthCurrency
    ? monthCategoryByCurrency.get(primaryMonthCurrency)
    : undefined;
  let topCategory: TopCategorySummary | null = null;

  if (primaryMonthCurrency && primaryCategoryTotals) {
    for (const [category, categoryTotal] of primaryCategoryTotals) {
      if (!topCategory || categoryTotal.total > topCategory.total) {
        topCategory = {
          category,
          currency: primaryMonthCurrency,
          total: categoryTotal.total,
          count: categoryTotal.count,
        };
      }
    }
  }

  return {
    monthTotals: toTotals(monthByCurrency),
    monthCount,
    lastMonthTotals: toTotals(lastMonthByCurrency),
    topCategory,
    yearTotals: toTotals(yearByCurrency),
    yearCount,
  };
}

export function formatPercentChange(changePercent: number): string {
  const sign = changePercent > 0 ? "+" : changePercent < 0 ? "−" : "";
  return `${sign}${Math.abs(changePercent).toFixed(1)}%`;
}

export function filterAndSortExpenses(
  expenses: ExpenseRecord[],
  filters: ExpenseFilters,
  referenceDate: Date,
): ExpenseRecord[] {
  const query = filters.search.trim().toLowerCase();

  const filtered = expenses.filter((expense) => {
    if (filters.category !== "all" && expense.category !== filters.category) {
      return false;
    }

    if (query) {
      const description = expense.description?.toLowerCase() ?? "";
      if (!description.includes(query)) {
        return false;
      }
    }

    const date = parseDateKey(expense.expenseDate);

    if (filters.dateRange === "this-month") {
      return monthsBetween(date, referenceDate) === 0;
    }

    if (filters.dateRange === "last-month") {
      return monthsBetween(date, referenceDate) === 1;
    }

    if (filters.dateRange === "this-year") {
      return date.getFullYear() === referenceDate.getFullYear();
    }

    return true;
  });

  return filtered.sort((a, b) => {
    switch (filters.sort) {
      case "date-asc":
        return a.expenseDate.localeCompare(b.expenseDate);
      case "amount-desc":
        return b.amount - a.amount;
      case "amount-asc":
        return a.amount - b.amount;
      case "date-desc":
      default:
        return b.expenseDate.localeCompare(a.expenseDate);
    }
  });
}

const categoryByValue = new Map<Category, CategoryOption>(
  CATEGORY_OPTIONS.map((option) => [option.value, option]),
);

export function getCategoryOption(category: Category): CategoryOption {
  return (
    categoryByValue.get(category) ??
    CATEGORY_OPTIONS[CATEGORY_OPTIONS.length - 1]
  );
}
