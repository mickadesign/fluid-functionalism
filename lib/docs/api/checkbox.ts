// The API reference of /docs/checkbox: its PropsTable and the API section of
// /docs/checkbox.md both read these, so the two cannot drift.
import type { ApiTable, PropDef } from "@/lib/docs/api/types";

export const checkboxProps: PropDef[] = [
  { name: "checked", type: "boolean", description: "Controlled state. Pair it with onCheckedChange." },
  { name: "defaultChecked", type: "boolean", default: "false", description: "Initial state when uncontrolled." },
  { name: "indeterminate", type: "boolean", default: "false", description: "Draws a dash instead of the check, for a box that stands for a partly selected set. Clicking it reports true." },
  { name: "onCheckedChange", type: "(checked: boolean) => void", description: "Called on every toggle, by a click, Space, or its FieldLabel." },
  { name: "size", type: '"default" | "compact"', description: "Pins the box to one step of the size ladder (16px or 14px). Omitted, it follows the surrounding SizeProvider." },
  { name: "id", type: "string", description: "Lets a FieldLabel name and toggle it through htmlFor." },
  { name: "aria-invalid", type: "boolean", description: "Tints the unchecked box red." },
  { name: "disabled", type: "boolean", default: "false", description: "Dims the box and drops its pointer events." },
  { name: "name / value / required", type: "string / string / boolean", description: "Submit the checkbox with a native form." },
];

/** The page's tables in page order, titled as on the page. */
export const apiReference: ApiTable[] = [{ title: "Checkbox", props: checkboxProps }];
