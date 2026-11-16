// ---------------------------------------------------------------------------
// Install generators, by component tag — consumed by /r/preset/[code].
// Pure functions only (this runs in a route handler): a generator turns a
// decoded preset into compilable files + dependency names; the route flavors
// the dependency URLs and wraps everything in a registry item.
// Server and tests only: client code names a preset's files through
// outlines.ts, which leaves the DataTable generator's data out of the bundle.
// ---------------------------------------------------------------------------

import { LIGHT_PRESET_GENERATORS, type PresetGenerator } from "./light-generators";
import { DATA_TABLE_PRESET_GENERATOR } from "./data-table-install";

export type { PresetGenerator };

export const PRESET_GENERATORS: Record<string, PresetGenerator> = {
  ...LIGHT_PRESET_GENERATORS,
  t: DATA_TABLE_PRESET_GENERATOR,
};
