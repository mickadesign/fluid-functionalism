// ---------------------------------------------------------------------------
// Install-grade code generation for sidebar presets. Where the playground's
// buildSidebarPlaygroundCode emits a TEACHING snippet (free identifiers,
// "./components" imports), this emits COMPILABLE files shaped like the
// sidebar-app block: nav-data with the preset's content shape baked in, the
// assembled component importing the shipped blocks, and a provider page.
// tests/preset-install.test.mjs compiles the output across the state space,
// and cross-checks it against the snippet generator's load-bearing classes.
// ---------------------------------------------------------------------------

import {
  type SidebarPreset,
  ROW_ACTION_SET,
  GROUP_ACTION_SET,
  HEADER_ACTION_SET,
  FOOTER_ACTION_SET,
  L2_ROWS,
  SECTION_LABELS,
  SEARCH_SHORTCUT,
} from "./sidebar-options";

export interface PresetFile {
  path: string;
  type: "registry:component" | "registry:page";
  target: string;
  content: string;
}

const DIR = "components/sidebar-preset";

function navDataFile(p: SidebarPreset): string {
  const l: string[] = [];
  l.push(`// Seed navigation data for the generated sidebar — replace with your own.`);
  if (p.l1Primary === "menu") {
    l.push(`import { type IconName } from "@/lib/icon-context";`);
    l.push(``);
  }
  if (p.l1Primary === "threads") {
    l.push(`export interface NavItem {`);
    l.push(`  label: string;`);
    l.push(`  /** Semantic status: drives the leading dot and screen-reader text. */`);
    l.push(`  status: "active" | "unread" | "idle";`);
    l.push(`  badge?: string;`);
    l.push(`}`);
  } else {
    l.push(`export interface NavItem {`);
    l.push(`  label: string;`);
    l.push(`  /** Key into the icon context (lucide by default). */`);
    l.push(`  icon: IconName;`);
    l.push(`  badge?: string;`);
    l.push(`  active?: boolean;`);
    if (p.l1Children) {
      l.push(`  children?: { label: string; icon: IconName; badge?: string }[];`);
    }
    l.push(`}`);
  }
  l.push(``);
  l.push(`export interface NavSection {`);
  l.push(`  label: string;`);
  l.push(`  items: NavItem[];`);
  l.push(`}`);
  l.push(``);
  const children = p.l1Children && p.l1Primary === "menu";
  const childLit = `[${L2_ROWS.map(
    (c) =>
      `{ label: ${JSON.stringify(c.label)}, icon: "folder"${"badge" in c && c.badge ? `, badge: ${JSON.stringify(c.badge)}` : ""} }`
  ).join(", ")}]`;
  const item = (label: string, extra: string) =>
    `    { label: ${JSON.stringify(label)}${extra}${children ? `, children: ${childLit}` : ""} },`;
  l.push(`export const NAV_SECTIONS: NavSection[] = [`);
  for (const [si, section] of SECTION_LABELS[p.l1Primary].entries()) {
    l.push(`  {`);
    l.push(`    label: ${JSON.stringify(section)},`);
    l.push(`    items: [`);
    if (p.l1Primary === "threads") {
      const rows =
        si === 0
          ? [
              ["New pricing page exploration", "active", "2"],
              ["Component library audit", "idle", "5"],
              ["Dark mode token pass", "unread", "3"],
            ]
          : [
              ["Scrollbar fade regression", "idle", "1"],
              ["Registry deploy pipeline", "unread", "4"],
            ];
      for (const [label, status, badge] of rows) {
        l.push(
          `    { label: ${JSON.stringify(label)}, status: ${JSON.stringify(status)}${p.l1Badges ? `, badge: ${JSON.stringify(badge)}` : ""} },`
        );
      }
    } else {
      const rows =
        si === 0
          ? [
              ["Home", "star", "3", true],
              ["Inbox", "users", "12", false],
              ["Calendar", "settings", "5", false],
            ]
          : [
              ["Notifications", "moon", "3", false],
              ["Members", "user", "", false],
            ];
      for (const [label, icon, badge, active] of rows) {
        l.push(
          item(
            label as string,
            `, icon: ${JSON.stringify(icon)}${p.l1Badges && badge ? `, badge: ${JSON.stringify(badge)}` : ""}${active ? `, active: true` : ""}`
          )
        );
      }
    }
    l.push(`    ],`);
    l.push(`  },`);
  }
  l.push(`];`);
  return l.join("\n") + "\n";
}

/** The action cluster / lone action for a row, install-grade. */
function rowActionLines(count: number, indent: string, guard?: string): string[] {
  if (count === 0) return [];
  const actions = ROW_ACTION_SET.slice(-count);
  const one = (
    a: (typeof ROW_ACTION_SET)[number],
    showOnHover: boolean,
    ind: string
  ): string[] =>
    "menu" in a && a.menu
      ? [
          `${ind}<DropdownMenu>`,
          `${ind}  <DropdownTrigger render={`,
          `${ind}    <SidebarMenuAction${showOnHover ? " showOnHover" : ""} aria-label="More options">`,
          `${ind}      <MoreVerticalIcon />`,
          `${ind}    </SidebarMenuAction>`,
          `${ind}  } />`,
          `${ind}  {/* 240px — the header/footer trigger width */}`,
          `${ind}  <DropdownContent className="min-w-0 w-[240px]" align="start" sideOffset={4}>`,
          `${ind}    <MenuItem index={0} icon={PencilIcon} label="Rename" onSelect={() => {}} />`,
          `${ind}    <MenuItem index={1} icon={LinkIcon} label="Share" onSelect={() => {}} />`,
          `${ind}  </DropdownContent>`,
          `${ind}</DropdownMenu>`,
        ]
      : [
          `${ind}<Tooltip content="${a.label}" side="top">`,
          `${ind}  <SidebarMenuAction${showOnHover ? " showOnHover" : ""} aria-label="${a.label}">`,
          `${ind}    <${a.icon === "plus" ? "PlusIcon" : "PencilIcon"} />`,
          `${ind}  </SidebarMenuAction>`,
          `${ind}</Tooltip>`,
        ];
  const body =
    count === 1
      ? one(actions[0], true, guard ? `${indent}  ` : indent)
      : [
          `${guard ? `${indent}  ` : indent}<SidebarMenuActions showOnHover>`,
          ...actions.flatMap((a) => one(a, false, `${guard ? `${indent}  ` : indent}  `)),
          `${guard ? `${indent}  ` : indent}</SidebarMenuActions>`,
        ];
  if (!guard) return body;
  return [`${indent}{${guard} && (`, ...body, `${indent})}`];
}

function appSidebarFile(p: SidebarPreset): string {
  const loading = p.state === "loading";
  const nests = p.l1Primary === "menu" && p.l1Children && !loading;
  const menuRows = !loading;
  const anyRowActions = !loading && (p.l1Actions > 0 || (nests && p.l2Actions > 0));
  const hasCallout = p.footerCallout !== "none";
  const hasFooter = p.footerPrimary === "dropdown" || p.footerActions > 0 || hasCallout;
  const headerHorizontal = p.headerStack === "horizontal";

  const sidebarParts = [
    "Sidebar",
    "SidebarHeader",
    "SidebarContent",
    ...(hasFooter ? ["SidebarFooter"] : []),
    "SidebarGroup",
    "SidebarGroupLabel",
    ...(p.sectionActions > 0 ? ["SidebarGroupActions", "SidebarGroupAction"] : []),
    "SidebarMenu",
    "SidebarMenuItem",
    ...(menuRows || (headerHorizontal ? false : p.headerActions > 0) ? ["SidebarMenuButton"] : []),
    ...(!loading && (p.l1Badges || (nests && p.l2Badges)) ? ["SidebarMenuBadge"] : []),
    ...(anyRowActions ? ["SidebarMenuAction"] : []),
    ...(anyRowActions && Math.max(p.l1Actions, nests ? p.l2Actions : 0) > 1
      ? ["SidebarMenuActions"]
      : []),
    ...(nests ? ["SidebarMenuSub", "SidebarMenuSubItem", "SidebarMenuSubButton"] : []),
    ...(loading ? ["SidebarMenuSkeleton"] : []),
  ];
  // Dedup while keeping order.
  const parts = [...new Set(sidebarParts)];

  const needsDropdown =
    p.headerPrimary === "dropdown" ||
    p.footerPrimary === "dropdown" ||
    anyRowActions; // overflow menu
  const needsTooltip =
    anyRowActions || p.sectionActions > 0 || headerHorizontal || (p.footerStack === "horizontal" && p.footerActions > 0);

  const l: string[] = [];
  l.push(`"use client";`);
  l.push(``);
  l.push(`import { useState } from "react";`);
  l.push(`import {`);
  l.push(`  ${parts.join(",\n  ")},`);
  l.push(`  type SidebarProps,`);
  l.push(`} from "@/components/ui/sidebar";`);
  if (needsTooltip) l.push(`import { Tooltip } from "@/components/ui/tooltip";`);
  if (needsDropdown) {
    l.push(
      `import { DropdownMenu, DropdownTrigger, DropdownContent } from "@/components/ui/dropdown";`
    );
    l.push(`import { MenuItem } from "@/components/ui/menu-item";`);
  }
  if (nests) {
    l.push(`import { type CSSProperties } from "react";`);
    l.push(`import { motion } from "motion/react";`);
    l.push(`import { spring } from "@/lib/springs";`);
  }
  l.push(`import { useIcons } from "@/lib/icon-context";`);
  if (p.headerPrimary !== "none") {
    l.push(
      `import { SidebarWorkspaceHeader, WorkspaceTile } from "@/components/sidebar-app/workspace-header";`
    );
  }
  if (p.footerPrimary === "dropdown") {
    l.push(`import { SidebarUserFooter } from "@/components/sidebar-app/user-footer";`);
  }
  if (!headerHorizontal) {
    l.push(`import { SidebarSearchField } from "@/components/sidebar-app/search-field";`);
  }
  if (hasCallout) {
    l.push(
      `import { Card, ${p.footerCallout === "banner" ? "CardImage" : "CardMedia"}, CardHeader, CardTitle, CardDescription${p.footerCallout === "inline" ? ", CardGroup" : ""} } from "@/components/ui/card";`
    );
    l.push(`import { surfaceClasses, surfaceHoverClasses } from "@/lib/surface-classes";`);
    l.push(`import { useSurface } from "@/lib/surface-context";`);
    if (p.footerCalloutStacked) l.push(`import { AnimatePresence, motion as m } from "motion/react";`);
    if (p.footerCalloutStacked && !nests) l.push(`import { spring } from "@/lib/springs";`);
  }
  l.push(`import { NAV_SECTIONS } from "@/components/sidebar-preset/nav-data";`);
  l.push(``);

  if (hasCallout) {
    l.push(`const CALLOUTS = [`);
    l.push(`  { id: 1, title: "Aurora 2 is here", desc: "Longer context, faster agents" },`);
    if (p.footerCalloutStacked) {
      l.push(`  { id: 2, title: "New workspace roles", desc: "Owner, editor, viewer" },`);
      l.push(`  { id: 3, title: "Dark mode shipped", desc: "Follows your system" },`);
    }
    l.push(`];`);
    l.push(``);
  }

  l.push(`export function AppSidebar(props: Omit<SidebarProps, "children">) {`);
  if (menuRows) l.push(`  const [active, setActive] = useState("${p.l1Primary === "threads" ? "New pricing page exploration" : "Home"}");`);
  if (nests) {
    l.push(`  // Nested rows start open; keys are row labels.`);
    l.push(`  const [closedRows, setClosedRows] = useState<Record<string, boolean>>({});`);
  }
  if (hasCallout) {
    l.push(`  const [callouts, setCallouts] = useState(CALLOUTS);`);
    l.push(`  const dismiss = (id: number) => setCallouts((c) => c.filter((x) => x.id !== id));`);
    l.push(`  // The callout rests one surface step above the rail.`);
    l.push(`  const level = Math.min(useSurface() + 1, 8);`);
    if (p.footerCalloutStacked) {
      l.push(`  const [expanded, setExpanded] = useState(false);`);
      l.push(`  // Front card's measured height — never an animated "auto".`);
      l.push(`  const [cardH, setCardH] = useState(64);`);
      l.push(`  const collapsedH = cardH + Math.min(callouts.length - 1, 2) * 12;`);
      l.push(`  const expandedH = callouts.length * cardH + (callouts.length - 1) * 4;`);
    }
  }
  l.push(`  const icons = useIcons();`);
  l.push(`  const PlusIcon = icons.plus;`);
  if (anyRowActions || p.sectionActions > 1) l.push(`  const PencilIcon = icons.pencil;`);
  if (anyRowActions) {
    l.push(`  const MoreVerticalIcon = icons["more-vertical"];`);
    l.push(`  const LinkIcon = icons.link;`);
  }
  if (p.sectionActions > 1) l.push(`  const SlidersIcon = icons["sliders-horizontal"];`);
  if (p.sectionActions > 2) l.push(`  const SectionMoreIcon = icons["more-vertical"];`);
  if (nests) l.push(`  const ChevronRightIcon = icons["chevron-right"];`);
  if (headerHorizontal && p.headerActions > 1) l.push(`  const UsersIcon = icons.users;`);
  if (!headerHorizontal && p.headerActions > 1) l.push(`  const UsersIcon = icons.users;`);
  if (p.footerPrimary === "dropdown") {
    l.push(`  const UserIcon = icons.user;`);
    l.push(`  const SettingsIcon = icons.settings;`);
    l.push(`  const ArrowLeftIcon = icons["arrow-left"];`);
  }
  if (p.footerActions > 0) l.push(`  const FooterSettingsIcon = icons.settings;`);
  if (p.footerActions > 1) l.push(`  const MoonIcon = icons.moon;`);
  if (hasCallout && p.footerCallout === "inline") l.push(`  const CalloutIcon = icons["panel-left"];`);
  if (headerHorizontal) l.push(`  const SearchIcon = icons.search;`);
  l.push(``);
  l.push(`  return (`);
  l.push(`    <Sidebar${p.design !== "sidebar" ? ` variant="${p.design}"` : ""} {...props}>`);

  // ── Header ──
  l.push(`      <SidebarHeader>`);
  const brand = (indent: string) =>
    p.headerPrimary === "none"
      ? []
      : [
          `${indent}<SidebarWorkspaceHeader`,
          `${indent}  name="Acme Inc"`,
          `${indent}  tile={<WorkspaceTile>A</WorkspaceTile>}`,
          ...(p.headerPrimary === "dropdown"
            ? [
                `${indent}  checkedIndex={0}`,
                `${indent}  menu={`,
                `${indent}    <>`,
                `${indent}      <MenuItem index={0} label="Acme Inc" checked onSelect={() => {}} />`,
                `${indent}      <MenuItem index={1} label="Personal" onSelect={() => {}} />`,
                `${indent}      <MenuItem index={2} icon={PlusIcon} label="New workspace" onSelect={() => {}} />`,
                `${indent}    </>`,
                `${indent}  }`,
              ]
            : []),
          `${indent}/>`,
        ];
  if (headerHorizontal) {
    l.push(`        {/* horizontal: search + actions share the brand line as 24px`);
    l.push(`            buttons, inset pr-1.5 onto the section actions' axis */}`);
    l.push(`        <div className="flex items-center gap-1 pr-1.5">`);
    if (p.headerPrimary === "none") {
      l.push(`          <div className="min-w-0 flex-1" />`);
    } else {
      l.push(`          <div className="min-w-0 flex-1">`);
      l.push(...brand(`            `));
      l.push(`          </div>`);
    }
    l.push(`          <Tooltip content="Search ${SEARCH_SHORTCUT}" side="bottom">`);
    l.push(`            <button type="button" aria-label="Search"`);
    l.push(`              className="flex size-6 shrink-0 items-center justify-center rounded-md text-muted-foreground`);
    l.push(`                outline-none hover:bg-hover hover:text-foreground transition-colors duration-80`);
    l.push(`                focus-visible:ring-1 focus-visible:ring-[color:var(--focus-ring,#6B97FF)]">`);
    l.push(`              <SearchIcon size={16} strokeWidth={1.5} />`);
    l.push(`            </button>`);
    l.push(`          </Tooltip>`);
    for (const a of HEADER_ACTION_SET.slice(0, p.headerActions)) {
      const Icon = a.icon === "plus" ? "PlusIcon" : "UsersIcon";
      l.push(`          <Tooltip content="${a.label} ${a.shortcut}" side="bottom">`);
      l.push(`            <button type="button" aria-label="${a.label}"`);
      l.push(`              className="flex size-6 shrink-0 items-center justify-center rounded-md text-muted-foreground`);
      l.push(`                outline-none hover:bg-hover hover:text-foreground transition-colors duration-80`);
      l.push(`                focus-visible:ring-1 focus-visible:ring-[color:var(--focus-ring,#6B97FF)]">`);
      l.push(`              <${Icon} size={16} strokeWidth={1.5} />`);
      l.push(`            </button>`);
      l.push(`          </Tooltip>`);
    }
    l.push(`        </div>`);
  } else {
    l.push(...brand(`        `));
    l.push(`        {/* search + action rows are ONE block on the menu rows' rhythm */}`);
    l.push(`        <div className="flex flex-col gap-0.5">`);
    l.push(`          <SidebarSearchField />`);
    if (p.headerActions > 0) {
      l.push(`          <SidebarMenu>`);
      for (const a of HEADER_ACTION_SET.slice(0, p.headerActions)) {
        const Icon = a.icon === "plus" ? "PlusIcon" : "UsersIcon";
        l.push(`            <SidebarMenuItem>`);
        l.push(`              <SidebarMenuButton icon={${Icon}}>`);
        l.push(`                ${a.label}`);
        l.push(`                {/* shortcut chip, revealed on row hover */}`);
        l.push(`                <span className="ml-auto inline-flex opacity-0 transition-opacity duration-80`);
        l.push(`                  group-hover/menu-item:opacity-100 group-focus-within/menu-item:opacity-100">`);
        l.push(`                  <kbd className="font-sans text-[11px] text-muted-foreground">${a.shortcut}</kbd>`);
        l.push(`                </span>`);
        l.push(`              </SidebarMenuButton>`);
        l.push(`            </SidebarMenuItem>`);
      }
      l.push(`          </SidebarMenu>`);
    }
    l.push(`        </div>`);
  }
  l.push(`      </SidebarHeader>`);

  // ── Content ──
  l.push(``);
  l.push(`      <SidebarContent>`);
  l.push(`        {NAV_SECTIONS${loading ? ".slice(0, 1)" : ""}.map((section) => (`);
  l.push(`          <SidebarGroup key={section.label}${p.sectionsCollapsible ? " collapsible" : ""}>`);
  l.push(`            <SidebarGroupLabel>{section.label}</SidebarGroupLabel>`);
  if (p.sectionActions > 0) {
    l.push(`            <SidebarGroupActions>`);
    for (const [i, a] of GROUP_ACTION_SET.slice(0, p.sectionActions).entries()) {
      const Icon = i === 0 ? "PlusIcon" : i === 1 ? "SlidersIcon" : "SectionMoreIcon";
      l.push(`              <Tooltip content="${a.label}" side="top">`);
      l.push(`                <SidebarGroupAction aria-label="${a.label}">`);
      l.push(`                  <${Icon} />`);
      l.push(`                </SidebarGroupAction>`);
      l.push(`              </Tooltip>`);
    }
    l.push(`            </SidebarGroupActions>`);
  }
  l.push(`            <SidebarMenu>`);
  if (loading) {
    l.push(`              {section.items.map((item) => (`);
    l.push(`                <SidebarMenuSkeleton key={item.label} showIcon />`);
    l.push(`              ))}`);
  } else {
    l.push(`              {section.items.map((item) => (`);
    l.push(`                <SidebarMenuItem key={item.label}>`);
    if (p.l1Primary === "threads") {
      l.push(`                  {/* status drives the dot and the screen-reader "unread" text */}`);
      l.push(`                  <SidebarMenuButton`);
      l.push(`                    status={item.status}`);
      l.push(`                    isActive={item.label === active}`);
      l.push(`                    onClick={() => setActive(item.label)}`);
      l.push(`                  >`);
      l.push(`                    {item.label}`);
      l.push(`                  </SidebarMenuButton>`);
    } else if (nests) {
      l.push(`                  {/* group/parent-row scopes the chevron reveal to the row's own`);
      l.push(`                      button; the pinned gutter keeps it from sliding on hover */}`);
      l.push(`                  <SidebarMenuButton`);
      l.push(`                    icon={icons[item.icon]}`);
      l.push(`                    isActive={item.label === active}`);
      l.push(`                    className={item.children ? "group/parent-row" : undefined}`);
      l.push(`                    aria-expanded={item.children ? !closedRows[item.label] : undefined}`);
      l.push(`                    style={item.children ? ({ "--row-gutter": "var(--row-gutter-hover)" } as CSSProperties) : undefined}`);
      l.push(`                    onClick={() =>`);
      l.push(`                      item.children`);
      l.push(`                        ? setClosedRows((r) => ({ ...r, [item.label]: !r[item.label] }))`);
      l.push(`                        : setActive(item.label)`);
      l.push(`                    }`);
      l.push(`                  >`);
      l.push(`                    {item.label}`);
      l.push(`                    {item.children && (`);
      l.push(`                      <span className="ml-auto -mr-0.5 flex size-6 shrink-0 items-center justify-center">`);
      l.push(`                        <motion.span className="inline-flex"`);
      l.push(`                          animate={{ rotate: closedRows[item.label] ? 0 : 90 }}`);
      l.push(`                          transition={spring.fast}>`);
      l.push(`                          <ChevronRightIcon size={16} strokeWidth={1.5}`);
      l.push(`                            className={\`text-muted-foreground transition-opacity duration-80 \${!closedRows[item.label]`);
      l.push(`                              ? "opacity-0 group-hover/parent-row:opacity-100 group-focus-within/parent-row:opacity-100"`);
      l.push(`                              : "opacity-100"}\`} />`);
      l.push(`                        </motion.span>`);
      l.push(`                      </span>`);
      l.push(`                    )}`);
      l.push(`                  </SidebarMenuButton>`);
    } else {
      l.push(`                  <SidebarMenuButton`);
      l.push(`                    icon={icons[item.icon]}`);
      l.push(`                    isActive={item.label === active}`);
      l.push(`                    onClick={() => setActive(item.label)}`);
      l.push(`                  >`);
      l.push(`                    {item.label}`);
      l.push(`                  </SidebarMenuButton>`);
    }
    if (p.l1Badges) {
      l.push(`                  {item.badge && <SidebarMenuBadge>{item.badge}</SidebarMenuBadge>}`);
    }
    // A row that owns a sub-tree gives its trailing slot to the chevron.
    l.push(
      ...rowActionLines(
        p.l1Actions,
        `                  `,
        nests && p.l1Actions > 0 ? `!item.children` : undefined
      )
    );
    if (nests) {
      l.push(`                  {item.children && (`);
      l.push(`                    <SidebarMenuSub open={!closedRows[item.label]}>`);
      l.push(`                      {item.children.map((child) => (`);
      l.push(`                        <SidebarMenuSubItem key={child.label}>`);
      l.push(
        p.l2Icon
          ? `                          <SidebarMenuSubButton icon={icons[child.icon]} href="#">`
          : `                          <SidebarMenuSubButton href="#">`
      );
      l.push(`                            {child.label}`);
      l.push(`                          </SidebarMenuSubButton>`);
      if (p.l2Badges) {
        l.push(`                          {child.badge && <SidebarMenuBadge>{child.badge}</SidebarMenuBadge>}`);
      }
      l.push(...rowActionLines(p.l2Actions, `                          `));
      l.push(`                        </SidebarMenuSubItem>`);
      l.push(`                      ))}`);
      l.push(`                    </SidebarMenuSub>`);
      l.push(`                  )}`);
    }
    l.push(`                </SidebarMenuItem>`);
    l.push(`              ))}`);
  }
  l.push(`            </SidebarMenu>`);
  l.push(`          </SidebarGroup>`);
  l.push(`        ))}`);
  l.push(`      </SidebarContent>`);

  // ── Footer ──
  if (hasFooter) {
    l.push(``);
    const calloutOnly =
      hasCallout && p.footerPrimary === "none" && p.footerActions === 0 && p.design === "inset";
    l.push(
      calloutOnly
        ? `      {/* nothing under the card — it sits flush on the edge */}\n      <SidebarFooter className="pb-0">`
        : `      <SidebarFooter>`
    );
    if (hasCallout) l.push(...calloutLines(p));
    const userRow = (horizontal: boolean, indent: string) => [
      `${indent}<SidebarUserFooter`,
      `${indent}  name="Jane Doe"`,
      `${indent}  avatar={`,
      `${indent}    <span className="flex size-5 items-center justify-center rounded-full bg-muted-foreground text-[10px] text-background">`,
      `${indent}      J`,
      `${indent}    </span>`,
      `${indent}  }`,
      ...(horizontal ? [`${indent}  className="min-w-0 flex-1"`] : []),
      `${indent}  menu={`,
      `${indent}    <>`,
      `${indent}      <MenuItem index={0} icon={UserIcon} label="Profile" onSelect={() => {}} />`,
      `${indent}      <MenuItem index={1} icon={SettingsIcon} label="Settings" onSelect={() => {}} />`,
      `${indent}      <MenuItem index={2} icon={ArrowLeftIcon} label="Log out" onSelect={() => {}} />`,
      `${indent}    </>`,
      `${indent}  }`,
      `${indent}/>`,
    ];
    if (p.footerStack === "horizontal") {
      if (p.footerPrimary === "dropdown" || p.footerActions > 0) {
        l.push(`        <div className="flex items-center gap-1 pr-1.5">`);
        if (p.footerPrimary === "dropdown") l.push(...userRow(true, `          `));
        for (const a of FOOTER_ACTION_SET.slice(0, p.footerActions)) {
          const Icon = a.icon === "settings" ? "FooterSettingsIcon" : "MoonIcon";
          l.push(`          <Tooltip content="${a.label}" side="top">`);
          l.push(`            <button type="button" aria-label="${a.label}"`);
          l.push(`              className="flex size-6 shrink-0 items-center justify-center rounded-md text-muted-foreground`);
          l.push(`                outline-none hover:bg-hover hover:text-foreground transition-colors duration-80`);
          l.push(`                focus-visible:ring-1 focus-visible:ring-[color:var(--focus-ring,#6B97FF)]">`);
          l.push(`              <${Icon} size={16} strokeWidth={1.5} />`);
          l.push(`            </button>`);
          l.push(`          </Tooltip>`);
        }
        l.push(`        </div>`);
      }
    } else {
      if (p.footerActions > 0) {
        l.push(`        {/* vertical: actions stack above the user row */}`);
        l.push(`        <SidebarMenu>`);
        for (const a of FOOTER_ACTION_SET.slice(0, p.footerActions)) {
          const Icon = a.icon === "settings" ? "FooterSettingsIcon" : "MoonIcon";
          l.push(`          <SidebarMenuItem>`);
          l.push(`            <SidebarMenuButton icon={${Icon}}>${a.label}</SidebarMenuButton>`);
          l.push(`          </SidebarMenuItem>`);
        }
        l.push(`        </SidebarMenu>`);
      }
      if (p.footerPrimary === "dropdown") l.push(...userRow(false, `        `));
    }
    l.push(`      </SidebarFooter>`);
  }

  l.push(`    </Sidebar>`);
  l.push(`  );`);
  l.push(`}`);
  return l.join("\n") + "\n";
}

/** Footer callout(s) — the Card resting one surface step above the rail. */
function calloutLines(p: SidebarPreset): string[] {
  const inline = p.footerCallout === "inline";
  const l: string[] = [];
  const cardClass = (ind: string) => [
    `${ind}  label="Aurora 2 is here — longer context, faster agents"`,
    `${ind}  className={\`rounded-xl overflow-hidden min-h-0 transition-[background-color,box-shadow]`,
    `${ind}    duration-80 \${surfaceClasses(level, 2)} \${surfaceHoverClasses(level + 1, 3)}`,
    `${ind}    shadow-[var(--shadow-2-inset)] hover:shadow-[var(--shadow-3-inset)]${inline ? " pl-2.5" : ""}\`}`,
  ];
  const media = (ind: string) =>
    p.footerCallout === "banner"
      ? `${ind}  {/* swap for your artwork */}\n${ind}  <CardImage src="/banner.png" className="aspect-[2/1] max-h-28" />`
      : `${ind}  <CardMedia icon={CalloutIcon} size={18} className="[&_svg]:text-[#6B97FF]" />`;
  const header = (ind: string, dynamic: boolean) => [
    inline ? `${ind}  <CardHeader className="gap-[2px] py-3">` : `${ind}  <CardHeader className="gap-0 pt-3">`,
    `${ind}    <CardTitle className="truncate">${dynamic ? "{c.title}" : "Aurora 2 is here"}</CardTitle>`,
    `${ind}    <CardDescription className="truncate text-[length:var(--fs-caption,12px)] leading-[var(--lh-caption,16px)]">${dynamic ? "{c.desc}" : "Longer context, faster agents"}</CardDescription>`,
    `${ind}  </CardHeader>`,
  ];
  if (!p.footerCalloutStacked) {
    l.push(`        {callouts.length > 0 && (`);
    if (inline) {
      l.push(`          <CardGroup orientation="inline" fluidHover={false}>`);
    }
    const ind = inline ? `          ` : `        `;
    l.push(`${ind}  <Card size="compact" dismissible onDismiss={() => dismiss(1)}`);
    l.push(...cardClass(ind));
    l.push(`${ind}  >`);
    l.push(media(ind));
    l.push(...header(ind, false));
    l.push(`${ind}  </Card>`);
    if (inline) l.push(`          </CardGroup>`);
    l.push(`        )}`);
    return l;
  }
  l.push(`        {/* sonner-style pile: cards peek 12px apiece behind the front one,`);
  l.push(`            scaling 0.05 a step, two peeks max${inline ? "; hover fans it out" : ""} */}`);
  l.push(`        <m.div className="relative"`);
  l.push(
    inline
      ? `          animate={{ height: expanded ? expandedH : collapsedH }}`
      : `          animate={{ height: collapsedH }}`
  );
  l.push(`          transition={{ ...spring.moderate, bounce: 0 }}`);
  if (inline) {
    l.push(`          onMouseEnter={() => setExpanded(true)} onMouseLeave={() => setExpanded(false)}`);
  }
  l.push(`        >`);
  l.push(`          <AnimatePresence initial={false}>`);
  l.push(`            {callouts.map((c, i) => (`);
  l.push(`              <m.div key={c.id} className="absolute inset-x-0 bottom-0"`);
  l.push(`                style={{ transformOrigin: "bottom center", zIndex: 100 - i }}`);
  l.push(`                initial={{ opacity: 0, y: 14, scale: 0.96 }}`);
  l.push(
    inline
      ? `                animate={expanded\n                  ? { y: -i * (cardH + 4), scale: 1, opacity: 1 }\n                  : { y: -Math.min(i, 2) * 12, scale: 1 - Math.min(i, 2) * 0.05,\n                      opacity: i <= 2 ? 1 : 0 }}`
      : `                animate={{ y: -Math.min(i, 2) * 12, scale: 1 - Math.min(i, 2) * 0.05,\n                  opacity: i <= 2 ? 1 : 0 }}`
  );
  l.push(`                exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.12 } }}`);
  l.push(`                transition={spring.moderate}`);
  l.push(`                ref={i === 0 ? (el) => { if (el) setCardH(el.offsetHeight); } : undefined}`);
  l.push(`              >`);
  if (inline) l.push(`                <CardGroup orientation="inline" fluidHover={false}>`);
  const ind = inline ? `                ` : `              `;
  l.push(`${ind}  <Card size="compact" dismissible onDismiss={() => dismiss(c.id)}`);
  l.push(...cardClass(ind));
  l.push(`${ind}  >`);
  l.push(media(ind));
  l.push(...header(ind, true));
  l.push(`${ind}  </Card>`);
  if (inline) l.push(`                </CardGroup>`);
  l.push(`              </m.div>`);
  l.push(`            ))}`);
  l.push(`          </AnimatePresence>`);
  l.push(`        </m.div>`);
  return l;
}

function pageFile(p: SidebarPreset): string {
  const l: string[] = [];
  const providers: [string, string][] = [];
  if (p.shape !== "rounded") providers.push(["ShapeProvider", ` defaultShape="${p.shape}"`]);
  if (p.size === "compact") providers.push(["SizeProvider", ` size="compact"`]);
  l.push(`"use client";`);
  l.push(``);
  l.push(`import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";`);
  l.push(`import { AppSidebar } from "@/components/sidebar-preset/app-sidebar";`);
  l.push(`import { SidebarInsetTopbar } from "@/components/sidebar-app/inset-topbar";`);
  if (p.shape !== "rounded") l.push(`import { ShapeProvider } from "@/lib/shape-context";`);
  if (p.size === "compact") l.push(`import { SizeProvider } from "@/lib/size-context";`);
  l.push(``);
  l.push(`// Generated from a fluidfunctionalism.com playground preset.`);
  l.push(`// State persists to the "sidebar_state" cookie — read it in a server`);
  l.push(`// layout for a flicker-free default:`);
  l.push(`//   const defaultOpen = (await cookies()).get("sidebar_state")?.value !== "false";`);
  l.push(``);
  l.push(`export default function Page() {`);
  l.push(`  return (`);
  let ind = `    `;
  for (const [name, props] of providers) {
    l.push(`${ind}<${name}${props}>`);
    ind += `  `;
  }
  l.push(
    `${ind}<SidebarProvider${p.collapsedBehavior !== "none" ? ` peek="${p.collapsedBehavior}"` : ""}${p.state === "closed" ? ` defaultOpen={false}` : ""}>`
  );
  l.push(`${ind}  <AppSidebar />`);
  l.push(`${ind}  <SidebarInset>`);
  l.push(`${ind}    <SidebarInsetTopbar />`);
  l.push(`${ind}    <main className="flex flex-1 flex-col gap-4 p-4">{/* your page */}</main>`);
  l.push(`${ind}  </SidebarInset>`);
  l.push(`${ind}</SidebarProvider>`);
  for (const [name] of [...providers].reverse()) {
    ind = ind.slice(2);
    l.push(`${ind}</${name}>`);
  }
  l.push(`  );`);
  l.push(`}`);
  return l.join("\n") + "\n";
}

export function generateSidebarPresetFiles(p: SidebarPreset): PresetFile[] {
  return [
    {
      path: `${DIR}/nav-data.ts`,
      type: "registry:component",
      target: `${DIR}/nav-data.ts`,
      content: navDataFile(p),
    },
    {
      path: `${DIR}/app-sidebar.tsx`,
      type: "registry:component",
      target: `${DIR}/app-sidebar.tsx`,
      content: appSidebarFile(p),
    },
    {
      path: "app/sidebar/page.tsx",
      type: "registry:page",
      target: "app/sidebar/page.tsx",
      content: pageFile(p),
    },
  ];
}

/** Registry dependencies the generated files need, as plain names — the
 *  route flavors them with the same helpers postbuild uses. */
export function presetRegistryDeps(p: SidebarPreset): string[] {
  const deps = new Set<string>(["utils", "icon-context", "size-context", "sidebar", "tooltip", "sidebar-inset-topbar"]);
  if (p.headerPrimary !== "none") deps.add("sidebar-workspace-header");
  if (p.footerPrimary === "dropdown") deps.add("sidebar-user-footer");
  if (p.headerStack === "vertical") deps.add("sidebar-search-field");
  if (
    p.headerPrimary === "dropdown" ||
    p.footerPrimary === "dropdown" ||
    p.l1Actions > 0 ||
    (p.l1Primary === "menu" && p.l1Children && p.l2Actions > 0)
  ) {
    deps.add("dropdown");
  }
  if (p.footerCallout !== "none") {
    deps.add("card");
    deps.add("surface-classes");
    deps.add("surface-context");
    deps.add("springs");
  }
  if (p.l1Primary === "menu" && p.l1Children) deps.add("springs");
  if (p.shape !== "rounded") deps.add("shape-context");
  return [...deps];
}

/** npm dependencies beyond what registryDependencies pull transitively. */
export function presetNpmDeps(p: SidebarPreset): string[] {
  const deps = new Set<string>(["lucide-react"]);
  if ((p.l1Primary === "menu" && p.l1Children) || p.footerCalloutStacked) {
    deps.add("motion");
  }
  return [...deps];
}
