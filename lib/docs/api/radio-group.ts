// The API reference of /docs/radio-group: its PropsTables and the API section
// of /docs/radio-group.md both read these, so the two cannot drift.
import type { ApiTable, PropDef } from "@/lib/docs/api/types";

export const groupProps: PropDef[] = [
  { name: "selectedIndex", type: "number", description: "Index of the currently selected item." },
  { name: "children", type: "ReactNode", description: "RadioItem children." },
];

export const itemProps: PropDef[] = [
  { name: "label", type: "string", description: "Text label for the radio item." },
  { name: "index", type: "number", description: "Position index within the group." },
  { name: "selected", type: "boolean", description: "Whether this item is selected." },
  { name: "onSelect", type: "() => void", description: "Called when this item is selected." },
  { name: "value", type: "string", description: "Optional value forwarded to the underlying primitive (Radix or Base UI) for form integration." },
];

/** The page's tables in page order, titled as on the page. */
export const apiReference: ApiTable[] = [
  { title: "RadioGroup", props: groupProps },
  { title: "RadioItem", props: itemProps },
];
