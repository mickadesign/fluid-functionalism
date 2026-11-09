// The API reference of /docs/textarea: its PropsTable and the API section of
// /docs/textarea.md both read these, so the two cannot drift.
import type { ApiTable, PropDef } from "@/lib/docs/api/types";

export const textareaProps: PropDef[] = [
  { name: "size", type: '"default" | "compact"', description: "Pins the text and padding to one step of the size ladder." },
  { name: "aria-invalid", type: "boolean", description: "Tints the hairline red until the field is focused." },
  { name: "disabled", type: "boolean", default: "false", description: "Dims the field and drops its pointer events." },
  { name: "...props", type: "TextareaHTMLAttributes", description: "Every native textarea attribute: value, placeholder, rows, onChange." },
];

/** The page's tables in page order, titled as on the page. */
export const apiReference: ApiTable[] = [{ title: "Textarea", props: textareaProps }];
