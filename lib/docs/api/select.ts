// The API reference of /docs/select: its PropsTables and the API section
// of /docs/select.md both read these, so the two cannot drift.
import type { ApiTable, PropDef } from "@/lib/docs/api/types";

// ---------------------------------------------------------------------------
// Props definitions
// ---------------------------------------------------------------------------

export const selectProps: PropDef[] = [
  {
    name: "value",
    type: "string",
    description: "Controlled selected value.",
  },
  {
    name: "defaultValue",
    type: "string",
    description: "Uncontrolled default value.",
  },
  {
    name: "onValueChange",
    type: "(value: string) => void",
    description: "Called when the selected value changes.",
  },
  {
    name: "disabled",
    type: "boolean",
    default: "false",
    description: "Disables the entire select.",
  },
  {
    name: "name",
    type: "string",
    description: "Name for form submission.",
  },
  {
    name: "required",
    type: "boolean",
    default: "false",
    description: "Marks the select as required in forms.",
  },
];

export const triggerProps: PropDef[] = [
  {
    name: "variant",
    type: '"bordered" | "borderless"',
    default: '"bordered"',
    description: "Visual style of the trigger.",
  },
  {
    name: "icon",
    type: "IconComponent",
    description: "Optional icon displayed before the value.",
  },
  {
    name: "placeholder",
    type: "string",
    default: '"Select…"',
    description: "Text shown when no value is selected.",
  },
  {
    name: "error",
    type: "string",
    description: "Error message shown below the trigger.",
  },
];

export const itemProps: PropDef[] = [
  {
    name: "index",
    type: "number",
    description: "Position index within the content for fluid hover.",
  },
  {
    name: "value",
    type: "string",
    description: "Unique value for this option.",
  },
  {
    name: "icon",
    type: "IconComponent",
    description: "Optional icon displayed before the label.",
  },
  {
    name: "disabled",
    type: "boolean",
    default: "false",
    description: "Disables this individual item.",
  },
];

export const contentProps: PropDef[] = [
  {
    name: "className",
    type: "string",
    description: "Additional classes for the menu container.",
  },
];

/** The page's tables in page order, titled as on the page. */
export const apiReference: ApiTable[] = [
  { title: "Select", props: selectProps },
  { title: "SelectTrigger", props: triggerProps },
  { title: "SelectContent", props: contentProps },
  { title: "SelectItem", props: itemProps },
];
