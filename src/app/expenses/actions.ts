"use server";

import { revalidatePath } from "next/cache";

import {
  expenseSchema,
  type ExpenseInput,
} from "@/app/expenses/expense-form/expense-schema";
import type {
  ExpenseActionResult,
  ExpenseDeleteResult,
} from "@/app/expenses/types";
import { getAccountCurrency, toExpenseRecord } from "@/lib/expenses";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/session";

const EXPENSE_SELECT = {
  id: true,
  category: true,
  amount: true,
  description: true,
  expenseDate: true,
} as const;

const SAVE_ERROR = "We couldn't save this expense. Please try again.";
const DELETE_ERROR = "We couldn't delete this expense. Please try again.";

function toExpenseDate(value: string): Date {
  return new Date(`${value}T00:00:00.000Z`);
}

async function getCurrentUserId(): Promise<string | null> {
  const session = await getServerSession();
  return session?.user?.id ?? null;
}

function revalidateExpensePages() {
  revalidatePath("/expenses");
  revalidatePath("/expenses/[id]", "page");
  revalidatePath("/dashboard");
}

export async function createExpense(
  values: ExpenseInput,
): Promise<ExpenseActionResult> {
  const userId = await getCurrentUserId();

  if (!userId) {
    return {
      success: false,
      error: "You need to be signed in to add an expense.",
    };
  }

  const parsed = expenseSchema.safeParse(values);

  if (!parsed.success) {
    return {
      success: false,
      error: "Please check the expense details and try again.",
    };
  }

  try {
    const currency = await getAccountCurrency(userId);
    const expense = await prisma.expense.create({
      data: {
        userId,
        category: parsed.data.category,
        amount: parsed.data.amount,
        description: parsed.data.description,
        expenseDate: toExpenseDate(parsed.data.expenseDate),
      },
      select: EXPENSE_SELECT,
    });

    revalidateExpensePages();

    return {
      success: true,
      expense: toExpenseRecord(expense, currency),
    };
  } catch {
    return { success: false, error: SAVE_ERROR };
  }
}

export async function updateExpense(
  expenseId: string,
  values: ExpenseInput,
): Promise<ExpenseActionResult> {
  const userId = await getCurrentUserId();

  if (!userId) {
    return {
      success: false,
      error: "You need to be signed in to update an expense.",
    };
  }

  const parsed = expenseSchema.safeParse(values);

  if (!parsed.success) {
    return {
      success: false,
      error: "Please check the expense details and try again.",
    };
  }

  try {
    const existingExpense = await prisma.expense.findFirst({
      where: { id: expenseId, userId },
      select: { id: true },
    });

    if (!existingExpense) {
      return { success: false, error: "Expense not found." };
    }

    const currency = await getAccountCurrency(userId);
    const expense = await prisma.expense.update({
      where: { id: existingExpense.id },
      data: {
        category: parsed.data.category,
        amount: parsed.data.amount,
        description: parsed.data.description,
        expenseDate: toExpenseDate(parsed.data.expenseDate),
      },
      select: EXPENSE_SELECT,
    });

    revalidateExpensePages();

    return {
      success: true,
      expense: toExpenseRecord(expense, currency),
    };
  } catch {
    return { success: false, error: SAVE_ERROR };
  }
}

export async function deleteExpense(
  expenseId: string,
): Promise<ExpenseDeleteResult> {
  const userId = await getCurrentUserId();

  if (!userId) {
    return {
      success: false,
      error: "You need to be signed in to delete an expense.",
    };
  }

  try {
    const result = await prisma.expense.deleteMany({
      where: { id: expenseId, userId },
    });

    if (result.count === 0) {
      return { success: false, error: "Expense not found." };
    }

    revalidateExpensePages();

    return { success: true };
  } catch {
    return { success: false, error: DELETE_ERROR };
  }
}
