import { describe, expect, it } from "vitest";

import {
  formatPercentUsed,
  getBudgetProgress,
  rankByPercentUsed,
  summarizeBudgets,
} from "@/lib/budget-math";
import {
  monthDateRange,
  parseMonthKey,
  shiftMonth,
  toMonthKey,
} from "@/lib/month";

describe("getBudgetProgress", () => {
  it("reports the share used and the amount left", () => {
    expect(getBudgetProgress(100, 30)).toEqual({
      budget: 100,
      spent: 30,
      remaining: 70,
      percentUsed: 30,
      fill: 30,
      isOverBudget: false,
    });
  });

  it("is not over budget when spending matches the budget exactly", () => {
    const progress = getBudgetProgress(250, 250);

    expect(progress.percentUsed).toBe(100);
    expect(progress.fill).toBe(100);
    expect(progress.remaining).toBe(0);
    expect(progress.isOverBudget).toBe(false);
  });

  it("keeps the real percentage but caps the bar when over budget", () => {
    const progress = getBudgetProgress(100, 120);

    expect(progress.percentUsed).toBe(120);
    expect(progress.fill).toBe(100);
    expect(progress.remaining).toBe(-20);
    expect(progress.isOverBudget).toBe(true);
  });

  it("handles a budget with nothing spent", () => {
    const progress = getBudgetProgress(80, 0);

    expect(progress.percentUsed).toBe(0);
    expect(progress.fill).toBe(0);
    expect(progress.remaining).toBe(80);
  });

  it("rounds the remaining amount to cents", () => {
    expect(getBudgetProgress(100, 30.1).remaining).toBe(69.9);
  });

  it.each([null, 0])("treats a %s budget as no budget set", (budget) => {
    expect(getBudgetProgress(budget, 45)).toEqual({
      budget: null,
      spent: 45,
      remaining: null,
      percentUsed: null,
      fill: 0,
      isOverBudget: false,
    });
  });
});

describe("formatPercentUsed", () => {
  it("rounds to a whole percentage", () => {
    expect(formatPercentUsed(30)).toBe("30%");
    expect(formatPercentUsed(33.333)).toBe("33%");
    expect(formatPercentUsed(119.6)).toBe("120%");
  });
});

describe("rankByPercentUsed", () => {
  const item = (name: string, budget: number | null, spent: number) => ({
    name,
    progress: getBudgetProgress(budget, spent),
  });

  it("orders budgeted items by share used and drops unbudgeted ones", () => {
    const ranked = rankByPercentUsed([
      item("food", 100, 30),
      item("rent", null, 900),
      item("transport", 50, 60),
      item("health", 200, 150),
    ]);

    expect(ranked.map((entry) => entry.name)).toEqual([
      "transport",
      "health",
      "food",
    ]);
  });

  it("does not reorder the input", () => {
    const items = [item("food", 100, 10), item("transport", 100, 90)];

    rankByPercentUsed(items);

    expect(items.map((entry) => entry.name)).toEqual(["food", "transport"]);
  });
});

describe("month helpers", () => {
  it("parses and formats month keys", () => {
    expect(parseMonthKey("2026-11")).toEqual({ year: 2026, month: 11 });
    expect(toMonthKey({ year: 2026, month: 3 })).toBe("2026-03");
  });

  it.each(["2026-13", "2026-00", "2026-1", "november", ""])(
    "rejects %j",
    (value) => {
      expect(parseMonthKey(value)).toBeNull();
    },
  );

  it("moves across year boundaries", () => {
    expect(shiftMonth({ year: 2026, month: 12 }, 1)).toEqual({
      year: 2027,
      month: 1,
    });
    expect(shiftMonth({ year: 2026, month: 1 }, -1)).toEqual({
      year: 2025,
      month: 12,
    });
  });

  it("covers every calendar date in the month", () => {
    const { start, end } = monthDateRange({ year: 2026, month: 2 });

    expect(start.toISOString()).toBe("2026-02-01T00:00:00.000Z");
    expect(end.toISOString()).toBe("2026-03-01T00:00:00.000Z");
  });
});

describe("summarizeBudgets", () => {
  const item = (budget: number | null, spent: number) => ({
    progress: getBudgetProgress(budget, spent),
  });

  it("totals budgeted categories and keeps unbudgeted spending apart", () => {
    const summary = summarizeBudgets([
      item(100, 30),
      item(50, 60),
      item(null, 40.25),
      item(null, 0),
    ]);

    expect(summary.total).toMatchObject({
      budget: 150,
      spent: 90,
      remaining: 60,
      percentUsed: 60,
      isOverBudget: false,
    });
    expect(summary.budgetedCount).toBe(2);
    expect(summary.overBudgetCount).toBe(1);
    expect(summary.unbudgetedSpent).toBe(40.25);
  });

  it("flags the month as over budget when total spending exceeds it", () => {
    const summary = summarizeBudgets([item(100, 90), item(50, 80)]);

    expect(summary.total.percentUsed).toBeCloseTo(113.33, 2);
    expect(summary.total.fill).toBe(100);
    expect(summary.total.remaining).toBe(-20);
    expect(summary.total.isOverBudget).toBe(true);
  });

  it("sums several budgets that are all under their limit", () => {
    const summary = summarizeBudgets([
      item(500, 200),
      item(400, 150),
      item(300, 120),
    ]);

    expect(summary.total).toMatchObject({
      budget: 1200,
      spent: 470,
      remaining: 730,
      isOverBudget: false,
    });
    expect(summary.total.percentUsed).toBeCloseTo(39.17, 2);
    expect(formatPercentUsed(summary.total.percentUsed ?? 0)).toBe("39%");
    expect(summary.overBudgetCount).toBe(0);
    expect(summary.unbudgetedSpent).toBe(0);
  });

  it("is not over budget when total spending equals the total budget", () => {
    const summary = summarizeBudgets([item(100, 100), item(50, 50)]);

    expect(summary.total).toMatchObject({
      budget: 150,
      spent: 150,
      remaining: 0,
      percentUsed: 100,
      fill: 100,
      isOverBudget: false,
    });
  });

  it("reports the full budget remaining when nothing has been spent", () => {
    const summary = summarizeBudgets([item(200, 0), item(100, 0)]);

    expect(summary.total).toMatchObject({
      budget: 300,
      spent: 0,
      remaining: 300,
      percentUsed: 0,
      fill: 0,
      isOverBudget: false,
    });
  });

  it("rounds totals to cents", () => {
    const summary = summarizeBudgets([item(0.1, 0.1), item(0.2, 0.2)]);

    expect(summary.total.budget).toBe(0.3);
    expect(summary.total.spent).toBe(0.3);
  });

  it("reports no budget when nothing is budgeted", () => {
    const summary = summarizeBudgets([item(null, 25)]);

    expect(summary.total.budget).toBeNull();
    expect(summary.total.percentUsed).toBeNull();
    expect(summary.budgetedCount).toBe(0);
    expect(summary.unbudgetedSpent).toBe(25);
  });
});
