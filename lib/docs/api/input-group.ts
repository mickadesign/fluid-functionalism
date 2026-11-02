// The API reference of /docs/input-group: its PropsTables and the API section
// of /docs/input-group.md both read these, so the two cannot drift.
import type { ApiTable, PropDef } from "@/lib/docs/api/types";

export const groupProps: PropDef[] = [
  { name: "children", type: "ReactNode", description: "InputField children." },
];

export const fieldProps: PropDef[] = [
  { name: "label", type: "string", description: "Label text above the input." },
  { name: "labelHidden", type: "boolean", default: "false", description: "Keep the label for assistive tech but don't render it — for inline fields (a toolbar search) where the placeholder carries the meaning." },
  { name: "index", type: "number", description: "Position index within the group." },
  { name: "value", type: "string", description: "Controlled input value." },
  { name: "onChange", type: "(value: string) => void", description: "Called when the input value changes." },
  { name: "placeholder", type: "string", description: "Placeholder text." },
  { name: "icon", type: "IconComponent", description: "Leading icon inside the input." },
  { name: "error", type: "string", description: "Error message shown below the input." },
  { name: "disabled", type: "boolean", default: "false", description: "Disables the input." },
];

/** The page's tables in page order, titled as on the page. */
export const apiReference: ApiTable[] = [
  { title: "InputGroup", props: groupProps },
  { title: "InputField", props: fieldProps },
];
