import Link from "next/link";
import { HStack, IconButton, Text } from "@chakra-ui/react";

import { formatMonth } from "@/lib/format";
import {
  monthStart,
  shiftMonth,
  toMonthKey,
  type CalendarMonth,
} from "@/lib/month";

import { COLORS } from "@/components/shared/colors";
import { ChevronLeftIcon, ChevronRightIcon } from "@/components/shared/icons";
import { secondaryButtonStyles } from "@/components/shared/styles";

interface MonthSelectorProps {
  month: CalendarMonth;
}

function monthHref(month: CalendarMonth): string {
  return `/budget?month=${toMonthKey(month)}`;
}

export function MonthSelector({ month }: MonthSelectorProps) {
  const previous = shiftMonth(month, -1);
  const next = shiftMonth(month, 1);

  return (
    <HStack as="nav" gap={2} aria-label="Budget month" flexShrink={0}>
      <IconButton asChild {...secondaryButtonStyles} px={0}>
        <Link
          href={monthHref(previous)}
          aria-label={`Previous month, ${formatMonth(monthStart(previous))}`}
        >
          <ChevronLeftIcon />
        </Link>
      </IconButton>
      <Text
        minW="36"
        textAlign="center"
        fontSize="sm"
        fontWeight="semibold"
        color={COLORS.text}
        aria-live="polite"
      >
        {formatMonth(monthStart(month))}
      </Text>
      <IconButton asChild {...secondaryButtonStyles} px={0}>
        <Link
          href={monthHref(next)}
          aria-label={`Next month, ${formatMonth(monthStart(next))}`}
        >
          <ChevronRightIcon />
        </Link>
      </IconButton>
    </HStack>
  );
}
