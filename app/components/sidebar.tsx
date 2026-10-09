"use client";

import Link from "next/link";
import { fontWeights } from "@/lib/font-weight";
import { usePathname } from "next/navigation";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  useSidebar,
} from "@/components/flavored/sidebar";
import { componentList, systemNavList } from "@/lib/docs/components";
import { GitHubStarButton, SettingsContent } from "@/app/components/right-panel";
import { SiteCommandMenuTrigger } from "@/app/components/site-command-menu";
import { resolveNavKind, STATUS_DOT } from "@/lib/docs/updates";

interface NavEntry {
  slug: string;
  name: string;
  isNew?: boolean;
  isUpdated?: boolean;
  dotColor?: string;
}

/** The isNew (yellow) / isUpdated (blue) dot — same colors as What's New. */
function StatusDot({ entry }: { entry: NavEntry }) {
  // Changelog wins; static flags cover items not yet in the update log.
  const kind = resolveNavKind(entry);
  if (!kind) return null;
  const color = entry.dotColor ?? STATUS_DOT[kind];
  return (
    <span
      className={`inline-block size-1.5 shrink-0 rounded-full ${color}`}
      aria-label={kind}
    />
  );
}

function NavGroup({
  label,
  entries,
  pathname,
  ariaLabel,
}: {
  label?: string;
  entries: NavEntry[];
  pathname: string;
  ariaLabel: string;
}) {
  return (
    <SidebarGroup>
      {label && (
        <SidebarGroupLabel>
          {label}
          {/* Styled like the "⌘K" badge in the Search row, so the counts line
              up in the same right-hand column. */}
          <span className="ml-auto flex h-5 min-w-5 items-center justify-center px-1 font-sans text-site-caption tabular-nums text-muted-foreground">
            {entries.length}
          </span>
        </SidebarGroupLabel>
      )}
      <SidebarMenu aria-label={ariaLabel}>
        {entries.map((entry) => {
          const href = `/docs/${entry.slug}`;
          return (
            <SidebarMenuItem key={entry.slug}>
              <SidebarMenuButton render={<Link href={href} />} isActive={pathname === href}>
                {entry.name}
                <StatusDot entry={entry} />
              </SidebarMenuButton>
            </SidebarMenuItem>
          );
        })}
      </SidebarMenu>
    </SidebarGroup>
  );
}

/** The site's own navigation rail — the Sidebar component, dogfooded. */
export function SiteSidebar() {
  const pathname = usePathname();
  const { isMobile } = useSidebar();

  return (
    <Sidebar collapsible="offcanvas" bordered={false} rail={false} className="ml-2">
      <SidebarContent className="py-2">
        {/* Search: opens the site's command menu (⌘K anywhere). */}
        <SidebarGroup>
          <SiteCommandMenuTrigger />
        </SidebarGroup>

        {/* Top-level navigation */}
        <SidebarGroup>
          <SidebarMenu aria-label="Main navigation">
            <SidebarMenuItem>
              <SidebarMenuButton render={<Link href="/" />} isActive={pathname === "/"}>
                Showcase
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton render={<Link href="/docs" />} isActive={pathname === "/docs"}>
                Introduction
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton
                render={<Link href="/whats-new" />}
                isActive={pathname === "/whats-new"}
              >
                What&apos;s New
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>

        <NavGroup
          label="System"
          entries={systemNavList}
          pathname={pathname}
          ariaLabel="System navigation"
        />
        <NavGroup
          label="Components"
          entries={componentList}
          pathname={pathname}
          ariaLabel="Component navigation"
        />
      </SidebarContent>

      {/* The settings block only ships in the mobile sheet — on desktop it
          lives in the right panel. */}
      {isMobile && (
        <SidebarFooter className="p-4 pt-2">
          <div className="flex items-center justify-between pt-2">
            <h2
              className="text-site-title text-foreground leading-none"
              style={{ fontVariationSettings: fontWeights.semibold }}
            >
              Make them yours
            </h2>
            <GitHubStarButton />
          </div>
          <SettingsContent tooltipSide="right" />
        </SidebarFooter>
      )}
    </Sidebar>
  );
}

export default SiteSidebar;
