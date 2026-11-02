// ---------------------------------------------------------------------------
// Sidebar playground state: the single source for the playground rail, the
// code generators (teaching snippet + installable preset), and the preset
// codec. Pure data — no React, safe on the server and in route handlers.
//
// Codec compat rules (same as shadcn's preset codec):
//   1. Never reorder existing value arrays — only append.
//   2. Every field's DEFAULT sits at index 0.
//   3. Only append new fields at the END of SIDEBAR_PRESET_FIELDS.
//   4. Stay under 53 bits total (JS safe-integer limit).
// tests/preset-codec.test.mjs enforces 2 and 4 and pins 1/3 with a golden.
// ---------------------------------------------------------------------------

export type Count3 = 0 | 1 | 2 | 3;
export type Count2 = 0 | 1 | 2;
export type Stack = "horizontal" | "vertical";
export type SidebarDesign = "sidebar" | "floating" | "inset";

export interface PlayState {
  // Layout
  design: SidebarDesign;
  /** What the collapsed edge does: nothing, or peek the sidebar back. */
  collapsedBehavior: "none" | "hover" | "click";
  state: "opened" | "closed" | "loading";
  // Header
  headerPrimary: "dropdown" | "logo" | "none";
  headerStack: Stack;
  headerActions: Count2;
  // Sections
  sectionsCollapsible: boolean;
  sectionActions: Count3;
  // Content level 1
  l1Primary: "threads" | "menu";
  l1Children: boolean;
  l1Actions: Count3;
  l1Badges: boolean;
  // Content level 2 — the deepest level the menu nests to.
  l2Icon: boolean;
  l2Actions: Count3;
  l2Badges: boolean;
  // Footer
  footerPrimary: "dropdown" | "none";
  footerStack: Stack;
  footerActions: Count2;
  /** Anchored callout above the footer rows: an inline icon row or a
   *  banner card. */
  footerCallout: "none" | "inline" | "banner";
  /** Render the callout as a sonner-style stack of cards instead of one. */
  footerCalloutStacked: boolean;
}

/** Site-level knobs that change what a preset INSTALLS (flavor picks the
 *  payload namespace; shape/size pin the providers in the emitted page). */
export interface PresetGlobals {
  flavor: "radix" | "base";
  shape: "rounded" | "pill";
  size: "default" | "compact";
}

export type SidebarPreset = PlayState & PresetGlobals;

export const DEFAULT_STATE: PlayState = {
  design: "inset",
  collapsedBehavior: "none",
  state: "opened",
  headerPrimary: "dropdown",
  headerStack: "vertical",
  headerActions: 1,
  sectionsCollapsible: true,
  sectionActions: 1,
  l1Primary: "threads",
  l1Children: false,
  l1Actions: 1,
  l1Badges: false,
  l2Icon: true,
  l2Actions: 1,
  l2Badges: true,
  footerPrimary: "dropdown",
  footerStack: "horizontal",
  footerActions: 2,
  footerCallout: "none",
  footerCalloutStacked: false,
};

/** The globals' keys, for a playground that hydrates its rail from a
 *  decoded preset and leaves these to the site settings. */
export const PRESET_GLOBAL_KEYS = ["flavor", "shape", "size"] as const satisfies readonly (keyof PresetGlobals)[];

export const DEFAULT_GLOBALS: PresetGlobals = {
  flavor: "radix",
  shape: "rounded",
  size: "default",
};

export const DEFAULT_PRESET: SidebarPreset = {
  ...DEFAULT_STATE,
  ...DEFAULT_GLOBALS,
};

import { type PresetField } from "./codec";
export type { PresetField };

// Value arrays are ordered DEFAULT-FIRST, which is why several differ from
// their natural order (e.g. headerActions [1, 0, 2]).
export const SIDEBAR_PRESET_FIELDS: readonly PresetField[] = [
  { key: "design", values: ["inset", "sidebar", "floating"], bits: 3 },
  { key: "collapsedBehavior", values: ["none", "hover", "click"], bits: 3 },
  { key: "state", values: ["opened", "closed", "loading"], bits: 3 },
  { key: "headerPrimary", values: ["dropdown", "logo", "none"], bits: 3 },
  { key: "headerStack", values: ["vertical", "horizontal"], bits: 1 },
  { key: "headerActions", values: [1, 0, 2], bits: 3 },
  { key: "sectionsCollapsible", values: [true, false], bits: 1 },
  { key: "sectionActions", values: [1, 0, 2, 3], bits: 3 },
  { key: "l1Primary", values: ["threads", "menu"], bits: 2 },
  { key: "l1Children", values: [false, true], bits: 1 },
  { key: "l1Actions", values: [1, 0, 2, 3], bits: 3 },
  { key: "l1Badges", values: [false, true], bits: 1 },
  { key: "l2Icon", values: [true, false], bits: 1 },
  { key: "l2Actions", values: [1, 0, 2, 3], bits: 3 },
  { key: "l2Badges", values: [true, false], bits: 1 },
  { key: "footerPrimary", values: ["dropdown", "none"], bits: 2 },
  { key: "footerStack", values: ["horizontal", "vertical"], bits: 1 },
  { key: "footerActions", values: [2, 0, 1], bits: 3 },
  { key: "footerCallout", values: ["none", "inline", "banner"], bits: 3 },
  { key: "footerCalloutStacked", values: [false, true], bits: 1 },
  { key: "flavor", values: ["radix", "base"], bits: 3 },
  { key: "shape", values: ["rounded", "pill"], bits: 2 },
  { key: "size", values: ["default", "compact"], bits: 2 },
];

// ── Demo content, shared by the playground preview and both generators ──────

/** Row actions are sliced from the END, so the overflow menu is the one you
 *  always keep: it stays rightmost and demos the dropdown at every count. */
export const ROW_ACTION_SET = [
  { icon: "plus", label: "Add" },
  { icon: "pencil", label: "Rename" },
  { icon: "more-vertical", label: "More options", menu: true },
] as const;

export const GROUP_ACTION_SET = [
  { icon: "plus", label: "Add item" },
  { icon: "sliders-horizontal", label: "Section settings" },
  { icon: "more-vertical", label: "More options" },
] as const;

export const SEARCH_SHORTCUT = "⌘K";

export const HEADER_ACTION_SET = [
  { icon: "plus", label: "New", shortcut: "⇧⌘O" },
  { icon: "users", label: "Invite", shortcut: "⇧⌘I" },
] as const;

export const FOOTER_ACTION_SET = [
  { icon: "settings", label: "Settings" },
  { icon: "moon", label: "Theme" },
] as const;

/** Level-2 rows, hosted by every level-1 row while "Has children" is on. */
export const L2_ROWS = [
  { icon: "folder", label: "Design system", badge: "4" },
  { icon: "folder", label: "Marketing site", badge: "2" },
  { icon: "folder", label: "Travel app" },
] as const;

export const SECTION_LABELS = {
  threads: ["fluid-functionalism", "portfolio-site"],
  menu: ["Platform", "Workspace"],
} as const;

/** "more-vertical" → "MoreVerticalIcon", for generated code. */
export function iconTag(name: string): string {
  return (
    name
      .split("-")
      .map((w) => w[0].toUpperCase() + w.slice(1))
      .join("") + "Icon"
  );
}
