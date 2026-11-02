"use client";

import Link from "next/link";
import { fontWeights } from "@/lib/font-weight";
import { usePathname } from "next/navigation";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  useSidebar,
} from "@/components/flavored/sidebar";
import { componentList, systemNavList } from "@/lib/docs/components";
import { KIND_DOT } from "@/lib/changelog/kind-style";
import { useReleaseMarks } from "@/lib/changelog/marks";
import { GitHubStarButton, SettingsContent } from "@/app/components/right-panel";
import { SiteCommandMenuTrigger } from "@/app/components/site-command-menu";

interface NavEntry {
  slug: string;
  name: string;
}

/** The New dot, in the accent (the changelog's New color): on pages landed
 *  since the latest release (AHEAD_OF_RELEASE), so the dots only mark what
 *  is new this month. */
function NewDot() {
  // Rendered as a flex sibling of the weight-animated label (the row's gap
  // provides the spacing), matching the old NavItem dot's visual position.
  return (
    <span className={`inline-block size-1.5 shrink-0 rounded-full ${KIND_DOT.new}`}>
      <span className="sr-only">New</span>
    </span>
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
  // Landed since the latest release and listed ahead of the next.
  const { isNew } = useReleaseMarks();
  return (
    // A labelled group (System, Components) gets 16px above it instead of
    // the group's 8px, so each section starts clear of the one before.
    <SidebarGroup className={label ? "pt-4" : undefined}>
      {label && (
        // Foreground, not the component's muted default: on the site the
        // group names are wayfinding, and the counts beside them stay muted.
        <SidebarGroupLabel className="text-foreground">
          {label}
          {/* Styled like the "⌘K" badge in the Search row, so the counts line
              up in the same right-hand column. */}
          <span className="ml-auto flex h-5 min-w-5 items-center justify-center px-1 font-sans text-site-caption tabular-nums text-muted-foreground">
            {entries.length}
          </span>
        </SidebarGroupLabel>
      )}
      {/* A hairline under the label, from the name's first letter (the
          label's 8px padding) to the count's last digit (12px in: the count
          box's 4px padding on top), with 4px before the first row so its
          hover fill clears the line. */}
      {label && <div aria-hidden className="mb-1 ml-2 mr-3 h-px shrink-0 bg-border" />}
      <SidebarMenu aria-label={ariaLabel}>
        {entries.map((entry) => {
          const href = `/docs/${entry.slug}`;
          return (
            <SidebarMenuItem key={entry.slug}>
              <SidebarMenuButton render={<Link href={href} />} isActive={pathname === href}>
                {entry.name}
                {isNew(entry.slug) && <NewDot />}
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
        {/* The settings block only ships in the mobile sheet (on desktop it
            lives in the right panel), first and scrolling with the menu. */}
        {isMobile && (
          <>
            <div className="flex flex-col gap-2 px-4 pt-2 pb-4">
              <div className="flex items-center justify-between pt-2">
                <h2
                  className="text-site-title text-foreground leading-none"
                  style={{ fontVariationSettings: fontWeights.semibold }}
                >
                  Make them yours
                </h2>
                <GitHubStarButton />
              </div>
              {/* Labels start under the heading: no group label to line
                  up with here, unlike the right panel. */}
              <SettingsContent inset={false} />
            </div>
            <div aria-hidden className="mx-4 mb-2 h-px shrink-0 bg-border" />
          </>
        )}

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
              <SidebarMenuButton render={<Link href="/changelog" />} isActive={pathname === "/changelog"}>
                Changelog
                {/* The page itself is new: dotted by hand, unlike the docs
                    rows, which follow the latest release. */}
                <NewDot />
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

    </Sidebar>
  );
}

export default SiteSidebar;
