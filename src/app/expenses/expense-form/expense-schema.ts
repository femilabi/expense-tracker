import { z } from "zod";
import { ExpenseCategory } from "../../../generated/prisma/enums";

const AMOUNT_PATTERN = /^\d{1,12}(\.\d{1,2})?$/;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function isValidDateOnly(value: string): boolean {
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().startsWith(value);
}

export const expenseSchema = z.object({
  category: z.enum(ExpenseCategory, { error: "Select a category" }),
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
  description: z
    .string()
    .trim()
    .nullable()
    .transform((value) => (value === "" || value === null ? null : value)),
  expenseDate: z
    .string()
    .regex(DATE_PATTERN, { error: "Select a valid date" })
    .refine(isValidDateOnly, { error: "Select a valid date" }),
});

export type ExpenseInput = z.infer<typeof expenseSchema>;
