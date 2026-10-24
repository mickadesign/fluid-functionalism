// The API reference of /docs/calendar: its PropsTables and the API section
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
    description:
      "The selected day, or `{ from, to }` in range mode (both `Date`, `to` unset while the end is being picked). With `onSelect` it is controlled; without, it seeds the calendar's own state. DayPicker's name: DatePicker calls it `value`.",
  },
  {
    name: "onSelect",
    type: "(value: Date | DateRange | undefined) => void",
    description: "Called on every pick. In range mode the first pick returns a range with no `to`.",
  },
  {
    name: "required",
    type: "boolean",
    default: "false",
    description: "Keeps a selection: picking the selected day again doesn't clear it.",
  },
  {
    name: "min / max",
    type: "number",
    description: "Range mode: fewest and most nights a range may span.",
  },
];

/** Which days can be picked, and what each day shows. */
export const calendarDaysProps: PropDef[] = [
  {
    name: "booked",
    type: "Matcher | Matcher[]",
    description:
      "Days that are taken: unavailable, struck through, and announced as booked. A matcher is a `Date`, a `Date[]`, `{ from, to }`, `{ before }`, `{ after }`, `{ dayOfWeek: [0, 6] }`, or `(date) => boolean`.",
  },
  {
    name: "available",
    type: "Matcher | Matcher[]",
    description: "When set, every day it doesn't match is unavailable, such as `{ dayOfWeek: [1, 2, 3, 4, 5] }` for weekdays only.",
  },
  {
    name: "disabled",
    type: "Matcher | Matcher[]",
    description: "Days that can't be picked, muted without a line-through, such as `{ before: new Date() }` for the past.",
  },
  {
    name: "dayDetail",
    type: "(date: Date) => ReactNode",
    description:
      "A line under each day's number, such as a price. Return null for none, and give it a taller `cellSize` (56 and up). Any node works (a colored price, say); screen readers read it after the date. Keep it a pure function of the date: results are kept per day until you pass a new function.",
  },
];

/** How the months sit and how big the cells are. */
export const calendarLayoutProps: PropDef[] = [
  {
    name: "numberOfMonths",
    type: "1 | 2",
    default: "1",
    description: "Months on screen. Two months share one fluid hover and hide outside days.",
  },
  {
    name: "orientation",
    type: '"auto" | "horizontal" | "vertical"',
    default: '"auto"',
    description: "Two months side by side, stacked, or side by side when the container fits both.",
  },
  {
    name: "cellSize",
    type: "number",
    default: "36 (32 compact)",
    description: "Day cell size in px. Text stays on the type scale; bigger cells add room.",
  },
  {
    name: "fill",
    type: "boolean",
    default: "false",
    description: "Stretches the columns to the container. `cellSize` then caps the row height.",
  },
];

/** Extra rows, columns and the size step. */
export const calendarAppearanceProps: PropDef[] = [
  {
    name: "showWeekNumber",
    type: "boolean",
    default: "false",
    description: "A muted ISO week column, display only. Titles then start at the Monday column.",
  },
  {
    name: "showOutsideDays",
    type: "boolean",
    default: "true (1 month)",
    description: "Days of the neighbouring months. Always off with 2 months.",
  },
  {
    name: "size",
    type: '"default" | "compact"',
    description: "Pins the calendar to one step of the size ladder.",
  },
  {
    name: "weekStartsOn · locale · timeZone · month · onMonthChange · …",
    type: "DayPickerProps",
    description: "Every other DayPicker prop passes through.",
  },
];

/** The page's tables in page order, titled as on the page. */
export const apiReference: ApiTable[] = [
  { title: "Selection", props: calendarSelectionProps },
  { title: "Days", props: calendarDaysProps },
  { title: "Layout", props: calendarLayoutProps },
  { title: "Appearance", props: calendarAppearanceProps },
];
