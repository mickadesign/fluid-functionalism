// ---------------------------------------------------------------------------
// Install generators, by component tag — consumed by /r/preset/[code].
// Pure functions only (this runs in a route handler): a generator turns a
// decoded preset into compilable files + dependency names; the route flavors
// the dependency URLs and wraps everything in a registry item.
// ---------------------------------------------------------------------------

import type { PresetFile } from "./sidebar-install";
import {
  generateSidebarPresetFiles,
  presetRegistryDeps,
  presetNpmDeps,
} from "./sidebar-install";
import type { SidebarPreset } from "./sidebar-options";
import { CARD_PRESET_GENERATOR } from "./card-install";
import { INPUT_MESSAGE_PRESET_GENERATOR } from "./input-message-install";
import { AUQ_PRESET_GENERATOR } from "./ask-user-questions-install";
import { DROPDOWN_PRESET_GENERATOR } from "./dropdown-install";
import { COMBOBOX_PRESET_GENERATOR } from "./combobox-install";
import { COMMAND_MENU_PRESET_GENERATOR } from "./command-menu-install";
import { CALENDAR_PRESET_GENERATOR } from "./calendar-install";
import { DATE_PICKER_PRESET_GENERATOR } from "./date-picker-install";

export interface PresetGenerator {
  title: string;
  description: string;
  files(preset: Record<string, string | number | boolean>): PresetFile[];
  registryDeps(preset: Record<string, string | number | boolean>): string[];
  npmDeps(preset: Record<string, string | number | boolean>): string[];
}

export const PRESET_GENERATORS: Record<string, PresetGenerator> = {
  s: {
    title: "Sidebar (playground preset)",
    description:
      "A sidebar generated from a fluidfunctionalism.com playground configuration — the exact variant you built, installable.",
    files: (p) => generateSidebarPresetFiles(p as unknown as SidebarPreset),
    registryDeps: (p) => presetRegistryDeps(p as unknown as SidebarPreset),
    npmDeps: (p) => presetNpmDeps(p as unknown as SidebarPreset),
  },
  c: CARD_PRESET_GENERATOR,
  m: INPUT_MESSAGE_PRESET_GENERATOR,
  q: AUQ_PRESET_GENERATOR,
  d: DROPDOWN_PRESET_GENERATOR,
  b: COMBOBOX_PRESET_GENERATOR,
  k: COMMAND_MENU_PRESET_GENERATOR,
  n: CALENDAR_PRESET_GENERATOR,
  p: DATE_PICKER_PRESET_GENERATOR,
};
