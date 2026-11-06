export interface IncomeRecord {
  id: string;
  amount: number;
  source: string | null;
  description: string | null;
  /** Calendar date in YYYY-MM-DD format. */
  incomeDate: string;
}

export type DateRangeFilter = "all" | "this-month" | "last-month" | "this-year";

export type SortOption =
  "date-desc" | "date-asc" | "amount-desc" | "amount-asc";

export interface IncomeFilters {
  search: string;
  dateRange: DateRangeFilter;
  sort: SortOption;
}

export interface IncomeSummary {
  monthTotal: number;
  monthCount: number;
  lastMonthTotal: number;
  yearTotal: number;
  lifetimeTotal: number;
  lifetimeCount: number;
}
