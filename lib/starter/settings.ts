// ---------------------------------------------------------------------------
// The starter's settings travel in its URL as a readable slug: one word per
// setting that differs from the default, in a fixed order, joined by dashes.
//
//   /r/starter/default.json                       every default
//   /r/starter/radix-pill-compact-phosphor.json   four changed, theme default
//
// Every value is a distinct word across all six settings, so a slug parses
// without knowing which position held which setting, and a person or an
// agent can read (or edit) it at a glance. Server-safe: no "use client".
// ---------------------------------------------------------------------------

import {
  DEFAULT_SETTINGS,
  SETTING_VALUES,
  type SiteSettings,
} from "@/lib/docs/site-settings";

export type StarterSettings = SiteSettings;

export const STARTER_DEFAULTS: StarterSettings = DEFAULT_SETTINGS;

/** Slug order: the order settings appear in the slug. */
const KEYS = ["base", "shape", "size", "icons", "theme", "accent"] as const satisfies readonly (keyof StarterSettings)[];

/** The slug for every default. */
export const DEFAULT_SLUG = "default";

const TOKENS = new Map<string, { key: keyof StarterSettings; value: string }>();
for (const key of KEYS) {
  for (const value of SETTING_VALUES[key]) TOKENS.set(value, { key, value });
}

export function starterSlug(settings: StarterSettings): string {
  const parts = KEYS.filter((k) => settings[k] !== STARTER_DEFAULTS[k]).map((k) => settings[k]);
  return parts.length ? parts.join("-") : DEFAULT_SLUG;
}

export type StarterParse =
  | { ok: true; settings: StarterSettings }
  | { ok: false; error: string };

/** Reads a slug back. Words may come in any order; each setting at most once. */
export function parseStarterSlug(slug: string): StarterParse {
  const settings = { ...STARTER_DEFAULTS };
  const seen = new Set<keyof StarterSettings>();
  for (const word of slug.toLowerCase().split("-").filter(Boolean)) {
    const token = TOKENS.get(word);
    if (!token) {
      return { ok: false, error: `Unknown starter setting "${word}". Valid words: ${[...TOKENS.keys()].join(", ")}.` };
    }
    if (seen.has(token.key)) {
      return { ok: false, error: `The slug sets ${token.key} twice.` };
    }
    // "default" is also a size value; as the whole slug it means every default.
    seen.add(token.key);
    (settings as Record<string, string>)[token.key] = token.value;
  }
  return { ok: true, settings };
}
