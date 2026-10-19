// The API reference of /docs/sidebar: its PropsTables and the API section
// of /docs/sidebar.md both read these, so the two cannot drift.
import type { ApiTable, PropDef } from "@/lib/docs/api/types";

// ── Props tables ─────────────────────────────────────────
// Grouped the way the sidebar is built — shell, sections, rows — so a prop
// is where you'd look for the part it belongs to.

export const providerProps: PropDef[] = [
  { name: "open", type: "boolean", description: "Controlled open state — pair with onOpenChange." },
  { name: "onOpenChange", type: "(open: boolean) => void", description: "Fires when the trigger, rail, or shortcut wants to toggle." },
  { name: "defaultOpen", type: "boolean", default: "true", description: "Uncontrolled initial state. Read the sidebar_state cookie in a server layout to restore the last visit." },
  { name: "persist", type: "boolean", default: "true", description: "Write the desktop state to the sidebar_state cookie (7 days). Mobile drawer state never persists." },
  { name: "peek", type: '"none" | "hover" | "click"', default: '"none"', description: "What the collapsed edge does: an edge strip reveals the sidebar as a floating overlay, on hover or on click — and in hover mode, resting on the trigger peeks it too. Escape or an outside press dismisses; peeking never pins it or writes the cookie." },
  { name: "shortcut", type: "string | null", default: '"[" left · "]" right', description: "Bare-key toggle, side-aware; null disables. Focus-scoped: the innermost provider containing focus answers." },
  { name: "mobileBreakpoint", type: "number", default: "768", description: "Width (px) below which the sidebar becomes a modal drawer." },
  { name: "width / widthMobile", type: "string", default: '"16rem" / "18rem"', description: "Rail and drawer widths, also published as --sidebar-width and --sidebar-width-mobile." },
];

export const sidebarProps: PropDef[] = [
  { name: "side", type: '"left" | "right"', default: '"left"', description: "Which edge the rail lives on. The provider mirrors it into the default shortcut — \"[\" left, \"]\" right — and the trigger's icon, the rail handle, and the drawer's slide all follow." },
  { name: "variant", type: '"sidebar" | "floating" | "inset"', default: '"sidebar"', description: "Transparent rail, elevated floating card, or the inset pairing where SidebarInset becomes the card." },
  { name: "collapsible", type: '"offcanvas" | "none"', default: '"offcanvas"', description: "Offcanvas slides the rail away; none renders a static, always-open column. (The icon-rail mode is intentionally not supported.)" },
  { name: "rail", type: "boolean", default: "true", description: "The built-in resize/collapse handle: drag to resize (160–360px), click to collapse, drag past the minimum to collapse. false hides it; the trigger and shortcut still toggle." },
  { name: "railTooltipOpen", type: "boolean", description: "Pins the rail's tooltip open (true) or closed (false); undefined leaves it on hover. Dragging always hides it — the collapse demo uses it to spotlight the handle." },
  { name: "bordered", type: "boolean", default: "true", description: "The sidebar variant's inner-edge border." },
  { name: "SidebarTrigger", type: "ButtonProps", description: "Ghost icon button calling toggleSidebar(). Its tooltip carries the shortcut key." },
  { name: "SidebarContent viewportClassName", type: "string", description: "Extra classes for the scroll viewport — a ScrollArea carrying the scroll-fade mask, with the boundary hairline on its frame." },
];

/** Sections — SidebarGroup and its label row. */
export const sectionProps: PropDef[] = [
  { name: "SidebarGroup collapsible", type: "boolean", default: "false", description: "Turns the group's label into an accordion toggle for everything after it. Hover raises the label's contrast and reveals a chevron." },
  { name: "SidebarGroup open / defaultOpen / onOpenChange", type: "boolean · (open) => void", description: "Control the accordion, or leave it uncontrolled." },
  { name: "SidebarGroupActions", type: "part", description: "Clusters 1–3 SidebarGroupAction buttons on the label row. A collapsible label keeps its chevron one gap clear of them." },
  { name: "SidebarGroupLabel / SidebarGroupAction render", type: "ReactElement", description: "Both accept render / asChild for composition." },
];

/** Content level 1 — the top-level rows and everything they carry. */
export const level1Props: PropDef[] = [
  { name: "focusRing", type: "boolean", default: "true", description: "SidebarMenu: draw the traveling keyboard focus ring. Off, keyboard focus moves the hover background only — for menus whose rows are the whole surface, like a settings dialog's section list." },
  { name: "SidebarMenuButton isActive", type: "boolean", default: "false", description: "Marks the current row: aria-current, the traveling active background, and the semibold weight shift." },
  { name: "SidebarMenuButton icon", type: "IconComponent", description: "Leading icon — stroke width animates 1.5 → 2 with the row's state." },
  { name: "SidebarMenuButton status", type: '"active" | "unread" | "idle"', description: "Leads with a status dot instead of an icon: active/unread fill it, idle rings it. Stamps data-status, adds visually-hidden \"unread\" text, and active implies isActive." },
  { name: "SidebarMenuButton dot", type: '"filled" | "ring"', description: "Visual-only dot for when the status vocabulary doesn't fit. Overrides the status-derived dot; ignored when icon is set." },
  { name: "SidebarMenuButton size / variant", type: '"default" | "sm" | "lg" · "default" | "outline"', description: "Row height (default follows the size ladder; lg is a 48px two-line row) and an outline treatment for standalone rows." },
  { name: "SidebarMenuButton render / asChild", type: "ReactElement · boolean", description: "Render into a custom element, e.g. render={<Link href=…/>}." },
  { name: "SidebarMenuBadge", type: "part", description: "Trailing count. Keeps the rightmost slot when the row also has actions." },
  { name: "SidebarMenuAction showOnHover", type: "boolean", default: "false", description: "Hide the action until the row is hovered or focused. The row reserves its width only while it shows, so the label runs full width at rest. Tracks the row's own button — a child's hover never reveals it." },
  { name: "SidebarMenuActions", type: "part", description: "Clusters more than one action on a row and publishes the count, so the row reserves exactly the gutter the cluster needs." },
  { name: "SidebarMenu size", type: '"default" | "compact"', description: "Pins the menu's rows to one step of the size ladder; omitted, they follow the surrounding SizeProvider." },
  { name: "SidebarMenuSkeleton showIcon", type: "boolean", default: "false", description: "Placeholder row while data lands. Widths are deterministic, so SSR and client agree." },
];

/** Content level 2 — the sub-tree a row can own. */
export const level2Props: PropDef[] = [
  { name: "SidebarMenuSub open", type: "boolean", default: "true", description: "Built-in collapse on the sub-tree's measured height, never an animated auto — wire it to state alongside a toggling row." },
  { name: "SidebarMenuSubButton", type: '{ size, icon, isActive }', description: "Nested row: 24 / 28px tall, text stays at the parent rows' size. Renders an <a> by default; also accepts render / asChild." },
  { name: "SidebarMenuBadge / SidebarMenuAction", type: "part", description: "Behave as they do at level 1, scoped to the nested row: an action here reveals on its own row, not on its siblings or its parent." },
  { name: "Highlight scope", type: "—", description: "Each sub-menu runs its own hover/active/focus overlays, so a nested row and its parent never fight over which one is lit." },
];

/** The page's tables in page order, titled as on the page. */
export const apiReference: ApiTable[] = [
  { title: "SidebarProvider", props: providerProps },
  { title: "Sidebar", props: sidebarProps },
  { title: "Sections", props: sectionProps },
  { title: "Content level 1", props: level1Props },
  { title: "Content level 2", props: level2Props },
];
