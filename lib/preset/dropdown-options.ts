// ---------------------------------------------------------------------------
// Dropdown playground state: the single source for the playground rail, the
// preset codec, and the install generator. Pure data — no React, safe on
// the server and in route handlers.
//
// Codec compat rules (same as shadcn's preset codec):
//   1. Never reorder existing value arrays — only append.
//   2. Every field's DEFAULT sits at index 0.
//   3. Only append new fields at the END of DROPDOWN_PRESET_FIELDS.
//   4. Stay under 53 bits total (JS safe-integer limit).
// tests/preset-dropdown.test.mjs enforces 2 and 4 and pins 1/3 with a golden.
// ---------------------------------------------------------------------------

import {
  registerPresetComponent,
  encodePreset,
  decodePreset,
  type PresetField,
  type PresetComponentDef,
} from "./codec";
import { DEFAULT_GLOBALS, type PresetGlobals } from "./sidebar-options";

/** Popup menu behind a trigger, or the always-visible inline panel. */
export type DropdownMode = "menu" | "inline";
/** Radio rows (one checked), checkbox rows (any number, merged
 *  backgrounds), or plain action rows. */
export type DropdownSelection = "single" | "multiple" | "none";

export interface DropdownPlayState {
  mode: DropdownMode;
  selection: DropdownSelection;
  /** A DropdownSearch pinned at the top of the popup (menu mode only). */
  search: boolean;
  /** Leading icons on every row. */
  icons: boolean;
  /** Two labelled groups with a separator (never together with search). */
  groups: boolean;
  /** One row rendered disabled. */
  disabledRow: boolean;
  /** A last row that creates what was typed (needs search). */
  creatable: boolean;
  /** The Theme row opens a submenu (menu mode only). */
  submenu: boolean;
}

export type DropdownPreset = DropdownPlayState & PresetGlobals;

export const DEFAULT_DROPDOWN_STATE: DropdownPlayState = {
  mode: "menu",
  selection: "single",
  search: false,
  icons: true,
  groups: false,
  disabledRow: false,
  creatable: false,
  submenu: true,
};

export const DEFAULT_DROPDOWN_PRESET: DropdownPreset = {
  ...DEFAULT_DROPDOWN_STATE,
  ...DEFAULT_GLOBALS,
};

// Value arrays are ordered DEFAULT-FIRST. The three site-global fields stay
// LAST, mirroring SIDEBAR_PRESET_FIELDS exactly.
const GLOBAL_FIELDS: readonly PresetField[] = [
  { key: "flavor", values: ["radix", "base"], bits: 3 },
  { key: "shape", values: ["rounded", "pill"], bits: 2 },
  { key: "size", values: ["default", "compact"], bits: 2 },
];

/** Version "a": the table the first published codes used. Kept so those
 *  codes still decode (the new field takes its default). */
const DROPDOWN_PRESET_FIELDS_A: readonly PresetField[] = [
  { key: "mode", values: ["menu", "inline"], bits: 2 },
  { key: "selection", values: ["single", "multiple", "none"], bits: 2 },
  { key: "search", values: [false, true], bits: 1 },
  { key: "icons", values: [true, false], bits: 1 },
  { key: "groups", values: [false, true], bits: 1 },
  { key: "disabledRow", values: [false, true], bits: 1 },
  ...GLOBAL_FIELDS,
];

/** Version "b" (2026-09-08): creatable, ahead of the globals so the tail
 *  keeps the sidebar's layout. A layout change, hence the bump. */
const DROPDOWN_PRESET_FIELDS_B: readonly PresetField[] = [
  { key: "mode", values: ["menu", "inline"], bits: 2 },
  { key: "selection", values: ["single", "multiple", "none"], bits: 2 },
  { key: "search", values: [false, true], bits: 1 },
  { key: "icons", values: [true, false], bits: 1 },
  { key: "groups", values: [false, true], bits: 1 },
  { key: "disabledRow", values: [false, true], bits: 1 },
  { key: "creatable", values: [false, true], bits: 1 },
  ...GLOBAL_FIELDS,
];

/** Version "c" (2026-10-05): submenu, on by default, ahead of the globals
 *  like creatable. Older codes decode with it off (versionDefaults). */
export const DROPDOWN_PRESET_FIELDS: readonly PresetField[] = [
  { key: "mode", values: ["menu", "inline"], bits: 2 },
  { key: "selection", values: ["single", "multiple", "none"], bits: 2 },
  { key: "search", values: [false, true], bits: 1 },
  { key: "icons", values: [true, false], bits: 1 },
  { key: "groups", values: [false, true], bits: 1 },
  { key: "disabledRow", values: [false, true], bits: 1 },
  { key: "creatable", values: [false, true], bits: 1 },
  { key: "submenu", values: [true, false], bits: 1 },
  ...GLOBAL_FIELDS,
];

// ── Registration (tag "d") ──────────────────────────────────────────────────

export const DROPDOWN_PRESET_DEF: PresetComponentDef = {
  tag: "d",
  label: "Dropdown",
  docsPath: "/docs/dropdown",
  versions: {
    a: DROPDOWN_PRESET_FIELDS_A,
    b: DROPDOWN_PRESET_FIELDS_B,
    c: DROPDOWN_PRESET_FIELDS,
  },
  currentVersion: "c",
  defaults: DEFAULT_DROPDOWN_PRESET as unknown as PresetComponentDef["defaults"],
  // Codes from before the submenu existed keep the menu they described.
  versionDefaults: { a: { submenu: false }, b: { submenu: false } },
  installable: true,
};
registerPresetComponent(DROPDOWN_PRESET_DEF);

export function encodeDropdownPreset(config: Partial<DropdownPreset>): string {
  return encodePreset(DROPDOWN_PRESET_DEF, config);
}

export type DropdownDecodeResult =
  | { ok: true; preset: DropdownPreset; version: string }
  | { ok: false; error: string };

export function decodeDropdownPreset(code: string): DropdownDecodeResult {
  const res = decodePreset(code);
  if (!res.ok) return res;
  if (res.def.tag !== "d") {
    return { ok: false, error: `Not a dropdown preset (tag "${res.def.tag}").` };
  }
  return {
    ok: true,
    preset: res.preset as unknown as DropdownPreset,
    version: res.version,
  };
}

export const DROPDOWN_DEFAULT_CODE = encodeDropdownPreset({});

/** The playground's derived facts, shared by the preview and the generator:
 *  a search field only lives in the popup, and it replaces the groups (a
 *  filtered list re-indexes from 0, which labelled sections can't follow).
 *  The create row reads the query, so it needs the search. A submenu is a
 *  popup too, so the inline panel has none. */
export function deriveDropdown(p: DropdownPlayState) {
  const search = p.mode === "menu" && p.search;
  const groups = !search && p.groups;
  const creatable = search && p.creatable;
  const submenu = p.mode === "menu" && p.submenu;
  return { search, groups, creatable, submenu };
}

/** A row the create row makes from the query: the plus icon marks it as
 *  user-made; the group only matters while groups are on, which search
 *  turns off. */
export const DROPDOWN_CREATED_ICON = "plus" as const;

// ── Demo content, shared by the playground preview and the generator ────────

/** Six settings rows in two groups — icon keys index the shipped
 *  icon-context (lucide by default). */
export const DROPDOWN_ITEMS = [
  { icon: "mail", label: "Email", group: "Account" },
  { icon: "bell", label: "Notifications", group: "Account" },
  { icon: "shield", label: "Privacy", group: "Account" },
  { icon: "settings", label: "General", group: "Appearance" },
  { icon: "palette", label: "Theme", group: "Appearance" },
  { icon: "monitor", label: "Display", group: "Appearance" },
] as const;

export const DROPDOWN_GROUPS = ["Account", "Appearance"] as const;

/** The row rendered disabled when `disabledRow` is on. */
export const DROPDOWN_DISABLED_LABEL = "Privacy";
/** Initial single selection / multiple selection. */
export const DROPDOWN_DEFAULT_SELECTED = "Email";
export const DROPDOWN_DEFAULT_PICKED = ["Email", "Notifications"] as const;

/** The row that opens a submenu when `submenu` is on, and what it holds:
 *  one theme picked out of three, a radio choice of its own. */
export const DROPDOWN_SUBMENU_LABEL = "Theme";
export const DROPDOWN_THEMES = [
  { icon: "sun", label: "Light" },
  { icon: "moon", label: "Dark" },
  { icon: "monitor", label: "System" },
] as const;
export const DROPDOWN_DEFAULT_THEME = "System";
