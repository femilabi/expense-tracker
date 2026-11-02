import { Box, Button, Flex, HStack, Stack, Text } from "@chakra-ui/react";

import type { CategoryBudget } from "@/lib/budgets";

import { BudgetCategoryProgress } from "@/components/budget/budget-category-progress";
import { COLORS } from "@/components/shared/colors";
import {
  dangerOutlineButtonStyles,
  secondaryButtonStyles,
  surfaceStyles,
} from "@/components/shared/styles";

interface BudgetListProps {
  categories: CategoryBudget[];
  currency: string;
  onEdit: (item: CategoryBudget) => void;
  onRemove: (item: CategoryBudget) => void;
}

export function BudgetList({
  categories,
  currency,
  onEdit,
  onRemove,
}: BudgetListProps) {
  const budgetedCount = categories.filter(
    (item) => item.progress.budget !== null,
  ).length;

  return (
    <Box {...surfaceStyles} overflow="hidden">
      <Box px={{ base: 4, md: 5 }} py={4}>
        <Text fontWeight="semibold" color={COLORS.text}>
          Categories
        </Text>
        <Text mt={0.5} fontSize="sm" color={COLORS.muted}>
          {budgetedCount} of {categories.length} categories budgeted
        </Text>
      </Box>

      <Stack as="ul" gap={0} listStyleType="none" m={0} p={0}>
        {categories.map((item) => (
          <Flex
            as="li"
            key={item.category}
            direction={{ base: "column", md: "row" }}
            align={{ base: "stretch", md: "center" }}
            gap={{ base: 3, md: 6 }}
            px={{ base: 4, md: 5 }}
            py={4}
            borderTopWidth="1px"
            borderColor={COLORS.border}
          >
            <Box flex="1" minW={0}>
              <BudgetCategoryProgress
                item={item}
                currency={currency}
                showAmounts
              />
            </Box>
            <BudgetRowActions item={item} onEdit={onEdit} onRemove={onRemove} />
          </Flex>
        ))}
      </Stack>
    </Box>
  );
}

interface BudgetRowActionsProps {
  item: CategoryBudget;
  onEdit: (item: CategoryBudget) => void;
  onRemove: (item: CategoryBudget) => void;
}

function BudgetRowActions({ item, onEdit, onRemove }: BudgetRowActionsProps) {
  if (item.progress.budget === null) {
    return (
      <HStack justify="flex-end" flexShrink={0} w={{ md: "52" }}>
        <Button
          type="button"
          aria-label={`Set ${item.label} budget`}
          onClick={() => onEdit(item)}
          {...secondaryButtonStyles}
        >
          Set budget
        </Button>
      </HStack>
    );
  }

  return (
    <HStack justify="flex-end" gap={2} flexShrink={0} w={{ md: "52" }}>
      <Button
        type="button"
        aria-label={`Edit ${item.label} budget`}
        onClick={() => onEdit(item)}
        {...secondaryButtonStyles}
      >
        Edit
      </Button>
      <Button
        type="button"
        aria-label={`Remove ${item.label} budget`}
        onClick={() => onRemove(item)}
        {...dangerOutlineButtonStyles}
      >
        Remove
      </Button>
    </HStack>
  );
}
