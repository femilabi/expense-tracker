import type { IncomeFilters, IncomeRecord, IncomeSummary } from "./types";

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
  timeZone: "UTC",
});

export function formatIncomeDate(dateKey: string): string {
  return dateFormatter.format(parseIncomeDateKey(dateKey));
}

export function parseIncomeDateKey(dateKey: string): Date {
  return new Date(`${dateKey}T00:00:00.000Z`);
}

export function toIncomeDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function monthsBetween(date: Date, reference: Date): number {
  return (
    (reference.getUTCFullYear() - date.getUTCFullYear()) * 12 +
    reference.getUTCMonth() -
    date.getUTCMonth()
  );
}

export function summarizeIncomes(
  incomes: IncomeRecord[],
  referenceDate: Date,
): IncomeSummary {
  let monthTotal = 0;
  let monthCount = 0;
  let lastMonthTotal = 0;
  let yearTotal = 0;
  let lifetimeTotal = 0;

  for (const income of incomes) {
    const date = parseIncomeDateKey(income.incomeDate);
    const monthOffset = monthsBetween(date, referenceDate);

    lifetimeTotal += income.amount;

    if (monthOffset === 0) {
      monthTotal += income.amount;
      monthCount += 1;
    } else if (monthOffset === 1) {
      lastMonthTotal += income.amount;
    }

    if (date.getUTCFullYear() === referenceDate.getUTCFullYear()) {
      yearTotal += income.amount;
    }
  }

  return {
    monthTotal,
    monthCount,
    lastMonthTotal,
    yearTotal,
    lifetimeTotal,
    lifetimeCount: incomes.length,
  };
}

export function filterAndSortIncomes(
  incomes: IncomeRecord[],
  filters: IncomeFilters,
  referenceDate: Date,
): IncomeRecord[] {
  const query = filters.search.trim().toLowerCase();

  return incomes
    .filter((income) => {
      if (query) {
        const searchable = `${income.source ?? ""} ${
          income.description ?? ""
        }`.toLowerCase();
        if (!searchable.includes(query)) {
          return false;
        }
      }

      const date = parseIncomeDateKey(income.incomeDate);

      if (filters.dateRange === "this-month") {
        return monthsBetween(date, referenceDate) === 0;
      }

      if (filters.dateRange === "last-month") {
        return monthsBetween(date, referenceDate) === 1;
      }

      if (filters.dateRange === "this-year") {
        return date.getUTCFullYear() === referenceDate.getUTCFullYear();
      }

      return true;
    })
    .sort((a, b) => {
      switch (filters.sort) {
        case "date-asc":
          return a.incomeDate.localeCompare(b.incomeDate);
        case "amount-desc":
          return b.amount - a.amount;
        case "amount-asc":
          return a.amount - b.amount;
        case "date-desc":
        default:
          return b.incomeDate.localeCompare(a.incomeDate);
      }
    });
}
