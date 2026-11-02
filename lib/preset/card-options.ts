// ---------------------------------------------------------------------------
// Card playground state: the single source for the playground rail, the
// preset codec, and the install generator. Pure data — no React, safe on
// the server and in route handlers.
//
// Codec compat rules (same as shadcn's preset codec):
//   1. Never reorder existing value arrays — only append.
//   2. Every field's DEFAULT sits at index 0.
//   3. Only append new fields at the END of CARD_PRESET_FIELDS.
//   4. Stay under 53 bits total (JS safe-integer limit).
// tests/preset-card.test.mjs enforces 2 and 4 and pins 1/3 with a golden.
// ---------------------------------------------------------------------------

import {
  registerPresetComponent,
  encodePreset,
  decodePreset,
  type PresetField,
  type PresetComponentDef,
} from "./codec";
import { DEFAULT_GLOBALS, type PresetGlobals } from "./sidebar-options";

export type CardOrientation = "card" | "inline";
export type CardBorder = "none" | "outlined";
export type CardMediaKind = "icon" | "logo" | "image" | "none";
export type CardColumns = 1 | 2 | 3;

export interface CardPlayState {
  // Per-card props
  media: CardMediaKind;
  description: boolean;
  primaryBtn: boolean;
  secondaryBtn: boolean;
  ghostBtn: boolean;
  // Group (layout) props
  orientation: CardOrientation;
  columns: CardColumns;
  border: CardBorder;
  separated: boolean;
  fluidHover: boolean;
  /** Selection mode: every card becomes clickable and one stays selected. */
  selected: boolean;
}

export type CardPreset = CardPlayState & PresetGlobals;

export const DEFAULT_CARD_STATE: CardPlayState = {
  media: "icon",
  description: true,
  primaryBtn: false,
  secondaryBtn: false,
  ghostBtn: false,
  orientation: "card",
  columns: 2,
  border: "none",
  separated: false,
  fluidHover: true,
  selected: false,
};

export const DEFAULT_CARD_PRESET: CardPreset = {
  ...DEFAULT_CARD_STATE,
  ...DEFAULT_GLOBALS,
};

// Value arrays are ordered DEFAULT-FIRST, which is why several differ from
// their natural order (e.g. columns [2, 1, 3]). The three site-global fields
// stay LAST, mirroring SIDEBAR_PRESET_FIELDS exactly.
export const CARD_PRESET_FIELDS: readonly PresetField[] = [
  { key: "media", values: ["icon", "logo", "image", "none"], bits: 3 },
  { key: "description", values: [true, false], bits: 1 },
  { key: "primaryBtn", values: [false, true], bits: 1 },
  { key: "secondaryBtn", values: [false, true], bits: 1 },
  { key: "ghostBtn", values: [false, true], bits: 1 },
  { key: "orientation", values: ["card", "inline"], bits: 2 },
  { key: "columns", values: [2, 1, 3], bits: 3 },
  { key: "border", values: ["none", "outlined"], bits: 2 },
  { key: "separated", values: [false, true], bits: 1 },
  { key: "fluidHover", values: [true, false], bits: 1 },
  { key: "selected", values: [false, true], bits: 1 },
  { key: "flavor", values: ["radix", "base"], bits: 3 },
  { key: "shape", values: ["rounded", "pill"], bits: 2 },
  { key: "size", values: ["default", "compact"], bits: 2 },
];

// ── Registration (tag "c") ──────────────────────────────────────────────────
// Self-registering: importing anything from this module guarantees the tag
// is known to the codec before any encode/decode runs.

export const CARD_PRESET_DEF: PresetComponentDef = {
  tag: "c",
  label: "Card",
  docsPath: "/docs/card",
  versions: { a: CARD_PRESET_FIELDS },
  currentVersion: "a",
  defaults: DEFAULT_CARD_PRESET as unknown as PresetComponentDef["defaults"],
  installable: true,
};
registerPresetComponent(CARD_PRESET_DEF);

export function encodeCardPreset(config: Partial<CardPreset>): string {
  return encodePreset(CARD_PRESET_DEF, config);
}

export type CardDecodeResult =
  | { ok: true; preset: CardPreset; version: string }
  | { ok: false; error: string };

export function decodeCardPreset(code: string): CardDecodeResult {
  const res = decodePreset(code);
  if (!res.ok) return res;
  if (res.def.tag !== "c") {
    return { ok: false, error: `Not a card preset (tag "${res.def.tag}").` };
  }
  return {
    ok: true,
    preset: res.preset as unknown as CardPreset,
    version: res.version,
  };
}

export const CARD_DEFAULT_CODE = encodeCardPreset({});

// ── Demo content, shared by the playground preview and the generator ────────

/** The feature tiles the playground previews — icon keys index the shipped
 *  icon-context (lucide by default). */
export const CARD_ITEMS = [
  { icon: "circle", title: "Fluid motion", description: "Spring-tuned transitions calibrated across three tiers" },
  { icon: "shield", title: "Accessible by default", description: "Focus-visible rings and ARIA roles in every part" },
  { icon: "palette", title: "Yours to theme", description: "Swap radius, icons, and primitive at runtime" },
  { icon: "moon", title: "Dark mode ready", description: "Tokens adapt to light and dark automatically" },
  { icon: "search", title: "Fluid hover", description: "A magnetic highlight previews where a click lands" },
  { icon: "lightbulb", title: "Drop-in registry", description: "Install any component with one shadcn command" },
] as const;

// An inline data-URI banner so the demo needs no asset files (CardImage
// accepts any src). A monochrome mesh built from the clarity-blue accent
// (#6B97FF) alone, at different opacities over white.
export const CARD_BANNER =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='320' height='180'%3E%3Cdefs%3E%3CradialGradient id='a' cx='12%25' cy='16%25' r='70%25'%3E%3Cstop offset='0%25' stop-color='%236B97FF' stop-opacity='0.9'/%3E%3Cstop offset='100%25' stop-color='%236B97FF' stop-opacity='0'/%3E%3C/radialGradient%3E%3CradialGradient id='b' cx='90%25' cy='12%25' r='65%25'%3E%3Cstop offset='0%25' stop-color='%236B97FF' stop-opacity='0.45'/%3E%3Cstop offset='100%25' stop-color='%236B97FF' stop-opacity='0'/%3E%3C/radialGradient%3E%3CradialGradient id='c' cx='82%25' cy='94%25' r='75%25'%3E%3Cstop offset='0%25' stop-color='%236B97FF' stop-opacity='0.8'/%3E%3Cstop offset='100%25' stop-color='%236B97FF' stop-opacity='0'/%3E%3C/radialGradient%3E%3CradialGradient id='d' cx='24%25' cy='90%25' r='68%25'%3E%3Cstop offset='0%25' stop-color='%236B97FF' stop-opacity='0.55'/%3E%3Cstop offset='100%25' stop-color='%236B97FF' stop-opacity='0'/%3E%3C/radialGradient%3E%3C/defs%3E%3Crect width='320' height='180' fill='%23ffffff'/%3E%3Crect width='320' height='180' fill='%236B97FF' fill-opacity='0.2'/%3E%3Crect width='320' height='180' fill='url(%23a)'/%3E%3Crect width='320' height='180' fill='url(%23b)'/%3E%3Crect width='320' height='180' fill='url(%23c)'/%3E%3Crect width='320' height='180' fill='url(%23d)'/%3E%3C/svg%3E";

// Logo → the same clarity-blue monochrome mesh at 40×40; a denser base tint
// reads as a solid brand tile.
export const CARD_THUMB =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40'%3E%3Cdefs%3E%3CradialGradient id='a' cx='20%25' cy='18%25' r='80%25'%3E%3Cstop offset='0%25' stop-color='%236B97FF' stop-opacity='0.95'/%3E%3Cstop offset='100%25' stop-color='%236B97FF' stop-opacity='0'/%3E%3C/radialGradient%3E%3CradialGradient id='b' cx='86%25' cy='14%25' r='75%25'%3E%3Cstop offset='0%25' stop-color='%236B97FF' stop-opacity='0.5'/%3E%3Cstop offset='100%25' stop-color='%236B97FF' stop-opacity='0'/%3E%3C/radialGradient%3E%3CradialGradient id='c' cx='72%25' cy='94%25' r='85%25'%3E%3Cstop offset='0%25' stop-color='%236B97FF' stop-opacity='0.85'/%3E%3Cstop offset='100%25' stop-color='%236B97FF' stop-opacity='0'/%3E%3C/radialGradient%3E%3C/defs%3E%3Crect width='40' height='40' fill='%23ffffff'/%3E%3Crect width='40' height='40' fill='%236B97FF' fill-opacity='0.35'/%3E%3Crect width='40' height='40' fill='url(%23a)'/%3E%3Crect width='40' height='40' fill='url(%23b)'/%3E%3Crect width='40' height='40' fill='url(%23c)'/%3E%3C/svg%3E";

/** The banner or logo above, drawn in another color than the default blue:
 *  the site's demos pass the visitor's accent. The art uses that one hue (on
 *  white), so swapping it recolors the whole mesh. */
export function tintCardArt(uri: string, hex: string): string {
  return uri.replaceAll("%236B97FF", `%23${hex.replace(/^#/, "")}`);
}
