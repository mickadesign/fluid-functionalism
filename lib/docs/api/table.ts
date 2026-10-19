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

/** The page's tables in page order, titled as on the page. */
export const apiReference: ApiTable[] = [
  { title: "Table", props: tableProps },
  { title: "TableRow", props: rowProps },
];
