import type { Metadata } from "next";
import { connection } from "next/server";

import { getBudgetMonth } from "@/lib/budgets";
import { getCurrentMonth, parseMonthKey } from "@/lib/month";
import { getCurrentUser } from "@/lib/session";

import { BudgetOverview } from "./components/budget-overview";

export const metadata: Metadata = {
  title: "Budget | Expense Tracker",
  description: "Set monthly budgets for each spending category.",
};

export const instant = false;

interface BudgetPageProps {
  searchParams: Promise<{ month?: string | string[] }>;
}

export default async function BudgetPage({ searchParams }: BudgetPageProps) {
  await connection();

  const user = await getCurrentUser();
  const { month: monthParam } = await searchParams;
  const requestedMonth =
    typeof monthParam === "string" ? parseMonthKey(monthParam) : null;
  const budgetMonth = await getBudgetMonth(
    user.id,
    requestedMonth ?? getCurrentMonth(),
  );

  return (
    <BudgetOverview
      budgetMonth={budgetMonth}
      isMonthRequested={requestedMonth !== null}
    />
  );
}
