// ---------------------------------------------------------------------------
// Stateless preset codec, following shadcn's preset principle: bit-pack the
// configuration into ONE integer over versioned, append-only field tables,
// base62-encode it, and prefix a component tag + version character. Codes
// decode offline and forever — no storage, no lookup.
//
// Code shape: `<component><version><base62>` — e.g. "sa3Xk9Q".
// Components register their tag + field tables in lib/preset/components.ts;
// this module is the generic engine.
//
// Compat rules (enforced by tests/preset-codec.test.mjs, per component):
//   1. Never reorder existing value arrays — only append.
//   2. Every field's default sits at index 0 (unknown/overflow decodes to it).
//      A field missing from an older version's table decodes to that default
//      too, unless `versionDefaults` pins the value it had then: needed when
//      a new field defaults ON, or every older code would gain it.
//   3. Only append new fields at the end; bump the component's version char
//      when the LAYOUT changes incompatibly (bit widths, removals), keeping
//      the old table registered so old codes still decode.
//   4. Total bits stay under 53 (JS safe-integer limit).
// ---------------------------------------------------------------------------

export interface PresetField {
  key: string;
  /** Append-only. Index 0 is the field's default. */
  values: readonly (string | number | boolean)[];
  /** Allocated width — headroom for appends, never shrink. */
  bits: number;
}

export interface PresetComponentDef {
  /** One character, unique across components — leads every code. */
  tag: string;
  /** Human name for dialogs ("Sidebar"). */
  label: string;
  /** Docs path whose playground hydrates from ?preset= ("/docs/sidebar"). */
  docsPath: string;
  /** Version char → field table. Append new versions, keep old ones. */
  versions: Record<string, readonly PresetField[]>;
  currentVersion: string;
  defaults: Record<string, string | number | boolean>;
  /** Version char → values for fields that version's table predates, when
   *  they must not take today's default. A field added on by default would
   *  otherwise switch itself on in every older code. */
  versionDefaults?: Record<string, Record<string, string | number | boolean>>;
  /** False = share-link only; /r/preset refuses to generate an install. */
  installable: boolean;
}

const BASE62 =
  "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";

export function toBase62(num: number): string {
  if (num === 0) return "0";
  let out = "";
  let n = num;
  while (n > 0) {
    out = BASE62[n % 62] + out;
    n = Math.floor(n / 62);
  }
  return out;
}

export function fromBase62(str: string): number {
  let out = 0;
  for (const ch of str) {
    const idx = BASE62.indexOf(ch);
    if (idx === -1) return -1;
    out = out * 62 + idx;
  }
  return out;
}

const COMPONENTS = new Map<string, PresetComponentDef>();

export function registerPresetComponent(def: PresetComponentDef): void {
  const existing = COMPONENTS.get(def.tag);
  if (existing && existing !== def) {
    throw new Error(`Preset tag "${def.tag}" is already registered.`);
  }
  COMPONENTS.set(def.tag, def);
}

export function getPresetComponent(tag: string): PresetComponentDef | undefined {
  return COMPONENTS.get(tag);
}

export function getAllPresetComponents(): PresetComponentDef[] {
  return [...COMPONENTS.values()];
}

export function totalBits(fields: readonly PresetField[]): number {
  return fields.reduce((n, f) => n + f.bits, 0);
}

/** Encode a (possibly partial) config for a registered component. Missing
 *  fields take their defaults, so {} encodes the canonical default code.
 *  Uses multiplication, not bitwise ops — JS bitwise truncates to 32 bits. */
export function encodePreset(
  def: PresetComponentDef,
  config: Record<string, unknown>
): string {
  const merged = { ...def.defaults, ...config };
  const fields = def.versions[def.currentVersion];
  let bits = 0;
  let offset = 0;
  for (const field of fields) {
    const idx = field.values.indexOf(merged[field.key] as never);
    bits += (idx === -1 ? 0 : idx) * 2 ** offset;
    offset += field.bits;
  }
  return `${def.tag}${def.currentVersion}${toBase62(bits)}`;
}

export type DecodeResult =
  | {
      ok: true;
      def: PresetComponentDef;
      preset: Record<string, string | number | boolean>;
      version: string;
    }
  | { ok: false; error: string };

/** Tolerant decode: an out-of-range index falls back to the field's default;
 *  unknown tags/versions fail loudly with a useful message. */
export function decodePreset(code: string): DecodeResult {
  const trimmed = code.trim();
  if (trimmed.length < 3) return { ok: false, error: "Preset code is too short." };
  const tag = trimmed[0];
  const version = trimmed[1];
  const body = trimmed.slice(2);
  const def = COMPONENTS.get(tag);
  if (!def) {
    return { ok: false, error: `Unknown preset component tag "${tag}".` };
  }
  const fields = def.versions[version];
  if (!fields) {
    return {
      ok: false,
      error: `Unknown preset version "${version}" — update fluidfunctionalism.com links or re-copy the code.`,
    };
  }
  const bits = fromBase62(body);
  if (bits < 0 || bits >= 2 ** totalBits(fields)) {
    return { ok: false, error: "Preset code is not valid base62 or out of range." };
  }
  const preset = { ...def.defaults, ...def.versionDefaults?.[version] };
  let remaining = bits;
  for (const field of fields) {
    const idx = remaining % 2 ** field.bits;
    remaining = Math.floor(remaining / 2 ** field.bits);
    preset[field.key] = idx < field.values.length ? field.values[idx] : field.values[0];
  }
  return { ok: true, def, preset, version };
}
