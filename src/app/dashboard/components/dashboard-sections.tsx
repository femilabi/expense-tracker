"use client";

import { Grid } from "@chakra-ui/react";

import type { BudgetMonth } from "@/lib/budgets";
import type { RecentTransaction } from "@/lib/recent-transactions";
import type { SpendingPace } from "@/lib/spending-pace";

import { BudgetProgressCard } from "./budget-progress-card";
import { RecentTransactionsCard } from "./recent-transactions-card";
import { SpendingCategoriesCard } from "./spending-categories-card";
import { SpendingPaceCard } from "./spending-pace-card";

interface DashboardSectionsProps {
  spendingPace: SpendingPace;
  spendingPaceSummary: string;
  budgetMonth: BudgetMonth;
  recentTransactions: RecentTransaction[];
  currency: string;
}

/** Chart, budget and transaction sections below the summary cards. */
export function DashboardSections({
  spendingPace,
  spendingPaceSummary,
  budgetMonth,
  recentTransactions,
  currency,
}: DashboardSectionsProps) {
  return (
    <>
      <SpendingPaceCard
        pace={spendingPace}
        summary={spendingPaceSummary}
        currency={currency}
      />

      {/* Categories and Budget */}
      <Grid
        mt="8"
        templateColumns={{
          base: "1fr",
          lg: "repeat(2, 1fr)",
        }}
        gap="6"
      >
        <SpendingCategoriesCard budgetMonth={budgetMonth} />

        <BudgetProgressCard budgetMonth={budgetMonth} />
      </Grid>

      <RecentTransactionsCard
        transactions={recentTransactions}
        currency={currency}
      />
    </>
  );
}
