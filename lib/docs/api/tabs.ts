// The API reference of /docs/tabs: its PropsTables and the API section
// of /docs/tabs.md both read these, so the two cannot drift.
import type { ApiTable, PropDef } from "@/lib/docs/api/types";

/* ────────── Props data ────────── */

export const tabsProps: PropDef[] = [
  { name: "value", type: "string", description: "Controlled active tab value. Takes precedence over selectedIndex." },
  { name: "onValueChange", type: "(value: string) => void", description: "Called when the active tab changes." },
  { name: "selectedIndex", type: "number", description: "Index-based controlled alternative." },
  { name: "onSelect", type: "(index: number) => void", description: "Called with the new index when the active tab changes." },
  { name: "defaultValue", type: "string", description: "Default active tab for uncontrolled usage." },
  { name: "children", type: "ReactNode", description: "TabsList and TabPanel children." },
];

export const tabsListProps: PropDef[] = [
  { name: "children", type: "ReactNode", description: "TabItem children." },
  { name: "className", type: "string", description: "Additional CSS classes for the container." },
];

export const tabItemProps: PropDef[] = [
  { name: "value", type: "string", description: "Unique value identifying this tab." },
  { name: "icon", type: "IconComponent", description: "Optional leading icon." },
  { name: "label", type: "string", description: "Text label for the tab." },
];

export const tabPanelProps: PropDef[] = [
  { name: "value", type: "string", description: "Must match a TabItem value." },
  { name: "children", type: "ReactNode", description: "Panel content, rendered when the matching tab is active." },
];

/** The page's tables in page order, titled as on the page. */
export const apiReference: ApiTable[] = [
  { title: "Tabs", props: tabsProps },
  { title: "TabsList", props: tabsListProps },
  { title: "TabItem", props: tabItemProps },
  { title: "TabPanel", props: tabPanelProps },
];
