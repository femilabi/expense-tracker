import { CATEGORY_BY_VALUE, type Category } from "@/lib/categories";

export const RECENT_TRANSACTION_LIMIT = 5;

export interface RecentExpenseRow {
  id: string;
  category: Category;
  amount: number;
  description: string | null;
  expenseDate: Date;
  createdAt: Date;
}

export interface RecentIncomeRow {
  id: string;
  amount: number;
  description: string | null;
  incomeDate: Date;
  createdAt: Date;
}

export interface RecentTransaction {
  id: string;
  kind: "expense" | "income";
  title: string;
  /** Category label for expenses, "Income" for income. */
  label: string;
  amount: number;
  /** Calendar date (UTC midnight), as entered on the record. */
  date: Date;
  href: string;
}

interface SortableTransaction {
  transaction: RecentTransaction;
  createdAt: Date;
}

function titleOrFallback(description: string | null, fallback: string) {
  const trimmed = description?.trim();
  return trimmed ? trimmed : fallback;
}

/**
 * Merges the latest expenses and income into one list, newest first by
 * transaction date, then by creation time for entries on the same date.
 */
export function mergeRecentTransactions(
  expenses: RecentExpenseRow[],
  incomes: RecentIncomeRow[],
  limit: number = RECENT_TRANSACTION_LIMIT,
): RecentTransaction[] {
  const items: SortableTransaction[] = [
    ...expenses.map((expense) => {
      const label = CATEGORY_BY_VALUE[expense.category].label;

      return {
        createdAt: expense.createdAt,
        transaction: {
          id: expense.id,
          kind: "expense" as const,
          title: titleOrFallback(expense.description, label),
          label,
          amount: expense.amount,
          date: expense.expenseDate,
          href: `/expenses/${expense.id}`,
        },
      };
    }),
    ...incomes.map((income) => ({
      createdAt: income.createdAt,
      transaction: {
        id: income.id,
        kind: "income" as const,
        title: titleOrFallback(income.description, "Income"),
        label: "Income",
        amount: income.amount,
        date: income.incomeDate,
        href: "/income",
      },
    })),
  ];

  return items
    .sort(
      (a, b) =>
        b.transaction.date.getTime() - a.transaction.date.getTime() ||
        b.createdAt.getTime() - a.createdAt.getTime(),
    )
    .slice(0, limit)
    .map((item) => item.transaction);
}
