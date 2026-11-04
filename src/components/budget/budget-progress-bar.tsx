"use client";

import { Progress } from "@chakra-ui/react";

import { formatPercentUsed, type BudgetProgress } from "@/lib/budget-math";

import { COLORS } from "@/components/shared/colors";

interface BudgetProgressBarProps {
  label: string;
  progress: BudgetProgress;
}

export function BudgetProgressBar({ label, progress }: BudgetProgressBarProps) {
  const percentText = formatPercentUsed(progress.percentUsed ?? 0);

  return (
    <Progress.Root
      value={progress.fill}
      translations={{ value: () => `${label} budget` }}
    >
      <Progress.Track
        h="3"
        bg={COLORS.border}
        borderRadius="full"
        aria-valuetext={`${percentText} used${
          progress.isOverBudget ? ", over budget" : ""
        }`}
      >
        <Progress.Range
          bg={progress.isOverBudget ? COLORS.danger : COLORS.primary}
          borderRadius="full"
          transition="width 0.3s ease, background-color 0.3s ease"
          _motionReduce={{ transition: "none" }}
        />
      </Progress.Track>
    </Progress.Root>
  );
}
