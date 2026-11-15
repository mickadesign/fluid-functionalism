// ---------------------------------------------------------------------------
// What a preset installs, in outline: each file's path, the export to
// render, and whether it only supports another file. The Copy prompt reads
// this in the browser, so it must stay light: the DataTable's outline comes
// from its options (its generator carries the API reference and two source
// files as text, which every docs page would otherwise download).
// tests/preset-outlines.test.mjs keeps each outline equal to what its
// generator writes, and this module's imports clear of the heavy ones.
// ---------------------------------------------------------------------------

import { LIGHT_PRESET_GENERATORS, type PresetGenerator } from "./light-generators";
import { dataTablePresetOutline, type DataTablePreset } from "./data-table-options";

export interface PresetOutline {
  files: { target: string; exportName?: string; helper?: boolean }[];
  /** A line the Copy prompt adds about what the block comes with. */
  note?: string;
}

type Preset = Record<string, string | number | boolean>;

/** A generator's files as an outline: the export is read from each file. */
export function outlineOf(generator: PresetGenerator, preset: Preset): PresetOutline {
  const helpers = new Set(generator.helpers?.(preset) ?? []);
  return {
    files: generator.files(preset).map((file) => ({
      target: file.target,
      exportName: file.content.match(/export (?:default )?function (\w+)/)?.[1],
      ...(helpers.has(file.target) ? { helper: true } : {}),
    })),
    note: generator.note,
  };
}

export const PRESET_OUTLINES: Record<string, (preset: Preset) => PresetOutline> = {
  ...Object.fromEntries(
    Object.entries(LIGHT_PRESET_GENERATORS).map(([tag, generator]) => [tag, (preset: Preset) => outlineOf(generator, preset)])
  ),
  t: (preset) => dataTablePresetOutline(preset as unknown as DataTablePreset),
};
