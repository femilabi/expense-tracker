import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";

import { getUserExpense } from "@/lib/expenses";
import { getCurrentUser } from "@/lib/session";

import {
  ExpenseEditor,
  ExpenseEditorLoading,
  ExpenseNotFound,
} from "../components/expense-editor";

export const metadata: Metadata = {
  title: "Expense | Expense Tracker",
  description: "View or edit a saved expense.",
};

export const instant = false;

interface ExpenseDetailContentProps {
  params: PageProps<"/expenses/[id]">["params"];
}

async function ExpenseDetailContent({ params }: ExpenseDetailContentProps) {
  await connection();

  const user = await getCurrentUser();
  const { id } = await params;
  const { expense } = await getUserExpense(user.id, id);

  if (!expense) {
    return <ExpenseNotFound />;
  }

  return <ExpenseEditor key={id} expense={expense} />;
}

export default function ExpenseDetailPage({
  params,
}: PageProps<"/expenses/[id]">) {
  return (
    <Suspense fallback={<ExpenseEditorLoading />}>
      <ExpenseDetailContent params={params} />
    </Suspense>
  );
}
