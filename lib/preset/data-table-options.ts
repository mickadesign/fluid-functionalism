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
  pageSize: "10" | "5" | "20";
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
  /** Sticky edge columns while the table scrolls sideways. */
  pinning: boolean;
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
  filters: false,
  pinning: true,
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
  { key: "pageSize", values: ["10", "5", "20"], bits: 2 },
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

// Version e adds column filters and sticky edge columns.
export const DATA_TABLE_PRESET_FIELDS: readonly PresetField[] = [
  ...DATA_TABLE_PRESET_FIELDS_D.slice(0, -3),
  { key: "filters", values: [false, true], bits: 1 },
  { key: "pinning", values: [true, false], bits: 1 },
  ...DATA_TABLE_PRESET_FIELDS_D.slice(-3),
];

// ── Registration (tag "t") ──────────────────────────────────────────────────

export const DATA_TABLE_PRESET_DEF: PresetComponentDef = {
  tag: "t",
  label: "DataTable",
  docsPath: "/docs/data-table",
  versions: { a: DATA_TABLE_PRESET_FIELDS_A, b: DATA_TABLE_PRESET_FIELDS_B, c: DATA_TABLE_PRESET_FIELDS_C, d: DATA_TABLE_PRESET_FIELDS_D, e: DATA_TABLE_PRESET_FIELDS },
  currentVersion: "e",
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

export const DATA_TABLE_DEFAULT_CODE = encodeDataTablePreset({});

// ── Demo content for the generated install ──────────────────────────────────
// The playground lists the live component catalog; an install gets this
// fixed sample in the same shape, to replace with real data.

export const DATA_TABLE_SAMPLE_ROWS = [
  { slug: "data-table", name: "DataTable", summary: "TanStack Table on the fluid hover Table: sorting, search, column resizing and reordering, row selection, and pagination.", primitives: "Built on both", props: 34, added: "2026-11-08" },
  { slug: "checkbox", name: "Checkbox", summary: "A single checkbox: a hairline square that darkens on hover and a check that draws itself.", primitives: "Radix + Base UI", props: 9, added: "2026-11-04" },
  { slug: "field", name: "Field", summary: "Labels, controls, help text, and errors composed into accessible form fields.", primitives: "None", props: 18, added: "2026-11-04" },
  { slug: "calendar", name: "Calendar", summary: "Month grid for a day or a range: one fluid hover across both months and week numbers.", primitives: "Built on both", props: 17, added: "2026-10-19" },
  { slug: "date-picker", name: "DatePicker", summary: "Outline or ghost trigger for a date, a range, or a date and a time.", primitives: "Radix + Base UI", props: 24, added: "2026-10-19" },
  { slug: "banner", name: "Banner", summary: "Status message in 5 statuses and 2 contrasts, inline or fixed at the top of the page.", primitives: "Built on both", props: 17, added: "2026-09-29" },
  { slug: "command-menu", name: "CommandMenu", summary: "Type to filter a list of actions, arrow through them, press Enter to run.", primitives: "Built on both", props: 50, added: "2026-09-08" },
  { slug: "combobox", name: "Combobox", summary: "Type-to-filter field with keyboard highlight, fluid hover, and a spring-animated list.", primitives: "Radix + Base UI", props: 36, added: "2026-09-06" },
  { slug: "sidebar", name: "Sidebar", summary: "Composable sidebar with offcanvas collapse, a drag-resize rail, and a mobile drawer.", primitives: "Radix + Base UI", props: 36, added: "2026-08-17" },
  { slug: "card", name: "Card", summary: "Compositional card in stacked, inline, and grid layouts with 2-D fluid hover.", primitives: "None", props: 32, added: "2026-07-20" },
  { slug: "tabs", name: "Tabs", summary: "Tab navigation with smooth pill animations.", primitives: "Radix + Base UI", props: 12, added: "2026-04-05" },
  { slug: "button", name: "Button", summary: "Versatile button with variants, sizes, loading state, and icon support.", primitives: "Radix + Base UI", props: 14, added: "2026-02-16" },
] as const;

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

// ── Sub-rows ────────────────────────────────────────────────────────────────
// The parts a few sample components open into, with their props counts.

export const DATA_TABLE_SAMPLE_PARTS: Record<string, readonly (readonly [string, number])[]> = {
  "data-table": [["useDataTable", 2], ["DataTable", 13], ["DataTableSearch", 4], ["DataTablePagination", 4], ["DataTableSelectionBar", 6]],
  "command-menu": [["CommandMenu", 10], ["CommandMenuDialog", 11], ["CommandMenuInput", 2], ["CommandMenuItem", 8]],
  sidebar: [["SidebarProvider", 9], ["Sidebar", 6], ["SidebarMenu", 4], ["SidebarMenuItem", 7]],
  combobox: [["Combobox", 13], ["ComboboxInput", 6], ["ComboboxChips", 6], ["ComboboxItem", 4]],
};
