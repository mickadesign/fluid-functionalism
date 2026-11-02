// The API reference of /docs/checkbox-group: its PropsTables and the API section
// of /docs/checkbox-group.md both read these, so the two cannot drift.
import type { ApiTable, PropDef } from "@/lib/docs/api/types";

export const groupProps: PropDef[] = [
  { name: "checkedIndices", type: "Set<number>", description: "Set of checked item indices. Used for merged background rendering." },
  { name: "children", type: "ReactNode", description: "CheckboxItem children." },
];

export const itemProps: PropDef[] = [
  { name: "label", type: "string", description: "Text label for the checkbox." },
  { name: "index", type: "number", description: "Position index within the group." },
  { name: "checked", type: "boolean", description: "Whether this item is checked." },
  { name: "onToggle", type: "() => void", description: "Called when this item is toggled." },
];

/** The page's tables in page order, titled as on the page. */
export const apiReference: ApiTable[] = [
  { title: "CheckboxGroup", props: groupProps },
  { title: "CheckboxItem", props: itemProps },
];
