// The API reference of /docs/calendar: its PropsTable and the API section
// of /docs/calendar.md both read these, so the two cannot drift.
import type { ApiTable, PropDef } from "@/lib/docs/api/types";

/** What gets picked. Calendar keeps DayPicker's names (`selected`,
 *  `onSelect`); DatePicker, a form control, uses `value` / `onValueChange`. */
export const calendarSelectionProps: PropDef[] = [
  {
    name: "mode",
    type: '"single" | "range"',
    default: '"single"',
    description: "One day, or a start and an end.",
  },
  {
    name: "selected",
    type: "Date | DateRange",
    description: "The day, or `{ from, to }` in range mode. DatePicker calls it `value`.",
  },
  {
    name: "onSelect",
    type: "(value: Date | DateRange | undefined) => void",
    description: "Runs on every pick. The first range pick has no `to` yet.",
  },
  {
    name: "required",
    type: "boolean",
    default: "false",
    description: "Picking the selected day again keeps it.",
  },
  {
    name: "min / max",
    type: "number",
    description: "Range mode: fewest and most nights.",
  },
];

/** Which days can be picked, and what each day shows. */
export const calendarDaysProps: PropDef[] = [
  {
    name: "booked",
    type: "Matcher | Matcher[]",
    description: "Taken days, struck through. A matcher is a date, `{ before }`, `{ dayOfWeek: [0, 6] }` or a function.",
  },
  {
    name: "available",
    type: "Matcher | Matcher[]",
    description: "Only these days open, such as `{ dayOfWeek: [1, 2, 3, 4, 5] }`.",
  },
  {
    name: "disabled",
    type: "Matcher | Matcher[]",
    description: "Days you can't pick, such as `{ before: new Date() }`.",
  },
  {
    name: "dayDetail",
    type: "(date: Date) => ReactNode",
    description: "A line under each number, like a price. Needs `cellSize` 56 or more. Keep it pure.",
  },
];

/** How the months sit and how big the cells are. */
export const calendarLayoutProps: PropDef[] = [
  {
    name: "numberOfMonths",
    type: "1 | 2",
    default: "1",
    description: "Months on screen, under one fluid hover.",
  },
  {
    name: "orientation",
    type: '"auto" | "horizontal" | "vertical"',
    default: '"auto"',
    description: "2 months side by side or stacked. Auto stacks when they don't fit.",
  },
  {
    name: "cellSize",
    type: "number",
    default: "36, 32 compact",
    description: "Cell size in px. Numbers keep their size.",
  },
  {
    name: "fill",
    type: "boolean",
    default: "false",
    description: "Columns stretch to the container, rows stop at `cellSize`.",
  },
];

/** Extra rows, columns and the size step. */
export const calendarAppearanceProps: PropDef[] = [
  {
    name: "showWeekNumber",
    type: "boolean",
    default: "false",
    description: "A muted ISO week column.",
  },
  {
    name: "showOutsideDays",
    type: "boolean",
    default: "true, false with 2 months",
    description: "Days of the neighbouring months.",
  },
  {
    name: "size",
    type: '"default" | "compact"',
    description: "Pins one step of the size ladder.",
  },
  {
    name: "DayPicker props",
    type: "DayPickerProps",
    description: "The rest pass through: `weekStartsOn`, `locale`, `month`…",
  },
];

/** The page's tables in page order, titled as on the page. */
export const apiReference: ApiTable[] = [
  { title: "Selection", props: calendarSelectionProps },
  { title: "Days", props: calendarDaysProps },
  { title: "Layout", props: calendarLayoutProps },
  { title: "Appearance", props: calendarAppearanceProps },
];
