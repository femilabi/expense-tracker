"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/session";

import {
  budgetKeySchema,
  budgetSchema,
  type BudgetInput,
  type BudgetKeyInput,
} from "./budget-schema";
import type { BudgetActionResult } from "./types";

const SAVE_ERROR = "We couldn't save this budget. Please try again.";
const DELETE_ERROR = "We couldn't delete this budget. Please try again.";

async function getCurrentUserId(): Promise<string | null> {
  const session = await getServerSession();
  return session?.user?.id ?? null;
}

function revalidateBudgetPages() {
  revalidatePath("/budget");
  revalidatePath("/dashboard");
}

export async function saveBudget(
  values: BudgetInput,
): Promise<BudgetActionResult> {
  const userId = await getCurrentUserId();

  if (!userId) {
    return {
      success: false,
      error: "You need to be signed in to set a budget.",
    };
  }

  const parsed = budgetSchema.safeParse(values);

  if (!parsed.success) {
    return {
      success: false,
      error: "Please check the budget amount and try again.",
    };
  }

  const { category, month, amount } = parsed.data;

  try {
    await prisma.budget.upsert({
      where: {
        userId_year_month_category: {
          userId,
          year: month.year,
          month: month.month,
          category,
        },
      },
      create: {
        userId,
        year: month.year,
        month: month.month,
        category,
        amount,
      },
      update: { amount },
    });

    revalidateBudgetPages();

    return { success: true };
  } catch {
    return { success: false, error: SAVE_ERROR };
  }
}

export async function deleteBudget(
  values: BudgetKeyInput,
): Promise<BudgetActionResult> {
  const userId = await getCurrentUserId();

  if (!userId) {
    return {
      success: false,
      error: "You need to be signed in to delete a budget.",
    };
  }

  const parsed = budgetKeySchema.safeParse(values);

  if (!parsed.success) {
    return { success: false, error: "Budget not found." };
  }

  const { category, month } = parsed.data;

  try {
    const result = await prisma.budget.deleteMany({
      where: { userId, year: month.year, month: month.month, category },
    });

    if (result.count === 0) {
      return { success: false, error: "Budget not found." };
    }

    revalidateBudgetPages();

    return { success: true };
  } catch {
    return { success: false, error: DELETE_ERROR };
  }
}
