/** A calendar month; `month` is 1-12. */
export interface CalendarMonth {
  year: number;
  month: number;
}

const MONTH_KEY_PATTERN = /^(\d{4})-(0[1-9]|1[0-2])$/;

/** Parses a YYYY-MM month key. */
export function parseMonthKey(value: string): CalendarMonth | null {
  const match = MONTH_KEY_PATTERN.exec(value);
  return match ? { year: Number(match[1]), month: Number(match[2]) } : null;
}

export function toMonthKey({ year, month }: CalendarMonth): string {
  return `${year}-${String(month).padStart(2, "0")}`;
}

/** The month containing `date`, using local time. */
export function getCurrentMonth(date: Date = new Date()): CalendarMonth {
  return { year: date.getFullYear(), month: date.getMonth() + 1 };
}

export function shiftMonth(
  { year, month }: CalendarMonth,
  delta: number,
): CalendarMonth {
  const index = year * 12 + (month - 1) + delta;
  return { year: Math.floor(index / 12), month: (index % 12) + 1 };
}

/** First day of the month at UTC midnight, matching stored calendar dates. */
export function monthStart({ year, month }: CalendarMonth): Date {
  return new Date(Date.UTC(year, month - 1, 1));
}

/** Half-open [start, end) range of calendar dates in the month. */
export function monthDateRange(month: CalendarMonth): {
  start: Date;
  end: Date;
} {
  return { start: monthStart(month), end: monthStart(shiftMonth(month, 1)) };
}
