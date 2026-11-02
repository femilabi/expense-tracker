"use client";

import * as React from "react";
import { DatePicker, parseDate, type DateValue } from "@chakra-ui/react";

import { COLORS } from "./colors";
import { CalendarIcon } from "./icons";
import { controlStyles, focusRing } from "./styles";

interface DatePickerFieldProps {
  label: React.ReactNode;
  labelProps?: React.ComponentProps<typeof DatePicker.Label>;
  /** Calendar date in YYYY-MM-DD format, or "" when empty. */
  value: string;
  onChange: (value: string) => void;
  invalid?: boolean;
  required?: boolean;
  placeholder?: string;
}

function toDateValues(value: string): DateValue[] {
  if (!value) {
    return [];
  }

  try {
    return [parseDate(value)];
  } catch {
    return [];
  }
}

/**
 * Chakra date picker bound to a YYYY-MM-DD string, so forms keep the same
 * state shape and payload as a native `<input type="date">`.
 */
export function DatePickerField({
  label,
  labelProps,
  value,
  onChange,
  invalid = false,
  required = false,
  placeholder = "mm/dd/yyyy",
}: DatePickerFieldProps) {
  const dateValues = React.useMemo(() => toDateValues(value), [value]);

  return (
    <DatePicker.Root
      w="full"
      gap="2"
      // Fixed locale keeps server and client renders identical.
      locale="en-US"
      value={dateValues}
      onValueChange={(details) => onChange(details.value[0]?.toString() ?? "")}
      // Fixed positioning escapes the dialogs' overflow clipping.
      positioning={{ strategy: "fixed", placement: "bottom-start" }}
    >
      <DatePicker.Label {...labelProps}>{label}</DatePicker.Label>
      <DatePicker.Control>
        <DatePicker.Input
          {...controlStyles}
          ps="3"
          pe="10"
          placeholder={placeholder}
          aria-required={required || undefined}
          aria-invalid={invalid || undefined}
          borderColor={invalid ? COLORS.danger : COLORS.border}
        />
        <DatePicker.IndicatorGroup pe="1">
          <DatePicker.Trigger
            aria-label="Open calendar"
            color={COLORS.muted}
            borderRadius="md"
            _hover={{ color: COLORS.text }}
            _focusVisible={focusRing}
          >
            <CalendarIcon />
          </DatePicker.Trigger>
        </DatePicker.IndicatorGroup>
      </DatePicker.Control>
      <DatePicker.Positioner>
        <DatePicker.Content>
          <DatePicker.View view="day">
            <DatePicker.Header />
            <DatePicker.DayTable />
          </DatePicker.View>
          <DatePicker.View view="month">
            <DatePicker.Header />
            <DatePicker.MonthTable />
          </DatePicker.View>
          <DatePicker.View view="year">
            <DatePicker.Header />
            <DatePicker.YearTable />
          </DatePicker.View>
        </DatePicker.Content>
      </DatePicker.Positioner>
    </DatePicker.Root>
  );
}
