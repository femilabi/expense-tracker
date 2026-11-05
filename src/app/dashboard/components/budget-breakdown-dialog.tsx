"use client";

import Link from "next/link";
import {
  Box,
  Button,
  CloseButton,
  Dialog,
  Flex,
  Portal,
  Stack,
} from "@chakra-ui/react";

import { rankByPercentUsed } from "@/lib/budget-math";
import type { BudgetMonth } from "@/lib/budgets";
import { formatMonth } from "@/lib/format";
import { monthStart } from "@/lib/month";

import { BudgetCategoryProgress } from "@/components/budget/budget-category-progress";
import { COLORS } from "@/components/shared/colors";
import {
  dialogSurfaceStyles,
  focusRing,
  secondaryButtonStyles,
} from "@/components/shared/styles";

interface BudgetBreakdownDialogProps {
  open: boolean;
  budgetMonth: BudgetMonth;
  onClose: () => void;
}

export function BudgetBreakdownDialog({
  open,
  budgetMonth,
  onClose,
}: BudgetBreakdownDialogProps) {
  const ranked = rankByPercentUsed(budgetMonth.categories);
  const unbudgeted = budgetMonth.categories.filter(
    (item) => item.progress.budget === null,
  );

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(details) => {
        if (!details.open) {
          onClose();
        }
      }}
      size="md"
      placement="center"
      scrollBehavior="inside"
      lazyMount
      unmountOnExit
    >
      {/* Portalled so the card's blur and entrance animation can't trap the
          full-screen overlay inside the card. */}
      <Portal>
        <Dialog.Backdrop bg={COLORS.backdrop} />
        <Dialog.Positioner p={4}>
          <Dialog.Content
            {...dialogSurfaceStyles}
            w="full"
            maxW="32rem"
            maxH="calc(100dvh - 2rem)"
          >
            <Flex align="flex-start" justify="space-between" gap={3}>
              <Box>
                <Dialog.Title
                  fontSize="lg"
                  fontWeight="semibold"
                  letterSpacing="tight"
                  color={COLORS.text}
                >
                  Spending by category
                </Dialog.Title>
                <Dialog.Description mt={1} fontSize="sm" color={COLORS.muted}>
                  {formatMonth(monthStart(budgetMonth.month))}
                </Dialog.Description>
              </Box>
              <Dialog.CloseTrigger asChild position="static">
                <CloseButton
                  size="sm"
                  color={COLORS.muted}
                  _hover={{ bg: COLORS.raised, color: COLORS.text }}
                  _focusVisible={focusRing}
                />
              </Dialog.CloseTrigger>
            </Flex>

            <Dialog.Body px={0} pt={6} pb={0}>
              <Stack as="ul" gap={5} listStyleType="none" m={0} p={0}>
                {[...ranked, ...unbudgeted].map((item) => (
                  <Box as="li" key={item.category}>
                    <BudgetCategoryProgress
                      item={item}
                      currency={budgetMonth.currency}
                      showAmounts
                    />
                  </Box>
                ))}
              </Stack>
            </Dialog.Body>

            <Flex mt={6} justify="flex-end">
              <Button asChild {...secondaryButtonStyles}>
                <Link href="/budget">Manage budgets</Link>
              </Button>
            </Flex>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}
