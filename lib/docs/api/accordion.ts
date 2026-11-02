// The API reference of /docs/accordion: its PropsTables and the API section
// of /docs/accordion.md both read these, so the two cannot drift.
import type { ApiTable, PropDef } from "@/lib/docs/api/types";

export const rootProps: PropDef[] = [
  { name: "type", type: '"single" | "multiple"', default: '"single"', description: "Whether one or multiple items can be expanded." },
  { name: "collapsible", type: "boolean", default: "true", description: "Allow collapsing all items when type is single." },
  { name: "defaultValue", type: "string | string[]", description: "Initially expanded item value(s)." },
  { name: "value", type: "string | string[]", description: "Controlled expanded value(s)." },
  { name: "onValueChange", type: "(value) => void", description: "Callback when expanded state changes." },
  { name: "highlight", type: '"trigger" | "item"', default: '"item"', description: "What an open item tints: item holds a block across the row and its panel, trigger scopes it to the row and shows it on hover. Same prop on AccordionItem standalone." },
];

export const itemProps: PropDef[] = [
  { name: "value", type: "string", description: "Unique identifier for this item." },
  { name: "index", type: "number", description: "Position index for fluid hover. Required inside AccordionGroup, omit for standalone." },
  { name: "disabled", type: "boolean", default: "false", description: "Whether this item is disabled." },
];

export const triggerProps: PropDef[] = [
  { name: "children", type: "ReactNode", description: "Trigger label content." },
];

export const contentProps: PropDef[] = [
  { name: "children", type: "ReactNode", description: "Collapsible content." },
];

/** The page's tables in page order, titled as on the page. */
export const apiReference: ApiTable[] = [
  { title: "Accordion / AccordionGroup", props: rootProps },
  { title: "AccordionItem", props: itemProps },
  { title: "AccordionTrigger", props: triggerProps },
  { title: "AccordionContent", props: contentProps },
];
