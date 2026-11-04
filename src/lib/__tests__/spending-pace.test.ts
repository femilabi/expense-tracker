import { describe, expect, it } from "vitest";

import { getBudgetProgress, summarizeBudgets } from "@/lib/budget-math";
import type { Category } from "@/lib/categories";
import {
  buildSpendingPace,
  describeSpendingPace,
  getPaceBudget,
  type DailySpend,
  type PaceBudget,
  type SpendingPace,
} from "@/lib/spending-pace";

const NOVEMBER = { year: 2026, month: 11 };

function spend(date: string, amount: number, category: Category = "FOOD") {
  return {
    date: new Date(`${date}T00:00:00.000Z`),
    category,
    amount,
  } satisfies DailySpend;
}

function pace(
  overrides: Partial<Parameters<typeof buildSpendingPace>[0]> = {},
): SpendingPace {
  return buildSpendingPace({
    month: NOVEMBER,
    today: 10,
    thisMonth: [],
    lastMonth: [],
    budget: null,
    ...overrides,
  });
}

const valuesFor = (
  result: SpendingPace,
  key: "thisMonth" | "lastMonth",
  days: number[],
) => days.map((day) => result.points[day - 1][key]);

describe("buildSpendingPace", () => {
  it("builds running totals, adding up spending on the same day", () => {
    const result = pace({
      thisMonth: [
        spend("2026-11-02", 10),
        spend("2026-11-02", 5.5),
        spend("2026-11-05", 20),
      ],
    });

    expect(valuesFor(result, "thisMonth", [1, 2, 3, 4, 5, 6])).toEqual([
      0, 15.5, 15.5, 15.5, 35.5, 35.5,
    ]);
    expect(result.spentSoFar).toBe(35.5);
  });

  it("sums in cents so totals don't drift", () => {
    const result = pace({
      thisMonth: [spend("2026-11-01", 0.1), spend("2026-11-01", 0.2)],
    });

    expect(result.spentSoFar).toBe(0.3);
  });

  it("stops this month's line at today and draws last month in full", () => {
    const result = pace({
      today: 10,
      thisMonth: [spend("2026-11-03", 40)],
      lastMonth: [spend("2026-10-31", 25)],
    });

    expect(result.points[9].thisMonth).toBe(40);
    expect(result.points[10].thisMonth).toBeNull();
    expect(result.points[30].lastMonth).toBe(25);
  });

  it("counts 'so far' up to and including today, not future-dated expenses", () => {
    const result = pace({
      today: 10,
      thisMonth: [spend("2026-11-10", 30), spend("2026-11-20", 500)],
    });

    expect(result.spentSoFar).toBe(30);
  });

  it("compares with last month on the same day of the month", () => {
    const result = pace({
      today: 10,
      lastMonth: [spend("2026-10-04", 60), spend("2026-10-15", 90)],
    });

    expect(result.lastMonthSoFar).toBe(60);
    expect(result.lastMonthTotal).toBe(150);
  });

  it("spans the longer month when last month has 31 days", () => {
    // October has 31 days, November 30.
    const result = pace({ lastMonth: [spend("2026-10-31", 12)] });

    expect(result.points).toHaveLength(31);
    expect(result.points[30]).toEqual({
      day: 31,
      thisMonth: null,
      lastMonth: 12,
    });
  });

  it("caps the comparison at last month's final day", () => {
    const result = pace({
      month: { year: 2027, month: 3 },
      today: 31,
      lastMonth: [spend("2027-02-28", 80)],
    });

    expect(result.points).toHaveLength(31);
    expect(result.points[27].lastMonth).toBe(80);
    expect(result.points[28].lastMonth).toBeNull();
    expect(result.lastMonthSoFar).toBe(80);
  });

  it("compares January with the previous December", () => {
    const result = pace({
      month: { year: 2027, month: 1 },
      today: 5,
      lastMonth: [spend("2026-12-31", 45)],
    });

    expect(result.points).toHaveLength(31);
    expect(result.points[30].lastMonth).toBe(45);
  });

  it("counts only budgeted categories when budgets exist", () => {
    const budget: PaceBudget = { categories: ["FOOD", "RENT"], total: 1200 };
    const result = pace({
      budget,
      thisMonth: [
        spend("2026-11-01", 800, "RENT"),
        spend("2026-11-02", 50, "FOOD"),
        spend("2026-11-03", 70, "SHOPPING"),
      ],
      lastMonth: [spend("2026-10-02", 30, "SHOPPING")],
    });

    expect(result.scope).toBe("budgeted");
    expect(result.budget).toBe(1200);
    expect(result.spentSoFar).toBe(850);
    expect(result.lastMonthTotal).toBe(0);
  });

  it("counts all spending and has no budget line without budgets", () => {
    const result = pace({
      thisMonth: [
        spend("2026-11-01", 800, "RENT"),
        spend("2026-11-03", 70, "SHOPPING"),
      ],
    });

    expect(result.scope).toBe("all");
    expect(result.budget).toBeNull();
    expect(result.spentSoFar).toBe(870);
  });

  it("matches the Budget progress card's spent total by month end", () => {
    const categories = [
      {
        category: "FOOD" as const,
        progress: getBudgetProgress(300, 120.4),
      },
      {
        category: "RENT" as const,
        progress: getBudgetProgress(900, 900),
      },
      {
        category: "SHOPPING" as const,
        progress: getBudgetProgress(null, 70),
      },
    ];
    const result = pace({
      today: 30,
      budget: getPaceBudget(categories),
      thisMonth: [
        spend("2026-11-01", 900, "RENT"),
        spend("2026-11-08", 100, "FOOD"),
        spend("2026-11-21", 20.4, "FOOD"),
        spend("2026-11-22", 70, "SHOPPING"),
      ],
    });
    const { total } = summarizeBudgets(categories);

    expect(result.spentSoFar).toBe(total.spent);
    expect(result.budget).toBe(total.budget);
  });

  it("is empty when neither month has any spending", () => {
    expect(pace().isEmpty).toBe(true);
  });

  it("is empty when the only spending is outside the budgeted categories", () => {
    const result = pace({
      budget: { categories: ["FOOD"], total: 200 },
      thisMonth: [spend("2026-11-02", 40, "SHOPPING")],
      lastMonth: [spend("2026-10-02", 40, "SHOPPING")],
    });

    expect(result.isEmpty).toBe(true);
  });

  it("is not empty when only last month has spending", () => {
    expect(pace({ lastMonth: [spend("2026-10-20", 10)] }).isEmpty).toBe(false);
  });
});

describe("getPaceBudget", () => {
  it("returns the budgeted categories and their total", () => {
    expect(
      getPaceBudget([
        { category: "FOOD", progress: getBudgetProgress(100.1, 0) },
        { category: "RENT", progress: getBudgetProgress(200.2, 0) },
        { category: "SHOPPING", progress: getBudgetProgress(null, 40) },
      ]),
    ).toEqual({ categories: ["FOOD", "RENT"], total: 300.3 });
  });

  it("returns null when nothing is budgeted", () => {
    expect(
      getPaceBudget([
        { category: "FOOD", progress: getBudgetProgress(null, 5) },
      ]),
    ).toBeNull();
  });
});

describe("describeSpendingPace", () => {
  const budget: PaceBudget = { categories: ["FOOD"], total: 1200 };

  it("reports spending against the budget and less than last month", () => {
    const result = pace({
      budget,
      thisMonth: [spend("2026-11-05", 470)],
      lastMonth: [spend("2026-10-03", 530), spend("2026-10-25", 300)],
    });

    expect(describeSpendingPace(result, "USD")).toBe(
      "You've spent $470.00 of $1,200.00 so far, $60.00 less than at this point last month.",
    );
  });

  it("reports more than last month", () => {
    const result = pace({
      thisMonth: [spend("2026-11-05", 200)],
      lastMonth: [spend("2026-10-05", 150)],
    });

    expect(describeSpendingPace(result, "USD")).toBe(
      "You've spent $200.00 so far this month, $50.00 more than at this point last month.",
    );
  });

  it("reports the same as last month", () => {
    const result = pace({
      thisMonth: [spend("2026-11-05", 99.99)],
      lastMonth: [spend("2026-10-01", 99.99)],
    });

    expect(describeSpendingPace(result, "USD")).toBe(
      "You've spent $99.99 so far this month, the same as at this point last month.",
    );
  });

  it("leaves out the comparison when last month had no spending", () => {
    const result = pace({ budget, thisMonth: [spend("2026-11-05", 470)] });

    expect(describeSpendingPace(result, "USD")).toBe(
      "You've spent $470.00 of $1,200.00 so far.",
    );
  });

  it("shows the real amount when over budget", () => {
    const result = pace({
      budget,
      thisMonth: [spend("2026-11-05", 1350)],
    });

    expect(describeSpendingPace(result, "USD")).toBe(
      "You've spent $1,350.00 of $1,200.00 so far.",
    );
  });

  it("says when nothing has been spent yet this month", () => {
    const result = pace({ lastMonth: [spend("2026-10-04", 120)] });

    expect(describeSpendingPace(result, "USD")).toBe(
      "You haven't spent anything yet this month. By this point last month you'd spent $120.00.",
    );
  });

  it("names budgeted categories when nothing budgeted has been spent", () => {
    const result = pace({
      budget,
      thisMonth: [spend("2026-11-02", 30, "SHOPPING")],
      lastMonth: [spend("2026-10-28", 50)],
    });

    expect(describeSpendingPace(result, "USD")).toBe(
      "You haven't spent anything in budgeted categories yet this month.",
    );
  });

  it("formats with the profile currency", () => {
    const result = pace({ thisMonth: [spend("2026-11-01", 15)] });

    expect(describeSpendingPace(result, "EUR")).toBe(
      "You've spent €15.00 so far this month.",
    );
  });
});
