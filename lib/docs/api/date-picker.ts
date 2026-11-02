// The API reference of /docs/date-picker: its PropsTable and the API
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
    name: "value",
    type: "Date | DateRange",
    description: "The date, or `{ from, to }` in range mode. `defaultValue` sets it once.",
  },
  {
    name: "onValueChange",
    type: "(value: Date | DateRange | undefined) => void",
    description: "Runs on a pick, a complete range, or a clear.",
  },
  {
    name: "presets",
    type: "DatePickerPreset[]",
    description: "Range mode: `{ label, range }` shortcuts beside the calendar.",
  },
];

/** The time fields beside the date. */
export const datePickerTimeProps: PropDef[] = [
  {
    name: "time",
    type: "string | null",
    description: 'One time, as `"HH:mm"`. `null` leaves it empty, `defaultTime` sets it once.',
  },
  {
    name: "onTimeChange",
    type: "(time: string | null) => void",
    description: "Runs when you pick, type or clear a time.",
  },
  {
    name: "timeRange",
    type: "TimeRange | null",
    description: '`{ start: "11:00", end: "12:45" }`, with the duration shown. `defaultTimeRange` sets it once.',
  },
  {
    name: "onTimeRangeChange",
    type: "(range: TimeRange | null) => void",
    description: "Runs when either time changes. Moving the start keeps the duration.",
  },
  {
    name: "step",
    type: "number",
    default: "15",
    description: "Minutes between slots.",
  },
  {
    name: "hourCycle",
    type: "12 | 24",
    description: "Overrides the locale's clock. Values stay `\"HH:mm\"`.",
  },
];

/** The calendar in the date popover. */
export const datePickerCalendarProps: PropDef[] = [
  {
    name: "numberOfMonths",
    type: "1 | 2",
    default: "1, 2 in range mode",
    description: "Months in the popover.",
  },
  {
    name: "orientation",
    type: '"auto" | "horizontal" | "vertical"',
    default: '"auto"',
    description: "2 months side by side or stacked. Auto stacks when they don't fit.",
  },
  {
    name: "calendarProps",
    type: "Partial<CalendarProps>",
    description: "Reaches the calendar: `booked`, `disabled`, `cellSize`, `dayDetail`…",
  },
  {
    name: "locale",
    type: "string",
    description: "BCP 47 locale for dates and times. Defaults to the browser's.",
  },
];

/** How the trigger looks and behaves. */
export const datePickerTriggerProps: PropDef[] = [
  {
    name: "variant",
    type: '"outline" | "ghost"',
    default: '"outline"',
    description: "A bordered field like Select, or inline text.",
  },
  {
    name: "placeholder",
    type: "string",
    default: '"Pick a date"',
    description: 'Shows while nothing is picked. Range mode: "Pick dates".',
  },
  {
    name: "clearable",
    type: "boolean",
    default: "true",
    description: "Outline: a clear button once there's a value.",
  },
  {
    name: "open",
    type: "boolean",
    description: "Controls the date popover, with `onOpenChange`. `defaultOpen` sets it once.",
  },
  {
    name: "disabled",
    type: "boolean",
    default: "false",
    description: "Disables the picker. Block days with `calendarProps.disabled`.",
  },
  {
    name: "size",
    type: '"default" | "compact"',
    description: "Pins one step of the size ladder.",
  },
];

/** Forms, labels and styling hooks. */
export const datePickerFormProps: PropDef[] = [
  {
    name: "name",
    type: "string",
    description: 'Submits with a form, in ISO 8601: `"2026-10-21T11:00"`, ranges joined by `/`.',
  },
  {
    name: "id",
    type: "string",
    description: "The date trigger's id, for `<label htmlFor>`.",
  },
  {
    name: "aria-label",
    type: "string",
    description: 'Read before the date: "Check-in: Oct 21".',
  },
  {
    name: "className",
    type: "string",
    description: "Classes on the outer group.",
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
