"use client";

import { useEffect, useRef, useState, createElement, type CSSProperties, type ReactNode } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { spring } from "@/registry/default/lib/springs";
import {
  SidebarProvider,
  Sidebar,
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
  SidebarMenuBadge,
  SidebarMenuAction,
  SidebarMenuActions,
  SidebarMenuSkeleton,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
  SidebarInset,
  useSidebar,
  type SidebarVariant,
} from "@/components/flavored/sidebar";
import { useIcons, type IconName } from "@/lib/icon-context";
import { useShape } from "@/lib/shape-context";
import { useSize } from "@/lib/size-context";
import {
  encodeSidebarPreset,
  decodeSidebarPreset,
  SIDEBAR_DEFAULT_CODE,
  SIDEBAR_PRESET_DEF,
} from "@/lib/preset/components";
import {
  usePresetGlobals,
  usePresetUrlSync,
  GetCodeDialog,
} from "@/lib/docs/preset-ui";
import { Switch } from "@/registry/radix/switch";
import { Button } from "@/registry/radix/button";
import { Tooltip } from "@/registry/radix/tooltip";
import {
  DropdownMenu,
  DropdownTrigger,
  DropdownContent,
} from "@/components/flavored/dropdown";
import { MenuItem } from "@/registry/default/menu-item";
import {
  Card,
  CardGroup,
  CardImage,
  CardMedia,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/registry/default/card";
import { BANNER } from "@/lib/docs/playgrounds/card";
import { useSurface } from "@/lib/surface-context";
import { surfaceClasses, surfaceHoverClasses } from "@/lib/surface-classes";
import {
  PLAY_SWITCH,
  PlayField,
  PlaySelect,
  PlaySection,
  PlayDivider,
  PlaygroundPanel,
} from "@/lib/docs/playground";
import { SIDEBAR_ITEMS, SIDEBAR_THREADS } from "@/app/components/demo-data";
import { WorkspaceMenuItems } from "@/lib/docs/workspace-demo";
import {
  SidebarWorkspaceHeader,
  WorkspaceTile,
} from "@/components/sidebar-app/workspace-header";
import { SidebarUserFooter } from "@/components/sidebar-app/user-footer";
import { SidebarSearchField } from "@/components/sidebar-app/search-field";
import { SidebarInsetTopbar } from "@/components/sidebar-app/inset-topbar";
import { SIDEBAR_MENU_POPUP } from "@/lib/sidebar-menu-grid";
import type { PlaygroundProps } from "./types";

// ── Sidebar playground ───────────────────────────────────
// The panel mirrors the sidebar's own anatomy top to bottom — Layout, Header,
// Sections, the three content levels, Footer — so a control's position tells
// you what it touches. Each content level answers the same few questions:
// what leads the row, whether it nests, how many actions, badges on or off.

// State shape, defaults, and demo content live in lib/preset/sidebar-options —
// shared with the preset codec, the "Get code" route, and both generators.
import {
  type Count3,
  type Count2,
  type Stack,
  type PlayState,
  DEFAULT_STATE,
  ROW_ACTION_SET,
  GROUP_ACTION_SET,
  SEARCH_SHORTCUT,
  HEADER_ACTION_SET,
  FOOTER_ACTION_SET,
  L2_ROWS,
  SECTION_LABELS,
  iconTag,
} from "@/lib/preset/sidebar-options";

/** Anchored footer callout — the Card component on a surface one step above
 *  the sidebar it sits in, so it reads as a card resting on the rail.
 *  "banner" leads with the gradient banner; "inline" leads with an icon tile
 *  on a single inline row, for when the footer has less room to give. */
function FooterCallout({
  variant,
  onDismiss,
}: {
  variant: "inline" | "banner";
  onDismiss: () => void;
}) {
  const substrate = useSurface();
  const shape = useShape();
  const icons = useIcons();
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

  // CardImage / CardMedia stay DIRECT children: Card detects the image by
  // scanning its own children, and a fragment wrapper would hide it (which
  // silently drops the dismiss control's scrim).
  const card = (
    <Card
      size="compact"
      dismissible
      onDismiss={onDismiss}
      href="/docs/sidebar"
      label="Sidebar is here — new in Fluid Functionalism"
      // The icon row drops the card's 60px floor and tightens its inset;
      // there's one line of text beside the icon, nothing to give room to.
      className={`${surface}${variant === "inline" ? " min-h-0 pl-2.5" : ""}`}
    >
      {variant === "banner" ? (
        // Capped so a drag-resized rail doesn't grow the banner with it.
        <CardImage src={BANNER} className="aspect-[2/1] max-h-28" />
      ) : (
        <CardMedia icon={icons["panel-left"]} size={18} />
      )}
      {/* The dismiss clearance is hover-only (Card pads the header while the
          ✕ is revealed), so the resting title keeps the full row. */}
      <CardHeader
        className={variant === "banner" ? "gap-0 pt-3" : "gap-[2px] py-3"}
      >
        <CardTitle className="truncate">Sidebar is here</CardTitle>
        <CardDescription className="truncate text-caption">
          New in Fluid Functionalism
        </CardDescription>
      </CardHeader>
    </Card>
  );

  // Inline orientation (leading media, text beside it) comes from the group.
  return variant === "inline" ? (
    <CardGroup orientation="inline" fluidHover={false}>
      {card}
    </CardGroup>
  ) : (
    card
  );
}

// ── Stacked footer callouts ──────────────────────────────
// Sonner-style pile, on the queued-message stack's geometry: cards peek out
// 12px apiece behind the front one, scaling down a step each, capped at two
// visible peeks. Only the INLINE pile fans out on hover (banner cards are too
// tall to fan inside a footer); either way, dismissing the front card is what
// reveals (and promotes) the one below. Each card keeps its own step of the
// brand-blue mesh, so the pile reads as one family with depth. The container
// is IN FLOW — the footer sits at the column's bottom.

const CALLOUT_STACK: readonly {
  id: string;
  icon: IconName;
  title: string;
  desc: string;
}[] = [
  { id: "sidebar", icon: "panel-left", title: "Sidebar is here", desc: "New in Fluid Functionalism" },
  { id: "stars", icon: "star", title: "500 stars", desc: "Find the hidden mosaic" },
  { id: "motion", icon: "play", title: "Motion guidelines", desc: "Three spring tiers, one page" },
];

const CALLOUT_PEEK = 12;
const CALLOUT_SCALE = 0.05;
const CALLOUT_GAP = 4;
const CALLOUT_MAX_PEEK = 2;
/** Brand-mesh intensity per card (by its place in CALLOUT_STACK — a card
 *  keeps its own tint when promotion moves it forward). */
const CALLOUT_MESH_STEPS = [1, 0.4, 0.66] as const;
/** The inline tile's flat equivalent of the same ladder (the second card is
 *  the lightest, so the pile alternates instead of just fading back). */
const CALLOUT_TILE_TINTS = [
  "bg-[#6B97FF]/25",
  "bg-[#6B97FF]/[0.08]",
  "bg-[#6B97FF]/15",
] as const;

/** Scales every opacity stop in the card playground's brand-blue mesh, so
 *  one asset yields the whole intensity ladder. */
function meshAt(src: string, k: number): string {
  return src.replace(
    /(stop-opacity='|fill-opacity=')([0-9.]+)/g,
    (_, prefix, value) => `${prefix}${Math.round(Number(value) * k * 1000) / 1000}`
  );
}
/** Height fallbacks until the first card is measured. */
const CALLOUT_INLINE_H = 64;
const CALLOUT_BANNER_H = 180;

export function FooterCalloutStack({
  variant,
  onEmpty,
}: {
  variant: "inline" | "banner";
  onEmpty: () => void;
}) {
  const substrate = useSurface();
  const shape = useShape();
  const icons = useIcons();
  const [cards, setCards] = useState(() => [...CALLOUT_STACK]);
  // Banner cards never fan out — a hover-expanded pile of banners would
  // swallow the whole rail. The inline pile expands under the pointer.
  const [hovered, setHovered] = useState(false);
  const expanded = variant === "inline" && hovered;

  // Cards share one anatomy, so the FRONT card's measured height drives the
  // whole pile's geometry — a banner's height follows the rail's width
  // (aspect-ratio image), so it can't be a constant. offsetHeight, not
  // getBoundingClientRect: the /demo card scales this preview.
  // Refs are kept per card id: the FRONT card is the measure target, and an
  // id-keyed map survives promotion — a dismissed card's late ref cleanup
  // (AnimatePresence keeps it mounted through its exit) deletes its own
  // entry instead of clobbering the promoted card's.
  const wrapperRefs = useRef(new Map<string, HTMLDivElement>());
  const frontId = cards[0]?.id;
  const [cardH, setCardH] = useState(
    variant === "banner" ? CALLOUT_BANNER_H : CALLOUT_INLINE_H
  );
  useEffect(() => {
    const el = frontId ? wrapperRefs.current.get(frontId) : undefined;
    if (!el || typeof ResizeObserver === "undefined") return;
    const measure = () => {
      if (el.offsetHeight) setCardH(el.offsetHeight);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [frontId]);

  const level = Math.min(substrate + 1, 8);
  const surface = `${shape.container} overflow-hidden transition-[background-color,box-shadow] duration-80 ${surfaceClasses(
    level,
    2
  )} ${surfaceHoverClasses(
    level + 1,
    3
  )} shadow-[var(--shadow-2-inset)] hover:shadow-[var(--shadow-3-inset)]`;

  const n = cards.length;
  const collapsedH =
    cardH + Math.min(Math.max(n - 1, 0), CALLOUT_MAX_PEEK) * CALLOUT_PEEK;
  const expandedH = n * cardH + Math.max(n - 1, 0) * CALLOUT_GAP;

  // onEmpty stays OUT of the state updater — updaters must be pure (strict
  // mode double-invokes them, which double-fired the restock).
  const dismiss = (id: string) => {
    const next = cards.filter((c) => c.id !== id);
    setCards(next);
    if (next.length === 0) onEmpty();
  };

  return (
    <motion.div
      className="relative"
      // Measured heights, never an animated "auto" — the /demo card scales
      // this preview.
      animate={{ height: expanded ? expandedH : collapsedH }}
      transition={{ ...spring.moderate, bounce: 0 }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <AnimatePresence initial={false}>
        {cards.map((c, i) => {
          const peek = Math.min(i, CALLOUT_MAX_PEEK);
          // The tint follows the CARD, not the slot — promotion keeps it.
          const step = CALLOUT_STACK.findIndex((x) => x.id === c.id);
          const card = (
            <Card
              size="compact"
              dismissible
              onDismiss={() => dismiss(c.id)}
              href="/docs/sidebar"
              label={`${c.title} — ${c.desc}`}
              className={`${surface} min-h-0${variant === "inline" ? " pl-2.5" : ""}`}
            >
              {/* CardImage / CardMedia stay DIRECT children (a ternary is —
                  a fragment wrapper would hide them from Card's scan). */}
              {variant === "banner" ? (
                <CardImage
                  src={meshAt(BANNER, CALLOUT_MESH_STEPS[step] ?? 0.4)}
                  className="aspect-[2/1] max-h-28"
                />
              ) : (
                <CardMedia
                  icon={icons[c.icon]}
                  size={18}
                  // Full brand color on the glyph — the tinted tile carries
                  // the intensity step, the icon stays at full strength. The
                  // [&_svg] variant out-specifies CardMedia's own muted color.
                  className={`${CALLOUT_TILE_TINTS[step] ?? CALLOUT_TILE_TINTS[2]} [&_svg]:text-[#6B97FF]`}
                />
              )}
              <CardHeader
                className={
                  variant === "banner" ? "gap-0 pt-3" : "gap-[2px] py-3"
                }
              >
                <CardTitle className="truncate">{c.title}</CardTitle>
                <CardDescription className="truncate text-caption">
                  {c.desc}
                </CardDescription>
              </CardHeader>
            </Card>
          );
          return (
            <motion.div
              key={c.id}
              ref={(node) => {
                if (node) wrapperRefs.current.set(c.id, node);
                else wrapperRefs.current.delete(c.id);
              }}
              className="absolute inset-x-0 bottom-0"
              initial={{ opacity: 0, y: 14, scale: 0.96 }}
              animate={
                expanded
                  ? { y: -i * (cardH + CALLOUT_GAP), scale: 1, opacity: 1 }
                  : {
                      y: -peek * CALLOUT_PEEK,
                      scale: 1 - peek * CALLOUT_SCALE,
                      opacity: i <= CALLOUT_MAX_PEEK ? 1 : 0,
                    }
              }
              exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.12 } }}
              transition={spring.moderate}
              style={{ transformOrigin: "bottom center", zIndex: 100 - i }}
            >
              {variant === "inline" ? (
                <CardGroup orientation="inline" fluidHover={false}>
                  {card}
                </CardGroup>
              ) : (
                card
              )}
            </motion.div>
          );
        })}
      </AnimatePresence>
    </motion.div>
  );
}

/** Workspace brand row for the playground header — the
 *  sidebar-workspace-header block, fed the playground's standard content.
 *  The "logo" variant omits the menu, so the block renders the
 *  non-interactive lockup. */
function BrandHeaderRow({ variant }: { variant: "dropdown" | "logo" }) {
  if (variant === "logo") {
    return (
      <SidebarWorkspaceHeader
        name="Acme Inc"
        tile={<WorkspaceTile>A</WorkspaceTile>}
      />
    );
  }
  return (
    <SidebarWorkspaceHeader
      name="Acme Inc"
      tile={<WorkspaceTile>A</WorkspaceTile>}
      menu={<WorkspaceMenuItems />}
      checkedIndex={0}
    />
  );
}

function pick<T>(options: readonly T[]): T {
  return options[Math.floor(Math.random() * options.length)];
}


// ── Generated code ───────────────────────────────────────

function rowActionLines(count: Count3, indent: string): string[] {
  if (count === 0) return [];
  const actions = ROW_ACTION_SET.slice(-count);
  // Mirrors the preview's render(): plain actions get a Tooltip; the
  // overflow action (always kept — it's sliced from the end) is a
  // DropdownMenu whose 240px content matches the header/footer triggers,
  // so every menu in the sidebar reads as one family.
  const one = (a: (typeof ROW_ACTION_SET)[number], showOnHover: boolean, ind: string): string[] =>
    "menu" in a && a.menu
      ? [
          `${ind}<DropdownMenu>`,
          `${ind}  <DropdownTrigger render={`,
          `${ind}    <SidebarMenuAction${showOnHover ? " showOnHover" : ""} aria-label="${a.label}">`,
          `${ind}      <${iconTag(a.icon)} />`,
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
          `${ind}    <${iconTag(a.icon)} />`,
          `${ind}  </SidebarMenuAction>`,
          `${ind}</Tooltip>`,
        ];
  if (count === 1) return one(actions[0], true, indent);
  return [
    `${indent}{/* more than one action: the cluster owns the row's gutter */}`,
    `${indent}<SidebarMenuActions showOnHover>`,
    ...actions.flatMap((a) => one(a, false, `${indent}  `)),
    `${indent}</SidebarMenuActions>`,
  ];
}

/** The popup class both sidebar-anchored menus share — emitted once as a
 *  const, interpolated from the shipped lib so the generated snippet can
 *  never drift from what installs. */
function popupConstLines(): string[] {
  return [
    `/* Sidebar-anchored menus: trigger width +10px, shifted -4px — items start`,
    `   at the trigger row's edge, icon slots land on the rows' leading axis,`,
    `   and the trailing check sits on the trigger chevron's axis.`,
    `   Installable: npx shadcn add @fluid/sidebar-menu-grid */`,
    `const SIDEBAR_MENU_POPUP =`,
    `  "${SIDEBAR_MENU_POPUP}";`,
  ];
}

/** Tooltip content used by the horizontal header's icon buttons: the label
 *  plus a keystroke chip, height-matched to a chipless tooltip. */
function tipHelperLines(): string[] {
  return [
    `/* Tooltip label + keystroke chip, height-matched to a chipless tooltip:`,
    `   the flex row escapes the surface's text-box trim, so the label`,
    `   re-applies it and the chip pulls its box back with -my-1. */`,
    `const tipWithShortcut = (label: string, shortcut: string) => (`,
    `  <span className="flex items-center gap-2">`,
    `    <span className="[text-box:trim-both_cap_alphabetic]">{label}</span>`,
    `    <kbd className="-my-1 flex h-4 min-w-4 items-center justify-center rounded border`,
    `      border-background/30 px-1 font-sans text-[10px] text-background/80">{shortcut}</kbd>`,
    `  </span>`,
    `);`,
  ];
}

/** The footer's user row, emitted for real — avatar on the leading icon
 *  axis, chevron on the trailing action axis, popup on the shared grid. */
function userRowLines(horizontal: boolean, indent: string): string[] {
  const pad = (s: string) => `${indent}${s}`;
  return [
    `<SidebarMenu aria-label="User"${horizontal ? ` className="min-w-0 flex-1"` : ``}>`,
    `  <SidebarMenuItem>`,
    `    <DropdownMenu>`,
    `      <DropdownTrigger render={`,
    `        <SidebarMenuButton aria-label="Open user menu">`,
    `          {/* -ml-0.5 centres the 20px avatar on the rows' leading icon axis;`,
    `              the chevron rides a 24px slot pulled -mr-0.5 onto the trailing`,
    `              action axis */}`,
    `          <img src="/avatar.png" alt="" width={20} height={20}`,
    `            className="-ml-0.5 -mr-0.5 size-5 shrink-0 rounded-full" />`,
    `          <span className="min-w-0 truncate text-[13px] text-foreground">Micka Touillaud</span>`,
    `          <span className="ml-auto -mr-0.5 flex size-6 shrink-0 items-center justify-center">`,
    `            <ChevronsUpDownIcon size={16} strokeWidth={1.5} className="text-muted-foreground" />`,
    `          </span>`,
    `        </SidebarMenuButton>`,
    `      } />`,
    `      <DropdownContent className={SIDEBAR_MENU_POPUP} side="top" align="start" sideOffset={6}>`,
    `        <MenuItem index={0} icon={UserIcon} label="Profile" onSelect={() => {}} />`,
    `        <MenuItem index={1} icon={SettingsIcon} label="Settings" onSelect={() => {}} />`,
    `      </DropdownContent>`,
    `    </DropdownMenu>`,
    `  </SidebarMenuItem>`,
    `</SidebarMenu>`,
  ].map(pad);
}

/** The brand row, emitted for real — the crossfade slot is the single most
 *  finetuned pattern in the sidebar and must survive into the snippet. */
function brandRowLines(
  variant: "dropdown" | "logo",
  peek: boolean,
  indent: string
): string[] {
  const pad = (s: string) => `${indent}${s}`;
  // While the sidebar is only peeked, the trigger fades into the tile's
  // slot; without peek the swap never shows, so the snippet skips it.
  const trigger = peek
    ? [
        `  {/* isPeeking comes from useSidebar(), read in a child of the provider.`,
        `      While the rail is only PEEKED the overlay covers the pointer's one`,
        `      way to pin it open — so the trigger cross-fades with the tile,`,
        `      in place: neither element moves, only opacity. */}`,
        `  <SidebarTrigger`,
        `    size="icon-compact"`,
        `    aria-hidden={!isPeeking || undefined}`,
        `    tabIndex={isPeeking ? undefined : -1}`,
        `    className={\`absolute left-1 top-1/2 z-20 -translate-y-1/2`,
        `      [&>span:first-child]:hidden [&_svg]:size-4 transition-opacity duration-80`,
        `      \${isPeeking ? "opacity-100" : "pointer-events-none opacity-0"}\`}`,
        `  />`,
      ]
    : [];
  const tile = [
    `  {/* 20px tile at left-1.5 — centred on the rows' 16px leading axis;`,
    `      the constant pl-8 keeps the name pinned while the slot swaps */}`,
    `  <span aria-hidden className={\`pointer-events-none absolute left-1.5 top-1/2 flex size-5`,
    `    -translate-y-1/2 items-center justify-center rounded-md bg-foreground text-[10px]`,
    `    text-background${peek ? ` transition-opacity duration-80 \${isPeeking ? "opacity-0" : "opacity-100"}` : ""}\`}>A</span>`,
  ];
  const name = `<span className="min-w-0 truncate text-[13px] text-foreground">Acme Inc</span>`;
  if (variant === "logo") {
    return [
      `{/* logo lockup — not interactive, so it lives OUTSIDE SidebarMenu`,
      `    (a menu row would track the traveling hover background) */}`,
      `<div className="relative flex h-8 items-center pl-8 pr-2">`,
      ...trigger,
      ...tile,
      `  ${name}`,
      `</div>`,
    ].map(pad);
  }
  return [
    `{/* workspace switcher. @container: the chevron hides once the row gets`,
    `    too narrow to show a useful slice of the name */}`,
    `<SidebarMenu aria-label="Workspace" className="@container">`,
    `  <SidebarMenuItem>`,
    ...trigger.map((l) => `  ${l}`),
    `    <DropdownMenu>`,
    `      <DropdownTrigger render={`,
    `        <SidebarMenuButton aria-label="Switch workspace" className="pl-8">`,
    ...tile.map((l) => `        ${l}`),
    `          ${name}`,
    `          <span className="ml-auto inline-flex @max-[7rem]:hidden">`,
    `            <ChevronDownIcon size={16} strokeWidth={1.5} className="text-muted-foreground" />`,
    `          </span>`,
    `        </SidebarMenuButton>`,
    `      } />`,
    `      <DropdownContent className={SIDEBAR_MENU_POPUP} align="start" sideOffset={4} checkedIndex={0}>`,
    `        <MenuItem index={0} icon={AcmeTile} label="Acme Inc" checked onSelect={() => {}} />`,
    `        <MenuItem index={1} icon={PlusIcon} label="New workspace" onSelect={() => {}} />`,
    `      </DropdownContent>`,
    `    </DropdownMenu>`,
    `  </SidebarMenuItem>`,
    `</SidebarMenu>`,
  ].map(pad);
}

export function buildSidebarPlaygroundCode(o: PlayState): string {
  const lines: string[] = [];
  const loading = o.state === "loading";
  // Threads are leaves — only the icon menu nests.
  const nests = o.l1Primary === "menu" && o.l1Children;
  // What the snippet actually renders, so the import list stays honest:
  // loading swaps the body rows for skeletons (and drops the sub-tree), but
  // the brand row (dropdown variant), the user row, and the vertical
  // header/footer action stacks still emit menu rows even while loading.
  const menuRows =
    !loading ||
    o.headerPrimary === "dropdown" ||
    o.footerPrimary === "dropdown" ||
    (o.headerStack === "vertical" && o.headerActions > 0) ||
    (o.footerStack === "vertical" && o.footerActions > 0);
  const maxActions = loading ? 0 : Math.max(o.l1Actions, nests ? o.l2Actions : 0);
  const anyBadge = !loading && (o.l1Badges || (nests && o.l2Badges));
  const hasFooter =
    o.footerPrimary === "dropdown" || o.footerActions > 0 || o.footerCallout !== "none";

  lines.push(`import {`);
  lines.push(`  SidebarProvider, Sidebar, SidebarTrigger, SidebarInset,`);
  lines.push(
    `  SidebarHeader,${o.headerStack === "vertical" ? " SidebarInput," : ""} SidebarContent,${hasFooter ? " SidebarFooter," : ""}`
  );
  lines.push(
    o.sectionActions > 0
      ? `  SidebarGroup, SidebarGroupLabel, SidebarGroupActions, SidebarGroupAction,`
      : `  SidebarGroup, SidebarGroupLabel,`
  );
  lines.push(`  SidebarMenu,${menuRows ? " SidebarMenuItem," : ""}`);
  const menuExtras = [
    ...(menuRows ? ["SidebarMenuButton"] : []),
    ...(anyBadge ? ["SidebarMenuBadge"] : []),
    ...(maxActions > 0 ? ["SidebarMenuAction"] : []),
    ...(maxActions > 1 ? ["SidebarMenuActions"] : []),
    ...(nests && !loading
      ? ["SidebarMenuSub", "SidebarMenuSubItem", "SidebarMenuSubButton"]
      : []),
    ...(loading ? ["SidebarMenuSkeleton"] : []),
  ];
  lines.push(`  ${menuExtras.join(", ")},`);
  lines.push(`} from "./components";`);
  // The brand/user menus, row overflow menus, and action tooltips all pull
  // from the same flavored primitives; import them only when rendered.
  const anyMenuPopup = o.headerPrimary === "dropdown" || o.footerPrimary === "dropdown";
  const anyTooltip =
    maxActions > 0 ||
    o.sectionActions > 0 ||
    o.headerStack === "horizontal" ||
    (o.footerStack === "horizontal" && o.footerActions > 0);
  if (anyMenuPopup || maxActions > 0 || anyTooltip) {
    lines.push(
      `import { DropdownMenu, DropdownTrigger, DropdownContent, MenuItem, Tooltip } from "./components";`
    );
  }
  lines.push(``);
  if (anyMenuPopup) {
    lines.push(...popupConstLines());
    lines.push(``);
  }
  if (o.headerStack === "horizontal") {
    lines.push(...tipHelperLines());
    lines.push(``);
  }

  const providerProps =
    ` open={open} onOpenChange={setOpen}` +
    (o.collapsedBehavior !== "none" ? ` peek="${o.collapsedBehavior}"` : ``);
  lines.push(`<SidebarProvider${providerProps}>`);
  lines.push(`  <Sidebar${o.design !== "sidebar" ? ` variant="${o.design}"` : ""}>`);

  // Header
  const headerActions = HEADER_ACTION_SET.slice(0, o.headerActions);
  const peek = o.collapsedBehavior !== "none";
  const iconButton = (label: string, icon: string, shortcut: string | null, indent: string) => [
    shortcut
      ? `${indent}<Tooltip content={tipWithShortcut("${label}", "${shortcut}")} side="bottom">`
      : `${indent}<Tooltip content="${label}" side="bottom">`,
    `${indent}  <Button variant="ghost" size="icon-compact" className="size-6 shrink-0" aria-label="${label}">`,
    `${indent}    <${icon} />`,
    `${indent}  </Button>`,
    `${indent}</Tooltip>`,
  ];
  lines.push(`    <SidebarHeader>`);
  if (o.headerStack === "horizontal") {
    lines.push(`      {/* horizontal: search + actions share the brand line as 24px`);
    lines.push(`          buttons, inset pr-1.5 onto the section actions' axis */}`);
    lines.push(`      <div className="flex items-center gap-1 pr-1.5">`);
    // The brand slot keeps its flex-1 spacer even when empty, so the icon
    // buttons hold the trailing edge exactly as the preview does.
    if (o.headerPrimary === "none") {
      lines.push(`        <div className="min-w-0 flex-1" />`);
    } else {
      lines.push(`        <div className="min-w-0 flex-1">`);
      lines.push(...brandRowLines(o.headerPrimary, peek, `          `));
      lines.push(`        </div>`);
    }
    lines.push(...iconButton("Search", "SearchIcon", SEARCH_SHORTCUT, `        `));
    for (const a of headerActions) {
      lines.push(...iconButton(a.label, iconTag(a.icon), a.shortcut, `        `));
    }
    lines.push(`      </div>`);
  } else {
    if (o.headerPrimary !== "none") {
      lines.push(...brandRowLines(o.headerPrimary, peek, `      `));
    }
    lines.push(`      {/* search + action rows are ONE block: the field reads as the`);
    lines.push(`          list's first row, on the menu rows' own tight rhythm */}`);
    lines.push(`      <div className="flex flex-col">`);
    lines.push(`        <div className="group/search relative">`);
    lines.push(`          <SearchIcon size={16} strokeWidth={1.5}`);
    lines.push(`            className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground" />`);
    lines.push(`          <SidebarInput placeholder="Search…" aria-label="Search" className="pl-8 pr-12" />`);
    lines.push(`          {/* revealed on hover/focus — the placeholder owns the field at rest */}`);
    lines.push(`          <kbd className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 font-sans`);
    lines.push(`            text-[11px] text-muted-foreground opacity-0 transition-opacity duration-80`);
    lines.push(`            group-hover/search:opacity-100 group-focus-within/search:opacity-100">${SEARCH_SHORTCUT}</kbd>`);
    lines.push(`        </div>`);
    if (headerActions.length > 0) {
      lines.push(`        <SidebarMenu>`);
      for (const a of headerActions) {
        lines.push(`          <SidebarMenuItem>`);
        lines.push(`            <SidebarMenuButton icon={${iconTag(a.icon)}}>`);
        lines.push(`              ${a.label}`);
        lines.push(`              {/* shortcut chip, revealed on row hover */}`);
        lines.push(`              <span className="ml-auto inline-flex opacity-0 transition-opacity duration-80`);
        lines.push(`                group-hover/menu-item:opacity-100 group-focus-within/menu-item:opacity-100">`);
        lines.push(`                <kbd className="font-sans text-[11px] text-muted-foreground">${a.shortcut}</kbd>`);
        lines.push(`              </span>`);
        lines.push(`            </SidebarMenuButton>`);
        lines.push(`          </SidebarMenuItem>`);
      }
      lines.push(`        </SidebarMenu>`);
    }
    lines.push(`      </div>`);
  }
  lines.push(`    </SidebarHeader>`);

  // Content
  lines.push(`    <SidebarContent>`);
  lines.push(`      <SidebarGroup${o.sectionsCollapsible ? " collapsible" : ""}>`);
  lines.push(`        <SidebarGroupLabel>${SECTION_LABELS[o.l1Primary][0]}</SidebarGroupLabel>`);
  if (o.sectionActions > 0) {
    lines.push(`        <SidebarGroupActions>`);
    for (const a of GROUP_ACTION_SET.slice(0, o.sectionActions)) {
      lines.push(`          <Tooltip content="${a.label}" side="top">`);
      lines.push(`            <SidebarGroupAction aria-label="${a.label}">`);
      lines.push(`              <${iconTag(a.icon)} />`);
      lines.push(`            </SidebarGroupAction>`);
      lines.push(`          </Tooltip>`);
    }
    lines.push(`        </SidebarGroupActions>`);
  }
  lines.push(`        <SidebarMenu>`);
  if (loading) {
    lines.push(`          {items.map((item) => (`);
    lines.push(`            <SidebarMenuSkeleton key={item.label} showIcon />`);
    lines.push(`          ))}`);
  } else {
    lines.push(`          {items.map((item) => (`);
    lines.push(`            <SidebarMenuItem key={item.label}>`);
    if (o.l1Primary === "threads") {
      lines.push(`              {/* semantic status drives the dot, data-status,`);
      lines.push(`                  and the screen-reader "unread" text */}`);
      lines.push(`              <SidebarMenuButton status={item.status}>{item.label}</SidebarMenuButton>`);
    } else if (nests) {
      lines.push(`              {/* group/parent-row scopes the chevron reveal to the row's own`);
      lines.push(`                  button; the pinned gutter keeps it from sliding on hover */}`);
      lines.push(`              <SidebarMenuButton icon={item.icon} isActive={item.active}`);
      lines.push(`                className={item.children ? "group/parent-row" : undefined}`);
      lines.push(`                aria-expanded={item.children ? item.open : undefined}`);
      lines.push(`                style={item.children ? { "--row-gutter": "var(--row-gutter-hover)" } : undefined}>`);
      lines.push(`                {item.label}`);
      lines.push(`                {item.children && (`);
      lines.push(`                  <span className="ml-auto -mr-0.5 flex size-6 shrink-0 items-center justify-center">`);
      lines.push(`                    {/* one chevron-right glyph, sprung 90° while open; at rest an`);
      lines.push(`                        open row hides it — hover/focus brings it back */}`);
      lines.push(`                    <motion.span className="inline-flex" animate={{ rotate: item.open ? 90 : 0 }}`);
      lines.push(`                      transition={spring.fast}>`);
      lines.push(`                      <ChevronRightIcon size={16} strokeWidth={1.5}`);
      lines.push(`                        className={\`text-muted-foreground transition-opacity duration-80 \${item.open`);
      lines.push(`                          ? "opacity-0 group-hover/parent-row:opacity-100 group-focus-within/parent-row:opacity-100"`);
      lines.push(`                          : "opacity-100"}\`} />`);
      lines.push(`                    </motion.span>`);
      lines.push(`                  </span>`);
      lines.push(`                )}`);
      lines.push(`              </SidebarMenuButton>`);
    } else {
      lines.push(`              <SidebarMenuButton icon={item.icon} isActive={item.active}>`);
      lines.push(`                {item.label}`);
      lines.push(`              </SidebarMenuButton>`);
    }
    if (o.l1Badges) {
      lines.push(`              {item.badge && <SidebarMenuBadge>{item.badge}</SidebarMenuBadge>}`);
    }
    // A row that owns a sub-tree gives its trailing slot to the chevron, so
    // the printed code guards the actions the same way the preview does.
    if (nests && o.l1Actions > 0) {
      lines.push(`              {!item.children && (`);
      lines.push(...rowActionLines(o.l1Actions, `                `));
      lines.push(`              )}`);
    } else {
      lines.push(...rowActionLines(o.l1Actions, `              `));
    }
    if (nests) {
      lines.push(`              <SidebarMenuSub open={item.open}>`);
      lines.push(`                {item.children.map((child) => (`);
      lines.push(`                  <SidebarMenuSubItem key={child.label}>`);
      lines.push(
        o.l2Icon
          ? `                    <SidebarMenuSubButton icon={child.icon} href="#">`
          : `                    <SidebarMenuSubButton href="#">`
      );
      lines.push(`                      {child.label}`);
      lines.push(`                    </SidebarMenuSubButton>`);
      if (o.l2Badges) {
        lines.push(`                    {child.badge && <SidebarMenuBadge>{child.badge}</SidebarMenuBadge>}`);
      }
      lines.push(...rowActionLines(o.l2Actions, `                    `));
      lines.push(`                  </SidebarMenuSubItem>`);
      lines.push(`                ))}`);
      lines.push(`              </SidebarMenuSub>`);
    }
    lines.push(`            </SidebarMenuItem>`);
    lines.push(`          ))}`);
  }
  lines.push(`        </SidebarMenu>`);
  lines.push(`      </SidebarGroup>`);
  if (!loading) {
    lines.push(`      <SidebarGroup${o.sectionsCollapsible ? " collapsible" : ""}>`);
    lines.push(`        <SidebarGroupLabel>${SECTION_LABELS[o.l1Primary][1]}</SidebarGroupLabel>`);
    lines.push(`        <SidebarMenu>{/* same row anatomy */}</SidebarMenu>`);
    lines.push(`      </SidebarGroup>`);
  }
  lines.push(`    </SidebarContent>`);

  // Footer
  if (hasFooter) {
    const footerActions = FOOTER_ACTION_SET.slice(0, o.footerActions);
    // Flush to the edge only in the inset variant (see the shell).
    const calloutOnly =
      o.footerCallout !== "none" &&
      o.footerPrimary === "none" &&
      footerActions.length === 0 &&
      o.design === "inset";
    lines.push(
      calloutOnly
        ? `    {/* nothing under the card — it sits flush on the edge */}\n    <SidebarFooter className="pb-0">`
        : `    <SidebarFooter>`
    );
    if (o.footerCallout !== "none" && o.footerCalloutStacked) {
      lines.push(`      {/* Stacked callouts — a sonner-style pile: cards peek 12px apiece`);
      lines.push(`          behind the front one (scaling down 0.05 a step, two peeks max).`);
      lines.push(
        o.footerCallout === "banner"
          ? `          Banner piles never fan out (too tall for a footer) — dismissing`
          : `          The inline pile fans out into a column on hover — and either way,`
      );
      lines.push(
        o.footerCallout === "banner"
          ? `          the front card is what reveals and promotes the next. Each card`
          : `          dismissing the front card reveals and promotes the next. Each card`
      );
      lines.push(`          keeps its own step of the brand mesh's intensity ladder.`);
      lines.push(`          Bottom-anchored absolutes inside an in-flow container whose`);
      lines.push(`          measured height animates (CARD_H = the front card's measured`);
      lines.push(`          offsetHeight). */}`);
      lines.push(
        o.footerCallout === "banner"
          ? `      <motion.div className="relative" animate={{ height: collapsedH }}\n        transition={{ ...spring.moderate, bounce: 0 }}>`
          : `      <motion.div className="relative" animate={{ height: expanded ? expandedH : collapsedH }}\n        transition={{ ...spring.moderate, bounce: 0 }}\n        onMouseEnter={() => setExpanded(true)} onMouseLeave={() => setExpanded(false)}>`
      );
      lines.push(`        <AnimatePresence initial={false}>`);
      lines.push(`          {callouts.map((c, i) => (`);
      lines.push(`            <motion.div key={c.id} className="absolute inset-x-0 bottom-0"`);
      lines.push(`              style={{ transformOrigin: "bottom center", zIndex: 100 - i }}`);
      lines.push(`              initial={{ opacity: 0, y: 14, scale: 0.96 }}`);
      lines.push(
        o.footerCallout === "banner"
          ? `              animate={{ y: -Math.min(i, 2) * 12, scale: 1 - Math.min(i, 2) * 0.05,\n                opacity: i <= 2 ? 1 : 0 }}`
          : `              animate={expanded\n                ? { y: -i * (CARD_H + 4), scale: 1, opacity: 1 }\n                : { y: -Math.min(i, 2) * 12, scale: 1 - Math.min(i, 2) * 0.05,\n                    opacity: i <= 2 ? 1 : 0 }}`
      );
      lines.push(`              exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.12 } }}`);
      lines.push(`              transition={spring.moderate}>`);
      if (o.footerCallout === "inline") {
        lines.push(`              {/* inline orientation puts the icon beside the text */}`);
        lines.push(`              <CardGroup orientation="inline" fluidHover={false}>`);
      }
      const stackCardIndent = o.footerCallout === "inline" ? `                ` : `              `;
      lines.push(`${stackCardIndent}{/* one surface step above the rail, rising another under the`);
      lines.push(`${stackCardIndent}    pointer — the inset shadow keeps the hairline inside the box */}`);
      lines.push(`${stackCardIndent}<Card size="compact" dismissible onDismiss={() => dismiss(c.id)}`);
      lines.push(`${stackCardIndent}  label={\`\${c.title} — \${c.desc}\`}`);
      lines.push(`${stackCardIndent}  className={\`rounded-xl overflow-hidden min-h-0 transition-[background-color,box-shadow]`);
      lines.push(`${stackCardIndent}    duration-80 \${surfaceClasses(level, 2)} \${surfaceHoverClasses(level + 1, 3)}`);
      lines.push(
        `${stackCardIndent}    shadow-[var(--shadow-2-inset)] hover:shadow-[var(--shadow-3-inset)]${o.footerCallout === "inline" ? " pl-2.5" : ""}\`}>`
      );
      lines.push(
        o.footerCallout === "banner"
          ? `${stackCardIndent}  {/* meshAt scales the brand mesh's stops to the card's step */}\n${stackCardIndent}  <CardImage src={meshAt(banner, c.intensity)} className="aspect-[2/1] max-h-28" />`
          : `${stackCardIndent}  <CardMedia icon={c.icon} size={18} className={\`\${c.tint} [&_svg]:text-[#6B97FF]\`} />`
      );
      lines.push(
        o.footerCallout === "banner"
          ? `${stackCardIndent}  <CardHeader className="gap-0 pt-3">`
          : `${stackCardIndent}  <CardHeader className="gap-[2px] py-3">`
      );
      lines.push(`${stackCardIndent}    <CardTitle className="truncate">{c.title}</CardTitle>`);
      lines.push(`${stackCardIndent}    <CardDescription className="truncate text-caption">{c.desc}</CardDescription>`);
      lines.push(`${stackCardIndent}  </CardHeader>`);
      lines.push(`${stackCardIndent}</Card>`);
      if (o.footerCallout === "inline") {
        lines.push(`              </CardGroup>`);
      }
      lines.push(`            </motion.div>`);
      lines.push(`          ))}`);
      lines.push(`        </AnimatePresence>`);
      lines.push(`      </motion.div>`);
    } else if (o.footerCallout !== "none") {
      const mediaTag =
        o.footerCallout === "banner"
          ? `<CardImage src={banner} className="aspect-[2/1] max-h-28" />`
          : `<CardMedia icon={PanelLeftIcon} size={18} />`;
      lines.push(`      {/* anchored callout: a Card resting one surface step above the`);
      lines.push(`          rail, rising another under the pointer — the inset shadow keeps`);
      lines.push(`          its hairline inside the box */}`);
      if (o.footerCallout === "inline") {
        lines.push(`      {/* inline orientation puts the icon beside the text */}`);
        lines.push(`      <CardGroup orientation="inline" fluidHover={false}>`);
      }
      const calloutIndent = o.footerCallout === "inline" ? `        ` : `      `;
      lines.push(`${calloutIndent}<Card size="compact" dismissible onDismiss={hide} href="/docs/sidebar"`);
      lines.push(`${calloutIndent}  label="Sidebar is here — new in Fluid Functionalism"`);
      lines.push(`${calloutIndent}  className={\`rounded-xl overflow-hidden transition-[background-color,box-shadow] duration-80`);
      lines.push(`${calloutIndent}    \${surfaceClasses(level, 2)} \${surfaceHoverClasses(level + 1, 3)}`);
      lines.push(
        `${calloutIndent}    shadow-[var(--shadow-2-inset)] hover:shadow-[var(--shadow-3-inset)]${o.footerCallout === "inline" ? " min-h-0 pl-2.5" : ""}\`}>`
      );
      lines.push(`${calloutIndent}  ${mediaTag}`);
      lines.push(
        o.footerCallout === "inline"
          ? `${calloutIndent}  <CardHeader className="gap-[2px] py-3">`
          : `${calloutIndent}  <CardHeader className="gap-0 pt-3">`
      );
      lines.push(`${calloutIndent}    <CardTitle className="truncate">Sidebar is here</CardTitle>`);
      lines.push(
        `${calloutIndent}    <CardDescription className="truncate text-caption">New in Fluid Functionalism</CardDescription>`
      );
      lines.push(`${calloutIndent}  </CardHeader>`);
      lines.push(`${calloutIndent}</Card>`);
      if (o.footerCallout === "inline") lines.push(`      </CardGroup>`);
    }
    if (o.footerStack === "horizontal") {
      if (footerActions.length > 0 || o.footerPrimary === "dropdown") {
        lines.push(`      <div className="flex items-center gap-1 pr-1.5">`);
        // The user row owns the leftover width, as in the preview.
        if (o.footerPrimary === "dropdown") {
          lines.push(...userRowLines(true, `        `));
        }
        for (const a of footerActions) {
          lines.push(`        <Tooltip content="${a.label}" side="top">`);
          lines.push(`          <Button variant="ghost" size="icon-compact" className="size-6 shrink-0" aria-label="${a.label}">`);
          lines.push(`            <${iconTag(a.icon)} />`);
          lines.push(`          </Button>`);
          lines.push(`        </Tooltip>`);
        }
        lines.push(`      </div>`);
      }
    } else {
      if (footerActions.length > 0) {
        lines.push(`      {/* vertical: actions stack above the user row */}`);
        lines.push(`      <SidebarMenu>`);
        for (const a of footerActions) {
          lines.push(`        <SidebarMenuItem>`);
          lines.push(`          <SidebarMenuButton icon={${iconTag(a.icon)}}>${a.label}</SidebarMenuButton>`);
          lines.push(`        </SidebarMenuItem>`);
        }
        lines.push(`      </SidebarMenu>`);
      }
      if (o.footerPrimary === "dropdown") {
        lines.push(...userRowLines(false, `      `));
      }
    }
    lines.push(`    </SidebarFooter>`);
  }

  lines.push(`  </Sidebar>`);
  // pt-2 aligns the inset with the floating rail's card edge.
  lines.push(`  <SidebarInset${o.design === "floating" ? ` className="pt-2"` : ``}>`);
  lines.push(`    <header className="flex h-12 shrink-0 items-center gap-2 px-1.5">`);
  if (peek) {
    lines.push(`      {/* hidden while the rail is peeked; after a pin it fades back in`);
    lines.push(`          late, appearing at its settled spot instead of riding the`);
    lines.push(`          inset's slide */}`);
    lines.push(
      `      <SidebarTrigger className={\`transition-opacity delay-200 duration-160 \${isPeeking ? "opacity-0" : "opacity-100"}\`} />`
    );
  } else {
    lines.push(`      <SidebarTrigger />`);
  }
  lines.push(`    </header>`);
  lines.push(`    {children}`);
  lines.push(`  </SidebarInset>`);
  lines.push(`</SidebarProvider>`);
  return lines.join("\n");
}

// ── Component ────────────────────────────────────────────

/** What the inset shows depends on whether the sidebar is a rail or a sheet.
 *  Above the breakpoint it plays a page — a topbar with the trigger and some
 *  content blocks — so the rail has something to sit beside. Below it the
 *  sidebar is a sheet over the whole preview, so a mock page has nothing to
 *  demonstrate and the small stage is better spent on the one control that
 *  matters: the button that opens it. Reads `isMobile` from the provider
 *  rather than a media query so the swap lands exactly when the sheet does. */
function PlaygroundInsetBody() {
  const { isMobile, toggleSidebar } = useSidebar();

  if (isMobile) {
    return (
      <div className="flex flex-1 items-center justify-center p-4">
        <Button variant="secondary" onClick={toggleSidebar}>
          Open sidebar
        </Button>
      </div>
    );
  }

  // The main region stays blank on purpose — a bare topbar with the trigger.
  // Skeleton page furniture competed with the sidebar for attention.
  return <SidebarInsetTopbar />;
}

export function SidebarPlayground({ children }: PlaygroundProps) {
  const [state, setState] = useState<PlayState>(DEFAULT_STATE);
  const [closedRows, setClosedRows] = useState<Record<string, boolean>>({});
  // Which row the user last clicked — leaf and sub rows are selectable, so
  // the active highlight follows the pointer around the preview. Null falls
  // back to the demo data's own active row.
  const [selected, setSelected] = useState<string | null>(null);
  const icons = useIcons();
  const set = <K extends keyof PlayState>(key: K, value: PlayState[K]) =>
    setState((prev) => ({ ...prev, [key]: value }));
  // Nested rows start open, so switching a level on shows the tree at once.
  const isRowOpen = (key: string) => !closedRows[key];
  const toggleRow = (key: string) =>
    setClosedRows((prev) => ({ ...prev, [key]: !prev[key] }));

  const randomize = () => {
    // Selection keys are row labels, which differ between the two primary
    // element modes — clear it so the data's own active row takes over.
    setSelected(null);
    setState((prev) => ({
      // `state` is deliberately not rolled: shuffling is for trying shapes,
      // and landing on closed or loading hides the very thing being shuffled.
      state: prev.state,
      design: pick(["sidebar", "floating", "inset"] as const),
      collapsedBehavior: pick(["none", "none", "hover", "click"] as const),
      headerPrimary: pick(["dropdown", "dropdown", "logo", "none"] as const),
      headerStack: pick(["horizontal", "vertical"] as const),
      headerActions: pick([0, 1, 2, 2] as const),
      sectionsCollapsible: Math.random() > 0.25,
      sectionActions: pick([0, 1, 2, 3] as const),
      l1Primary: pick(["threads", "menu"] as const),
      l1Children: Math.random() > 0.5,
      l1Actions: pick([0, 1, 1, 2, 3] as const),
      l1Badges: Math.random() > 0.5,
      l2Icon: Math.random() > 0.4,
      l2Actions: pick([0, 1, 2] as const),
      l2Badges: Math.random() > 0.5,
      footerPrimary: pick(["dropdown", "dropdown", "none"] as const),
      footerStack: pick(["horizontal", "horizontal", "vertical"] as const),
      footerActions: pick([0, 1, 2, 2] as const),
      footerCallout: pick(["none", "inline", "banner", "banner"] as const),
      footerCalloutStacked: Math.random() > 0.65,
    }));
  };

  // Chevrons and the rows' trailing glyphs ride the same ladder step as
  // every other sidebar icon.
  const iconSize = useSize().icon;
  const shape = useShape();

  // ── Get code (presets) ─────────────────────────────────
  // The rail's configuration bit-packs into a stateless code (shadcn's
  // preset principle) that the /r/preset route turns into an installable
  // registry item; the site's flavor/shape/size ride along.
  const globals = usePresetGlobals();
  const presetCode = encodeSidebarPreset({ ...state, ...globals });
  usePresetUrlSync(presetCode, SIDEBAR_DEFAULT_CODE, (raw) => {
    const res = decodeSidebarPreset(raw);
    if (res.ok) {
      const { flavor: _f, shape: _s, size: _z, ...play } = res.preset;
      setState(play);
    }
  });

  /** Tooltip content with the action's keystroke, on the same inverted
   *  surface treatment the sidebar trigger's tooltip uses. */
  const tipWithShortcut = (label: string, shortcut: string) => (
    <span className="flex items-center gap-2">
      {/* A flex row escapes the tooltip surface's text-box trim, so the label
          re-applies it and the chip pulls its box back with -my-1 — together
          they keep this the same height as a tooltip without a shortcut. */}
      <span className="[text-box:trim-both_cap_alphabetic]">{label}</span>
      <kbd className="-my-1 flex h-4 min-w-4 items-center justify-center rounded border border-background/30 px-1 font-sans text-[10px] text-background/80">
        {shortcut}
      </kbd>
    </span>
  );
  const loading = state.state === "loading";
  const headerHorizontal = state.headerStack === "horizontal";
  const footerHorizontal = state.footerStack === "horizontal";
  const headerActionSet = HEADER_ACTION_SET.slice(0, state.headerActions);
  // Only icon menus nest; a thread row is a leaf.
  const l1CanNest = state.l1Primary === "menu";
  const l1Children = l1CanNest && state.l1Children;
  const footerActionSet = FOOTER_ACTION_SET.slice(0, state.footerActions);
  // A promo card with no rows under it has nothing to be spaced from, so the
  // footer drops its bottom padding and the card sits flush on the edge.
  // Flush only in the inset variant: there the rail has no card edge of its
  // own, so the callout can land on the bottom. Floating and sidebar keep
  // their gutter — the callout has a card edge (or a border) to clear.
  const calloutOnlyFooter =
    state.footerCallout !== "none" &&
    state.footerPrimary === "none" &&
    footerActionSet.length === 0 &&
    state.design === "inset";

  /** Row actions for one level: a single action uses the canonical part,
   *  more than one goes through the cluster that owns the row's gutter. */
  const rowActions = (count: Count3) => {
    if (count === 0) return null;
    const chosen = ROW_ACTION_SET.slice(-count);
    const render = (a: (typeof ROW_ACTION_SET)[number], standalone: boolean) => {
      const button = (
        <SidebarMenuAction showOnHover={standalone} aria-label={a.label}>
          {createElement(icons[a.icon as IconName], {})}
        </SidebarMenuAction>
      );
      if (!("menu" in a && a.menu)) {
        return (
          <Tooltip key={a.icon} content={a.label} side="top">
            {button}
          </Tooltip>
        );
      }
      return (
        <DropdownMenu key={a.icon}>
          <DropdownTrigger render={button} />
          {/* 240px matches the header/footer trigger width, so every menu in
              the sidebar reads as one family. */}
          <DropdownContent className="min-w-0 w-[240px]" align="start" sideOffset={4}>
            <MenuItem index={0} icon={icons.pencil} label="Rename" onSelect={() => {}} />
            <MenuItem index={1} icon={icons.link} label="Share" onSelect={() => {}} />
            <MenuItem index={2} icon={icons.x} label="Delete" onSelect={() => {}} />
          </DropdownContent>
        </DropdownMenu>
      );
    };
    if (count === 1) return render(chosen[0], true);
    return (
      <SidebarMenuActions showOnHover>
        {chosen.map((a) => render(a, false))}
      </SidebarMenuActions>
    );
  };

  const groupActionCluster =
    state.sectionActions > 0 ? (
      <SidebarGroupActions>
        {GROUP_ACTION_SET.slice(0, state.sectionActions).map((a) => (
          <Tooltip key={a.icon} content={a.label} side="top">
            <SidebarGroupAction aria-label={a.label}>
              {createElement(icons[a.icon], {})}
            </SidebarGroupAction>
          </Tooltip>
        ))}
      </SidebarGroupActions>
    ) : null;




  // Level-1 rows follow the primary-element choice: thread titles carry
  // semantic status, menu rows carry an icon.
  const level1 =
    state.l1Primary === "threads"
      ? SIDEBAR_THREADS.map((t) => ({
          key: t.label,
          label: t.label,
          badge: t.badge,
          status: t.status as "active" | "unread" | "idle" | undefined,
          icon: undefined as IconName | undefined,
          active: undefined as boolean | undefined,
        }))
      : SIDEBAR_ITEMS.map((i) => ({
          key: i.label,
          label: i.label,
          badge: i.badge,
          status: undefined as "active" | "unread" | "idle" | undefined,
          icon: i.icon as IconName | undefined,
          active: i.active,
        }));

  // Same treatment as a collapsible section label: while the row is open the
  // chevron waits for hover, and once collapsed it stays put as the cue to
  // reopen.
  const chevron = (open: boolean) => (
    <span className="ml-auto -mr-0.5 flex size-6 shrink-0 items-center justify-center">
      <motion.span
        className="inline-flex"
        animate={{ rotate: open ? 90 : 0 }}
        transition={spring.fast}
      >
        {createElement(icons["chevron-right"], {
          size: iconSize,
          strokeWidth: 1.5,
          // One chevron-right glyph, sprung 90° to point down while open.
          // Hover reveal is scoped to the row's own button, not the <li> —
          // the li also wraps the sub-menu, so hovering a child would light
          // the parent's chevron.
          className: `text-muted-foreground transition-opacity duration-80 ${
            open
              ? "opacity-0 group-hover/parent-row:opacity-100 group-focus-within/parent-row:opacity-100"
              : "opacity-100"
          }`,
        })}
      </motion.span>
    </span>
  );

  const subTree = (parentKey: string): ReactNode => (
    <SidebarMenuSub open={isRowOpen(parentKey)}>
      {L2_ROWS.map((row) => (
        <SidebarMenuSubItem key={row.label}>
          <SidebarMenuSubButton
            icon={state.l2Icon ? icons[row.icon] : undefined}
            href="#"
            isActive={selected === `${parentKey}/${row.label}`}
            onClick={(e) => {
              e.preventDefault();
              setSelected(`${parentKey}/${row.label}`);
            }}
          >
            {row.label}
          </SidebarMenuSubButton>
          {state.l2Badges && "badge" in row && row.badge && (
            <SidebarMenuBadge>{row.badge}</SidebarMenuBadge>
          )}
          {rowActions(state.l2Actions)}
        </SidebarMenuSubItem>
      ))}
    </SidebarMenuSub>
  );

  const contentSection = (index: 0 | 1) => (
    <SidebarGroup collapsible={state.sectionsCollapsible}>
      <SidebarGroupLabel>{SECTION_LABELS[state.l1Primary][index]}</SidebarGroupLabel>
      {groupActionCluster}
      <SidebarMenu>
        {loading
          ? level1.slice(0, 4).map((row) => <SidebarMenuSkeleton key={row.key} showIcon />)
          : level1
              .slice(index === 0 ? 0 : 3, index === 0 ? 3 : 5)
              .map((row) => {
                const key = `${index}/${row.key}`;
                const hasChildren = l1Children;
                return (
                  <SidebarMenuItem key={row.key}>
                    <SidebarMenuButton
                      className={hasChildren ? "group/parent-row" : undefined}
                      icon={row.icon ? icons[row.icon] : undefined}
                      // status="active" implies row-active by design, so once
                      // the user selects a different thread the streaming one
                      // demotes to "unread" — the dot stays filled, but the
                      // highlight follows the selection alone.
                      status={
                        row.status === "active" && selected && selected !== key
                          ? "unread"
                          : row.status
                      }
                      // Click a leaf to select it; until the first click the
                      // demo data's own active row holds the highlight.
                      isActive={selected ? selected === key : row.active}
                      onClick={
                        hasChildren ? () => toggleRow(key) : () => setSelected(key)
                      }
                      aria-expanded={hasChildren ? isRowOpen(key) : undefined}
                      // A row holding a chevron pins its gutter to the hover
                      // value: the chevron rides the label's padding edge, so
                      // letting that padding grow on hover would slide the
                      // chevron sideways. A section header's is static for
                      // the same reason — its actions never hide.
                      style={
                        hasChildren
                          ? ({ "--row-gutter": "var(--row-gutter-hover)" } as CSSProperties)
                          : undefined
                      }
                    >
                      {row.label}
                      {hasChildren && chevron(isRowOpen(key))}
                    </SidebarMenuButton>
                    {state.l1Badges && row.badge && (
                      <SidebarMenuBadge>{row.badge}</SidebarMenuBadge>
                    )}
                    {/* A parent row spends its trailing slot on the chevron,
                        so it skips the row actions: with both, the chevron is
                        pushed off the axis the badges and actions share. With
                        children on, every level-1 row is a parent, so the
                        level-1 actions live on the leaf rows one level down. */}
                    {!hasChildren && rowActions(state.l1Actions)}
                    {hasChildren && subTree(key)}
                  </SidebarMenuItem>
                );
              })}
      </SidebarMenu>
    </SidebarGroup>
  );

  // The doc page's ComponentPreview already draws the frame; only the /demo
  // card's standalone preview brings its own border. Inset and floating put
  // a rounded card (rounded-xl / rounded-3xl by shape) 8px inside the frame,
  // so the frame's radius is that inner radius + 8px — concentric corners.
  // The flush sidebar design has no inner card and keeps the plain container
  // radius.
  const frameRadius =
    state.design === "sidebar"
      ? shape.container
      : shape.bgRadius >= 20
        ? "rounded-[32px]"
        : "rounded-[20px]";
  const shell = (height: string, framed = false) => (
    <div
      className={`relative flex w-full overflow-hidden bg-background ${height} ${
        framed ? `${frameRadius} border border-border` : ""
      }`}
    >
      <SidebarProvider
        className="h-full min-h-0"
        persist={false}
        // Never flip to the sheet inside the preview: on a phone the drawer
        // reduced the playground to one "Open sidebar" button, so shuffling
        // and every rail control looked inert. Rendering the real rail
        // inline (like every other demo on the page) keeps the state visible
        // at any width.
        mobileBreakpoint={0}
        open={state.state !== "closed"}
        onOpenChange={(next) => set("state", next ? "opened" : "closed")}
        peek={state.collapsedBehavior}
      >
        <Sidebar variant={state.design} className="h-full">
          <SidebarHeader>
            {/* Stacking rule: vertical keeps the brand row on its own line
                with search and actions stacked beneath as full-width rows;
                horizontal collapses them to icon buttons sharing its line.
                The buttons are 24px (size-6) and the row insets pr-1.5 so
                each button's centre lands on the section actions' axis —
                26px from the sidebar's inner edge, on the same 28px pitch. */}
            <div className={headerHorizontal ? "flex items-center gap-1 pr-1.5" : "contents"}>
              <div className={headerHorizontal ? "min-w-0 flex-1" : "contents"}>
                {state.headerPrimary === "logo" ? (
                  <BrandHeaderRow variant="logo" />
                ) : state.headerPrimary === "dropdown" ? (
                  <BrandHeaderRow variant="dropdown" />
                ) : null}
              </div>
              {headerHorizontal && (
                <>
                  <Tooltip content={tipWithShortcut("Search", SEARCH_SHORTCUT)} side="bottom">
                    <Button
                      variant="ghost"
                      size="icon-compact"
                      aria-label="Search"
                      className="size-6 shrink-0"
                    >
                      {createElement(icons.search, {})}
                    </Button>
                  </Tooltip>
                  {headerActionSet.map((a) => (
                    <Tooltip key={a.icon} content={tipWithShortcut(a.label, a.shortcut)} side="bottom">
                      <Button
                        variant="ghost"
                        size="icon-compact"
                        aria-label={a.label}
                        className="size-6 shrink-0"
                      >
                        {createElement(icons[a.icon], {})}
                      </Button>
                    </Tooltip>
                  ))}
                </>
              )}
            </div>
            {!headerHorizontal && (
              // Search and the action rows are ONE block: the header's gap-2
              // separates it from the brand row, while inside it the search
              // field reads as the list's first row (menu row rhythm).
              <div className="flex flex-col">
                <SidebarSearchField />
                {headerActionSet.length > 0 && (
                  <SidebarMenu aria-label="Actions">
                    {headerActionSet.map((a) => (
                      <SidebarMenuItem key={a.icon}>
                        <SidebarMenuButton icon={icons[a.icon]}>
                          {a.label}
                          <span className="ml-auto inline-flex opacity-0 transition-opacity duration-80 group-hover/menu-item:opacity-100 group-focus-within/menu-item:opacity-100">
                            <kbd className="font-sans text-[11px] text-muted-foreground">
                              {a.shortcut}
                            </kbd>
                          </span>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                )}
              </div>
            )}
          </SidebarHeader>
          <SidebarContent>
            {contentSection(0)}
            {!loading && contentSection(1)}
          </SidebarContent>
          {(state.footerPrimary === "dropdown" ||
            footerActionSet.length > 0 ||
            state.footerCallout !== "none") && (
            <SidebarFooter className={calloutOnlyFooter ? "pb-0" : undefined}>
              {state.footerCallout !== "none" &&
                (state.footerCalloutStacked ? (
                  <FooterCalloutStack
                    variant={state.footerCallout}
                    onEmpty={() => set("footerCallout", "none")}
                  />
                ) : (
                  <FooterCallout
                    variant={state.footerCallout}
                    onDismiss={() => set("footerCallout", "none")}
                  />
                ))}
              {/* Vertical stacking puts the actions above the user row, so
                  identity stays anchored to the sidebar's outer edge —
                  mirroring the brand row at the top. */}
              {!footerHorizontal && footerActionSet.length > 0 && (
                <SidebarMenu aria-label="Footer actions">
                  {footerActionSet.map((a) => (
                    <SidebarMenuItem key={a.icon}>
                      <SidebarMenuButton icon={icons[a.icon]}>{a.label}</SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              )}
              {/* Skip the row wrapper entirely when there's no user row and no
                  horizontal actions — an empty div would still take the
                  footer's gap and hold the card off the edge. */}
              {(state.footerPrimary === "dropdown" ||
                (footerHorizontal && footerActionSet.length > 0)) && (
              <div className={footerHorizontal ? "flex items-center gap-1 pr-1.5" : "contents"}>
                {state.footerPrimary === "dropdown" && (
                  <SidebarUserFooter
                    name="Micka Touillaud"
                    avatar={
                      <Image
                        src="/micka.png"
                        alt=""
                        width={20}
                        height={20}
                        className="size-5 shrink-0 rounded-full"
                      />
                    }
                    className={footerHorizontal ? "min-w-0 flex-1" : undefined}
                    menu={
                      <>
                        <MenuItem index={0} icon={icons.user} label="Profile" onSelect={() => {}} />
                        <MenuItem index={1} icon={icons.settings} label="Settings" onSelect={() => {}} />
                        <MenuItem index={2} icon={icons["arrow-left"]} label="Log out" onSelect={() => {}} />
                      </>
                    }
                  />
                )}
                {footerHorizontal &&
                  footerActionSet.map((a) => (
                    <Tooltip key={a.icon} content={a.label} side="top">
                      <Button
                        variant="ghost"
                        size="icon-compact"
                        aria-label={a.label}
                        className="size-6 shrink-0"
                      >
                        {createElement(icons[a.icon], {})}
                      </Button>
                    </Tooltip>
                  ))}
              </div>
              )}
            </SidebarFooter>
          )}
        </Sidebar>
        <SidebarInset className={state.design === "floating" ? "min-h-0 pt-2" : "min-h-0"}>
          <PlaygroundInsetBody />
        </SidebarInset>
      </SidebarProvider>
    </div>
  );

  const countOptions = (max: 2 | 3) => [
    { value: "0", label: "None" },
    { value: "1", label: "One" },
    { value: "2", label: "Two" },
    ...(max === 3 ? [{ value: "3", label: "Three" }] : []),
  ];

  const controls = (
    <PlaygroundPanel onShuffle={randomize}>
      <PlaySection label="Layout" />
      <PlayField label="Design">
        <PlaySelect
          value={state.design}
          onChange={(v) => set("design", v as SidebarVariant)}
          options={[
            { value: "sidebar", label: "Sidebar" },
            { value: "floating", label: "Floating" },
            { value: "inset", label: "Inset" },
          ]}
        />
      </PlayField>
      <PlayField label="Collapsed behavior">
        <PlaySelect
          value={state.collapsedBehavior}
          onChange={(v) => set("collapsedBehavior", v as PlayState["collapsedBehavior"])}
          options={[
            { value: "none", label: "None" },
            { value: "hover", label: "On hover" },
            { value: "click", label: "On click" },
          ]}
        />
      </PlayField>
      <PlayField label="State">
        <PlaySelect
          value={state.state}
          onChange={(v) => set("state", v as PlayState["state"])}
          options={[
            { value: "opened", label: "Opened" },
            { value: "closed", label: "Closed" },
            { value: "loading", label: "Loading" },
          ]}
        />
      </PlayField>

      <PlayDivider />
      <PlaySection label="Header" />
      <PlayField label="Primary element">
        <PlaySelect
          value={state.headerPrimary}
          onChange={(v) => set("headerPrimary", v as PlayState["headerPrimary"])}
          options={[
            { value: "dropdown", label: "Dropdown" },
            { value: "logo", label: "Brand logo" },
            { value: "none", label: "None" },
          ]}
        />
      </PlayField>
      <PlayField label="Stacking">
        <PlaySelect
          value={state.headerStack}
          onChange={(v) => set("headerStack", v as Stack)}
          options={[
            { value: "horizontal", label: "Horizontal" },
            { value: "vertical", label: "Vertical" },
          ]}
        />
      </PlayField>
      <PlayField label="Header actions">
        <PlaySelect
          value={String(state.headerActions)}
          onChange={(v) => set("headerActions", Number(v) as Count2)}
          options={countOptions(2)}
        />
      </PlayField>

      <PlayDivider />
      <PlaySection label="Sections" />
      <Switch
        label="Collapsible"
        checked={state.sectionsCollapsible}
        onToggle={() => set("sectionsCollapsible", !state.sectionsCollapsible)}
        className={PLAY_SWITCH}
      />
      <PlayField label="Section actions">
        <PlaySelect
          value={String(state.sectionActions)}
          onChange={(v) => set("sectionActions", Number(v) as Count3)}
          options={countOptions(3)}
        />
      </PlayField>

      <PlayDivider />
      <PlaySection label="Content level 1" />
      <PlayField label="Primary element">
        <PlaySelect
          value={state.l1Primary}
          onChange={(v) => {
            set("l1Primary", v as PlayState["l1Primary"]);
            setSelected(null);
          }}
          options={[
            { value: "menu", label: "Menu" },
            { value: "threads", label: "Thread" },
          ]}
        />
      </PlayField>
      {/* Threads are leaves — a discussion doesn't own a sub-tree. */}
      <Switch
        label="Has children"
        checked={l1CanNest && state.l1Children}
        onToggle={() => set("l1Children", !state.l1Children)}
        disabled={!l1CanNest}
        className={PLAY_SWITCH}
      />
      <PlayField label="Actions">
        <PlaySelect
          value={String(state.l1Actions)}
          onChange={(v) => set("l1Actions", Number(v) as Count3)}
          options={countOptions(3)}
        />
      </PlayField>
      <Switch
        label="Badges"
        checked={state.l1Badges}
        onToggle={() => set("l1Badges", !state.l1Badges)}
        className={PLAY_SWITCH}
      />

      <PlayDivider />
      <PlaySection label="Content level 2" />
      <Switch
        label="Leading icon"
        checked={l1Children && state.l2Icon}
        onToggle={() => set("l2Icon", !state.l2Icon)}
        disabled={!l1Children}
        className={PLAY_SWITCH}
      />
      <PlayField label="Actions" disabled={!l1Children}>
        <PlaySelect
          value={String(state.l2Actions)}
          onChange={(v) => set("l2Actions", Number(v) as Count3)}
          options={countOptions(3)}
        />
      </PlayField>
      <Switch
        label="Badges"
        checked={l1Children && state.l2Badges}
        onToggle={() => set("l2Badges", !state.l2Badges)}
        disabled={!l1Children}
        className={PLAY_SWITCH}
      />

      <PlayDivider />
      <PlaySection label="Footer" />
      <PlayField label="Primary element">
        <PlaySelect
          value={state.footerPrimary}
          onChange={(v) => set("footerPrimary", v as PlayState["footerPrimary"])}
          options={[
            { value: "dropdown", label: "Dropdown" },
            { value: "none", label: "None" },
          ]}
        />
      </PlayField>
      <PlayField label="Stacking">
        <PlaySelect
          value={state.footerStack}
          onChange={(v) => set("footerStack", v as Stack)}
          options={[
            { value: "horizontal", label: "Horizontal" },
            { value: "vertical", label: "Vertical" },
          ]}
        />
      </PlayField>
      <PlayField label="Footer actions">
        <PlaySelect
          value={String(state.footerActions)}
          onChange={(v) => set("footerActions", Number(v) as Count2)}
          options={countOptions(2)}
        />
      </PlayField>
      <PlayField label="Callout">
        <PlaySelect
          value={state.footerCallout}
          onChange={(v) => set("footerCallout", v as PlayState["footerCallout"])}
          options={[
            { value: "none", label: "None" },
            { value: "inline", label: "Inline" },
            { value: "banner", label: "Banner" },
          ]}
        />
      </PlayField>
      {/* Either anatomy stacks — a sonner-style pile of three cards. */}
      <Switch
        label="Stacked"
        checked={state.footerCallout !== "none" && state.footerCalloutStacked}
        onToggle={() => set("footerCalloutStacked", !state.footerCalloutStacked)}
        disabled={state.footerCallout === "none"}
        className={PLAY_SWITCH}
      />
      <PlayDivider />
      {/* shadcn's preset principle: the exact configuration above, as a
          stateless code the registry can turn into an installable block. */}
      <GetCodeDialog def={SIDEBAR_PRESET_DEF} code={presetCode} />
    </PlaygroundPanel>
  );

  return children({
    // Doc-page preview and /demo card share one state; the collapse animates
    // between fixed widths (never height/width "auto"), so it stays correct
    // under the /demo page's scaled card. The doc preview fills the
    // ComponentPreview stage edge to edge.
    preview: shell("h-full self-stretch"),
    // The /demo card gives shell previews more room than the default 420
    // stage — a sidebar next to its inset needs the width to read properly.
    demoPreview: <div className="w-full">{shell("h-[560px]", true)}</div>,
    demoMaxWidth: 600,
    controls,
    code: buildSidebarPlaygroundCode(state),
  });
}
