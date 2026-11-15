// ---------------------------------------------------------------------------
// DataTable playground state: the single source for the playground rail, the
// preset codec, and the install generator. Pure data — no React, safe on
// the server and in route handlers.
//
// Codec compat rules (same as shadcn's preset codec):
//   1. Never reorder existing value arrays — only append.
//   2. Every field's DEFAULT sits at index 0.
//   3. Only append new fields at the END of DATA_TABLE_PRESET_FIELDS
//      (before the three globals, which stay last).
//   4. Stay under 53 bits total (JS safe-integer limit).
// tests/preset-data-table.test.mjs enforces 2 and 4 and pins 1/3 with a golden.
// ---------------------------------------------------------------------------

import {
  registerPresetComponent,
  encodePreset,
  decodePreset,
  type PresetField,
  type PresetComponentDef,
} from "./codec";
import { DEFAULT_GLOBALS, type PresetGlobals } from "./sidebar-options";

export type DataTableSearchMode = "column" | "all" | "none";
export type DataTableLines = "1" | "2" | "wrap";

export interface DataTablePlayState {
  /** Search one column (the name), every column, or none. */
  filter: DataTableSearchMode;
  viewMenu: boolean;
  selection: boolean;
  rowActions: boolean;
  pagination: boolean;
  pageSize: "10" | "5" | "20" | "50";
  resize: boolean;
  reorder: boolean;
  /** "wrap" wraps every text column; anything else is off: names and
   *  links keep 1 line, the Summary 2. ("1" only arrives from old codes.) */
  lines: DataTableLines;
  align: "auto" | "center" | "top";
  headerIcons: boolean;
  /** Editable cells: Component (text), Props (number), Added (date) and a
   *  Tags column. */
  editable: boolean;
  /** Rows with sub-rows: a component opens into its parts. */
  expandable: boolean;
  /** A + Filter button in the toolbar (DataTableFilters). */
  filters: boolean;
  /** Sticky left columns (the boxes and the first column) while the table
   *  scrolls sideways. Named `pinning` from version e, when one switch
   *  held both sides. */
  pinning: boolean;
  /** Sticky right column (the row menus). */
  pinRight: boolean;
  /** A DataTableTitle heading above the toolbar. */
  title: boolean;
  /** Saved views: a Save view button and tabs to switch between them. */
  views: boolean;
  /** Drag handles left of the boxes: rows move by hand. Off by default,
   *  since it drops the starting sort (under one, a move first asks to
   *  remove it). */
  rowReorder: boolean;
  /** The rows' hover fill: by what the table does (on where a row answers
   *  a click, off on one that is only read), or held on or off. */
  rowHover: "auto" | "on" | "off";
}

export type DataTablePreset = DataTablePlayState & PresetGlobals;

export const DEFAULT_DATA_TABLE_STATE: DataTablePlayState = {
  filter: "column",
  viewMenu: true,
  selection: true,
  rowActions: true,
  pagination: true,
  pageSize: "10",
  resize: true,
  reorder: true,
  lines: "2",
  align: "auto",
  headerIcons: false,
  editable: false,
  expandable: false,
  filters: true,
  pinning: true,
  pinRight: true,
  title: true,
  views: true,
  rowReorder: false,
  rowHover: "auto",
};

export const DEFAULT_DATA_TABLE_PRESET: DataTablePreset = {
  ...DEFAULT_DATA_TABLE_STATE,
  ...DEFAULT_GLOBALS,
};

// Value arrays are ordered DEFAULT-FIRST (pageSize [10, 5, 20]). The three
// site-global fields stay LAST, mirroring SIDEBAR_PRESET_FIELDS exactly.
// Version a, before editable cells: kept so its codes still decode.
export const DATA_TABLE_PRESET_FIELDS_A: readonly PresetField[] = [
  { key: "filter", values: ["column", "all", "none"], bits: 2 },
  { key: "viewMenu", values: [true, false], bits: 1 },
  { key: "selection", values: [true, false], bits: 1 },
  { key: "rowActions", values: [true, false], bits: 1 },
  { key: "pagination", values: [true, false], bits: 1 },
  { key: "pageSize", values: ["10", "5", "20"], bits: 2 },
  { key: "resize", values: [true, false], bits: 1 },
  { key: "reorder", values: [true, false], bits: 1 },
  { key: "lines", values: ["1", "2", "wrap"], bits: 2 },
  { key: "align", values: ["auto", "center", "top"], bits: 2 },
  { key: "headerIcons", values: [true, false], bits: 1 },
  { key: "flavor", values: ["radix", "base"], bits: 3 },
  { key: "shape", values: ["rounded", "pill", "sharp"], bits: 2 },
  { key: "size", values: ["default", "compact"], bits: 2 },
];

// Version b adds editable cells: kept so its codes still decode.
export const DATA_TABLE_PRESET_FIELDS_B: readonly PresetField[] = [
  { key: "filter", values: ["column", "all", "none"], bits: 2 },
  { key: "viewMenu", values: [true, false], bits: 1 },
  { key: "selection", values: [true, false], bits: 1 },
  { key: "rowActions", values: [true, false], bits: 1 },
  { key: "pagination", values: [true, false], bits: 1 },
  { key: "pageSize", values: ["10", "5", "20"], bits: 2 },
  { key: "resize", values: [true, false], bits: 1 },
  { key: "reorder", values: [true, false], bits: 1 },
  { key: "lines", values: ["1", "2", "wrap"], bits: 2 },
  { key: "align", values: ["auto", "center", "top"], bits: 2 },
  { key: "headerIcons", values: [true, false], bits: 1 },
  { key: "editable", values: [false, true], bits: 1 },
  { key: "flavor", values: ["radix", "base"], bits: 3 },
  { key: "shape", values: ["rounded", "pill", "sharp"], bits: 2 },
  { key: "size", values: ["default", "compact"], bits: 2 },
];

// Version c adds sub-rows: kept so its codes still decode.
export const DATA_TABLE_PRESET_FIELDS_C: readonly PresetField[] = [
  { key: "filter", values: ["column", "all", "none"], bits: 2 },
  { key: "viewMenu", values: [true, false], bits: 1 },
  { key: "selection", values: [true, false], bits: 1 },
  { key: "rowActions", values: [true, false], bits: 1 },
  { key: "pagination", values: [true, false], bits: 1 },
  { key: "pageSize", values: ["10", "5", "20"], bits: 2 },
  { key: "resize", values: [true, false], bits: 1 },
  { key: "reorder", values: [true, false], bits: 1 },
  { key: "lines", values: ["1", "2", "wrap"], bits: 2 },
  { key: "align", values: ["auto", "center", "top"], bits: 2 },
  { key: "headerIcons", values: [true, false], bits: 1 },
  { key: "editable", values: [false, true], bits: 1 },
  { key: "expandable", values: [false, true], bits: 1 },
  { key: "flavor", values: ["radix", "base"], bits: 3 },
  { key: "shape", values: ["rounded", "pill", "sharp"], bits: 2 },
  { key: "size", values: ["default", "compact"], bits: 2 },
];

// Version d turns header icons off by default, and text fitting into one
// wrap switch: off, names and links keep 1 line and the Summary 2. Kept so
// its codes still decode.
export const DATA_TABLE_PRESET_FIELDS_D: readonly PresetField[] = [
  { key: "filter", values: ["column", "all", "none"], bits: 2 },
  { key: "viewMenu", values: [true, false], bits: 1 },
  { key: "selection", values: [true, false], bits: 1 },
  { key: "rowActions", values: [true, false], bits: 1 },
  { key: "pagination", values: [true, false], bits: 1 },
  // "50" took the fourth slot the 2 bits always had: older codes read as before.
  { key: "pageSize", values: ["10", "5", "20", "50"], bits: 2 },
  { key: "resize", values: [true, false], bits: 1 },
  { key: "reorder", values: [true, false], bits: 1 },
  { key: "lines", values: ["2", "wrap"], bits: 1 },
  { key: "align", values: ["auto", "center", "top"], bits: 2 },
  { key: "headerIcons", values: [false, true], bits: 1 },
  { key: "editable", values: [false, true], bits: 1 },
  { key: "expandable", values: [false, true], bits: 1 },
  { key: "flavor", values: ["radix", "base"], bits: 3 },
  { key: "shape", values: ["rounded", "pill", "sharp"], bits: 2 },
  { key: "size", values: ["default", "compact"], bits: 2 },
];

// Version e adds column filters and sticky edge columns. Kept so its
// codes still decode.
export const DATA_TABLE_PRESET_FIELDS_E: readonly PresetField[] = [
  ...DATA_TABLE_PRESET_FIELDS_D.slice(0, -3),
  { key: "filters", values: [false, true], bits: 1 },
  { key: "pinning", values: [true, false], bits: 1 },
  ...DATA_TABLE_PRESET_FIELDS_D.slice(-3),
];

// Version f adds the title heading, on by default. Kept so its codes
// still decode.
export const DATA_TABLE_PRESET_FIELDS_F: readonly PresetField[] = [
  ...DATA_TABLE_PRESET_FIELDS_E.slice(0, -3),
  { key: "title", values: [true, false], bits: 1 },
  ...DATA_TABLE_PRESET_FIELDS_E.slice(-3),
];

// Version g splits sticky columns by side: `pinning` keeps the left, and
// `pinRight` takes the right. Kept so its codes still decode.
export const DATA_TABLE_PRESET_FIELDS_G: readonly PresetField[] = [
  ...DATA_TABLE_PRESET_FIELDS_F.slice(0, -3),
  { key: "pinRight", values: [true, false], bits: 1 },
  ...DATA_TABLE_PRESET_FIELDS_F.slice(-3),
];

// Version h adds saved views, on by default. Kept so its codes still
// decode.
export const DATA_TABLE_PRESET_FIELDS_H: readonly PresetField[] = [
  ...DATA_TABLE_PRESET_FIELDS_G.slice(0, -3),
  { key: "views", values: [true, false], bits: 1 },
  ...DATA_TABLE_PRESET_FIELDS_G.slice(-3),
];

// Version i turns column filters on by default. Kept so its codes still
// decode.
export const DATA_TABLE_PRESET_FIELDS_I: readonly PresetField[] = DATA_TABLE_PRESET_FIELDS_H.map((field) =>
  field.key === "filters" ? { ...field, values: [true, false] } : field
);

// Version j adds row reordering, off by default. Kept so its codes still
// decode.
export const DATA_TABLE_PRESET_FIELDS_J: readonly PresetField[] = [
  ...DATA_TABLE_PRESET_FIELDS_I.slice(0, -3),
  { key: "rowReorder", values: [false, true], bits: 1 },
  ...DATA_TABLE_PRESET_FIELDS_I.slice(-3),
];

// Version k adds the rows' hover fill: by the table, on, or off.
export const DATA_TABLE_PRESET_FIELDS: readonly PresetField[] = [
  ...DATA_TABLE_PRESET_FIELDS_J.slice(0, -3),
  { key: "rowHover", values: ["auto", "on", "off"], bits: 2 },
  ...DATA_TABLE_PRESET_FIELDS_J.slice(-3),
];

// ── Registration (tag "t") ──────────────────────────────────────────────────

export const DATA_TABLE_PRESET_DEF: PresetComponentDef = {
  tag: "t",
  label: "DataTable",
  docsPath: "/docs/data-table",
  versions: { a: DATA_TABLE_PRESET_FIELDS_A, b: DATA_TABLE_PRESET_FIELDS_B, c: DATA_TABLE_PRESET_FIELDS_C, d: DATA_TABLE_PRESET_FIELDS_D, e: DATA_TABLE_PRESET_FIELDS_E, f: DATA_TABLE_PRESET_FIELDS_F, g: DATA_TABLE_PRESET_FIELDS_G, h: DATA_TABLE_PRESET_FIELDS_H, i: DATA_TABLE_PRESET_FIELDS_I, j: DATA_TABLE_PRESET_FIELDS_J, k: DATA_TABLE_PRESET_FIELDS },
  currentVersion: "k",
  defaults: DEFAULT_DATA_TABLE_PRESET as unknown as PresetComponentDef["defaults"],
  installable: true,
};
registerPresetComponent(DATA_TABLE_PRESET_DEF);

export function encodeDataTablePreset(config: Partial<DataTablePreset>): string {
  return encodePreset(DATA_TABLE_PRESET_DEF, config);
}

export type DataTableDecodeResult =
  | { ok: true; preset: DataTablePreset; version: string }
  | { ok: false; error: string };

export function decodeDataTablePreset(code: string): DataTableDecodeResult {
  const res = decodePreset(code);
  if (!res.ok) return res;
  if (res.def.tag !== "t") {
    return { ok: false, error: `Not a data table preset (tag "${res.def.tag}").` };
  }
  return {
    ok: true,
    preset: res.preset as unknown as DataTablePreset,
    version: res.version,
  };
}

/** The rows-per-page choices, the same in the playground's rail, in the
 *  table's own footer and in the generated code. */
export const DATA_TABLE_PAGE_SIZES = [5, 10, 20, 50] as const;

export const DATA_TABLE_DEFAULT_CODE = encodeDataTablePreset({});

// ── Editable cells ──────────────────────────────────────────────────────────
// The Tags column the editable preset adds, and the lists its editors offer.

export const DATA_TABLE_TAG_OPTIONS = ["Data", "Feedback", "Form", "Layout", "Navigation", "Overlay"] as const;

export const DATA_TABLE_PROPS_OPTIONS = [5, 10, 20, 30, 40, 50] as const;

const TAGS: Record<string, readonly string[]> = {
  accordion: ["Layout"],
  "ask-user-questions": ["Form"],
  badge: ["Data"],
  banner: ["Feedback"],
  breadcrumb: ["Navigation"],
  button: ["Form"],
  calendar: ["Form", "Data"],
  card: ["Layout"],
  "carousel-dots": ["Navigation"],
  "chat-message": ["Data"],
  checkbox: ["Form"],
  "checkbox-group": ["Form"],
  "color-picker": ["Form", "Overlay"],
  combobox: ["Form", "Overlay"],
  "command-menu": ["Navigation", "Overlay"],
  "data-table": ["Data"],
  "date-picker": ["Form", "Overlay"],
  dialog: ["Overlay"],
  dropdown: ["Overlay"],
  field: ["Form"],
  input: ["Form"],
  "input-copy": ["Form"],
  "input-group": ["Form"],
  "input-message": ["Form"],
  "radio-group": ["Form"],
  select: ["Form", "Overlay"],
  sidebar: ["Navigation", "Layout"],
  slider: ["Form"],
  switch: ["Form"],
  table: ["Data"],
  tabs: ["Navigation"],
  textarea: ["Form"],
  "thinking-indicator": ["Feedback"],
  "thinking-steps": ["Feedback"],
  tooltip: ["Overlay"],
};

export function dataTableTagsFor(slug: string): string[] {
  return [...(TAGS[slug] ?? [])];
}
