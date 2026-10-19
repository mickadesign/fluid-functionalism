// The API reference of /docs/tabs-subtle: its PropsTables and the API section
// of /docs/tabs-subtle.md both read these, so the two cannot drift.
import type { ApiTable, PropDef } from "@/lib/docs/api/types";

export const tabProps: PropDef[] = [
  { name: "selectedIndex", type: "number", description: "Index of the currently selected tab." },
  { name: "onSelect", type: "(index: number) => void", description: "Called when a tab is selected." },
  { name: "idPrefix", type: "string", description: "Prefix for ARIA IDs linking tabs to panels." },
  { name: "activeLabel", type: "boolean", default: "false", description: "When true, only the selected tab shows its text label. Requires icons on tabs." },
  { name: "children", type: "ReactNode", description: "TabsSubtleItem children." },
];

export const tabItemProps: PropDef[] = [
  { name: "icon", type: "IconComponent", description: "Icon displayed in the tab.", default: "—" },
  { name: "label", type: "string", description: "Text label for the tab." },
  { name: "index", type: "number", description: "Position index within the tab list." },
];

export const tabPanelProps: PropDef[] = [
  { name: "index", type: "number", description: "Index of this panel." },
  { name: "selectedIndex", type: "number", description: "Currently selected tab index." },
  { name: "idPrefix", type: "string", description: "Must match the TabsSubtle idPrefix." },
  { name: "children", type: "ReactNode", description: "Panel content, only rendered when selected." },
];

/** The page's tables in page order, titled as on the page. */
export const apiReference: ApiTable[] = [
  { title: "TabsSubtle", props: tabProps },
  { title: "TabsSubtleItem", props: tabItemProps },
  { title: "TabsSubtlePanel", props: tabPanelProps },
];
