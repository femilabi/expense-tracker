import {
  isCurrency,
  type Currency,
} from "@/app/expenses/expense-form/constants/currencies";
import type { ExpenseRecord } from "@/app/expenses/types";
import { toUtcDateKey } from "@/app/expenses/utils";
import { prisma } from "@/lib/prisma";

const EXPENSE_SELECT = {
  id: true,
  category: true,
  amount: true,
  description: true,
  expenseDate: true,
} as const;

interface ExpenseRow {
  id: string;
  category: ExpenseRecord["category"];
  amount: { toNumber(): number };
  description: string | null;
  expenseDate: Date;
}

export function resolveCurrency(value: string | null | undefined): Currency {
  return isCurrency(value) ? value : "USD";
}

export function toExpenseRecord(
  expense: ExpenseRow,
  currency: Currency,
): ExpenseRecord {
  return {
    id: expense.id,
    category: expense.category,
    amount: expense.amount.toNumber(),
    description: expense.description,
    currency,
    expenseDate: toUtcDateKey(expense.expenseDate),
  };
}

export async function getAccountCurrency(userId: string): Promise<Currency> {
  const profile = await prisma.profile.findUnique({
    where: { userId },
    select: { currency: true },
  });

  return resolveCurrency(profile?.currency);
}

export interface ExpensesPageData {
  expenses: ExpenseRecord[];
  currency: Currency;
}

export async function getUserExpenses(
  userId: string,
): Promise<ExpensesPageData> {
  const [profile, expenses] = await Promise.all([
    prisma.profile.findUnique({
      where: { userId },
      select: { currency: true },
    }),
    prisma.expense.findMany({
      where: { userId },
      orderBy: [{ expenseDate: "desc" }, { createdAt: "desc" }],
      select: EXPENSE_SELECT,
    }),
  ]);

  const currency = resolveCurrency(profile?.currency);

  return {
    expenses: expenses.map((expense) => toExpenseRecord(expense, currency)),
    currency,
  };
}

export interface ExpenseDetailData {
  expense: ExpenseRecord | null;
  currency: Currency;
}

export async function getUserExpense(
  userId: string,
  expenseId: string,
): Promise<ExpenseDetailData> {
  const [profile, expense] = await Promise.all([
    prisma.profile.findUnique({
      where: { userId },
      select: { currency: true },
    }),
    prisma.expense.findFirst({
      where: { id: expenseId, userId },
      select: EXPENSE_SELECT,
    }),
  ]);

  const currency = resolveCurrency(profile?.currency);

  return {
    expense: expense ? toExpenseRecord(expense, currency) : null,
    currency,
  };
}
