// ---------------------------------------------------------------------------
// Preset component registrations — the one place tags meet field tables.
// Import from HERE (not codec.ts) anywhere codes are encoded or decoded, so
// registration has always run. Adding a playground to the preset system:
// register its def here, add a generator in generators.ts if installable,
// and wire GetCodeDialog + usePresetUrlSync in its playground module.
// ---------------------------------------------------------------------------

import {
  registerPresetComponent,
  encodePreset,
  decodePreset,
  type PresetComponentDef,
} from "./codec";
import {
  SIDEBAR_PRESET_FIELDS,
  DEFAULT_PRESET,
  type SidebarPreset,
} from "./sidebar-options";

export { decodePreset, encodePreset } from "./codec";
// Side-effect registrations for components defined in their own modules.
export * from "./ask-user-questions-options";
export { CARD_PRESET_DEF, encodeCardPreset, decodeCardPreset, CARD_DEFAULT_CODE } from "./card-options";
export * from "./input-message-options";
export { DROPDOWN_PRESET_DEF, encodeDropdownPreset, decodeDropdownPreset, DROPDOWN_DEFAULT_CODE } from "./dropdown-options";
export { COMBOBOX_PRESET_DEF, encodeComboboxPreset, decodeComboboxPreset, COMBOBOX_DEFAULT_CODE } from "./combobox-options";
export { COMMAND_MENU_PRESET_DEF, encodeCommandMenuPreset, decodeCommandMenuPreset, COMMAND_MENU_DEFAULT_CODE } from "./command-menu-options";
export { CALENDAR_PRESET_DEF, encodeCalendarPreset, decodeCalendarPreset, CALENDAR_DEFAULT_CODE } from "./calendar-options";
export { DATE_PICKER_PRESET_DEF, encodeDatePickerPreset, decodeDatePickerPreset, DATE_PICKER_DEFAULT_CODE } from "./date-picker-options";
export type { PresetComponentDef, DecodeResult } from "./codec";

// ── Sidebar (tag "s") ───────────────────────────────────────────────────────

export const SIDEBAR_PRESET_DEF: PresetComponentDef = {
  tag: "s",
  label: "Sidebar",
  docsPath: "/docs/sidebar",
  versions: { a: SIDEBAR_PRESET_FIELDS },
  currentVersion: "a",
  defaults: DEFAULT_PRESET as unknown as PresetComponentDef["defaults"],
  installable: true,
};
registerPresetComponent(SIDEBAR_PRESET_DEF);

export function encodeSidebarPreset(config: Partial<SidebarPreset>): string {
  return encodePreset(SIDEBAR_PRESET_DEF, config);
}

export type SidebarDecodeResult =
  | { ok: true; preset: SidebarPreset; version: string }
  | { ok: false; error: string };

export function decodeSidebarPreset(code: string): SidebarDecodeResult {
  const res = decodePreset(code);
  if (!res.ok) return res;
  if (res.def.tag !== "s") {
    return { ok: false, error: `Not a sidebar preset (tag "${res.def.tag}").` };
  }
  return {
    ok: true,
    preset: res.preset as unknown as SidebarPreset,
    version: res.version,
  };
}

export const SIDEBAR_DEFAULT_CODE = encodeSidebarPreset({});
