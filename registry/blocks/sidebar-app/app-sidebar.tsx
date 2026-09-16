"use client";

import { useState } from "react";
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupActions,
  SidebarGroupAction,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuBadge,
  type SidebarProps,
} from "@/components/ui/sidebar";
import { Tooltip } from "@/components/ui/tooltip";
import { MenuItem } from "@/components/ui/menu-item";
import { useIcon, useIcons } from "@/lib/icon-context";
import {
  SidebarWorkspaceHeader,
  WorkspaceTile,
} from "@/components/sidebar-app/workspace-header";
import { SidebarUserFooter } from "@/components/sidebar-app/user-footer";
import { SidebarSearchField } from "@/components/sidebar-app/search-field";
import { NAV_SECTIONS } from "@/components/sidebar-app/nav-data";

// ---------------------------------------------------------------------------
// A complete app sidebar assembled from the workspace-header, search-field,
// and user-footer blocks: brand row with the peek cross-fade, search on the
// rows' rhythm, collapsible sections with label actions, badge-carrying
// rows, and the identity row anchoring the outer edge. Swap the seed data
// in nav-data.ts and the names below for your own.
// ---------------------------------------------------------------------------

export function AppSidebar(props: Omit<SidebarProps, "children">) {
  const [active, setActive] = useState("Home");
  const icons = useIcons();
  const PlusIcon = useIcon("plus");
  const UserIcon = useIcon("user");
  const SettingsIcon = useIcon("settings");
  const ArrowLeftIcon = useIcon("arrow-left");

  return (
    <Sidebar variant="inset" {...props}>
      <SidebarHeader>
        <SidebarWorkspaceHeader
          name="Acme Inc"
          tile={<WorkspaceTile>A</WorkspaceTile>}
          checkedIndex={0}
          menu={
            <>
              <MenuItem index={0} label="Acme Inc" checked onSelect={() => {}} />
              <MenuItem index={1} label="Personal" onSelect={() => {}} />
              <MenuItem index={2} icon={PlusIcon} label="New workspace" onSelect={() => {}} />
            </>
          }
        />
        {/* Search + action rows are ONE block: the field reads as the list's
            first row, on the menu rows' own tight rhythm. */}
        <div className="flex flex-col">
          <SidebarSearchField />
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton icon={PlusIcon}>
                New
                {/* shortcut chip, revealed on row hover */}
                <span className="ml-auto inline-flex opacity-0 transition-opacity duration-80 group-hover/menu-item:opacity-100 group-focus-within/menu-item:opacity-100">
                  <kbd className="font-sans text-[11px] text-muted-foreground">
                    ⇧⌘O
                  </kbd>
                </span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </div>
      </SidebarHeader>

      <SidebarContent>
        {NAV_SECTIONS.map((section) => (
          <SidebarGroup key={section.label} collapsible>
            <SidebarGroupLabel>{section.label}</SidebarGroupLabel>
            <SidebarGroupActions>
              <Tooltip content="Add item" side="top">
                <SidebarGroupAction aria-label="Add item">
                  <PlusIcon />
                </SidebarGroupAction>
              </Tooltip>
            </SidebarGroupActions>
            <SidebarMenu>
              {section.items.map((item) => (
                <SidebarMenuItem key={item.label}>
                  <SidebarMenuButton
                    icon={icons[item.icon]}
                    isActive={item.label === active}
                    onClick={() => setActive(item.label)}
                  >
                    {item.label}
                  </SidebarMenuButton>
                  {item.badge && <SidebarMenuBadge>{item.badge}</SidebarMenuBadge>}
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter>
        <SidebarUserFooter
          name="Jane Doe"
          avatar={
            <span className="flex size-5 items-center justify-center rounded-full bg-muted-foreground text-[10px] text-background">
              J
            </span>
          }
          menu={
            <>
              <MenuItem index={0} icon={UserIcon} label="Profile" onSelect={() => {}} />
              <MenuItem index={1} icon={SettingsIcon} label="Settings" onSelect={() => {}} />
              <MenuItem index={2} icon={ArrowLeftIcon} label="Log out" onSelect={() => {}} />
            </>
          }
        />
      </SidebarFooter>
    </Sidebar>
  );
}
