// The API reference of /docs/input-copy: its PropsTables and the API section
// of /docs/input-copy.md both read these, so the two cannot drift.
import type { ApiTable, PropDef } from "@/lib/docs/api/types";

export const inputCopyProps: PropDef[] = [
  { name: "value", type: "string", description: "The text value to display and copy to clipboard." },
  { name: "label", type: "string", description: "Optional label displayed above the input." },
  { name: "variant", type: '"icon" | "button"', default: '"icon"', description: "Icon-only with tooltip, or button with visible label." },
  { name: "align", type: '"right" | "left"', default: '"right"', description: "Position of the copy action relative to the value." },
  { name: "onCopy", type: "() => void", description: "Callback fired after the value is successfully copied." },
  { name: "disabled", type: "boolean", default: "false", description: "Disables the input and copy button." },
];

/** The page's tables in page order, titled as on the page. */
export const apiReference: ApiTable[] = [
  { title: "InputCopy", props: inputCopyProps },
];
