const DEFAULT_CURRENCY = "USD";

const monthFormatter = new Intl.DateTimeFormat("en-US", {
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

const shortMonthFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  timeZone: "UTC",
});

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
  timeZone: "UTC",
});

const shortDateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  timeZone: "UTC",
});

export function formatCurrency(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
    }).format(amount);
  } catch {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: DEFAULT_CURRENCY,
    }).format(amount);
  }
}

export function formatMonth(date: Date): string {
  return monthFormatter.format(date);
}

export function formatShortMonth(date: Date): string {
  return shortMonthFormatter.format(date);
}

export function formatDate(date: Date): string {
  return dateFormatter.format(date);
}

/** "Nov 3". Calendar dates are stored as UTC midnight, so format in UTC. */
export function formatShortDate(date: Date): string {
  return shortDateFormatter.format(date);
}
