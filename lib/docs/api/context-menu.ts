// The API reference of /docs/context-menu: its PropsTables and the API
// section of /docs/context-menu.md both read these, so the two cannot drift.
import type { ApiTable, PropDef } from "@/lib/docs/api/types";

export const contextMenuProps: PropDef[] = [
  { name: "children", type: "ReactNode", description: "A ContextMenuTrigger and a ContextMenuContent." },
  { name: "onOpenChange", type: "(open: boolean) => void", description: "Called as the menu opens and closes. Record what was right-clicked in the trigger's onContextMenu." },
  { name: "disabled", type: "boolean", default: "false", description: "Right-clicks keep the browser's own menu." },
  { name: "size", type: '"default" | "compact"', default: "from SizeProvider", description: "Pins the menu's rows to one step of the size ladder." },
];

export const contextMenuTriggerProps: PropDef[] = [
  { name: "filter", type: "(target: Element) => boolean", description: "Which right-clicked elements open the menu; the rest keep the browser's. Text fields always keep the browser's (paste, spelling)." },
  { name: "render", type: "ReactElement", description: "The element that opens the menu, in place of the default <div>. Its own onContextMenu and onKeyDown run first." },
  { name: "disabled", type: "boolean", default: "false", description: "This area keeps the browser's menu." },
  { name: "...props", type: "HTMLAttributes<HTMLElement>", description: "Passed to the area. Shift + F10 or the Menu key opens the menu under the focused element inside it." },
];

export const contextMenuContentProps: PropDef[] = [
  { name: "children", type: "ReactNode", description: "The Dropdown's items: MenuItem, DropdownSub, DropdownSearch, DropdownLabel, DropdownSeparator." },
  { name: "sideOffset", type: "number", default: "2", description: "Px between the pointer and the menu's top left corner." },
  { name: "className", type: "string", description: "Classes for the panel, such as a width (w-56)." },
  { name: "...props", type: "DropdownContent props", description: "checkedIndex, checkedIndices, collisionBoundary and the rest. The menu opens down and to the right of the pointer, and flips at the window's edges." },
];

/** The page's tables in page order, titled as on the page. */
export const apiReference: ApiTable[] = [
  { title: "ContextMenu", props: contextMenuProps },
  { title: "ContextMenuTrigger", props: contextMenuTriggerProps },
  { title: "ContextMenuContent", props: contextMenuContentProps },
];
