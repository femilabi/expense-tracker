"use client";

import { Dialog } from "@chakra-ui/react";

import type { IncomeInput } from "../income-schema";
import type { IncomeRecord } from "../types";
import { COLORS } from "@/components/shared/colors";
import { dialogSurfaceStyles } from "@/components/shared/styles";
import { IncomeForm } from "./income-form";

interface IncomeDialogProps {
  open: boolean;
  today: string;
  income?: IncomeRecord | null;
  onClose: () => void;
  onSubmit: (values: IncomeInput) => void | Promise<void>;
}

export function IncomeDialog({
  open,
  today,
  income = null,
  onClose,
  onSubmit,
}: IncomeDialogProps) {
  const title = income ? "Edit income" : "Add income";

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(details) => {
        if (!details.open) {
          onClose();
        }
      }}
      size="lg"
      placement="center"
      lazyMount
      unmountOnExit
    >
      <Dialog.Backdrop bg={COLORS.backdrop} />
      <Dialog.Positioner p={4}>
        <Dialog.Content
          {...dialogSurfaceStyles}
          w="full"
          maxW="27rem"
          maxH="calc(100dvh - 2rem)"
          overflowY="auto"
        >
          <Dialog.Title
            position="absolute"
            w="1px"
            h="1px"
            p="0"
            m="-1px"
            overflow="hidden"
            whiteSpace="nowrap"
            borderWidth="0"
            clip="rect(0, 0, 0, 0)"
          >
            {title}
          </Dialog.Title>
          <IncomeForm
            key={income?.id ?? "new"}
            today={today}
            initialIncome={income}
            onSubmit={onSubmit}
            onCancel={onClose}
          />
        </Dialog.Content>
      </Dialog.Positioner>
    </Dialog.Root>
  );
}
