import { beforeEach, describe, expect, it, vi } from "vitest";

type BudgetRow = {
  userId: string;
  year: number;
  month: number;
  category: string;
  amount: string;
};

type BudgetKey = Omit<BudgetRow, "amount">;

const mocks = vi.hoisted(() => ({
  currentUserId: null as string | null,
  budgets: [] as BudgetRow[],
  revalidatedPaths: [] as string[],
  failNextWrite: false,
}));

function sameKey(row: BudgetKey, key: BudgetKey): boolean {
  return (
    row.userId === key.userId &&
    row.year === key.year &&
    row.month === key.month &&
    row.category === key.category
  );
}

function failIfRequested() {
  if (mocks.failNextWrite) {
    mocks.failNextWrite = false;
    throw new Error("Simulated database failure");
  }
}

vi.mock("@/lib/prisma", () => ({
  prisma: {
    budget: {
      async upsert({
        where,
        create,
        update,
      }: {
        where: { userId_year_month_category: BudgetKey };
        create: BudgetRow;
        update: { amount: string };
      }) {
        failIfRequested();
        const existing = mocks.budgets.find((row) =>
          sameKey(row, where.userId_year_month_category),
        );
        if (existing) {
          existing.amount = update.amount;
          return existing;
        }
        mocks.budgets.push({ ...create });
        return create;
      },
      async deleteMany({ where }: { where: BudgetKey }) {
        failIfRequested();
        const before = mocks.budgets.length;
        mocks.budgets = mocks.budgets.filter((row) => !sameKey(row, where));
        return { count: before - mocks.budgets.length };
      },
    },
  },
}));

vi.mock("@/lib/session", () => ({
  getServerSession: async () =>
    mocks.currentUserId ? { user: { id: mocks.currentUserId } } : null,
}));

vi.mock("next/cache", () => ({
  revalidatePath: (path: string) => {
    mocks.revalidatedPaths.push(path);
  },
}));

const { deleteBudget, saveBudget } =
  await import("@/app/dashboard/budget/actions");

const USER_ID = "user-1";
const OTHER_USER_ID = "user-2";

const foodNovember = {
  userId: USER_ID,
  year: 2026,
  month: 11,
  category: "FOOD",
} as const;

beforeEach(() => {
  mocks.currentUserId = USER_ID;
  mocks.budgets = [];
  mocks.revalidatedPaths = [];
  mocks.failNextWrite = false;
});

describe("saveBudget", () => {
  it("creates a budget for the category and month", async () => {
    const result = await saveBudget({
      category: "FOOD",
      month: "2026-11",
      amount: "100",
    });

    expect(result).toEqual({ success: true });
    expect(mocks.budgets).toEqual([{ ...foodNovember, amount: "100" }]);
    expect(mocks.revalidatedPaths).toEqual(["/dashboard/budget", "/dashboard"]);
  });

  it("updates the existing budget instead of adding another", async () => {
    await saveBudget({ category: "FOOD", month: "2026-11", amount: "100" });
    await saveBudget({ category: "FOOD", month: "2026-11", amount: "150.50" });

    expect(mocks.budgets).toEqual([{ ...foodNovember, amount: "150.50" }]);
  });

  it("keeps budgets for different months separate", async () => {
    await saveBudget({ category: "FOOD", month: "2026-11", amount: "100" });
    await saveBudget({ category: "FOOD", month: "2026-12", amount: "120" });

    expect(mocks.budgets).toHaveLength(2);
  });

  it.each(["0", "-5", "abc", "", "1.234"])(
    "rejects the amount %j",
    async (amount) => {
      const result = await saveBudget({
        category: "FOOD",
        month: "2026-11",
        amount,
      });

      expect(result.success).toBe(false);
      expect(mocks.budgets).toEqual([]);
      expect(mocks.revalidatedPaths).toEqual([]);
    },
  );

  it("rejects an invalid month or category", async () => {
    expect(
      await saveBudget({ category: "FOOD", month: "2026-13", amount: "10" }),
    ).toMatchObject({ success: false });
    const unknownCategory = {
      category: "GROCERIES",
      month: "2026-11",
      amount: "10",
    } as unknown as Parameters<typeof saveBudget>[0];
    expect(await saveBudget(unknownCategory)).toMatchObject({
      success: false,
    });
    expect(mocks.budgets).toEqual([]);
  });

  it("requires a signed-in user", async () => {
    mocks.currentUserId = null;

    const result = await saveBudget({
      category: "FOOD",
      month: "2026-11",
      amount: "100",
    });

    expect(result).toEqual({
      success: false,
      error: "You need to be signed in to set a budget.",
    });
    expect(mocks.budgets).toEqual([]);
  });

  it("reports a database failure without revalidating", async () => {
    mocks.failNextWrite = true;

    const result = await saveBudget({
      category: "FOOD",
      month: "2026-11",
      amount: "100",
    });

    expect(result).toEqual({
      success: false,
      error: "We couldn't save this budget. Please try again.",
    });
    expect(mocks.revalidatedPaths).toEqual([]);
  });
});

describe("deleteBudget", () => {
  beforeEach(() => {
    mocks.budgets = [
      { ...foodNovember, amount: "100" },
      { ...foodNovember, userId: OTHER_USER_ID, amount: "300" },
    ];
  });

  it("removes only the signed-in user's budget", async () => {
    const result = await deleteBudget({ category: "FOOD", month: "2026-11" });

    expect(result).toEqual({ success: true });
    expect(mocks.budgets).toEqual([
      { ...foodNovember, userId: OTHER_USER_ID, amount: "300" },
    ]);
    expect(mocks.revalidatedPaths).toEqual(["/dashboard/budget", "/dashboard"]);
  });

  it("reports a missing budget", async () => {
    const result = await deleteBudget({
      category: "TRANSPORT",
      month: "2026-11",
    });

    expect(result).toEqual({ success: false, error: "Budget not found." });
    expect(mocks.budgets).toHaveLength(2);
    expect(mocks.revalidatedPaths).toEqual([]);
  });

  it("requires a signed-in user", async () => {
    mocks.currentUserId = null;

    const result = await deleteBudget({ category: "FOOD", month: "2026-11" });

    expect(result.success).toBe(false);
    expect(mocks.budgets).toHaveLength(2);
  });
});
