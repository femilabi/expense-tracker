import { z } from "zod";

const AMOUNT_PATTERN = /^\d{1,12}(\.\d{1,2})?$/;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function isValidDateOnly(value: string): boolean {
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().startsWith(value);
}

export const incomeSchema = z.object({
  amount: z
    .string()
    .trim()
    .min(1, { error: "Amount is required" })
    .regex(AMOUNT_PATTERN, {
      error: "Enter an amount with up to 12 digits and 2 decimal places",
    })
    .refine((value) => Number(value) > 0, {
      error: "Amount must be greater than zero",
    }),
  source: z
    .string()
    .trim()
    .max(150, { error: "Source must be 150 characters or fewer" })
    .nullable()
    .optional()
    .transform((value) =>
      value === "" || value === null || value === undefined ? null : value,
    ),
  description: z
    .string()
    .trim()
    .nullable()
    .optional()
    .transform((value) =>
      value === "" || value === null || value === undefined ? null : value,
    ),
  incomeDate: z
    .string()
    .regex(DATE_PATTERN, { error: "Select a valid date" })
    .refine(isValidDateOnly, { error: "Select a valid date" }),
});

export type IncomeInput = z.infer<typeof incomeSchema>;
