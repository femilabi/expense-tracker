import { describe, expect, it } from "vitest";

import {
  formatPercentUsed,
  getBudgetProgress,
  rankByPercentUsed,
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
