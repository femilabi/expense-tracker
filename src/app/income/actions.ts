"use server";

import { revalidatePath } from "next/cache";

import { incomeSchema } from "./income-schema";
import type { IncomeRecord } from "./types";
import { getCurrentUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";

function parseIncomeInput(input: unknown) {
  const result = incomeSchema.safeParse(input);
  if (!result.success) {
    throw new Error(
      result.error.issues[0]?.message ?? "Invalid income details.",
    );
  }

  return result.data;
}

function toIncomeDate(dateKey: string): Date {
  return new Date(`${dateKey}T00:00:00.000Z`);
}

function toIncomeDateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function toIncomeRecord(income: {
  id: string;
  amount: { toNumber(): number };
  source: string | null;
  description: string | null;
  incomeDate: Date;
}): IncomeRecord {
  return {
    id: income.id,
    amount: income.amount.toNumber(),
    source: income.source,
    description: income.description,
    incomeDate: toIncomeDateKey(income.incomeDate),
  };
}

export async function createIncome(input: unknown): Promise<IncomeRecord> {
  const user = await getCurrentUser();
  const values = parseIncomeInput(input);
  const income = await prisma.income.create({
    data: {
      userId: user.id,
      amount: values.amount,
      source: values.source,
      description: values.description,
      incomeDate: toIncomeDate(values.incomeDate),
    },
    select: {
      id: true,
      amount: true,
      source: true,
      description: true,
      incomeDate: true,
    },
  });

  revalidatePath("/income");
  revalidatePath("/dashboard");
  return toIncomeRecord(income);
}

export async function updateIncome(
  id: unknown,
  input: unknown,
): Promise<IncomeRecord> {
  const user = await getCurrentUser();
  if (typeof id !== "string" || id.trim() === "") {
    throw new Error("Invalid income ID.");
  }
  const values = parseIncomeInput(input);
  const result = await prisma.income.updateMany({
    where: { id, userId: user.id },
    data: {
      amount: values.amount,
      source: values.source,
      description: values.description,
      incomeDate: toIncomeDate(values.incomeDate),
    },
  });

  if (result.count !== 1) {
    throw new Error("Income record not found.");
  }

  revalidatePath("/income");
  revalidatePath("/dashboard");
  return {
    id,
    amount: Number(values.amount),
    source: values.source,
    description: values.description,
    incomeDate: values.incomeDate,
  };
}

export async function deleteIncome(id: unknown): Promise<void> {
  const user = await getCurrentUser();
  if (typeof id !== "string" || id.trim() === "") {
    throw new Error("Invalid income ID.");
  }

  const result = await prisma.income.deleteMany({
    where: { id, userId: user.id },
  });

  if (result.count !== 1) {
    throw new Error("Income record not found.");
  }

  revalidatePath("/income");
  revalidatePath("/dashboard");
}
