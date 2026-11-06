import type { Category } from "@/app/dashboard/expenses/expense-form/constants/categories";
import type { Currency } from "@/app/dashboard/expenses/expense-form/constants/currencies";

export interface ExpenseRecord {
  id: string;
  description: string | null;
  category: Category;
  amount: number;
  currency: Currency;
  /** Calendar date in YYYY-MM-DD format. */
  expenseDate: string;
}

export type ExpenseActionResult =
  { success: true; expense: ExpenseRecord } | { success: false; error: string };

export type ExpenseDeleteResult =
  { success: true } | { success: false; error: string };

export type CategoryFilter = Category | "all";

export type DateRangeFilter = "all" | "this-month" | "last-month" | "this-year";

export type SortOption =
  "date-desc" | "date-asc" | "amount-desc" | "amount-asc";

export interface ExpenseFilters {
  search: string;
  category: CategoryFilter;
  dateRange: DateRangeFilter;
  sort: SortOption;
}

export interface CurrencyTotal {
  currency: Currency;
  total: number;
}

export interface TopCategorySummary {
  category: Category;
  currency: Currency;
  total: number;
  count: number;
}

export interface ExpenseSummary {
  monthTotals: CurrencyTotal[];
  monthCount: number;
  lastMonthTotals: CurrencyTotal[];
  topCategory: TopCategorySummary | null;
  yearTotals: CurrencyTotal[];
  yearCount: number;
}
