// The API reference of /docs/input: its PropsTable and the API section of
// /docs/input.md both read these, so the two cannot drift.
import type { ApiTable, PropDef } from "@/lib/docs/api/types";

export const inputProps: PropDef[] = [
  { name: "size", type: '"default" | "compact"', description: "Pins the field to one step of the size ladder. Omitted, it follows the surrounding SizeProvider." },
  { name: "aria-invalid", type: "boolean", description: "Tints the hairline red until the field is focused." },
  { name: "disabled", type: "boolean", default: "false", description: "Dims the field and drops its pointer events." },
  { name: "type", type: "string", default: '"text"', description: "Any native type. number shows minus and plus buttons in place of the browser spinners; file shows a file icon and muted text until a file is picked." },
  { name: "...props", type: "InputHTMLAttributes", description: "Every native input attribute: value, placeholder, min, max, step, onChange." },
];

/** The page's tables in page order, titled as on the page. */
export const apiReference: ApiTable[] = [{ title: "Input", props: inputProps }];
