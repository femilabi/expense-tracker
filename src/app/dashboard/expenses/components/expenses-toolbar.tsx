"use client";

import { Box, Button, Flex, Input, NativeSelect } from "@chakra-ui/react";

import { CATEGORY_OPTIONS } from "@/app/dashboard/expenses/expense-form/constants/categories";
import type {
  CategoryFilter,
  DateRangeFilter,
  ExpenseFilters,
  SortOption,
} from "@/app/dashboard/expenses/types";

import { COLORS } from "@/components/shared/colors";
import { SearchIcon } from "@/components/shared/icons";
import {
  controlStyles,
  focusRing,
  nativeSelectOptionStyles,
} from "@/components/shared/styles";

interface ExpensesToolbarProps {
  filters: ExpenseFilters;
  hasFilters: boolean;
  onFilterChange: (patch: Partial<ExpenseFilters>) => void;
  onClearFilters: () => void;
}

export function ExpensesToolbar({
  filters,
  hasFilters,
  onFilterChange,
  onClearFilters,
}: ExpensesToolbarProps) {
  return (
    <Flex
      as="search"
      aria-label="Filter expenses"
      direction={{ base: "column", lg: "row" }}
      align={{ lg: "center" }}
      gap={2}
    >
      <Box position="relative" flex="1" minW={{ base: "full", lg: "16rem" }}>
        <Box
          position="absolute"
          top="50%"
          left="3"
          zIndex="1"
          transform="translateY(-50%)"
          color={COLORS.muted}
          pointerEvents="none"
          aria-hidden="true"
        >
          <SearchIcon />
        </Box>
        <Input
          ps="10"
          placeholder="Search descriptions…"
          aria-label="Search expenses by description"
          value={filters.search}
          onChange={(event) => onFilterChange({ search: event.target.value })}
          {...controlStyles}
        />
      </Box>

      <NativeSelect.Root
        w={{ base: "full", lg: "44" }}
        flexShrink={0}
        size="sm"
      >
        <NativeSelect.Field
          aria-label="Filter by category"
          value={filters.category}
          onChange={(event) =>
            onFilterChange({
              category: event.target.value as CategoryFilter,
            })
          }
          {...controlStyles}
          css={nativeSelectOptionStyles}
        >
          <option value="all">All categories</option>
          {CATEGORY_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </NativeSelect.Field>
        <NativeSelect.Indicator color={COLORS.muted} />
      </NativeSelect.Root>

      <NativeSelect.Root
        w={{ base: "full", lg: "40" }}
        flexShrink={0}
        size="sm"
      >
        <NativeSelect.Field
          aria-label="Filter by date range"
          value={filters.dateRange}
          onChange={(event) =>
            onFilterChange({
              dateRange: event.target.value as DateRangeFilter,
            })
          }
          {...controlStyles}
          css={nativeSelectOptionStyles}
        >
          <option value="all">All time</option>
          <option value="this-month">This month</option>
          <option value="last-month">Last month</option>
          <option value="this-year">This year</option>
        </NativeSelect.Field>
        <NativeSelect.Indicator color={COLORS.muted} />
      </NativeSelect.Root>

      <NativeSelect.Root
        w={{ base: "full", lg: "44" }}
        flexShrink={0}
        size="sm"
      >
        <NativeSelect.Field
          aria-label="Sort expenses"
          value={filters.sort}
          onChange={(event) =>
            onFilterChange({ sort: event.target.value as SortOption })
          }
          {...controlStyles}
          css={nativeSelectOptionStyles}
        >
          <option value="date-desc">Newest first</option>
          <option value="date-asc">Oldest first</option>
          <option value="amount-desc">Highest amount</option>
          <option value="amount-asc">Lowest amount</option>
        </NativeSelect.Field>
        <NativeSelect.Indicator color={COLORS.muted} />
      </NativeSelect.Root>

      {hasFilters ? (
        <Button
          size="sm"
          variant="ghost"
          flexShrink={0}
          color={COLORS.text}
          _hover={{ bg: COLORS.primarySurface }}
          _focusVisible={focusRing}
          onClick={onClearFilters}
        >
          Reset
        </Button>
      ) : null}
    </Flex>
  );
}
