import { ExpenseCategory } from "../../../../../generated/prisma/enums";

export type Category = (typeof ExpenseCategory)[keyof typeof ExpenseCategory];

export interface CategoryOption {
  value: Category;
  label: string;
}

const CATEGORY_DISPLAY: Record<Category, Omit<CategoryOption, "value">> = {
  FOOD: { label: "Food" },
  INTERNET: { label: "Internet" },
  DRINKS: { label: "Drinks" },
  TRANSPORT: { label: "Transport" },
  RENT: { label: "Rent" },
  UTILITIES: { label: "Utilities" },
  HEALTH: { label: "Health" },
  ENTERTAINMENT: { label: "Entertainment" },
  SHOPPING: { label: "Shopping" },
  OTHER: { label: "Other" },
};

export const CATEGORY_OPTIONS: readonly CategoryOption[] = Object.values(
  ExpenseCategory,
).map((value) => ({ value, ...CATEGORY_DISPLAY[value] }));
