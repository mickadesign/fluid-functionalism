// The API reference of /docs/date-picker: its PropsTables and the API
// section of /docs/date-picker.md both read these, so the two cannot drift.
import type { ApiTable, PropDef } from "@/lib/docs/api/types";

/** What gets picked. DatePicker is a form control, so it uses `value` /
 *  `onValueChange`; the Calendar inside keeps DayPicker's `selected`. */
export const datePickerValueProps: PropDef[] = [
  {
    name: "mode",
    type: '"single" | "range"',
    default: '"single"',
    description: "One date, or a start and an end.",
  },
  {
    name: "value / defaultValue",
    type: "Date | DateRange",
    description:
      "The picked date, or `{ from, to }` (both `Date`) in range mode. Calendar calls this `selected`. A range reaches `onValueChange` only once both ends are set.",
  },
  {
    name: "onValueChange",
    type: "(value: Date | DateRange | undefined) => void",
    description: "Called when a date or a complete range is picked, or the field is cleared.",
  },
  {
    name: "presets",
    type: "{ label: string; range: DateRange }[]",
    description: "Range mode: ranges listed beside the calendar. Off by default.",
  },
];

/** The time fields beside the date. */
export const datePickerTimeProps: PropDef[] = [
  {
    name: "time / defaultTime",
    type: "string | null",
    description: 'One time on the same day, as "HH:mm" in 24-hour form ("09:30", "17:00"). `null` shows an empty field.',
  },
  {
    name: "onTimeChange",
    type: "(time: string | null) => void",
    description: 'Called with "HH:mm" when a time is picked, typed, or cleared (`null`).',
  },
  {
    name: "timeRange / defaultTimeRange",
    type: "TimeRange | null",
    description: 'A start and an end on the same day: `{ start: "11:00", end: "12:45" }`, both "HH:mm", the end after the start. The end field shows the duration.',
  },
  {
    name: "onTimeRangeChange",
    type: "(range: TimeRange | null) => void",
    description: "Called when either time changes. Moving the start keeps the duration.",
  },
  {
    name: "step",
    type: "number",
    default: "15",
    description: "Minutes between time slots.",
  },
  {
    name: "hourCycle",
    type: "12 | 24",
    description: "Overrides the clock shown. Unset, it follows `locale` (or the browser's language): 12h for en-US, 24h for fr-FR. Values stay \"HH:mm\" either way.",
  },
];

/** The calendar in the date popover. */
export const datePickerCalendarProps: PropDef[] = [
  {
    name: "numberOfMonths",
    type: "1 | 2",
    default: "1 single, 2 range",
    description: "Months in the date popover.",
  },
  {
    name: "orientation",
    type: '"auto" | "horizontal" | "vertical"',
    default: '"auto"',
    description: "Two months side by side, stacked, or side by side when the viewport fits both.",
  },
  {
    name: "calendarProps",
    type: "Partial<CalendarProps>",
    description:
      "Passed to the calendar inside: `booked`, `available` and `disabled` matchers (such as `{ before: new Date() }`), `cellSize`, `dayDetail`, `showWeekNumber` and the rest of the Calendar API.",
  },
  {
    name: "locale",
    type: "string",
    description: "BCP 47 locale for the labels, the calendar and the times. Defaults to the browser's.",
  },
];

/** How the trigger looks and behaves. */
export const datePickerTriggerProps: PropDef[] = [
  {
    name: "variant",
    type: '"outline" | "ghost"',
    default: '"outline"',
    description: "Outline: a bordered field that matches Select. Ghost: inline text with a hover fill.",
  },
  {
    name: "placeholder",
    type: "string",
    default: '"Pick a date" / "Pick dates"',
    description: "Shown while there is no value. The field keeps the width of its longest date or this text.",
  },
  {
    name: "clearable",
    type: "boolean",
    default: "true",
    description: "Outline variant: a clear button once a value is set.",
  },
  {
    name: "open / defaultOpen / onOpenChange",
    type: "boolean",
    description: "Controls the date popover.",
  },
  {
    name: "disabled",
    type: "boolean",
    default: "false",
    description: "Disables the whole picker.",
  },
  {
    name: "size",
    type: '"default" | "compact"',
    description: "Pins the trigger and popovers to one step of the size ladder.",
  },
];

/** Forms, labels and styling hooks. */
export const datePickerFormProps: PropDef[] = [
  {
    name: "name",
    type: "string",
    description:
      'Submits the value with a native form through a hidden input, in ISO 8601 local time: "2026-10-21", "2026-10-21T11:00" with a time, and two of those joined by "/" for a range or a start and end time. Empty until the value is complete.',
  },
  {
    name: "id",
    type: "string",
    description: "The date trigger's id, for a `<label htmlFor>`.",
  },
  {
    name: "aria-label",
    type: "string",
    description: "Names the group for screen readers, read before the date (\"Check-in: Oct 21\").",
  },
  {
    name: "className",
    type: "string",
    description: "Classes on the trigger's outer group.",
  },
];

/** The page's tables in page order, titled as on the page. */
export const apiReference: ApiTable[] = [
  { title: "Value", props: datePickerValueProps },
  { title: "Time", props: datePickerTimeProps },
  { title: "Calendar", props: datePickerCalendarProps },
  { title: "Trigger", props: datePickerTriggerProps },
  { title: "Forms and accessibility", props: datePickerFormProps },
];
