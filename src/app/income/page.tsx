import type { Metadata } from "next";
import { connection } from "next/server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";

import { IncomeHistory } from "./components/income-history";
import { toIncomeDateKey } from "./utils";

export const metadata: Metadata = {
  title: "Income | Expense Tracker",
  description: "Review, search, and filter your income records.",
};

export const instant = false;

export default async function IncomePage() {
  await connection();
  const user = await getCurrentUser();
  const [incomeRows, profile] = await Promise.all([
    prisma.income.findMany({
      where: { userId: user.id },
      orderBy: [{ incomeDate: "desc" }, { createdAt: "desc" }],
      select: {
        id: true,
        amount: true,
        source: true,
        description: true,
        incomeDate: true,
      },
    }),
    prisma.profile.findUnique({
      where: { userId: user.id },
      select: { currency: true },
    }),
  ]);

  const incomes = incomeRows.map((income) => ({
    id: income.id,
    amount: income.amount.toNumber(),
    source: income.source,
    description: income.description,
    incomeDate: income.incomeDate.toISOString().slice(0, 10),
  }));

  return (
    <IncomeHistory
      referenceDate={toIncomeDateKey(new Date())}
      initialIncomes={incomes}
      currency={profile?.currency ?? "USD"}
    />
  );
}
