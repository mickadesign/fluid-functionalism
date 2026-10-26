// ---------------------------------------------------------------------------
// Calendar playground state: the single source for the playground rail, the
// preset codec, and the install generator. Pure data — no React, safe on
// the server and in route handlers.
//
// Codec compat rules (same as shadcn's preset codec):
//   1. Never reorder existing value arrays — only append.
//   2. Every field's DEFAULT sits at index 0.
//   3. Only append new fields at the END of CALENDAR_PRESET_FIELDS.
//   4. Stay under 53 bits total (JS safe-integer limit).
// tests/preset-calendar.test.mjs enforces 2 and 4 and pins 1/3 with a golden.
// ---------------------------------------------------------------------------

import {
  registerPresetComponent,
  encodePreset,
  decodePreset,
  type PresetField,
  type PresetComponentDef,
} from "./codec";
import { DEFAULT_GLOBALS, type PresetGlobals } from "./sidebar-options";

/** Which days can be picked: all of them, all but the booked and past
 *  ones, or Monday to Friday. */
export type CalendarDays = "all" | "booked" | "weekdays";

export interface CalendarPlayState {
  mode: "single" | "range";
  months: "1" | "2";
  orientation: "auto" | "horizontal" | "vertical";
  /** "auto" leaves cellSize unset, so the site size picks 36 or 32. */
  cellSize: "auto" | "40" | "44" | "48";
  weekNumbers: boolean;
  days: CalendarDays;
}

export type CalendarPreset = CalendarPlayState & PresetGlobals;

export const DEFAULT_CALENDAR_STATE: CalendarPlayState = {
  mode: "range",
  months: "2",
  orientation: "auto",
  cellSize: "auto",
  weekNumbers: false,
  days: "all",
};

export const DEFAULT_CALENDAR_PRESET: CalendarPreset = {
  ...DEFAULT_CALENDAR_STATE,
  ...DEFAULT_GLOBALS,
};

// Value arrays are ordered DEFAULT-FIRST. The three site-global fields stay
// LAST, mirroring SIDEBAR_PRESET_FIELDS exactly.
export const CALENDAR_PRESET_FIELDS: readonly PresetField[] = [
  { key: "mode", values: ["range", "single"], bits: 2 },
  { key: "months", values: ["2", "1"], bits: 2 },
  { key: "orientation", values: ["auto", "horizontal", "vertical"], bits: 2 },
  { key: "cellSize", values: ["auto", "40", "44", "48"], bits: 3 },
  { key: "weekNumbers", values: [false, true], bits: 1 },
  { key: "days", values: ["all", "booked", "weekdays"], bits: 3 },
  { key: "flavor", values: ["radix", "base"], bits: 3 },
  { key: "shape", values: ["rounded", "pill"], bits: 2 },
  { key: "size", values: ["default", "compact"], bits: 2 },
];

// ── Registration (tag "n") ──────────────────────────────────────────────────

export const CALENDAR_PRESET_DEF: PresetComponentDef = {
  tag: "n",
  label: "Calendar",
  docsPath: "/docs/calendar",
  versions: { a: CALENDAR_PRESET_FIELDS },
  currentVersion: "a",
  defaults: DEFAULT_CALENDAR_PRESET as unknown as PresetComponentDef["defaults"],
  installable: true,
};
registerPresetComponent(CALENDAR_PRESET_DEF);

export function encodeCalendarPreset(config: Partial<CalendarPreset>): string {
  return encodePreset(CALENDAR_PRESET_DEF, config);
}

export type CalendarDecodeResult =
  | { ok: true; preset: CalendarPreset; version: string }
  | { ok: false; error: string };

export function decodeCalendarPreset(code: string): CalendarDecodeResult {
  const res = decodePreset(code);
  if (!res.ok) return res;
  if (res.def.tag !== "n") {
    return { ok: false, error: `Not a calendar preset (tag "${res.def.tag}").` };
  }
  return {
    ok: true,
    preset: res.preset as unknown as CalendarPreset,
    version: res.version,
  };
}

export const CALENDAR_DEFAULT_CODE = encodeCalendarPreset({});

// ── Demo content, shared by the playground preview and the generator ────────

/** Booked nights, in days from today, so the demo always shows some. */
export const CALENDAR_BOOKED_OFFSETS = [4, 5, 6, 12, 19, 20] as const;
/** The days "weekdays" leaves open, Monday to Friday. */
export const CALENDAR_WEEKDAYS = [1, 2, 3, 4, 5] as const;
