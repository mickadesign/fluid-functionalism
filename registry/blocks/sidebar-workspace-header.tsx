"use client";

import { type ReactNode } from "react";
import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownTrigger,
  DropdownContent,
} from "@/components/ui/dropdown";
import { cn } from "@/lib/utils";
import { useShape } from "@/lib/shape-context";
import { useSize } from "@/lib/size-context";
import { useIcons } from "@/lib/icon-context";
import { fontWeights } from "@/lib/font-weight";
import { SIDEBAR_MENU_POPUP } from "@/lib/sidebar-menu-grid";

// ---------------------------------------------------------------------------
// Workspace brand row for a sidebar header.
//
// While the sidebar is only PEEKING (a collapsed rail floated out by
// `peek="hover"` / `peek="click"`), the overlay itself covers the pointer's
// one way to pin the sidebar open — so a SidebarTrigger takes the tile's
// slot: a sibling positioned over the row (the menu-action pattern), never a
// button nested inside the row button. The trigger and the tile CROSS-FADE in
// place — neither element ever moves, only opacity — and the row's constant
// pl-8 keeps the name pinned on the rows' 32px text axis while they swap.
// Without peek enabled the trigger simply never shows.
// ---------------------------------------------------------------------------

export interface SidebarWorkspaceHeaderProps {
  /** Workspace or product name shown in the row. */
  name: ReactNode;
  /** 20px mark for the leading slot — a letter tile (see WorkspaceTile), a
   *  logo, an avatar. The header positions and cross-fades it; the mark owns
   *  its own colors and rounding. */
  tile: ReactNode;
  /** Dropdown content (MenuItem rows). Omit to render a non-interactive logo
   *  lockup instead of a workspace switcher. */
  menu?: ReactNode;
  /** Index of the checked menu row, forwarded to DropdownContent. */
  checkedIndex?: number;
}

export function SidebarWorkspaceHeader({
  name,
  tile,
  menu,
  checkedIndex,
}: SidebarWorkspaceHeaderProps) {
  const iconSize = useSize().icon;
  const icons = useIcons();
  const ChevronDown = icons["chevron-down"];
  const { isPeeking } = useSidebar();

  // The tile sits absolutely in the row's leading slot — 20px at left-1.5
  // centres it on the rows' 16px leading icon axis.
  const tileSlot = (
    <span
      aria-hidden
      className={`pointer-events-none absolute left-1.5 top-1/2 -translate-y-1/2 transition-opacity duration-80 ${
        isPeeking ? "opacity-0" : "opacity-100"
      }`}
    >
      {tile}
    </span>
  );
  // No hover/press fill on this trigger (the Button's first child is its bg
  // layer): its box is off-axis from the tile slot it overlays, so a
  // background reads as a second, non-concentric rectangle behind the glyph.
  // [&_svg]:size-4 matches the topbar trigger's 16px glyph — icon-compact
  // would otherwise draw this one at 14px.
  const triggerFade = `[&>span:first-child]:hidden [&_svg]:size-4 transition-opacity duration-80 ${
    isPeeking ? "opacity-100" : "pointer-events-none opacity-0"
  }`;
  const nameSpan = (
    <span
      className="min-w-0 truncate text-[length:var(--fs-body,13px)] leading-[var(--lh-body,20px)] text-foreground"
      style={{ fontVariationSettings: fontWeights.semibold }}
    >
      {name}
    </span>
  );

  if (!menu) {
    // Not interactive, so it renders outside SidebarMenu — a menu row would
    // track the traveling hover background.
    return (
      <div className="relative flex h-8 items-center pl-8 pr-2">
        <SidebarTrigger
          size="icon-compact"
          aria-hidden={!isPeeking || undefined}
          tabIndex={isPeeking ? undefined : -1}
          className={`absolute left-1 top-1/2 -translate-y-1/2 ${triggerFade}`}
        />
        {tileSlot}
        {nameSpan}
      </div>
    );
  }
  return (
    // @container: the row hides its dropdown chevron once it gets too narrow
    // to show a useful slice of the name (squeezed by trailing header actions
    // or a mid-drag width) — the text keeps whatever room is left.
    <SidebarMenu aria-label="Workspace" className="@container">
      <SidebarMenuItem>
        <SidebarTrigger
          size="icon-compact"
          aria-hidden={!isPeeking || undefined}
          tabIndex={isPeeking ? undefined : -1}
          className={`absolute left-1 top-1/2 z-20 -translate-y-1/2 ${triggerFade}`}
        />
        <DropdownMenu>
          <DropdownTrigger
            render={
              <SidebarMenuButton aria-label="Switch workspace" className="pl-8">
                {tileSlot}
                {nameSpan}
                <span className="ml-auto inline-flex @max-[7rem]:hidden">
                  <ChevronDown
                    size={iconSize}
                    strokeWidth={1.5}
                    className="text-muted-foreground"
                  />
                </span>
              </SidebarMenuButton>
            }
          />
          {/* Trigger-width popup on the shared sidebar menu grid: items start
              at the row's edge, icon slots land on the leading axis, and the
              check sits on the chevron's vertical axis. */}
          <DropdownContent
            className={SIDEBAR_MENU_POPUP}
            align="start"
            sideOffset={4}
            checkedIndex={checkedIndex}
          >
            {menu}
          </DropdownContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}

/** The 20px letter-tile treatment the switcher's trigger and its menu rows
 *  share — squared to the shape system, semibold 10px glyph. */
export function WorkspaceTile({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const shape = useShape();
  return (
    <span
      className={cn(
        "flex size-5 shrink-0 items-center justify-center bg-foreground text-[length:var(--fs-micro-compact,10px)] leading-[var(--lh-micro-compact,12px)] text-background",
        { pill: "rounded-full", rounded: "rounded-md", sharp: "rounded-[1px]" }[shape.variant],
        className
      )}
      style={{ fontVariationSettings: fontWeights.semibold }}
    >
      {children}
    </span>
  );
}
