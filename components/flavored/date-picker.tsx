"use client";

import { DatePicker as DatePickerBase } from "@/registry/base/date-picker";
import { DatePicker as DatePickerRadix } from "@/registry/radix/date-picker";
import { flavored } from "@/components/flavored/flavored";

export const DatePicker = flavored(DatePickerBase, DatePickerRadix, "Flavored(DatePicker)");

export {
  formatDateLabel,
  formatRangeLabel,
  formatDuration,
  formatTime,
  parseTime,
  shiftEnd,
  buildSlots,
} from "@/registry/base/date-picker";
export type {
  DatePickerProps,
  DatePickerSingleProps,
  DatePickerRangeProps,
  DatePickerPreset,
  TimeRange,
  DateRange,
} from "@/registry/base/date-picker";
