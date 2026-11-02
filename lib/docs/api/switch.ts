// The API reference of /docs/switch: its PropsTables and the API section
// of /docs/switch.md both read these, so the two cannot drift.
import type { ApiTable, PropDef } from "@/lib/docs/api/types";

export const switchProps: PropDef[] = [
  { name: "label", type: "string", description: "Text label displayed next to the switch." },
  { name: "checked", type: "boolean", description: "Whether the switch is on." },
  { name: "onToggle", type: "() => void", description: "Called when the switch is toggled." },
  { name: "disabled", type: "boolean", default: "false", description: "Disables the switch." },
];

/** The page's tables in page order, titled as on the page. */
export const apiReference: ApiTable[] = [
  { title: "Switch", props: switchProps },
];
