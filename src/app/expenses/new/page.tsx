import type { Metadata } from "next";
import { connection } from "next/server";


import { ExpenseEditor } from "../components/expense-editor";

export const metadata: Metadata = {
  title: "Add expense | Expense Tracker",
  description: "Record a new expense.",
};

export const instant = false;

export default async function NewExpensePage() {
  await connection();

  return <ExpenseEditor />;
}
