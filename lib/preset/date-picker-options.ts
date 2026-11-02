// ---------------------------------------------------------------------------
// DatePicker playground state: the single source for the playground rail,
// the preset codec, and the install generator. Pure data — no React, safe
// on the server and in route handlers.
//
// Codec compat rules (same as shadcn's preset codec):
//   1. Never reorder existing value arrays — only append.
//   2. Every field's DEFAULT sits at index 0.
//   3. Only append new fields at the END of DATE_PICKER_PRESET_FIELDS.
//   4. Stay under 53 bits total (JS safe-integer limit).
// tests/preset-date-picker.test.mjs enforces 2 and 4 and pins 1/3 with a
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

/** No time, one time, or a start → end time on the picked day. */
export type DatePickerTime = "none" | "time" | "timeRange";

export interface DatePickerPlayState {
  mode: "single" | "range";
  /** The `variant` prop, labeled "Design" in the rail. */
  variant: "outline" | "ghost";
  time: DatePickerTime;
  presets: boolean;
  months: "1" | "2";
  orientation: "auto" | "horizontal" | "vertical";
  step: "15" | "30" | "60";
  clock: "locale" | "12" | "24";
  weekNumbers: boolean;
  days: "all" | "booked";
  clearable: boolean;
  disabled: boolean;
  /** The picker's own `size` prop; "site" leaves it unset. Named apart from
   *  the site-global `size` every preset carries. */
  pickerSize: "site" | "default" | "compact";
}

export type DatePickerPreset = DatePickerPlayState & PresetGlobals;

export const DEFAULT_DATE_PICKER_STATE: DatePickerPlayState = {
  mode: "single",
  variant: "ghost",
  time: "timeRange",
  presets: false,
  months: "2",
  orientation: "auto",
  step: "15",
  clock: "locale",
  weekNumbers: false,
  days: "all",
  clearable: true,
  disabled: false,
  pickerSize: "site",
};

export const DEFAULT_DATE_PICKER_PRESET: DatePickerPreset = {
  ...DEFAULT_DATE_PICKER_STATE,
  ...DEFAULT_GLOBALS,
};

// Value arrays are ordered DEFAULT-FIRST. The three site-global fields stay
// LAST, mirroring SIDEBAR_PRESET_FIELDS exactly.
const DATE_PICKER_PRESET_FIELDS_A: readonly PresetField[] = [
  { key: "variant", values: ["ghost", "outline"], bits: 2 },
  { key: "mode", values: ["single", "range"], bits: 2 },
  { key: "time", values: ["timeRange", "none", "time"], bits: 2 },
  { key: "step", values: ["15", "30", "60"], bits: 3 },
  { key: "clock", values: ["locale", "12", "24"], bits: 2 },
  { key: "presets", values: [false, true], bits: 1 },
  { key: "months", values: ["2", "1"], bits: 2 },
  { key: "orientation", values: ["horizontal", "auto", "vertical"], bits: 2 },
  { key: "days", values: ["all", "booked"], bits: 2 },
  { key: "weekNumbers", values: [false, true], bits: 1 },
  { key: "pickerSize", values: ["site", "default", "compact"], bits: 2 },
  { key: "clearable", values: [true, false], bits: 1 },
  { key: "disabled", values: [false, true], bits: 1 },
  { key: "flavor", values: ["radix", "base"], bits: 3 },
  { key: "shape", values: ["rounded", "pill"], bits: 2 },
  { key: "size", values: ["default", "compact"], bits: 2 },
];

/** Version "b": orientation defaults to "auto", the component's own, so 2
 *  months stack on a phone. The values lead with it. */
export const DATE_PICKER_PRESET_FIELDS: readonly PresetField[] = [
  { key: "variant", values: ["ghost", "outline"], bits: 2 },
  { key: "mode", values: ["single", "range"], bits: 2 },
  { key: "time", values: ["timeRange", "none", "time"], bits: 2 },
  { key: "step", values: ["15", "30", "60"], bits: 3 },
  { key: "clock", values: ["locale", "12", "24"], bits: 2 },
  { key: "presets", values: [false, true], bits: 1 },
  { key: "months", values: ["2", "1"], bits: 2 },
  { key: "orientation", values: ["auto", "horizontal", "vertical"], bits: 2 },
  { key: "days", values: ["all", "booked"], bits: 2 },
  { key: "weekNumbers", values: [false, true], bits: 1 },
  { key: "pickerSize", values: ["site", "default", "compact"], bits: 2 },
  { key: "clearable", values: [true, false], bits: 1 },
  { key: "disabled", values: [false, true], bits: 1 },
  { key: "flavor", values: ["radix", "base"], bits: 3 },
  { key: "shape", values: ["rounded", "pill"], bits: 2 },
  { key: "size", values: ["default", "compact"], bits: 2 },
];

// ── Registration (tag "p") ──────────────────────────────────────────────────

export const DATE_PICKER_PRESET_DEF: PresetComponentDef = {
  tag: "p",
  label: "Date Picker",
  docsPath: "/docs/date-picker",
  versions: { a: DATE_PICKER_PRESET_FIELDS_A, b: DATE_PICKER_PRESET_FIELDS },
  currentVersion: "b",
  defaults: DEFAULT_DATE_PICKER_PRESET as unknown as PresetComponentDef["defaults"],
  installable: true,
};
registerPresetComponent(DATE_PICKER_PRESET_DEF);

export function encodeDatePickerPreset(config: Partial<DatePickerPreset>): string {
  return encodePreset(DATE_PICKER_PRESET_DEF, config);
}

export type DatePickerDecodeResult =
  | { ok: true; preset: DatePickerPreset; version: string }
  | { ok: false; error: string };

export function decodeDatePickerPreset(code: string): DatePickerDecodeResult {
  const res = decodePreset(code);
  if (!res.ok) return res;
  if (res.def.tag !== "p") {
    return { ok: false, error: `Not a date picker preset (tag "${res.def.tag}").` };
  }
  return {
    ok: true,
    preset: res.preset as unknown as DatePickerPreset,
    version: res.version,
  };
}

export const DATE_PICKER_DEFAULT_CODE = encodeDatePickerPreset({});

/** The default month count for a mode: 1 for a date, 2 for a range. */
export const defaultDatePickerMonths = (
  mode: DatePickerPlayState["mode"]
): DatePickerPlayState["months"] => (mode === "range" ? "2" : "1");

/** The playground's derived facts, shared by the preview and the generator:
 *  times belong to a single date, presets to a range, and the clear button
 *  to the outline field. */
export function deriveDatePicker(p: DatePickerPlayState) {
  const range = p.mode === "range";
  const time: DatePickerTime = range ? "none" : p.time;
  const presets = range && p.presets;
  const clearable = p.variant !== "outline" || p.clearable;
  return { range, time, presets, clearable };
}

// ── Demo content, shared by the playground preview and the generator ────────

/** Starting times for the time fields. */
export const DATE_PICKER_DEFAULT_TIME = "11:00";
export const DATE_PICKER_DEFAULT_TIME_RANGE = { start: "11:00", end: "12:45" } as const;
