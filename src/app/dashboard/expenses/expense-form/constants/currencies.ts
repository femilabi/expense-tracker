export const CURRENCY_CODES = [
  "USD",
  "EUR",
  "GBP",
  "NGN",
  "CAD",
  "AUD",
  "INR",
  "JPY",
  "CNY",
  "ZAR",
] as const;

export type Currency = (typeof CURRENCY_CODES)[number];

export const CURRENCY_OPTIONS: readonly {
  value: Currency;
  label: string;
}[] = CURRENCY_CODES.map((value) => ({ value, label: value }));

export function isCurrency(value: unknown): value is Currency {
  return (
    typeof value === "string" &&
    (CURRENCY_CODES as readonly string[]).includes(value)
  );
}
