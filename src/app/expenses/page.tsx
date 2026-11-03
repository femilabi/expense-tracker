import type { Metadata } from "next";
import { connection } from "next/server";

import { getUserExpenses } from "@/lib/expenses";
import { getCurrentUser } from "@/lib/session";

import { ExpensesHistory } from "./components/expenses-history";
import { toLocalDateKey } from "./utils";

export const metadata: Metadata = {
  title: "Expenses | Expense Tracker",
  description: "Review, search, and filter your saved expenses.",
};

export const instant = false;

export default async function ExpensesPage() {
  await connection();

  const user = await getCurrentUser();
  const { expenses } = await getUserExpenses(user.id);
  const now = new Date();

  return (
    <ExpensesHistory
      referenceDate={toLocalDateKey(now)}
      initialExpenses={expenses}
    />
  );
}
