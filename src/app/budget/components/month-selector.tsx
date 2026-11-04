import Link from "next/link";
import { Flex, IconButton, Text } from "@chakra-ui/react";

import { formatMonth } from "@/lib/format";
import {
  monthStart,
  shiftMonth,
  toMonthKey,
  type CalendarMonth,
} from "@/lib/month";

import { COLORS } from "@/components/shared/colors";
import { ChevronLeftIcon, ChevronRightIcon } from "@/components/shared/icons";
import { controlGroupStyles, focusRing } from "@/components/shared/styles";

interface MonthSelectorProps {
  month: CalendarMonth;
}

function monthHref(month: CalendarMonth): string {
  return `/budget?month=${toMonthKey(month)}`;
}

function MonthStepButton({
  month,
  direction,
}: {
  month: CalendarMonth;
  direction: "previous" | "next";
}) {
  const label = `${direction === "previous" ? "Previous" : "Next"} month, ${formatMonth(monthStart(month))}`;

  return (
    <IconButton
      asChild
      size="sm"
      variant="ghost"
      color={COLORS.muted}
      _hover={{ bg: COLORS.raised, color: COLORS.text }}
      _focusVisible={focusRing}
    >
      <Link href={monthHref(month)} aria-label={label} title={label}>
        {direction === "previous" ? <ChevronLeftIcon /> : <ChevronRightIcon />}
      </Link>
    </IconButton>
  );
}

export function MonthSelector({ month }: MonthSelectorProps) {
  return (
    <Flex
      as="nav"
      aria-label="Budget month"
      align="center"
      justify="space-between"
      w={{ base: "full", sm: "auto" }}
      px={1}
      gap={1}
      {...controlGroupStyles}
    >
      <MonthStepButton month={shiftMonth(month, -1)} direction="previous" />
      <Text
        minW="36"
        textAlign="center"
        fontSize="sm"
        fontWeight="medium"
        color={COLORS.text}
        fontVariantNumeric="tabular-nums"
        aria-live="polite"
      >
        {formatMonth(monthStart(month))}
      </Text>
      <MonthStepButton month={shiftMonth(month, 1)} direction="next" />
    </Flex>
  );
}
