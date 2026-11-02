import {
  parseDateKey,
  summarizeExpenses,
  toLocalDateKey,
} from "@/app/expenses/utils";
import { parseIncomeDateKey, summarizeIncomes } from "@/app/income/utils";
import { CATEGORY_BY_VALUE, type Category } from "@/lib/categories";
import { resolveCurrency, toExpenseRecord } from "@/lib/expenses";
import { formatShortMonth } from "@/lib/format";
import { prisma } from "@/lib/prisma";

const TREND_MONTHS = 6;
const RECENT_LIMIT = 8;

export interface DashboardSummary {
  currency: string;
  income: number;
  incomeEntries: number;
  expenses: number;
  transactions: number;
  net: number;
  /** Net savings as a percentage of income; null when there is no income. */
  savingsRate: number | null;
}

export interface CategoryBreakdown {
  category: Category;
  label: string;
  emoji: string;
  tint: string;
  color: string;
  total: number;
  share: number;
  count: number;
}

export interface MonthlyPoint {
  key: string;
  label: string;
  income: number;
  expenses: number;
}

export interface RecentExpense {
  id: string;
  category: Category;
  label: string;
  emoji: string;
  tint: string;
  color: string;
  amount: number;
  description: string | null;
  date: Date;
}

export interface DashboardData {
  /** First day of the summarised month (UTC midnight). */
  month: Date;
  summary: DashboardSummary;
  breakdown: CategoryBreakdown[];
  trend: MonthlyPoint[];
  recentExpenses: RecentExpense[];
  topCategory: CategoryBreakdown | null;
}

function monthStart(year: number, month: number): Date {
  return new Date(Date.UTC(year, month, 1));
}

function monthKey(year: number, month: number): string {
  return `${year}-${String(month + 1).padStart(2, "0")}`;
}

function toNumber(value: { toNumber(): number } | null | undefined): number {
  return value ? value.toNumber() : 0;
}

export async function getDashboardData(
  userId: string,
  now: Date = new Date(),
): Promise<DashboardData> {
  // Use the same reference date as the Income and Expenses pages (the server's
  // local calendar date) so the "this month" figures always agree.
  const referenceKey = toLocalDateKey(now);
  const year = now.getFullYear();
  const month = now.getMonth();

  const currentMonthStart = monthStart(year, month);
  const nextMonthStart = monthStart(year, month + 1);
  const trendStart = monthStart(year, month - (TREND_MONTHS - 1));

  const [
    profile,
    monthIncomes,
    monthExpenses,
    recentExpenses,
    trendExpenses,
    trendIncomes,
  ] = await Promise.all([
    prisma.profile.findUnique({
      where: { userId },
      select: { currency: true },
    }),
    prisma.income.findMany({
      where: {
        userId,
        incomeDate: { gte: currentMonthStart, lt: nextMonthStart },
      },
      select: {
        id: true,
        amount: true,
        source: true,
        description: true,
        incomeDate: true,
      },
    }),
    prisma.expense.findMany({
      where: {
        userId,
        expenseDate: { gte: currentMonthStart, lt: nextMonthStart },
      },
      // Same ordering as the Expenses page so top-category ties resolve alike.
      orderBy: [{ expenseDate: "desc" }, { createdAt: "desc" }],
      select: {
        id: true,
        category: true,
        amount: true,
        description: true,
        expenseDate: true,
      },
    }),
    prisma.expense.findMany({
      where: { userId },
      orderBy: [{ expenseDate: "desc" }, { createdAt: "desc" }],
      take: RECENT_LIMIT,
      select: {
        id: true,
        category: true,
        amount: true,
        description: true,
        expenseDate: true,
      },
    }),
    prisma.expense.findMany({
      where: { userId, expenseDate: { gte: trendStart, lt: nextMonthStart } },
      select: { amount: true, expenseDate: true },
    }),
    prisma.income.findMany({
      where: { userId, incomeDate: { gte: trendStart, lt: nextMonthStart } },
      select: { amount: true, incomeDate: true },
    }),
  ]);

  const currency = resolveCurrency(profile?.currency);

  // Reuse the Income and Expenses page summaries so the totals can't drift.
  const incomeSummary = summarizeIncomes(
    monthIncomes.map((income) => ({
      id: income.id,
      amount: income.amount.toNumber(),
      source: income.source,
      description: income.description,
      incomeDate: income.incomeDate.toISOString().slice(0, 10),
    })),
    parseIncomeDateKey(referenceKey),
  );
  const expenseRecords = monthExpenses.map((expense) =>
    toExpenseRecord(expense, currency),
  );
  const expenseSummary = summarizeExpenses(
    expenseRecords,
    parseDateKey(referenceKey),
  );

  const income = incomeSummary.monthTotal;
  const expenses = expenseSummary.monthTotals[0]?.total ?? 0;
  const net = income - expenses;

  const categoryTotals = new Map<Category, { total: number; count: number }>();
  for (const expense of expenseRecords) {
    const entry = categoryTotals.get(expense.category) ?? {
      total: 0,
      count: 0,
    };
    entry.total += expense.amount;
    entry.count += 1;
    categoryTotals.set(expense.category, entry);
  }

  const breakdown: CategoryBreakdown[] = Array.from(
    categoryTotals,
    ([category, { total, count }]) => {
      const option = CATEGORY_BY_VALUE[category];

      return {
        category,
        label: option.label,
        emoji: option.emoji,
        tint: option.tint,
        color: option.color,
        total,
        share: expenses > 0 ? total / expenses : 0,
        count,
      };
    },
  ).sort((a, b) => b.total - a.total);

  const topCategory = expenseSummary.topCategory
    ? (breakdown.find(
        (entry) => entry.category === expenseSummary.topCategory?.category,
      ) ?? null)
    : null;

  const trend: MonthlyPoint[] = Array.from(
    { length: TREND_MONTHS },
    (_, index) => {
      const pointDate = monthStart(year, month - (TREND_MONTHS - 1) + index);

      return {
        key: monthKey(pointDate.getUTCFullYear(), pointDate.getUTCMonth()),
        label: formatShortMonth(pointDate),
        income: 0,
        expenses: 0,
      };
    },
  );

  const trendByKey = new Map(trend.map((point) => [point.key, point]));

  for (const incomeRow of trendIncomes) {
    const point = trendByKey.get(
      monthKey(
        incomeRow.incomeDate.getUTCFullYear(),
        incomeRow.incomeDate.getUTCMonth(),
      ),
    );
    if (point) {
      point.income += toNumber(incomeRow.amount);
    }
  }

  for (const expenseRow of trendExpenses) {
    const point = trendByKey.get(
      monthKey(
        expenseRow.expenseDate.getUTCFullYear(),
        expenseRow.expenseDate.getUTCMonth(),
      ),
    );
    if (point) {
      point.expenses += toNumber(expenseRow.amount);
    }
  }

  return {
    month: currentMonthStart,
    summary: {
      currency,
      income,
      incomeEntries: incomeSummary.monthCount,
      expenses,
      transactions: expenseSummary.monthCount,
      net,
      savingsRate: income > 0 ? Math.round((net / income) * 100) : null,
    },
    breakdown,
    trend,
    topCategory,
    recentExpenses: recentExpenses.map((expense) => {
      const option = CATEGORY_BY_VALUE[expense.category];

      return {
        id: expense.id,
        category: expense.category,
        label: option.label,
        emoji: option.emoji,
        tint: option.tint,
        color: option.color,
        amount: toNumber(expense.amount),
        description: expense.description,
        date: expense.expenseDate,
      };
    }),
  };
}
