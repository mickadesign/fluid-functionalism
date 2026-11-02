// ---------------------------------------------------------------------------
// Command menu playground state: the single source for the playground rail,
// the preset codec, and the install generator. Pure data — no React, safe on
// the server and in route handlers.
//
// Codec compat rules (same as shadcn's preset codec):
//   1. Never reorder existing value arrays — only append.
//   2. Every field's DEFAULT sits at index 0.
//   3. Only append new fields at the END of COMMAND_MENU_PRESET_FIELDS.
//   4. Stay under 53 bits total (JS safe-integer limit).
// tests/preset-command-menu.test.mjs enforces 2 and 4 and pins 1/3 with a
// golden.
// ---------------------------------------------------------------------------

import {
  registerPresetComponent,
  encodePreset,
  decodePreset,
  type PresetField,
  type PresetComponentDef,
} from "./codec";
import { DEFAULT_GLOBALS, type PresetGlobals } from "./sidebar-options";

/** The combos the playground offers for the dialog, ⌘K first: the
 *  component's own default. */
export type CommandMenuTrigger = "mod+k" | "mod+j" | "mod+p" | "mod+/";

export const COMMAND_MENU_TRIGGERS: readonly CommandMenuTrigger[] = [
  "mod+k",
  "mod+j",
  "mod+p",
  "mod+/",
];

/** The order versions a to c encoded the combo in (⌘J led while the
 *  playground kept away from the site's ⌘K). Frozen for their codes. */
const TRIGGERS_J_FIRST: readonly CommandMenuTrigger[] = ["mod+j", "mod+k", "mod+p", "mod+/"];

export interface CommandMenuPlayState {
  /** The combo that toggles the dialog. */
  shortcut: CommandMenuTrigger;
  /** Rows keep their descriptions. */
  descriptions: boolean;
  /** Rows keep their shortcut caps. */
  shortcuts: boolean;
  /** Suggested rows listed first while nothing is typed. */
  suggestions: boolean;
  /** Tabs under the field. */
  tabs: boolean;
  /** Borderless filter bar under the field (inside the tab row when both). */
  filters: boolean;
  /** Hint strip under the list: what the keys do. */
  footer: boolean;
}

export type CommandMenuPreset = CommandMenuPlayState & PresetGlobals;

export const DEFAULT_COMMAND_MENU_STATE: CommandMenuPlayState = {
  shortcut: "mod+k",
  descriptions: true,
  shortcuts: true,
  suggestions: true,
  tabs: true,
  filters: false,
  footer: true,
};

export const DEFAULT_COMMAND_MENU_PRESET: CommandMenuPreset = {
  ...DEFAULT_COMMAND_MENU_STATE,
  ...DEFAULT_GLOBALS,
};

// Value arrays are ordered DEFAULT-FIRST. The three site-global fields stay
// LAST, mirroring SIDEBAR_PRESET_FIELDS exactly.
const GLOBAL_FIELDS: readonly PresetField[] = [
  { key: "flavor", values: ["radix", "base"], bits: 3 },
  { key: "shape", values: ["rounded", "pill"], bits: 2 },
  { key: "size", values: ["default", "compact"], bits: 2 },
];

/** Version "a": the first table. Kept so its codes still decode (the
 *  footer takes its default). */
const COMMAND_MENU_PRESET_FIELDS_A: readonly PresetField[] = [
  { key: "shortcut", values: [...TRIGGERS_J_FIRST], bits: 3 },
  { key: "descriptions", values: [true, false], bits: 1 },
  { key: "shortcuts", values: [true, false], bits: 1 },
  { key: "suggestions", values: [true, false], bits: 1 },
  { key: "tabs", values: [false, true], bits: 1 },
  { key: "filters", values: [false, true], bits: 1 },
  ...GLOBAL_FIELDS,
];

/** Version "b": the footer hint strip, ahead of the globals so the tail
 *  keeps the sidebar's layout. Kept for its published codes. */
const COMMAND_MENU_PRESET_FIELDS_B: readonly PresetField[] = [
  { key: "shortcut", values: [...TRIGGERS_J_FIRST], bits: 3 },
  { key: "descriptions", values: [true, false], bits: 1 },
  { key: "shortcuts", values: [true, false], bits: 1 },
  { key: "suggestions", values: [true, false], bits: 1 },
  { key: "tabs", values: [false, true], bits: 1 },
  { key: "filters", values: [false, true], bits: 1 },
  { key: "footer", values: [true, false], bits: 1 },
  ...GLOBAL_FIELDS,
];

/** Version "c": tabs on by default (the design the Showcase and /demo
 *  show), so the `tabs` values flipped to keep the default at index 0. */
const COMMAND_MENU_PRESET_FIELDS_C: readonly PresetField[] = [
  { key: "shortcut", values: [...TRIGGERS_J_FIRST], bits: 3 },
  { key: "descriptions", values: [true, false], bits: 1 },
  { key: "shortcuts", values: [true, false], bits: 1 },
  { key: "suggestions", values: [true, false], bits: 1 },
  { key: "tabs", values: [true, false], bits: 1 },
  { key: "filters", values: [false, true], bits: 1 },
  { key: "footer", values: [true, false], bits: 1 },
  ...GLOBAL_FIELDS,
];

/** Version "d": ⌘K is the default combo, the component's own, so the
 *  trigger values lead with it. */
export const COMMAND_MENU_PRESET_FIELDS: readonly PresetField[] = [
  { key: "shortcut", values: [...COMMAND_MENU_TRIGGERS], bits: 3 },
  { key: "descriptions", values: [true, false], bits: 1 },
  { key: "shortcuts", values: [true, false], bits: 1 },
  { key: "suggestions", values: [true, false], bits: 1 },
  { key: "tabs", values: [true, false], bits: 1 },
  { key: "filters", values: [false, true], bits: 1 },
  { key: "footer", values: [true, false], bits: 1 },
  ...GLOBAL_FIELDS,
];

// ── Registration (tag "k") ──────────────────────────────────────────────────

export const COMMAND_MENU_PRESET_DEF: PresetComponentDef = {
  tag: "k",
  label: "Command menu",
  docsPath: "/docs/command-menu",
  versions: {
    a: COMMAND_MENU_PRESET_FIELDS_A,
    b: COMMAND_MENU_PRESET_FIELDS_B,
    c: COMMAND_MENU_PRESET_FIELDS_C,
    d: COMMAND_MENU_PRESET_FIELDS,
  },
  currentVersion: "d",
  defaults: DEFAULT_COMMAND_MENU_PRESET as unknown as PresetComponentDef["defaults"],
  installable: true,
};
registerPresetComponent(COMMAND_MENU_PRESET_DEF);

export function encodeCommandMenuPreset(config: Partial<CommandMenuPreset>): string {
  return encodePreset(COMMAND_MENU_PRESET_DEF, config);
}

export type CommandMenuDecodeResult =
  | { ok: true; preset: CommandMenuPreset; version: string }
  | { ok: false; error: string };

export function decodeCommandMenuPreset(code: string): CommandMenuDecodeResult {
  const res = decodePreset(code);
  if (!res.ok) return res;
  if (res.def.tag !== "k") {
    return { ok: false, error: `Not a command menu preset (tag "${res.def.tag}").` };
  }
  return {
    ok: true,
    preset: res.preset as unknown as CommandMenuPreset,
    version: res.version,
  };
}

export const COMMAND_MENU_DEFAULT_CODE = encodeCommandMenuPreset({});

// ── Demo content shared by the preview and the generator ────────────────────

export const COMMAND_MENU_GROUPS = ["Actions", "Go to", "Help"] as const;

/** The demo actions, with icons as slot names so the generated file reads
 *  them from the installed icon context. */
export const COMMAND_MENU_ITEMS: readonly {
  value: string;
  label: string;
  /** Names Enter in the footer while highlighted; defaults to the label. */
  action?: string;
  description?: string;
  icon: string;
  shortcut?: string;
  keywords?: readonly string[];
  group: (typeof COMMAND_MENU_GROUPS)[number];
  disabled?: boolean;
}[] = [
  // Actions
  { value: "new-file", label: "New file", description: "Blank document", icon: "plus", shortcut: "mod+n", keywords: ["create", "document"], group: "Actions" },
  { value: "search", label: "Search everywhere", description: "Files, people, messages", icon: "search", shortcut: "mod+shift+f", keywords: ["find"], group: "Actions" },
  { value: "theme", label: "Toggle dark mode", description: "System, light, or dark", icon: "moon", shortcut: "mod+shift+l", keywords: ["appearance", "theme"], group: "Actions" },
  { value: "copy-link", label: "Copy link", description: "To this page", icon: "link", shortcut: "mod+shift+c", keywords: ["share", "url"], group: "Actions" },
  { value: "invite", label: "Invite people", description: "Send an email invite", icon: "users", keywords: ["team", "member"], group: "Actions" },
  { value: "export", label: "Export as PDF", description: "Pro plan", icon: "image", keywords: ["download"], group: "Actions", disabled: true },
  // Go to
  { value: "home", label: "Home", action: "Go to Home", icon: "home", group: "Go to" },
  { value: "inbox", label: "Inbox", action: "Go to Inbox", description: "3 unread", icon: "inbox", keywords: ["mail", "notifications"], group: "Go to" },
  { value: "calendar", label: "Calendar", action: "Go to Calendar", description: "Today", icon: "calendar", keywords: ["events", "schedule"], group: "Go to" },
  { value: "starred", label: "Starred", action: "Go to Starred", icon: "star", keywords: ["favorites"], group: "Go to" },
  { value: "recent", label: "Recent", action: "Go to Recent", description: "Last 7 days", icon: "clock", keywords: ["history"], group: "Go to" },
  { value: "settings", label: "Settings", action: "Go to Settings", description: "Account and workspace", icon: "settings", shortcut: "mod+,", keywords: ["preferences"], group: "Go to" },
  // Help
  { value: "docs", label: "Documentation", icon: "square-library", keywords: ["help", "guide"], group: "Help" },
  { value: "whats-new", label: "What's new", description: "Release notes", icon: "rocket", keywords: ["changelog", "updates"], group: "Help" },
  { value: "support", label: "Contact support", description: "Reply within a day", icon: "message-circle", keywords: ["help", "chat"], group: "Help" },
];

/** Values listed first while nothing is typed: the last things used. */
export const COMMAND_MENU_SUGGESTIONS = ["calendar", "new-file", "settings"] as const;

/** The header controls every preview and generator share: one tab per
 *  group behind "All", the same groups as a filter select, and the sort. */
export const COMMAND_MENU_TABS: readonly { value: string; label: string }[] = [
  { value: "all", label: "All" },
  ...COMMAND_MENU_GROUPS.map((group) => ({ value: group, label: group })),
];
export const COMMAND_MENU_TYPES: readonly { value: string; label: string }[] = [
  { value: "all", label: "All types" },
  ...COMMAND_MENU_GROUPS.map((group) => ({ value: group, label: group })),
];
export const COMMAND_MENU_SORTS: readonly { value: string; label: string }[] = [
  { value: "default", label: "Default order" },
  { value: "az", label: "A to Z" },
];

export const COMMAND_MENU_COPY = {
  placeholder: "Type a command or search…",
  empty: "No results.",
  trigger: "Open command menu",
} as const;
