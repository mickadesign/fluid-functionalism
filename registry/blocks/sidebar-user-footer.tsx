"use client";

import { type ReactNode } from "react";
import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownTrigger,
  DropdownContent,
} from "@/components/ui/dropdown";
import { cn } from "@/lib/utils";
import { useSize } from "@/lib/size-context";
import { useIcon } from "@/lib/icon-context";
import { SIDEBAR_MENU_POPUP } from "@/lib/sidebar-menu-grid";

// ---------------------------------------------------------------------------
// Footer user row: identity anchors the sidebar's outer edge. The 20px
// avatar pulls -ml-0.5 to centre on the rows' leading icon axis; the
// chevron rides a 24px slot pulled -mr-0.5 onto the trailing action axis —
// the same axes every other sidebar row uses. Its menu opens upward on the
// shared sidebar menu grid, so labels and trailing glyphs line up with the
// trigger row exactly.
// ---------------------------------------------------------------------------

export interface SidebarUserFooterProps {
  /** Display name shown in the row. */
  name: ReactNode;
  /** 20px avatar — e.g. <img className="size-5 rounded-full outline-1 -outline-offset-1 outline-black/10 dark:outline-white/10" …/>. The row
   *  positions it on the leading icon axis; the element owns its look. */
  avatar: ReactNode;
  /** Dropdown content (MenuItem rows). */
  menu: ReactNode;
  /** Extra classes for the wrapping SidebarMenu — pass "min-w-0 flex-1" when
   *  the row shares a horizontal footer line with icon buttons. */
  className?: string;
}

export function SidebarUserFooter({
  name,
  avatar,
  menu,
  className,
}: SidebarUserFooterProps) {
  const iconSize = useSize().icon;
  const ChevronsUpDown = useIcon("chevrons-up-down");
  return (
    <SidebarMenu aria-label="User" className={cn(className)}>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownTrigger
            render={
              <SidebarMenuButton aria-label="Open user menu">
                <span className="-ml-0.5 -mr-0.5 flex size-5 shrink-0 items-center justify-center">
                  {avatar}
                </span>
                <span className="min-w-0 truncate text-[13px] text-foreground">
                  {name}
                </span>
                <span className="ml-auto -mr-0.5 flex size-6 shrink-0 items-center justify-center">
                  <ChevronsUpDown
                    size={iconSize}
                    strokeWidth={1.5}
                    className="text-muted-foreground"
                  />
                </span>
              </SidebarMenuButton>
            }
          />
          <DropdownContent
            className={SIDEBAR_MENU_POPUP}
            side="top"
            align="start"
            sideOffset={6}
          >
            {menu}
          </DropdownContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
