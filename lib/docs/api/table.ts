// The API reference of /docs/table: its PropsTables and the API section
// of /docs/table.md both read these, so the two cannot drift.
import type { ApiTable, PropDef } from "@/lib/docs/api/types";

export const tableProps: PropDef[] = [
  { name: "children", type: "ReactNode", description: "TableHeader and TableBody children." },
];

export const rowProps: PropDef[] = [
  { name: "index", type: "number", description: "Row index for fluid hover. Omit for header rows." },
  { name: "children", type: "ReactNode", description: "TableCell or TableHead children." },
];

export const emptyProps: PropDef[] = [
  { name: "columns", type: "number", description: "The table's column count, so the message spans the full width." },
  { name: "title", type: "ReactNode", description: "One short line saying what belongs in the table." },
  { name: "description", type: "ReactNode", description: "One line on how rows get there." },
  { name: "action", type: "ReactNode", description: "The control that creates the first row, e.g. a Button." },
  { name: "rows", type: "number", default: "3", description: "Height to hold, in body rows, so the first rows arriving don't shift what sits below the table." },
];

/** The page's tables in page order, titled as on the page. */
export const apiReference: ApiTable[] = [
  { title: "Table", props: tableProps },
  { title: "TableRow", props: rowProps },
  { title: "TableEmpty", props: emptyProps },
];
