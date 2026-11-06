"use client";

import { Progress } from "@chakra-ui/react";

import { formatPercentUsed, type BudgetProgress } from "@/lib/budget-math";

import { COLORS, CSS_COLORS, cssTint } from "@/components/shared/colors";

interface BudgetProgressBarProps {
  label: string;
  progress: BudgetProgress;
  /** "glow" is the dashboard's soft-glass look; the Budget page uses "solid". */
  variant?: "solid" | "glow";
}

/** Gradient fill and glow for the "glow" variant, from globals.css colours. */
function glowFill(isOverBudget: boolean) {
  const [from, to] = isOverBudget
    ? [CSS_COLORS.warning, CSS_COLORS.danger]
    : [CSS_COLORS.secondary, CSS_COLORS.success];

  return {
    bg: `linear-gradient(90deg, ${from}, ${to})`,
    boxShadow: `0 0 12px -2px ${cssTint(to, 60)}`,
  };
}

export function BudgetProgressBar({
  label,
  progress,
  variant = "solid",
}: BudgetProgressBarProps) {
  const percentText = formatPercentUsed(progress.percentUsed ?? 0);
  const isGlow = variant === "glow";

  return (
    <Progress.Root
      value={progress.fill}
      translations={{ value: () => `${label} budget` }}
    >
      <Progress.Track
        h={isGlow ? "2.5" : "3"}
        bg={isGlow ? cssTint(CSS_COLORS.muted, 14) : COLORS.border}
        borderRadius="full"
        overflow={isGlow ? "visible" : undefined}
        aria-valuetext={`${percentText} used${
          progress.isOverBudget ? ", over budget" : ""
        }`}
      >
        {isGlow ? (
          <Progress.Range
            {...glowFill(progress.isOverBudget)}
            borderRadius="full"
            transformOrigin="left center"
            animation="bar-grow 0.9s cubic-bezier(0.22, 1, 0.36, 1) 0.2s both"
            transition="width 0.4s cubic-bezier(0.22, 1, 0.36, 1)"
            _motionReduce={{ animation: "none", transition: "none" }}
          />
        ) : (
          <Progress.Range
            bg={progress.isOverBudget ? COLORS.danger : COLORS.primary}
            borderRadius="full"
            transition="width 0.3s ease, background-color 0.3s ease"
            _motionReduce={{ transition: "none" }}
          />
        )}
      </Progress.Track>
    </Progress.Root>
  );
}
