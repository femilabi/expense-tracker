import type { Currency } from "@/app/dashboard/expenses/expense-form/constants/currencies";
import { getBudgetProgress, type BudgetProgress } from "@/lib/budget-math";
import { CATEGORY_OPTIONS, type Category } from "@/lib/categories";
import { getAccountCurrency } from "@/lib/expenses";
import { monthDateRange, type CalendarMonth } from "@/lib/month";
import { prisma } from "@/lib/prisma";

export interface CategoryBudget {
  category: Category;
  label: string;
  progress: BudgetProgress;
}

export interface BudgetMonth {
  month: CalendarMonth;
  currency: Currency;
  /** Every category, in the app's category order. */
  categories: CategoryBudget[];
}

export async function getBudgetMonth(
  userId: string,
  month: CalendarMonth,
): Promise<BudgetMonth> {
  const { start, end } = monthDateRange(month);

  const [currency, budgets, spending] = await Promise.all([
    getAccountCurrency(userId),
    prisma.budget.findMany({
      where: { userId, year: month.year, month: month.month },
      select: { category: true, amount: true },
    }),
    prisma.expense.groupBy({
      by: ["category"],
      where: { userId, expenseDate: { gte: start, lt: end } },
      _sum: { amount: true },
    }),
  ]);

  const budgetByCategory = new Map(
    budgets.map((budget) => [budget.category, budget.amount.toNumber()]),
  );
  const spentByCategory = new Map(
    spending.map((group) => [
      group.category,
      group._sum.amount?.toNumber() ?? 0,
    ]),
  );

  return {
    month,
    currency,
    categories: CATEGORY_OPTIONS.map((option) => ({
      category: option.value,
      label: option.label,
      progress: getBudgetProgress(
        budgetByCategory.get(option.value) ?? null,
        spentByCategory.get(option.value) ?? 0,
      ),
    })),
  };
}
