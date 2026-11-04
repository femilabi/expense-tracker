import { describe, expect, it } from "vitest";

import {
  mergeRecentTransactions,
  type RecentExpenseRow,
  type RecentIncomeRow,
} from "@/lib/recent-transactions";

function expense(
  id: string,
  date: string,
  overrides: Partial<RecentExpenseRow> = {},
): RecentExpenseRow {
  return {
    id,
    category: "FOOD",
    amount: 10,
    description: `Expense ${id}`,
    expenseDate: new Date(`${date}T00:00:00.000Z`),
    createdAt: new Date(`${date}T12:00:00.000Z`),
    ...overrides,
  };
}

function income(
  id: string,
  date: string,
  overrides: Partial<RecentIncomeRow> = {},
): RecentIncomeRow {
  return {
    id,
    amount: 100,
    description: `Income ${id}`,
    incomeDate: new Date(`${date}T00:00:00.000Z`),
    createdAt: new Date(`${date}T12:00:00.000Z`),
    ...overrides,
  };
}

const ids = (list: { id: string }[]) => list.map((item) => item.id);

describe("mergeRecentTransactions", () => {
  it("returns an empty list when there are no transactions", () => {
    expect(mergeRecentTransactions([], [])).toEqual([]);
  });

  it("interleaves expenses and income newest first", () => {
    const result = mergeRecentTransactions(
      [expense("e1", "2026-11-03"), expense("e2", "2026-10-28")],
      [income("i1", "2026-11-01"), income("i2", "2026-10-30")],
    );

    expect(ids(result)).toEqual(["e1", "i1", "i2", "e2"]);
  });

  it("breaks ties on the same date by creation time", () => {
    const result = mergeRecentTransactions(
      [
        expense("early", "2026-11-03", {
          createdAt: new Date("2026-11-03T08:00:00.000Z"),
        }),
        expense("late", "2026-11-03", {
          createdAt: new Date("2026-11-03T18:00:00.000Z"),
        }),
      ],
      [
        income("middle", "2026-11-03", {
          createdAt: new Date("2026-11-03T12:00:00.000Z"),
        }),
      ],
    );

    expect(ids(result)).toEqual(["late", "middle", "early"]);
  });

  it("orders by transaction date before creation time", () => {
    const result = mergeRecentTransactions(
      [
        // Entered later, but for an earlier date.
        expense("backdated", "2026-10-01", {
          createdAt: new Date("2026-11-04T09:00:00.000Z"),
        }),
      ],
      [income("current", "2026-11-02")],
    );

    expect(ids(result)).toEqual(["current", "backdated"]);
  });

  it("returns everything when there are fewer than five", () => {
    const result = mergeRecentTransactions(
      [expense("e1", "2026-11-03")],
      [income("i1", "2026-11-02")],
    );

    expect(result).toHaveLength(2);
  });

  it("returns all five when there are exactly five", () => {
    const result = mergeRecentTransactions(
      [
        expense("e1", "2026-11-05"),
        expense("e2", "2026-11-03"),
        expense("e3", "2026-11-01"),
      ],
      [income("i1", "2026-11-04"), income("i2", "2026-11-02")],
    );

    expect(ids(result)).toEqual(["e1", "i1", "e2", "i2", "e3"]);
  });

  it("keeps only the five most recent when there are more", () => {
    const expenses = ["01", "03", "05", "07", "09"].map((day) =>
      expense(`e${day}`, `2026-11-${day}`),
    );
    const incomes = ["02", "04", "06", "08", "10"].map((day) =>
      income(`i${day}`, `2026-11-${day}`),
    );

    const result = mergeRecentTransactions(expenses, incomes);

    expect(ids(result)).toEqual(["i10", "e09", "i08", "e07", "i06"]);
  });

  it("maps each record to the row shown on the card", () => {
    const [expenseRow, incomeRow] = mergeRecentTransactions(
      [
        expense("e1", "2026-11-03", {
          category: "TRANSPORT",
          amount: 12.5,
          description: "Bus pass",
        }),
      ],
      [income("i1", "2026-11-02", { amount: 2500, description: "Salary" })],
    );

    expect(expenseRow).toEqual({
      id: "e1",
      kind: "expense",
      title: "Bus pass",
      label: "Transport",
      amount: 12.5,
      date: new Date("2026-11-03T00:00:00.000Z"),
      href: "/expenses/e1",
    });
    expect(incomeRow).toEqual({
      id: "i1",
      kind: "income",
      title: "Salary",
      label: "Income",
      amount: 2500,
      date: new Date("2026-11-02T00:00:00.000Z"),
      href: "/income",
    });
  });

  it("falls back to the category label or 'Income' without a description", () => {
    const result = mergeRecentTransactions(
      [expense("e1", "2026-11-03", { category: "RENT", description: null })],
      [income("i1", "2026-11-02", { description: "  " })],
    );

    expect(result.map((item) => item.title)).toEqual(["Rent", "Income"]);
  });

  it("does not modify its inputs", () => {
    const expenses = [expense("e1", "2026-11-01"), expense("e2", "2026-11-03")];

    mergeRecentTransactions(expenses, []);

    expect(ids(expenses)).toEqual(["e1", "e2"]);
  });
});
