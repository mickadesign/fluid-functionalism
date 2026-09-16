"use client";

import { Fragment, createElement, useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { AnimatePresence, motion, useInView, useReducedMotion } from "framer-motion";
import { spring } from "@/lib/springs";
import {
  SidebarProvider,
  Sidebar,
  SidebarInset,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupAction,
  SidebarGroupActions,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuAction,
  SidebarMenuActions,
  SidebarMenuBadge,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
} from "@/components/flavored/sidebar";
import { Button } from "@/registry/radix/button";
import { Tooltip, TooltipPortalContainer } from "@/registry/radix/tooltip";
import {
  DropdownMenu,
  DropdownTrigger,
  DropdownContent,
} from "@/components/flavored/dropdown";
import { MenuItem } from "@/registry/default/menu-item";
import { useIcons, useIcon, type IconName } from "@/lib/icon-context";
import { useShape } from "@/lib/shape-context";
import { fontWeights } from "@/lib/font-weight";
import { ComponentPreview } from "@/lib/docs/ComponentPreview";
import { PropsTable, type PropDef } from "@/lib/docs/PropsTable";
import { DocPage, DocSection } from "@/lib/docs/DocPage";
import { useNarrowFrame } from "@/lib/use-narrow-frame";
import { PlaygroundLayout } from "@/lib/docs/playground";
import { SidebarPlayground, FooterCalloutStack } from "@/lib/docs/playgrounds/sidebar";
import { WorkspaceMenuItems, SIDEBAR_MENU_POPUP } from "@/lib/docs/workspace-demo";
import {
  SidebarWorkspaceHeader,
  WorkspaceTile,
} from "@/components/sidebar-app/workspace-header";
import { SidebarSearchField } from "@/components/sidebar-app/search-field";
import { SidebarInsetTopbar } from "@/components/sidebar-app/inset-topbar";
import { SettingsDialog } from "@/components/dialog-sidebar/settings-dialog";
import {
  Card,
  CardDescription,
  CardGroup,
  CardHeader,
  CardImage,
  CardMedia,
  CardTitle,
} from "@/registry/default/card";
import { BANNER } from "@/lib/docs/playgrounds/card";
import { SIDEBAR_THREADS } from "@/app/components/demo-data";
import { useSurface } from "@/lib/surface-context";
import { surfaceClasses, surfaceHoverClasses } from "@/lib/surface-classes";
import {
  AI_CALLOUT,
  AI_NAV,
  AI_THREADS,
  AI_WORKSPACE,
  WIKI_PRIVATE,
  WIKI_RECENT,
  WIKI_SHARED,
} from "./example-data";

// ── Code snippets ────────────────────────────────────────

const nestingCode = `const [open, setOpen] = useState<string | null>("Agents");

<SidebarMenuItem>
  {/* Level 1 — the row that owns the sub-tree. group/parent-row scopes the
      chevron reveal to this button (the <li> also wraps the sub-menu, so a
      child's hover must never light the parent's chevron), and the pinned
      gutter keeps the chevron from sliding on hover. */}
  <SidebarMenuButton
    icon={BrainIcon}
    className="group/parent-row"
    style={{ "--row-gutter": "var(--row-gutter-hover)" }}
    onClick={() => setOpen((v) => (v === "Agents" ? null : "Agents"))}
    aria-expanded={open === "Agents"}
  >
    Agents
    {/* one chevron-right glyph in an action-sized slot, sprung 90° to point
        down while open; at rest an open row hides it — hover/focus reveals */}
    <span className="ml-auto -mr-0.5 flex size-6 shrink-0 items-center justify-center">
      <motion.span
        className="inline-flex"
        animate={{ rotate: open === "Agents" ? 90 : 0 }}
        transition={spring.fast}
      >
        <ChevronRightIcon
          size={16}
          strokeWidth={1.5}
          className={\`text-muted-foreground transition-opacity duration-80 \${open === "Agents"
            ? "opacity-0 group-hover/parent-row:opacity-100 group-focus-within/parent-row:opacity-100"
            : "opacity-100"}\`}
        />
      </motion.span>
    </span>
  </SidebarMenuButton>

  {/* Level 2 — collapses on measured height, never an animated "auto" */}
  <SidebarMenuSub open={open === "Agents"}>
    {agents.map((agent) => (
      <SidebarMenuSubItem key={agent.label}>
        <SidebarMenuSubButton
          href="#"
          icon={agent.icon}
          isActive={agent.label === current}
        >
          {agent.label}
        </SidebarMenuSubButton>
      </SidebarMenuSubItem>
    ))}
  </SidebarMenuSub>
</SidebarMenuItem>`;

const actionsCode = `{/* The section label carries actions of its own */}
<SidebarGroup collapsible>
  <SidebarGroupLabel>Threads</SidebarGroupLabel>
  <SidebarGroupActions>
    <SidebarGroupAction aria-label="New thread"><PlusIcon /></SidebarGroupAction>
    <SidebarGroupAction aria-label="Filter"><SlidersIcon /></SidebarGroupAction>
  </SidebarGroupActions>

  <SidebarMenu>
    {/* Status leads instead of an icon: active/unread fill the dot, idle
        rings it, and "unread" is announced to screen readers. The badge
        keeps the rightmost slot; the cluster reveals to its left and owns
        the row's gutter */}
    {threads.map((thread) => (
      <SidebarMenuItem key={thread.label}>
        <SidebarMenuButton status={thread.status}>{thread.label}</SidebarMenuButton>
        <SidebarMenuBadge>{thread.badge}</SidebarMenuBadge>
        <SidebarMenuActions showOnHover>
          <Tooltip content="Branch thread" side="top">
            <SidebarMenuAction aria-label="Branch"><CornerIcon /></SidebarMenuAction>
          </Tooltip>
          <Tooltip content="Share thread" side="top">
            <SidebarMenuAction aria-label="Share"><LinkIcon /></SidebarMenuAction>
          </Tooltip>
          {/* the overflow action opens a menu — no tooltip, like every other
              dropdown trigger, and 240px wide like the header/footer menus
              so all of the sidebar's popups read as one family */}
          <DropdownMenu>
            <DropdownTrigger render={
              <SidebarMenuAction aria-label="More options"><MoreIcon /></SidebarMenuAction>
            } />
            <DropdownContent className="min-w-[240px] w-[240px]" align="start" sideOffset={4}>
              <MenuItem index={0} icon={PencilIcon} label="Rename" onSelect={() => {}} />
              <MenuItem index={1} icon={XIcon} label="Delete" onSelect={() => {}} />
            </DropdownContent>
          </DropdownMenu>
        </SidebarMenuActions>
      </SidebarMenuItem>
    ))}
  </SidebarMenu>
</SidebarGroup>`;

const noIconRailCode = `// ❌ The icon rail. Collapsing to a strip of glyphs keeps the
// sidebar's cost without its value: every destination takes a
// hover, a beat, a tooltip — and section labels have no icon to
// shrink to, so the structure collapses to a divider. The nav
// becomes a quiz — which is why \`collapsible\` here is only
// "offcanvas" | "none".

// ✅ Collapsed means gone. The canvas gets every pixel back, and
// peek="hover" floats the REAL sidebar — labels and all — the
// moment the cursor reaches the collapsed edge or the trigger.
<SidebarProvider peek="hover">
  <Sidebar variant="inset">…</Sidebar>
  <SidebarInset>
    <SidebarTrigger />
  </SidebarInset>
</SidebarProvider>`;

const alignmentCode = `// One rhythm everywhere: 24px icon buttons, gap-1, inside the
// section's p-2 with pr-1.5 — so every trailing icon centre lands
// 26px in from the sidebar's inner edge, 28px to the next column.
// Header buttons, row action clusters and footer buttons all share
// the same axes; the guides trace the measured centres.

<SidebarHeader>
  <div className="flex items-center gap-1 pr-1.5">
    {/* -mr-1.5 puts the brand row's own chevron slot on the next 28px column */}
    <div className="min-w-0 flex-1 -mr-1.5">{/* brand row */}</div>
    <div className="flex items-center gap-1">
      <Button variant="ghost" size="icon-compact" className="size-6 shrink-0" />
      <Button variant="ghost" size="icon-compact" className="size-6 shrink-0" />
      <Button variant="ghost" size="icon-compact" className="size-6 shrink-0" />
    </div>
  </div>
</SidebarHeader>

{/* the label row's own cluster sits on the same trailing columns */}
<SidebarGroup collapsible>
  <SidebarGroupLabel>Threads</SidebarGroupLabel>
  <SidebarGroupActions>{/* 3 SidebarGroupActions */}</SidebarGroupActions>
</SidebarGroup>

<SidebarMenuItem>
  {/* the badge holds the rightmost slot; the cluster reveals to its left */}
  <SidebarMenuButton status={status}>{label}</SidebarMenuButton>
  <SidebarMenuBadge>{badge}</SidebarMenuBadge>
  <SidebarMenuActions showOnHover>{/* 3 actions */}</SidebarMenuActions>
</SidebarMenuItem>

<SidebarFooter>
  <div className="flex items-center gap-1 pr-1.5">
    <div className="min-w-0 flex-1 -mr-1.5">{/* user row */}</div>
    <div className="flex items-center gap-1">
      {/* icon buttons, as many as the row holds */}
    </div>
  </div>
</SidebarFooter>

{/* The workspace and user menus hang off the same axes: SIDEBAR_MENU_POPUP
    (from the sidebar-menu-grid lib) sizes the popup to the trigger +10px,
    shifts it -ml-1 onto the row's edge, and grids the items so tiles and
    labels land on the rows' 16px/32px axes. Interpolated live, so this
    snippet can never drift from the shipped value:
    "${SIDEBAR_MENU_POPUP}" */}
<DropdownContent className={SIDEBAR_MENU_POPUP} align="start" sideOffset={4}>`;

// ── Props tables ─────────────────────────────────────────
// Grouped the way the sidebar is built — shell, sections, rows — so a prop
// is where you'd look for the part it belongs to.

const providerProps: PropDef[] = [
  { name: "open", type: "boolean", description: "Controlled open state — pair with onOpenChange." },
  { name: "onOpenChange", type: "(open: boolean) => void", description: "Fires when the trigger, rail, or shortcut wants to toggle." },
  { name: "defaultOpen", type: "boolean", default: "true", description: "Uncontrolled initial state. Read the sidebar_state cookie in a server layout to restore the last visit." },
  { name: "persist", type: "boolean", default: "true", description: "Write the desktop state to the sidebar_state cookie (7 days). Mobile drawer state never persists." },
  { name: "peek", type: '"none" | "hover" | "click"', default: '"none"', description: "What the collapsed edge does: an edge strip reveals the sidebar as a floating overlay, on hover or on click — and in hover mode, resting on the trigger peeks it too. Escape or an outside press dismisses; peeking never pins it or writes the cookie." },
  { name: "shortcut", type: "string | null", default: '"[" left · "]" right', description: "Bare-key toggle, side-aware; null disables. Focus-scoped: the innermost provider containing focus answers." },
  { name: "mobileBreakpoint", type: "number", default: "768", description: "Width (px) below which the sidebar becomes a modal drawer." },
  { name: "width / widthMobile", type: "string", default: '"16rem" / "18rem"', description: "Rail and drawer widths, also published as --sidebar-width and --sidebar-width-mobile." },
];

const sidebarProps: PropDef[] = [
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
const sectionProps: PropDef[] = [
  { name: "SidebarGroup collapsible", type: "boolean", default: "false", description: "Turns the group's label into an accordion toggle for everything after it. Hover raises the label's contrast and reveals a chevron." },
  { name: "SidebarGroup open / defaultOpen / onOpenChange", type: "boolean · (open) => void", description: "Control the accordion, or leave it uncontrolled." },
  { name: "SidebarGroupActions", type: "part", description: "Clusters 1–3 SidebarGroupAction buttons on the label row. A collapsible label keeps its chevron one gap clear of them." },
  { name: "SidebarGroupLabel / SidebarGroupAction render", type: "ReactElement", description: "Both accept render / asChild for composition." },
];

/** Content level 1 — the top-level rows and everything they carry. */
const level1Props: PropDef[] = [
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
const level2Props: PropDef[] = [
  { name: "SidebarMenuSub open", type: "boolean", default: "true", description: "Built-in collapse on the sub-tree's measured height, never an animated auto — wire it to state alongside a toggling row." },
  { name: "SidebarMenuSubButton", type: '{ size, icon, isActive }', description: "Nested row: 24 / 28px tall, text stays at the parent rows' size. Renders an <a> by default; also accepts render / asChild." },
  { name: "SidebarMenuBadge / SidebarMenuAction", type: "part", description: "Behave as they do at level 1, scoped to the nested row: an action here reveals on its own row, not on its siblings or its parent." },
  { name: "Highlight scope", type: "—", description: "Each sub-menu runs its own hover/active/focus overlays, so a nested row and its parent never fight over which one is lit." },
];

// ── Shared demo scaffolding ──────────────────────────────

/** Every preview stage on this page. 640px gives the rail room to be a rail.
 *  On a phone the previews are rail-only, and the rails run 300–580px of
 *  content, so 560 shows almost all of it without scrolling — the stage is
 *  the point on a page where the prose is deliberately short. */
const SHELL_HEIGHT = "h-[560px] md:h-[640px]";

/** Bounded app-shell frame every preview runs inside — the provider fills it
 *  instead of the viewport. Full-bleed shells don't want Inspect's rulers
 *  drawn over their chrome; every preview on this page passes
 *  `inspectRulers={false}` instead of the old z-20 masking hack. */
function SidebarShellFrame({
  children,
  heightClass = SHELL_HEIGHT,
}: {
  children: ReactNode;
  /** Override the frame's height — e.g. `aspect-square` for gallery rows. */
  heightClass?: string;
}) {
  return (
    <div
      className={`relative flex w-full overflow-hidden bg-background ${heightClass}`}
    >
      {children}
    </div>
  );
}

/** The header's brand row — the sidebar-workspace-header block, fed this
 *  page's workspace name and the shared switcher menu. */
function DemoHeaderRow() {
  return (
    <SidebarWorkspaceHeader
      name={AI_WORKSPACE}
      tile={<WorkspaceTile>A</WorkspaceTile>}
      menu={<WorkspaceMenuItems />}
      checkedIndex={0}
    />
  );
}

const SEARCH_SHORTCUT = "⌘K";

/** Tooltip content with the action's keystroke, on the same inverted surface
 *  treatment the sidebar trigger's tooltip uses. The label re-applies the
 *  surface's text-box trim (a flex row escapes it) and the chip pulls its
 *  box back with -my-1, so the tooltip keeps its single-line height. */
function tipWithShortcut(label: string, shortcut: string) {
  return (
    <span className="flex items-center gap-2">
      <span className="[text-box:trim-both_cap_alphabetic]">{label}</span>
      <kbd className="-my-1 flex h-4 min-w-4 items-center justify-center rounded border border-background/30 px-1 font-sans text-[10px] text-background/80">
        {shortcut}
      </kbd>
    </span>
  );
}

/** The header's search row — the sidebar-search-field block with its default
 *  placeholder and shortcut chip. */
function DemoSearch() {
  return <SidebarSearchField />;
}

/** Workspace menu + search — the header block every example shares.
 *  `search="inline"` swaps the full bar for a round icon button beside the
 *  workspace row. */
function DemoHeader({ search = "below" }: { search?: "below" | "inline" }) {
  const SearchIcon = useIcon("search");
  if (search === "inline") {
    return (
      <SidebarHeader>
        {/* 24px buttons, row inset pr-1.5: centres land on the section
            actions' axis, 26px from the sidebar's inner edge. */}
        <div className="flex items-center gap-1 pr-1.5">
          <div className="min-w-0 flex-1">
            <DemoHeaderRow />
          </div>
          <Tooltip content={tipWithShortcut("Search", SEARCH_SHORTCUT)} side="bottom">
            <Button
              variant="ghost"
              size="icon-compact"
              aria-label="Search"
              className="size-6 shrink-0"
            >
              <SearchIcon />
            </Button>
          </Tooltip>
        </div>
      </SidebarHeader>
    );
  }
  return (
    <SidebarHeader>
      <DemoHeaderRow />
      <DemoSearch />
    </SidebarHeader>
  );
}

// Local twin of the sidebar-user-footer block — carries the alignment demo's
// data-guide hooks; keep its classes in lockstep with the block.
function DemoFooterUser() {
  const ChevronsUpDown = useIcon("chevrons-up-down");
  const icons = useIcons();
  return (
    <SidebarMenu aria-label="User">
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownTrigger
            render={
              <SidebarMenuButton aria-label="Open user menu">
                {/* -ml-0.5 centres the 20px avatar on the rows' leading icon
                    axis (24px in); the chevron rides a 24px slot pulled
                    -mr-0.5 onto the trailing action axis — same idiom as the
                    nesting rows' chevron box. */}
                <Image
                  src="/micka.png"
                  alt=""
                  width={20}
                  height={20}
                  data-guide-img
                  className="-ml-0.5 -mr-0.5 size-5 shrink-0 rounded-full"
                />
                <span className="min-w-0 truncate text-[13px] text-foreground">Micka Touillaud</span>
                <span data-guide className="ml-auto -mr-0.5 flex size-6 shrink-0 items-center justify-center">
                  <ChevronsUpDown size={16} strokeWidth={1.5} className="text-muted-foreground" />
                </span>
              </SidebarMenuButton>
            }
          />
          <DropdownContent className={SIDEBAR_MENU_POPUP} side="top" align="start" sideOffset={6}>
            <MenuItem index={0} icon={icons.user} label="Profile" onSelect={() => {}} />
            <MenuItem index={1} icon={icons.settings} label="Settings" onSelect={() => {}} />
            <MenuItem index={2} icon={icons["arrow-left"]} label="Log out" onSelect={() => {}} />
          </DropdownContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}

/** The product's top-level nav — Chat, Agents, Knowledge, Runs, Evals under
 *  a section label that collapses the lot. The Layouts previews render it
 *  FLAT (`nested={false}`): those examples are about the shell, so plain
 *  selectable rows keep the rail quiet — and keep the layout galleries quiet
 *  snippet. The collapse example keeps the tree: each row owns a sub-tree,
 *  one starting open (five expanded sub-trees would outrun the frame, and a
 *  mix of open and closed is what a real tree looks like anyway). */
function DemoMenu({ nested = true }: { nested?: boolean }) {
  const icons = useIcons();
  const [open, setOpen] = useState<Record<string, boolean>>({ Chat: true });
  const [current, setCurrent] = useState(
    nested ? AI_NAV[0].children[0].label : AI_NAV[0].label
  );

  return (
    <SidebarGroup collapsible>
      <SidebarGroupLabel>Workspace</SidebarGroupLabel>
      <SidebarMenu>
        {AI_NAV.map((item) => {
          if (!nested) {
            return (
              <SidebarMenuItem key={item.label}>
                <SidebarMenuButton
                  icon={icons[item.icon]}
                  isActive={item.label === current}
                  onClick={() => setCurrent(item.label)}
                >
                  {item.label}
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          }
          const isOpen = !!open[item.label];
          return (
            <SidebarMenuItem key={item.label}>
              {/* Parents only expand/collapse — the current-page highlight
                  lives on the selected child alone. */}
              <SidebarMenuButton
                className="group/parent-row"
                icon={icons[item.icon]}
                onClick={() => setOpen((prev) => ({ ...prev, [item.label]: !prev[item.label] }))}
                aria-expanded={isOpen}
                style={{ "--row-gutter": "var(--row-gutter-hover)" } as CSSProperties}
              >
                {item.label}
                {/* The chevron rides the label's trailing edge: at rest it
                    only shows on a closed row, so an open tree isn't a column
                    of arrows. One chevron-right glyph, sprung 90° to point
                    down while the row is open. */}
                <span className="ml-auto -mr-0.5 flex size-6 shrink-0 items-center justify-center">
                  <motion.span
                    className="inline-flex"
                    animate={{ rotate: isOpen ? 90 : 0 }}
                    transition={spring.fast}
                  >
                    {createElement(icons["chevron-right"], {
                      size: 16,
                      strokeWidth: 1.5,
                      className: `text-muted-foreground transition-opacity duration-80 ${
                        isOpen
                          ? "opacity-0 group-hover/parent-row:opacity-100 group-focus-within/parent-row:opacity-100"
                          : "opacity-100"
                      }`,
                    })}
                  </motion.span>
                </span>
              </SidebarMenuButton>

              <SidebarMenuSub open={isOpen}>
                {item.children.map((child) => (
                  <SidebarMenuSubItem key={child.label}>
                    <SidebarMenuSubButton
                      href="#"
                      isActive={child.label === current}
                      onClick={(event) => {
                        event.preventDefault();
                        setCurrent(child.label);
                      }}
                    >
                      {child.label}
                    </SidebarMenuSubButton>
                    {child.badge && <SidebarMenuBadge>{child.badge}</SidebarMenuBadge>}
                  </SidebarMenuSubItem>
                ))}
              </SidebarMenuSub>
            </SidebarMenuItem>
          );
        })}
      </SidebarMenu>
    </SidebarGroup>
  );
}

/** Two examples are *about* the rail-and-main pairing, so they keep both
 *  halves at every width — the rail just narrows to leave the main region
 *  something to be. The other three are rail-only and never render this.
 *  The region itself stays blank on purpose: a bare topbar with the trigger
 *  and optional caption — skeleton page furniture competed with the rail. */
function DemoInsetContent({ title }: { title?: ReactNode }) {
  return (
    <SidebarInsetTopbar>
      <span className="text-[13px] text-muted-foreground">{title}</span>
    </SidebarInsetTopbar>
  );
}

/** Every preview's provider: scoped to the frame, no cookie writes, and
 *  pinned to a rail (`mobileBreakpoint={0}`) because a drawer inside a 325px
 *  frame hides the thing being demonstrated — the playground above is where
 *  the real drawer lives. The toggle key needs no opt-out: only the innermost
 *  provider containing focus answers a keypress. */
function DemoProvider({
  children,
  narrowWidth,
  ...props
}: {
  children: ReactNode;
  /** Rail width once the frame is too narrow for a 16rem rail. */
  narrowWidth?: string;
} & Omit<React.ComponentProps<typeof SidebarProvider>, "children">) {
  const narrow = useNarrowFrame();
  return (
    <SidebarProvider
      className="h-full min-h-0"
      persist={false}
      mobileBreakpoint={0}
      width={narrow ? narrowWidth : undefined}
      {...props}
    >
      {children}
    </SidebarProvider>
  );
}

/** Rail-only shell: the three examples whose subject lives entirely inside
 *  the sidebar. On a phone the mock main region is dropped and the rail takes
 *  the whole frame; above the breakpoint it sits beside the usual page. */
function DemoRailShell({
  children,
  insetTitle,
  heightClass,
}: {
  children: ReactNode;
  insetTitle?: ReactNode;
  heightClass?: string;
}) {
  const narrow = useNarrowFrame();
  return (
    <SidebarShellFrame heightClass={heightClass}>
      <DemoProvider narrowWidth="100%">
        <Sidebar collapsible="none" className="h-full">
          {children}
        </Sidebar>
        {!narrow && (
          <SidebarInset className="min-h-0">
            <DemoInsetContent title={insetTitle} />
          </SidebarInset>
        )}
      </DemoProvider>
    </SidebarShellFrame>
  );
}

/** Standard demo shell — rail and main together, for the examples about that
 *  relationship. */
function DemoShell({
  variant,
  insetTitle,
}: {
  variant?: "sidebar" | "floating" | "inset";
  insetTitle?: ReactNode;
}) {
  return (
    <SidebarShellFrame>
      <DemoProvider narrowWidth="11rem">
        <Sidebar variant={variant} className="h-full">
          <DemoHeader />
          <SidebarContent>
            <DemoMenu nested={false} />
          </SidebarContent>
          <SidebarFooter>
            <DemoFooterUser />
          </SidebarFooter>
        </Sidebar>
        {/* The floating card sits in a p-2 gutter — pad the main region's
            top so its header lines up with the card's. The inset variant's
            main is itself the card (own m-2), so it needs no extra padding. */}
        <SidebarInset className={variant === "floating" ? "min-h-0 pt-2" : "min-h-0"}>
          <DemoInsetContent title={insetTitle} />
        </SidebarInset>
      </DemoProvider>
    </SidebarShellFrame>
  );
}

// ── Section previews ─────────────────────────────────────

/** Stacked callouts: the footer pile as its own subject — hover fans the
 *  inline pile out, dismissing the front card promotes the next, and each
 *  card keeps its own step of the brand-blue ladder. Emptying the pile
 *  brings it back a beat later so the demo stays stocked. */
function StackedCalloutPreview({ variant }: { variant: "inline" | "banner" }) {
  const [restockKey, setRestockKey] = useState(0);
  const [hidden, setHidden] = useState(false);
  const onEmpty = () => {
    setHidden(true);
    setTimeout(() => {
      setRestockKey((k) => k + 1);
      setHidden(false);
    }, 1600);
  };
  return (
    <DemoRailShell heightClass="aspect-square">
      <DemoHeader />
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Threads</SidebarGroupLabel>
          <SidebarMenu>
            {AI_THREADS.slice(0, 3).map((thread) => (
              <SidebarMenuItem key={thread.label}>
                <SidebarMenuButton status={thread.status}>{thread.label}</SidebarMenuButton>
                <SidebarMenuBadge>{thread.badge}</SidebarMenuBadge>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        {!hidden && (
          <FooterCalloutStack key={restockKey} variant={variant} onEmpty={onEmpty} />
        )}
        <DemoFooterUser />
      </SidebarFooter>
    </DemoRailShell>
  );
}

/** Collapse, peek & resize: the whole shell, since collapsing is about what
 *  the main region does with the space. The rail's tooltip is pinned open as
 *  the section's subject — a real hover takes over (it follows the cursor
 *  along the handle), and it pins again once the pointer leaves the preview.
 *  Inset layout, simple thread rows: nothing competes with the rail. */
function CollapsePreview({
  peek = "hover",
  defaultOpen = true,
}: {
  peek?: "hover" | "click";
  defaultOpen?: boolean;
}) {
  const [cursorInside, setCursorInside] = useState(false);
  const [open, setOpen] = useState(defaultOpen);
  // Same in-view gate as the actions demo: never pin the rail tooltip while
  // the section is off screen, or it shifts back into the viewport detached.
  const frameRef = useRef<HTMLDivElement>(null);
  const inView = useInView(frameRef, { amount: 0.5 });
  // And the same local tooltip portal, so the pinned rail tooltip scrolls
  // with the page instead of chasing its anchor a frame behind.
  const [frameEl, setFrameEl] = useState<HTMLElement | null>(null);
  return (
    <div
      ref={(el) => {
        frameRef.current = el;
        setFrameEl(el);
      }}
      className="relative w-full self-stretch"
      // mousemove covers a pointer already resting inside at mount, and
      // pointerdown covers touch (no hover) — otherwise the pinned tooltip
      // could never be handed off and would sit over the demo forever.
      onMouseEnter={() => setCursorInside(true)}
      onMouseMove={() => setCursorInside(true)}
      onPointerDown={() => setCursorInside(true)}
      onMouseLeave={() => setCursorInside(false)}
    >
      <TooltipPortalContainer value={frameEl}>
      <SidebarShellFrame heightClass="aspect-square">
        <DemoProvider narrowWidth="11rem" peek={peek} open={open} onOpenChange={setOpen}>
          <Sidebar
            variant="inset"
            // Pinned only while the rail exists to anchor it — never while
            // collapsed, and never against the visitor's own hover.
            railTooltipOpen={inView && !cursorInside && open ? true : undefined}
            className="h-full"
          >
            <DemoHeader />
            <SidebarContent>
              <SidebarGroup>
                <SidebarGroupLabel>Threads</SidebarGroupLabel>
                <SidebarMenu>
                  {AI_THREADS.slice(0, 5).map((thread) => (
                    <SidebarMenuItem key={thread.label}>
                      <SidebarMenuButton status={thread.status}>{thread.label}</SidebarMenuButton>
                      <SidebarMenuBadge>{thread.badge}</SidebarMenuBadge>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroup>
            </SidebarContent>
          </Sidebar>
          <SidebarInset className="min-h-0">
            <DemoInsetContent />
          </SidebarInset>
        </DemoProvider>
      </SidebarShellFrame>
      </TooltipPortalContainer>
    </div>
  );
}

// ── Why no icon rail? — scripted comparison ──────────────

/** One clock drives both panels so the contrast is the point: while the left
 *  cursor is still quizzing tooltips one icon at a time, the right cursor's
 *  single hover already brought the whole sidebar back. */
const RAIL_PHASES = ["rest", "hover-0", "hover-1", "hover-2", "hover-3", "away"] as const;
type RailPhase = (typeof RAIL_PHASES)[number];
const RAIL_PHASE_MS: Record<RailPhase, number> = {
  rest: 900,
  "hover-0": 1600,
  "hover-1": 1600,
  "hover-2": 1600,
  "hover-3": 1600,
  away: 1500,
};

/** Two labeled sections of three — the peek shows them as-is; the rail has
 *  nowhere to put the labels, so between its groups all that survives is a
 *  divider. */
const RAIL_GROUPS: readonly {
  label: string;
  items: readonly { icon: IconName; label: string }[];
}[] = [
  {
    label: "Workspace",
    items: [
      { icon: "message-circle", label: "Chat" },
      { icon: "brain", label: "Agents" },
      { icon: "square-library", label: "Knowledge" },
    ],
  },
  {
    label: "Operations",
    items: [
      { icon: "play", label: "Runs" },
      { icon: "star", label: "Evals" },
      { icon: "settings", label: "Settings" },
    ],
  },
];

/** The cursor quizzes these rail indices — from the first item down and
 *  across the divider, where the section context is exactly what the rail
 *  can't show. */
const RAIL_HOVER_TARGETS = [0, 1, 2, 3] as const;

/* Geometry the cursors aim at: the rail opens with the size-6 workspace tile
   (mb-1), so its size-8 icons start at y=40 in a gap-1 column (centers 36px
   apart, first at y=56); the divider between groups (my-1 h-px, plus the
   column gap on both sides) pushes the second group down 13px. The peek
   trigger is size-7 inset pl-3.5 pt-3.5 into the corner (center at 28,28). */
const railIconCenterY = (index: number) =>
  index < 3 ? 56 + 36 * index : 177 + 36 * (index - 3);

function FakeCursor({ x, y }: { x: number; y: number }) {
  return (
    <motion.span
      aria-hidden
      className="pointer-events-none absolute left-0 top-0 z-30"
      initial={false}
      animate={{ x, y }}
      transition={spring.slow}
    >
      <svg width="18" height="18" viewBox="0 0 24 24">
        <path
          d="m4 4 7.07 17 2.51-7.39L21 11.07z"
          strokeWidth="1.5"
          strokeLinejoin="round"
          className="fill-foreground stroke-background"
        />
      </svg>
    </motion.span>
  );
}

function CompareLabel({ children }: { children: ReactNode }) {
  return (
    <span className="text-caption text-muted-foreground text-center">
      {children}
    </span>
  );
}

function IconRailVsPeekPreview({ paused }: { paused: boolean }) {
  const icons = useIcons();
  const shape = useShape();
  // Same surface math as the real peek card: one step above the substrate,
  // wearing the overlay shadow.
  const substrate = useSurface();
  const floatingLevel = Math.min(substrate + 1, 8);
  const containerRef = useRef<HTMLDivElement>(null);
  const inView = useInView(containerRef, { amount: 0.35 });
  const reduced = useReducedMotion();
  const [phase, setPhase] = useState<RailPhase>("rest");
  // Pausing clears the timer and freezes the current phase in place; resuming
  // picks the loop back up from that phase.
  const phaseRef = useRef<RailPhase>("rest");
  phaseRef.current = phase;

  useEffect(() => {
    if (!inView || reduced || paused) return;
    let index = RAIL_PHASES.indexOf(phaseRef.current);
    let timer: ReturnType<typeof setTimeout>;
    const step = () => {
      const current = RAIL_PHASES[index];
      setPhase(current);
      timer = setTimeout(() => {
        index = (index + 1) % RAIL_PHASES.length;
        step();
      }, RAIL_PHASE_MS[current]);
    };
    step();
    return () => clearTimeout(timer);
  }, [inView, reduced, paused]);

  // Reduced motion holds the frame that tells the story — a tooltip mid-quiz
  // on the left, the peek open on the right — with no cursors and no loop.
  const effective: RailPhase = reduced ? "hover-1" : phase;
  const hoverStep = effective.startsWith("hover-")
    ? Number(effective.slice("hover-".length))
    : null;
  const hoverIndex = hoverStep === null ? null : RAIL_HOVER_TARGETS[hoverStep];
  const engaged = hoverIndex !== null;
  const railItems = RAIL_GROUPS.flatMap((group) => group.items);
  const PanelLeftIcon = icons["panel-left"];

  return (
    <div
      ref={containerRef}
      className="flex w-full flex-col items-center gap-6 sm:flex-row sm:items-start sm:justify-center"
    >
      <div className="flex w-full min-w-0 max-w-[340px] flex-col gap-2">
        <div
          className={`relative z-20 h-80 overflow-hidden border border-border bg-background ${shape.container}`}
        >
          <div className="absolute inset-y-0 left-0 flex w-11 flex-col items-center gap-1 border-r border-border/60 pt-2">
            <span
              aria-hidden
              className={`mb-1 flex size-6 shrink-0 items-center justify-center bg-foreground text-[11px] text-background ${
                shape.bgRadius >= 20 ? "rounded-full" : "rounded-md"
              }`}
              style={{ fontVariationSettings: fontWeights.semibold }}
            >
              A
            </span>
            {RAIL_GROUPS.map((group, g) => (
              <Fragment key={group.label}>
                {/* The section label has no icon to shrink to — all that's
                    left of it is this line. */}
                {g > 0 && <span aria-hidden className="my-1 h-px w-6 bg-border" />}
                {group.items.map((item, i) => {
                  const index = g * 3 + i;
                  return (
                    <span
                      key={item.label}
                      className={`flex size-8 items-center justify-center rounded-lg transition-colors duration-80 ${
                        hoverIndex === index
                          ? "bg-hover text-foreground"
                          : "text-muted-foreground"
                      }`}
                    >
                      {createElement(icons[item.icon], { size: 16, strokeWidth: 1.5 })}
                    </span>
                  );
                })}
              </Fragment>
            ))}
          </div>
          {/* The tooltip arrives late on purpose — the hover-and-wait IS the cost. */}
          <AnimatePresence>
            {hoverIndex !== null && (
              <motion.span
                key={hoverIndex}
                className="absolute z-20 rounded-md bg-foreground px-2 py-1 text-[11px] leading-none text-background"
                style={{ left: 52, top: railIconCenterY(hoverIndex) - 10 }}
                initial={{ opacity: 0, x: -4 }}
                animate={{
                  opacity: 1,
                  x: 0,
                  transition: { ...spring.fast, delay: reduced ? 0 : 0.5 },
                }}
                exit={{ opacity: 0, transition: spring.fast.exit }}
              >
                {railItems[hoverIndex].label}
              </motion.span>
            )}
          </AnimatePresence>
          {!reduced && (
            <FakeCursor
              x={hoverIndex !== null ? 20 : 210}
              y={hoverIndex !== null ? railIconCenterY(hoverIndex) + 2 : 260}
            />
          )}
        </div>
        <CompareLabel>
          <span aria-hidden="true">❌</span> Icon rail: six glyphs, one tooltip
          at a time
        </CompareLabel>
      </div>

      <div className="flex w-full min-w-0 max-w-[340px] flex-col gap-2">
        <div
          className={`relative z-20 h-80 overflow-hidden border border-border bg-background ${shape.container}`}
        >
          {/* All the chrome a collapsed sidebar leaves behind: the trigger,
              inset 14px into the corner. Hover shows only while the cursor is
              actually on it — once the peek covers it, no state lingers
              behind. */}
          <div className="flex items-start pl-3.5 pt-3.5">
            <span
              className={`flex size-7 items-center justify-center rounded-md transition-colors duration-80 ${
                effective === "hover-0" ? "bg-hover text-foreground" : "text-muted-foreground"
              }`}
            >
              <PanelLeftIcon size={16} strokeWidth={1.5} />
            </span>
          </div>
          {/* The peek card wears the real overlay treatment: one surface
              above the substrate, overlay shadow, no border — same recipe as
              the component's own peek, in its floating-variant gutter. */}
          <AnimatePresence>
            {engaged && (
              <motion.div
                className={`absolute inset-y-2 left-2 z-10 flex w-44 flex-col overflow-hidden p-2 ${shape.container} ${surfaceClasses(floatingLevel, 3)}`}
                initial={{ x: "-108%" }}
                animate={{ x: 0, transition: spring.moderate }}
                exit={{ x: "-108%", transition: spring.moderate.exit }}
              >
                <div className="flex items-center gap-2 px-1 pb-1 pt-0.5">
                  <span
                    className={`flex size-5 items-center justify-center bg-foreground text-[10px] text-background ${
                      shape.bgRadius >= 20 ? "rounded-full" : "rounded-md"
                    }`}
                    style={{ fontVariationSettings: fontWeights.semibold }}
                  >
                    A
                  </span>
                  <span
                    className="text-[12px] text-foreground"
                    style={{ fontVariationSettings: fontWeights.semibold }}
                  >
                    {AI_WORKSPACE}
                  </span>
                </div>
                {/* The same six items, with the structure the rail dropped:
                    both section labels, shown normally. */}
                {RAIL_GROUPS.map((group, g) => (
                  <Fragment key={group.label}>
                    {/* Regular SidebarGroupLabel metrics: h-8, px-2, 12px. */}
                    <span className="flex h-8 shrink-0 items-center px-2 text-[12px] text-muted-foreground/70">
                      {group.label}
                    </span>
                    {group.items.map((item, i) => {
                      const isActive = g === 0 && i === 0;
                      return (
                        <div
                          key={item.label}
                          className={`flex h-7 shrink-0 items-center gap-2 rounded-lg px-2 ${
                            isActive ? "bg-active" : ""
                          }`}
                        >
                          <span className="text-muted-foreground">
                            {createElement(icons[item.icon], { size: 14, strokeWidth: 1.5 })}
                          </span>
                          <span className="text-[12px] text-foreground">{item.label}</span>
                          {/* The active row keeps its menu action visible —
                              one more thing the rail has no room for. */}
                          {isActive && (
                            <span className="ml-auto text-muted-foreground">
                              {createElement(icons["more-vertical"], {
                                size: 14,
                                strokeWidth: 1.5,
                              })}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </Fragment>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
          {/* One hover on the trigger opens the peek; then the cursor is
              already picking a destination while the other panel is still
              waiting on tooltips. */}
          {!reduced && (
            <FakeCursor
              x={effective === "hover-0" ? 26 : engaged ? 72 : 210}
              y={effective === "hover-0" ? 26 : engaged ? 90 : 260}
            />
          )}
        </div>
        <CompareLabel>
          <span aria-hidden="true">✅</span> Peek on hover: the whole sidebar,
          one hover
        </CompareLabel>
      </div>
    </div>
  );
}

/** The comparison's frame: adds the play/pause playback button (the same
 *  header slot the thinking-steps demos use) so the loop can be held on any
 *  frame. */
function IconRailVsPeekDemo() {
  const [paused, setPaused] = useState(false);
  const PauseIcon = useIcon("pause");
  const PlayIcon = useIcon("play");
  return (
    <ComponentPreview
      code={noIconRailCode}
      padding="responsive"
      inspectRulers={false}
      playbackButton={{
        icon: paused ? (
          <PlayIcon size={16} strokeWidth={1.5} />
        ) : (
          <PauseIcon size={16} strokeWidth={1.5} />
        ),
        tooltip: paused ? "Play" : "Pause",
        onClick: () => setPaused((v) => !v),
      }}
    >
      <IconRailVsPeekPreview paused={paused} />
    </ComponentPreview>
  );
}

// ── Icon alignment — measured guides ─────────────────────

// Thread rows: the same status-dot content the playground's first example
// shows (SIDEBAR_THREADS from demo-data).

const ALIGN_HEADER_ICONS: readonly { icon: IconName; label: string }[] = [
  { icon: "search", label: "Search" },
  { icon: "plus", label: "New thread" },
  { icon: "sliders-horizontal", label: "Filters" },
];

const ALIGN_FOOTER_ICONS: readonly { icon: IconName; label: string }[] = [
  { icon: "settings", label: "Settings" },
  { icon: "inbox", label: "Inbox" },
];

/** Icon alignment: header buttons, row action clusters and footer buttons
 *  all on the same vertical axes. The guides aren't drawn from constants —
 *  every icon's centre is MEASURED and each distinct axis gets a line, so
 *  the demo proves the rhythm rather than asserting it. One row keeps its
 *  cluster pinned visible (until the visitor's cursor takes over) so the
 *  guides visibly thread header, row and footer at once. */
function AlignmentPreview() {
  const icons = useIcons();
  const MoreIcon = useIcon("more-vertical");
  const [cursorInside, setCursorInside] = useState(false);
  const frameRef = useRef<HTMLDivElement>(null);
  const inView = useInView(frameRef, { amount: 0.5 });
  const [guides, setGuides] = useState<number[]>([]);
  // The guides render in a body portal at z-[60] so they draw OVER the
  // (body-portaled, z-50) dropdown popups too — the menus sit below the
  // lines, which then vouch for the popup icons as well. Document-space
  // coordinates keep them glued to the frame while the page scrolls.
  const [frameBox, setFrameBox] = useState<{ left: number; top: number; height: number } | null>(null);

  useEffect(() => {
    const root = frameRef.current;
    if (!root) return;
    const sameBox = (a: { left: number; top: number; height: number } | null, b: { left: number; top: number; height: number }) =>
      !!a && a.left === b.left && a.top === b.top && a.height === b.height;
    // Body-resize events only shift the frame's document offset — the guide
    // xs are frame-relative and unchanged — so that path refreshes just the
    // portal anchor instead of re-running the selector sweep.
    const measureFrameBox = () => {
      const rootRect = root.getBoundingClientRect();
      const next = {
        left: rootRect.left + window.scrollX,
        top: rootRect.top + window.scrollY,
        height: rootRect.height,
      };
      setFrameBox((prev) => (sameBox(prev, next) ? prev : next));
    };
    const measure = () => {
      measureFrameBox();
      const rootRect = root.getBoundingClientRect();
      const xs: number[] = [];
      // Each icon contributes both edges of its 24px slot (the size-6
      // button box, centred on the glyph), so every column reads as a pair
      // of rails around the button. Row icons are scoped to the Threads
      // group — the footer's user row carries an off-rhythm trailing
      // chevron that would draw near-miss lines.
      root
        .querySelectorAll(
          '[data-guide] svg, [data-guide-img], [data-sidebar="menu-action"] svg, [data-sidebar="group-action"] svg, [data-guide-rows] [data-sidebar="menu-button"] svg, [data-guide-rows] [data-sidebar="menu-button"] .size-2'
        )
        .forEach((el) => {
          const rect = el.getBoundingClientRect();
          const center = rect.left + rect.width / 2 - rootRect.left;
          xs.push(center - 12, center + 12);
        });
      // Label-start axes get a single line at the text's leading edge — one
      // for the header's workspace name, one for the Threads group label.
      root
        .querySelectorAll(
          '[data-guide-text], [data-guide-rows] [data-sidebar="group-label"] span.truncate'
        )
        .forEach((el) => {
          xs.push(el.getBoundingClientRect().left - rootRect.left);
        });
      xs.sort((a, b) => a - b);
      // Merge edges within 2px — hidden clusters overlay the visible one.
      const merged: number[] = [];
      for (const x of xs) {
        if (!merged.length || x - merged[merged.length - 1] > 2) merged.push(x);
      }
      setGuides((prev) =>
        prev.length === merged.length && prev.every((v, i) => v === merged[i])
          ? prev
          : merged
      );
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(root);
    // Content above the section changing height shifts the frame's document
    // offset without resizing it — watching the body catches that, but only
    // the cheap frame-box refresh rides it (any height animation elsewhere
    // on the page fires this per frame).
    const bodyObserver = new ResizeObserver(measureFrameBox);
    bodyObserver.observe(document.body);
    return () => {
      observer.disconnect();
      bodyObserver.disconnect();
    };
  }, []);

  return (
    <div
      ref={frameRef}
      className="relative w-full self-stretch"
      onMouseEnter={() => setCursorInside(true)}
      onMouseMove={() => setCursorInside(true)}
      onPointerDown={() => setCursorInside(true)}
      onMouseLeave={() => setCursorInside(false)}
    >
      <DemoRailShell>
        <SidebarHeader>
          <div className="flex items-center gap-1 pr-1.5">
            {/* The workspace dropdown, on the grid: tile nudged -ml-0.5 onto
                the leading axis, chevron in a -mr-0.5 24px slot — and the
                wrapper's -mr-1.5 puts that slot on the next 28px column
                beside the three buttons. */}
            <div className="min-w-0 flex-1 -mr-1.5">
              <SidebarMenu aria-label="Workspace">
                <SidebarMenuItem>
                  <DropdownMenu>
                    <DropdownTrigger
                      render={
                        <SidebarMenuButton aria-label="Switch workspace">
                          <span
                            aria-hidden
                            data-guide-img
                            className="-ml-0.5 -mr-0.5 flex size-5 shrink-0 items-center justify-center rounded-md bg-foreground text-[10px] text-background"
                            style={{ fontVariationSettings: fontWeights.semibold }}
                          >
                            A
                          </span>
                          <span
                            data-guide-text
                            className="min-w-0 truncate text-[13px] text-foreground"
                            style={{ fontVariationSettings: fontWeights.semibold }}
                          >
                            {AI_WORKSPACE}
                          </span>
                          <span
                            data-guide
                            className="ml-auto -mr-0.5 flex size-6 shrink-0 items-center justify-center"
                          >
                            {createElement(icons["chevron-down"], {
                              size: 16,
                              strokeWidth: 1.5,
                              className: "text-muted-foreground",
                            })}
                          </span>
                        </SidebarMenuButton>
                      }
                    />
                    <DropdownContent
                      className={SIDEBAR_MENU_POPUP}
                      align="start"
                      sideOffset={4}
                      checkedIndex={0}
                    >
                      <WorkspaceMenuItems />
                    </DropdownContent>
                  </DropdownMenu>
                </SidebarMenuItem>
              </SidebarMenu>
            </div>
            <div data-guide className="flex items-center gap-1">
              {ALIGN_HEADER_ICONS.map((entry) => (
                <Button
                  key={entry.label}
                  variant="ghost"
                  size="icon-compact"
                  aria-label={entry.label}
                  className="size-6 shrink-0"
                >
                  {createElement(icons[entry.icon])}
                </Button>
              ))}
            </div>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup collapsible data-guide-rows="">
            <SidebarGroupLabel>Threads</SidebarGroupLabel>
            {/* The section header's own actions sit on the same trailing
                axes as everything else. */}
            <SidebarGroupActions>
              <SidebarGroupAction aria-label="New thread">
                {createElement(icons.plus, {})}
              </SidebarGroupAction>
              <SidebarGroupAction aria-label="Filter threads">
                {createElement(icons["sliders-horizontal"], {})}
              </SidebarGroupAction>
              <SidebarGroupAction aria-label="More options">
                {createElement(icons["more-horizontal"], {})}
              </SidebarGroupAction>
            </SidebarGroupActions>
            <SidebarMenu>
              {/* Badges keep the rightmost slot; the hover cluster slides in
                  left of them. */}
              {SIDEBAR_THREADS.map((thread, i) => {
                const pinned = inView && !cursorInside && i === 1;
                return (
                  <SidebarMenuItem key={thread.label}>
                    {/* "active" implies the row-active treatment — mapped to
                        "unread" (same filled dot) so no page reads as
                        selected here. */}
                    <SidebarMenuButton
                      status={thread.status === "active" ? "unread" : thread.status}
                      className={pinned ? "bg-hover" : undefined}
                      style={
                        pinned
                          ? ({ "--row-gutter": "var(--row-gutter-hover)" } as CSSProperties)
                          : undefined
                      }
                    >
                      {thread.label}
                    </SidebarMenuButton>
                    {thread.badge && <SidebarMenuBadge>{thread.badge}</SidebarMenuBadge>}
                    <SidebarMenuActions
                      showOnHover
                      className={pinned ? "opacity-100" : undefined}
                    >
                      <SidebarMenuAction aria-label="Branch thread">
                        {createElement(icons["corner-down-right"], {})}
                      </SidebarMenuAction>
                      <SidebarMenuAction aria-label="Share thread">
                        {createElement(icons.link, {})}
                      </SidebarMenuAction>
                      <SidebarMenuAction aria-label="More options">
                        <MoreIcon />
                      </SidebarMenuAction>
                    </SidebarMenuActions>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter>
          {/* The header's inline pattern, mirrored: the user row keeps the
              leading run and the two icons sit past its chevron, on the
              same trailing axes as everything above. */}
          <div className="flex items-center gap-1 pr-1.5">
            {/* -mr-1.5 hands the row's trailing padding back to the rhythm,
                so its chevron slot lands on the next 28px column beside the
                icon buttons. */}
            <div className="min-w-0 flex-1 -mr-1.5">
              <DemoFooterUser />
            </div>
            <div data-guide className="flex items-center gap-1">
              {ALIGN_FOOTER_ICONS.map((entry) => (
                <Button
                  key={entry.label}
                  variant="ghost"
                  size="icon-compact"
                  aria-label={entry.label}
                  className="size-6 shrink-0"
                >
                  {createElement(icons[entry.icon])}
                </Button>
              ))}
            </div>
          </div>
        </SidebarFooter>
      </DemoRailShell>
      {/* One line per measured axis, on the accent so they read as guides,
          not chrome — body-portaled above the dropdown popups. */}
      {frameBox &&
        createPortal(
          guides.map((x) => (
            <span
              key={x}
              aria-hidden
              className="pointer-events-none absolute z-[60] w-px opacity-40"
              style={{
                left: frameBox.left + x - 0.5,
                top: frameBox.top,
                height: frameBox.height,
                backgroundColor: "var(--focus-ring, #6B97FF)",
              }}
            />
          )),
          document.body
        )}
    </div>
  );
}

/** Nesting: level 1 rows that own a level 2 sub-tree — an agent roster and
 *  the sources a retrieval agent reads, both open at once so the two levels
 *  can be seen holding their own highlights. */
function NestingPreview() {
  const icons = useIcons();
  // Recent's branches start open (level 2 on show); Private's and Shared's
  // start closed. No page is selected until the visitor picks one.
  const [open, setOpen] = useState<Record<string, boolean>>({
    Today: true,
    Yesterday: true,
  });
  const [current, setCurrent] = useState("");

  // One branch renderer for both sections — a parent row that folds its
  // children under it, chevron sprung 90° while open. Archive branches start
  // closed (absent from the `open` map).
  const renderBranch = (branch: (typeof WIKI_PRIVATE)[number]) => {
    // Coerce: a label absent from the map must read as CLOSED — an undefined
    // `open` would fall through to SidebarMenuSub's open-by-default.
    const isOpen = !!open[branch.label];
    return (
      <SidebarMenuItem key={branch.label}>
        <SidebarMenuButton
          className="group/parent-row"
          icon={icons[branch.icon]}
          onClick={() =>
            setOpen((prev) => ({ ...prev, [branch.label]: !prev[branch.label] }))
          }
          aria-expanded={isOpen}
          style={{ "--row-gutter": "var(--row-gutter-hover)" } as CSSProperties}
        >
          {branch.label}
          <span className="ml-auto -mr-0.5 flex size-6 shrink-0 items-center justify-center">
            <motion.span
              className="inline-flex"
              animate={{ rotate: isOpen ? 90 : 0 }}
              transition={spring.fast}
            >
              {createElement(icons["chevron-right"], {
                size: 16,
                strokeWidth: 1.5,
                className: `text-muted-foreground transition-opacity duration-80 ${
                  isOpen
                    ? "opacity-0 group-hover/parent-row:opacity-100 group-focus-within/parent-row:opacity-100"
                    : "opacity-100"
                }`,
              })}
            </motion.span>
          </span>
        </SidebarMenuButton>

        <SidebarMenuSub open={isOpen}>
          {branch.children.map((child) => (
            <SidebarMenuSubItem key={child.label}>
              <SidebarMenuSubButton
                href="#"
                icon={icons[child.icon]}
                isActive={child.label === current}
                onClick={(event) => {
                  event.preventDefault();
                  setCurrent(child.label);
                }}
              >
                {child.label}
              </SidebarMenuSubButton>
            </SidebarMenuSubItem>
          ))}
        </SidebarMenuSub>
      </SidebarMenuItem>
    );
  };

  return (
    <DemoRailShell>
      <DemoHeader />
      <SidebarContent>
        {/* One wiki, three sections, one per state: Private folded to its
            label, Shared open with its branches closed, Recent fully open
            down to level 2 — the whole accordion range in one sidebar. */}
        <SidebarGroup collapsible defaultOpen={false}>
          <SidebarGroupLabel>Private</SidebarGroupLabel>
          <SidebarMenu>
            {WIKI_PRIVATE.map(renderBranch)}
          </SidebarMenu>
        </SidebarGroup>
        <SidebarGroup collapsible>
          <SidebarGroupLabel>Shared</SidebarGroupLabel>
          <SidebarMenu>
            {WIKI_SHARED.map(renderBranch)}
          </SidebarMenu>
        </SidebarGroup>
        <SidebarGroup collapsible>
          <SidebarGroupLabel>Recent</SidebarGroupLabel>
          <SidebarMenu>
            {WIKI_RECENT.map(renderBranch)}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
    </DemoRailShell>
  );
}

/** Actions & badges: everything a row and a section label can carry —
 *  status dots on assistant threads, counts, and the hover-revealed action
 *  cluster (branch / share / overflow menu, tooltipped) on every thread —
 *  inside the full shell, header and footer included, like the other
 *  examples. */
function ActionsPreview() {
  const icons = useIcons();
  const MoreIcon = useIcon("more-vertical");
  // Until the visitor's own cursor takes over, one row wears the hovered
  // state as the section's subject: hover bg, action cluster visible, and
  // the Branch tooltip pinned open — same hand-off the collapse demo uses
  // for its rail tooltip.
  const [cursorInside, setCursorInside] = useState(false);
  const SPOTLIGHT_INDEX = 3;
  // Pin only while the demo is actually on screen — a force-opened tooltip
  // whose anchor scrolls away gets shifted back into the viewport and reads
  // as a detached black chip over whatever section is there instead.
  const frameRef = useRef<HTMLDivElement>(null);
  const inView = useInView(frameRef, { amount: 0.5 });
  // Portal the demo's tooltips into the frame itself (the /demo page's
  // pattern): a body-portaled tooltip chases its anchor a frame behind
  // during scroll, so the pinned chip visibly swims. In-flow, it just
  // scrolls with the page.
  const [frameEl, setFrameEl] = useState<HTMLElement | null>(null);

  // No Share here — it already sits on the row as a hover action.
  const threadMenu = (
    <DropdownContent className="min-w-[240px] w-[240px]" align="start" sideOffset={4}>
      <MenuItem index={0} icon={icons.pencil} label="Rename" onSelect={() => {}} />
      <MenuItem index={1} icon={icons.x} label="Delete" onSelect={() => {}} />
    </DropdownContent>
  );

  return (
    <div
      ref={(el) => {
        frameRef.current = el;
        setFrameEl(el);
      }}
      className="relative w-full self-stretch"
      // mousemove covers a pointer already resting inside at mount, and
      // pointerdown covers touch — otherwise the pinned hover could never
      // be handed off.
      onMouseEnter={() => setCursorInside(true)}
      onMouseMove={() => setCursorInside(true)}
      onPointerDown={() => setCursorInside(true)}
      onMouseLeave={() => setCursorInside(false)}
    >
      <TooltipPortalContainer value={frameEl}>
      <DemoRailShell>
        <DemoHeader />
        <SidebarContent>
          {/* A section label that collapses its rows and carries its own actions */}
          <SidebarGroup collapsible>
            <SidebarGroupLabel>Threads</SidebarGroupLabel>
            <SidebarGroupActions>
              <Tooltip content="New thread" side="top">
                <SidebarGroupAction aria-label="New thread">
                  {createElement(icons.plus, {})}
                </SidebarGroupAction>
              </Tooltip>
              <Tooltip content="Filter threads" side="top">
                <SidebarGroupAction aria-label="Filter threads">
                  {createElement(icons["sliders-horizontal"], {})}
                </SidebarGroupAction>
              </Tooltip>
            </SidebarGroupActions>
            <SidebarMenu>
              {/* Every thread carries the full cluster: branch, share, and the
                  overflow menu — the badge keeps the rightmost slot beside it.
                  The dropdown trigger goes without a tooltip, like every other
                  dropdown trigger in the sidebar. */}
              {AI_THREADS.map((thread, i) => {
                const pinned = inView && !cursorInside && i === SPOTLIGHT_INDEX;
                return (
                  <SidebarMenuItem key={thread.label}>
                    {/* "active" implies the row-active treatment — mapped to
                        "unread" here (same filled dot) so no page reads as
                        selected in this example. */}
                    <SidebarMenuButton
                      status={thread.status === "active" ? "unread" : thread.status}
                      className={pinned ? "bg-hover" : undefined}
                      // The wide gutter normally arrives with :hover — the
                      // pinned row opts in statically so the label truncates
                      // clear of the visible cluster instead of under it.
                      style={
                        pinned
                          ? ({ "--row-gutter": "var(--row-gutter-hover)" } as CSSProperties)
                          : undefined
                      }
                    >
                      {thread.label}
                    </SidebarMenuButton>
                    <SidebarMenuBadge>{thread.badge}</SidebarMenuBadge>
                    <SidebarMenuActions
                      showOnHover
                      className={pinned ? "opacity-100" : undefined}
                    >
                      <Tooltip
                        content="Branch thread"
                        side="top"
                        forceOpen={pinned || undefined}
                      >
                        {/* The tooltip's anchor also wears its own hover
                            treatment while pinned. */}
                        <SidebarMenuAction
                          aria-label="Branch thread"
                          className={pinned ? "bg-hover text-foreground" : undefined}
                        >
                          {createElement(icons["corner-down-right"], {})}
                        </SidebarMenuAction>
                      </Tooltip>
                      <Tooltip content="Share thread" side="top">
                        <SidebarMenuAction aria-label="Share thread">
                          {createElement(icons.link, {})}
                        </SidebarMenuAction>
                      </Tooltip>
                      <DropdownMenu>
                        <DropdownTrigger
                          render={
                            <SidebarMenuAction aria-label="More options">
                              <MoreIcon />
                            </SidebarMenuAction>
                          }
                        />
                        {threadMenu}
                      </DropdownMenu>
                    </SidebarMenuActions>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter>
          <DemoFooterUser />
        </SidebarFooter>
      </DemoRailShell>
      </TooltipPortalContainer>
    </div>
  );
}

/** The anchored callout — a Card on a surface one step above the rail.
 *  CardImage / CardMedia stay DIRECT children: Card finds the media by
 *  scanning its own children, and a fragment wrapper would hide it. */
function DemoCallout({ variant }: { variant: "banner" | "inline" }) {
  const substrate = useSurface();
  const shape = useShape();
  const icons = useIcons();
  // Dismiss really removes the card; the demo brings it back a beat later so
  // the section keeps its subject.
  const [dismissed, setDismissed] = useState(false);
  const dismiss = () => {
    setDismissed(true);
    setTimeout(() => setDismissed(false), 1600);
  };
  // Rests one step above the rail and rises another under the pointer, so the
  // card itself answers the hover rather than anything inside it.
  const level = Math.min(substrate + 1, 8);
  const surface = `${shape.container} overflow-hidden transition-[background-color,box-shadow] duration-80 ${surfaceClasses(
    level,
    2
  )} ${surfaceHoverClasses(
    level + 1,
    3
  )} shadow-[var(--shadow-2-inset)] hover:shadow-[var(--shadow-3-inset)]`;

  if (dismissed) return null;

  const card = (
    <Card
      size="compact"
      dismissible
      onDismiss={dismiss}
      href="/docs/sidebar"
      label={`${AI_CALLOUT.title} — ${AI_CALLOUT.media}`}
      className={`${surface}${variant === "inline" ? " min-h-0 pl-2.5" : ""}`}
    >
      {variant === "banner" ? (
        <CardImage src={BANNER} className="aspect-[2/1] max-h-28" />
      ) : (
        <CardMedia icon={icons.brain} size={18} />
      )}
      {/* The dismiss clearance is hover-only (Card pads the header while the
          ✕ is revealed), so the resting title keeps the full row. */}
      <CardHeader
        className={variant === "banner" ? "gap-0 pt-3" : "gap-[2px] py-3"}
      >
        <CardTitle className="truncate">{AI_CALLOUT.title}</CardTitle>
        <CardDescription className="truncate text-caption">
          {variant === "banner" ? AI_CALLOUT.media : AI_CALLOUT.icon}
        </CardDescription>
      </CardHeader>
    </Card>
  );

  return variant === "inline" ? (
    <CardGroup orientation="inline" fluidHover={false}>
      {card}
    </CardGroup>
  ) : (
    card
  );
}

/** Header, footer & callout: the two ends of the rail, stacked vertically —
 *  every element on its own full-width row — against the horizontal packing
 *  that collapses the same pieces into icon buttons. */
function HeaderFooterPreview({ stack }: { stack: "vertical" | "horizontal" }) {
  const icons = useIcons();
  const vertical = stack === "vertical";
  return (
    <DemoRailShell heightClass="aspect-square">
      <SidebarHeader>
        {vertical ? (
          <>
            <DemoHeaderRow />
            {/* Search and the action rows are ONE block: the header's gap-2
                separates it from the brand row, while inside it the search
                field reads as the list's first row (menu row rhythm). */}
            <div className="flex flex-col">
              <DemoSearch />
              <SidebarMenu aria-label="Header actions">
                <SidebarMenuItem>
                  <SidebarMenuButton icon={icons.plus}>
                    New thread
                    {/* Shortcut chip, revealed on row hover — a labeled row
                        wants no tooltip. */}
                    <span className="ml-auto inline-flex opacity-0 transition-opacity duration-80 group-hover/menu-item:opacity-100 group-focus-within/menu-item:opacity-100">
                      <kbd className="font-sans text-[11px] text-muted-foreground">⇧⌘O</kbd>
                    </span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </div>
          </>
        ) : (
          <div className="flex items-center gap-1 pr-1.5">
            <div className="min-w-0 flex-1">
              <DemoHeaderRow />
            </div>
            <Tooltip content={tipWithShortcut("Search", SEARCH_SHORTCUT)} side="bottom">
              <Button variant="ghost" size="icon-compact" aria-label="Search" className="size-6 shrink-0">
                {createElement(icons.search, {})}
              </Button>
            </Tooltip>
            <Tooltip content={tipWithShortcut("New thread", "⇧⌘O")} side="bottom">
              <Button variant="ghost" size="icon-compact" aria-label="New thread" className="size-6 shrink-0">
                {createElement(icons.plus, {})}
              </Button>
            </Tooltip>
          </div>
        )}
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Threads</SidebarGroupLabel>
          <SidebarMenu>
            {AI_THREADS.slice(0, 3).map((thread) => (
              <SidebarMenuItem key={thread.label}>
                <SidebarMenuButton status={thread.status}>{thread.label}</SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        {!vertical && <DemoCallout variant="inline" />}
        {vertical ? (
          <>
            {/* Actions stack above the user row, so identity stays anchored
                to the sidebar's outer edge — mirroring the brand row up top. */}
            <SidebarMenu aria-label="Footer actions">
              <SidebarMenuItem>
                <SidebarMenuButton icon={icons.settings}>Settings</SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton icon={icons.lightbulb}>What&apos;s new</SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
            <DemoFooterUser />
          </>
        ) : (
          <div className="flex items-center gap-1 pr-1.5">
            <div className="min-w-0 flex-1">
              <DemoFooterUser />
            </div>
            <Button variant="ghost" size="icon-compact" aria-label="Settings" className="size-6 shrink-0">
              {createElement(icons.settings, {})}
            </Button>
          </div>
        )}
      </SidebarFooter>
    </DemoRailShell>
  );
}

// ── Playground ───────────────────────────────────────────

function SidebarPlaygroundSection() {
  return (
    <SidebarPlayground>
      {({ preview, controls, code }) => (
        <PlaygroundLayout
          controls={controls}
          preview={
            <ComponentPreview code={code} padding="none" minHeightClass={SHELL_HEIGHT} inspectRulers={false}>
              {preview}
            </ComponentPreview>
          }
        />
      )}
    </SidebarPlayground>
  );
}

// ── Inside a dialog ──────────────────────────────────────

const settingsDialogCode = `import { Button } from "./components";
import { SettingsDialog } from "./components/dialog-sidebar/settings-dialog";

const [open, setOpen] = useState(false);

<Button variant="secondary" onClick={() => setOpen(true)}>Open settings</Button>
<SettingsDialog open={open} onOpenChange={setOpen} />

// Inside the block — the same Sidebar, in a bounded frame:
<DialogContent size="xl" className="flex h-[min(640px,calc(100dvh-4rem))] overflow-hidden p-0">
  <SidebarProvider persist={false} shortcut={null} width="13rem" className="h-full min-h-0">
    <Sidebar collapsible="none" className="hidden h-full sm:flex bg-[rgb(var(--overlay)/0.03)]">
      <SidebarHeader className="px-4 pt-5 pb-2">
        <DialogTitle>Settings</DialogTitle>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Workspace</SidebarGroupLabel>
          <SidebarMenu focusRing={false}>
            {sections.map((s) => (
              <SidebarMenuItem key={s.id}>
                <SidebarMenuButton icon={s.icon} isActive={s.id === section} onClick={() => setSection(s.id)}>
                  {s.label}
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
    <div className="flex min-w-0 flex-1 flex-col">{/* header + ScrollArea panel */}</div>
  </SidebarProvider>
</DialogContent>`;

function SettingsDialogDemo() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant="secondary" onClick={() => setOpen(true)}>
        Open settings
      </Button>
      <SettingsDialog open={open} onOpenChange={setOpen} />
    </>
  );
}

// ── Page ─────────────────────────────────────────────────

export default function SidebarDoc() {
  return (
    <DocPage
      title="Sidebar"
      description="A sidebar built from composable parts. Drag its edge to resize, collapse it away, and on mobile it becomes a drawer."
      slug="sidebar"
    >
      <DocSection title="Playground">
        <SidebarPlaygroundSection />
      </DocSection>

      <DocSection title="Layouts">
        <p className="text-body text-muted-foreground">
          3 layout options: <code>sidebar</code> default,{" "}
          <code>floating</code> to elevate the sidebar in a higher surface,{" "}
          <code>inset</code> to make your content stand out.
        </p>
        <ComponentPreview padding="none" minHeightClass={SHELL_HEIGHT} hideHeader caption="Sidebar">
          <DemoShell />
        </ComponentPreview>
        <ComponentPreview padding="none" minHeightClass={SHELL_HEIGHT} hideHeader caption="Floating">
          <DemoShell variant="floating" />
        </ComponentPreview>
        <ComponentPreview padding="none" minHeightClass={SHELL_HEIGHT} hideHeader caption="Inset">
          <DemoShell variant="inset" />
        </ComponentPreview>
      </DocSection>

      <DocSection title="Nesting">
        <p className="text-body text-muted-foreground">
          2 levels of nesting, one section level and one parent level.
        </p>
        <ComponentPreview code={nestingCode} padding="none" minHeightClass={SHELL_HEIGHT} inspectRulers={false}>
          <NestingPreview />
        </ComponentPreview>
      </DocSection>

      <DocSection title="Actions & badges">
        <p className="text-body text-muted-foreground">
          Add badge indicator and up to 3 actions. Actions show on hover so
          the label keeps maximum readability.
        </p>
        <ComponentPreview code={actionsCode} padding="none" minHeightClass={SHELL_HEIGHT} inspectRulers={false}>
          <ActionsPreview />
        </ComponentPreview>
      </DocSection>

      <DocSection title="Header & footer">
        <p className="text-body text-muted-foreground">
          Stack the header and footer content <code>vertically</code> or{" "}
          <code>horizontally</code>.
        </p>
        <ComponentPreview padding="none" hideHeader caption="Vertical stacking">
          <HeaderFooterPreview stack="vertical" />
        </ComponentPreview>
        <ComponentPreview padding="none" hideHeader caption="Horizontal stacking">
          <HeaderFooterPreview stack="horizontal" />
        </ComponentPreview>
      </DocSection>

      <DocSection title="Callouts">
        <p className="text-body text-muted-foreground">
          Elevate &amp; promote news using the callout with stackable{" "}
          <code>Banners</code> or <code>Inlines</code>.
        </p>
        <ComponentPreview padding="none" hideHeader caption="Stacked inlines">
          <StackedCalloutPreview variant="inline" />
        </ComponentPreview>
        <ComponentPreview padding="none" hideHeader caption="Stacked banners">
          <StackedCalloutPreview variant="banner" />
        </ComponentPreview>
      </DocSection>

      <DocSection title="Resize, collapse & peek">
        <p className="text-body text-muted-foreground">
          Drag to resize, click to collapse, or press <code>[</code> key.
          Open sidebar on <code>click</code> or <code>hover</code>.
        </p>
        <ComponentPreview padding="none" hideHeader caption="On hover">
          <CollapsePreview />
        </ComponentPreview>
        <ComponentPreview padding="none" hideHeader caption="On click">
          <CollapsePreview peek="click" defaultOpen={false} />
        </ComponentPreview>
      </DocSection>

      <DocSection title="Inside a dialog">
        <p className="text-body text-muted-foreground">
          A settings dialog with the sidebar inside. 3 props make it fit:{" "}
          <code>collapsible=&quot;none&quot;</code> drops the rail and the
          drawer, <code>persist={"{false}"}</code> skips the cookie, and{" "}
          <code>h-full</code> pins it to the dialog&apos;s height. Below{" "}
          <code>sm</code> a Select takes over.
        </p>
        <ComponentPreview code={settingsDialogCode}>
          <SettingsDialogDemo />
        </ComponentPreview>
      </DocSection>

      <DocSection title="No icon rail version?">
        <p className="text-body text-muted-foreground">
          Hot take baked into this component: there&apos;s no icon-only
          collapsed mode. On purpose.
        </p>
        <p className="text-body text-muted-foreground">
          Icon rails look tidy in screenshots but fail in use. Six ambiguous
          glyphs, and you suddenly need to tooltip most of them until
          you&apos;ve found the right one.
        </p>
        <p className="text-body text-muted-foreground">
          Nesting, section labels and complementary actions are impossible to
          reflect. It only benefits power users on simple sidebars — and
          it&apos;s your worst way to educate users.
        </p>
        <p className="text-body text-muted-foreground">
          Half a sidebar is confusing for everybody. Convert yours now.
        </p>
        <IconRailVsPeekDemo />
      </DocSection>

      <DocSection title="Functional and perfectly aligned">
        <p className="text-body text-muted-foreground">
          One rhythm everywhere: 24px icon buttons with 16px icons from
          header to footer.
        </p>
        <ComponentPreview
          code={alignmentCode}
          padding="none"
          minHeightClass={SHELL_HEIGHT}
          inspectRulers={false}
        >
          <AlignmentPreview />
        </ComponentPreview>
      </DocSection>

      <DocSection title="API Reference — SidebarProvider">
        <PropsTable props={providerProps} />
      </DocSection>

      <DocSection title="API Reference — Sidebar">
        <PropsTable props={sidebarProps} />
      </DocSection>

      <DocSection title="API Reference — Sections">
        <PropsTable props={sectionProps} />
      </DocSection>

      <DocSection title="API Reference — Content level 1">
        <PropsTable props={level1Props} />
      </DocSection>

      <DocSection title="API Reference — Content level 2">
        <PropsTable props={level2Props} />
      </DocSection>
    </DocPage>
  );
}
