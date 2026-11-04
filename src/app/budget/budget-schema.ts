import { z } from "zod";

import { ExpenseCategory } from "@/generated/prisma/enums";
import { parseMonthKey } from "@/lib/month";

const AMOUNT_PATTERN = /^\d{1,12}(\.\d{1,2})?$/;

export const budgetAmountSchema = z
  .string()
  .trim()
  .min(1, { error: "Amount is required" })
  .regex(AMOUNT_PATTERN, {
    error: "Enter an amount with up to 12 digits and 2 decimal places",
  })
  .refine((value) => Number(value) > 0, {
    error: "Amount must be greater than zero",
  });

export const budgetKeySchema = z.object({
  category: z.enum(ExpenseCategory, { error: "Select a category" }),
  month: z.string().transform((value, context) => {
    const month = parseMonthKey(value);
    if (!month) {
      context.addIssue({ code: "custom", message: "Select a valid month" });
      return z.NEVER;
    }
    return month;
  }),
});

export const budgetSchema = budgetKeySchema.extend({
  amount: budgetAmountSchema,
});

export type BudgetKeyInput = z.input<typeof budgetKeySchema>;
export type BudgetInput = z.input<typeof budgetSchema>;
