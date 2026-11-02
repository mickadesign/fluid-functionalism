// ---------------------------------------------------------------------------
// The "Make them yours" settings (theme, radius, size, icons, primitive,
// accent) and where the browser keeps them: one cookie each, so the server
// layout renders the visitor's last choice on the first paint. localStorage
// would only be readable after hydration, and every reload would flash the
// defaults first (a light page before dark, rounded corners before pill, the
// default ladder before compact, blue before the picked accent).
//
// Server-safe on purpose: no "use client", and the value lists live here
// rather than in the client modules that own each setting, because a server
// component importing a value from a client module gets a reference, not
// the array.
// ---------------------------------------------------------------------------

import type { Theme } from "@/registry/default/lib/theme-context";
import type { ShapeVariant } from "@/registry/default/lib/shape-context";
import type { SizeVariant } from "@/registry/default/lib/size-context";
import type { IconLibrary } from "@/lib/docs/icon-map";
import type { Base } from "@/lib/base-context";
import { ACCENT_ORDER, isAccentHex, type AccentPreset } from "@/lib/accent";

export interface SiteSettings {
  theme: Theme;
  shape: ShapeVariant;
  size: SizeVariant;
  icons: IconLibrary;
  base: Base;
  accent: AccentPreset;
}

/** What a first visit sees. */
export const DEFAULT_SETTINGS: SiteSettings = {
  theme: "system",
  shape: "rounded",
  size: "default",
  icons: "untitledui",
  base: "base",
  accent: "blue",
};

/** Every value each setting accepts, in the order the site lists them. */
export const SETTING_VALUES = {
  theme: ["system", "light", "dark"],
  shape: ["rounded", "pill"],
  size: ["default", "compact"],
  icons: ["lucide", "tabler", "phosphor", "hugeicons", "untitledui"],
  base: ["radix", "base"],
  accent: ACCENT_ORDER,
} as const satisfies { [K in keyof SiteSettings]: readonly SiteSettings[K][] };

export const SETTINGS_COOKIES: Record<keyof SiteSettings, string> = {
  theme: "ff_theme",
  shape: "ff_shape",
  size: "ff_size",
  icons: "ff_icons",
  base: "ff_base",
  accent: "ff_accent",
};

/** One year: a preference, not a session. */
const MAX_AGE = 60 * 60 * 24 * 365;

/** Reads every setting through `get` (a cookie lookup), falling back to the
 *  default for a missing or unknown value. */
export function readSettings(get: (name: string) => string | undefined): SiteSettings {
  const pick = <K extends keyof SiteSettings>(key: K): SiteSettings[K] => {
    const raw = get(SETTINGS_COOKIES[key]);
    const allowed = SETTING_VALUES[key] as readonly string[];
    return (raw && allowed.includes(raw) ? raw : DEFAULT_SETTINGS[key]) as SiteSettings[K];
  };
  return {
    theme: pick("theme"),
    shape: pick("shape"),
    size: pick("size"),
    icons: pick("icons"),
    base: pick("base"),
    accent: pick("accent"),
  };
}

/** The `document.cookie` assignment that stores one setting. */
export function settingCookie<K extends keyof SiteSettings>(key: K, value: SiteSettings[K]): string {
  return `${SETTINGS_COOKIES[key]}=${value}; path=/; max-age=${MAX_AGE}; samesite=lax`;
}

// ---------------------------------------------------------------------------
// The custom accent: site-only, like the heading font. A preset is the
// "accent" setting above; a color of the visitor's own overrides it here and
// travels to installs through the copied prompt.
// ---------------------------------------------------------------------------

export const CUSTOM_ACCENT_COOKIE = "ff_accent_custom";

/** The saved custom accent, a 6-digit hex, or null. */
export function readCustomAccent(get: (name: string) => string | undefined): string | null {
  const raw = get(CUSTOM_ACCENT_COOKIE);
  let value: string | undefined;
  try {
    value = raw ? decodeURIComponent(raw) : undefined;
  } catch {
    value = undefined;
  }
  return isAccentHex(value) ? value.toUpperCase() : null;
}

/** Stores the custom accent; `null` (back to a preset) clears the cookie. */
export function customAccentCookie(hex: string | null): string {
  return hex === null
    ? `${CUSTOM_ACCENT_COOKIE}=; path=/; max-age=0; samesite=lax`
    : `${CUSTOM_ACCENT_COOKIE}=${encodeURIComponent(hex)}; path=/; max-age=${MAX_AGE}; samesite=lax`;
}

// ---------------------------------------------------------------------------
// The heading font: site-only, so it sits outside SiteSettings and never
// travels in a starter slug. Same cookie recipe, read by the root layout into
// <html data-font> so a saved serif paints on the first frame.
// ---------------------------------------------------------------------------

export type HeadingFont = "inter" | "geist-serif" | "custom";

export const HEADING_FONTS = ["inter", "geist-serif", "custom"] as const satisfies readonly HeadingFont[];

export const DEFAULT_HEADING_FONT: HeadingFont = "inter";

export const HEADING_FONT_COOKIE = "ff_font";

/** The Google Fonts family behind "custom", URI-encoded. */
export const CUSTOM_FONT_COOKIE = "ff_font_custom";

/** The weight every heading takes in the custom family, when the visitor
 *  picked one over Auto (the role weights). */
export const CUSTOM_WEIGHT_COOKIE = "ff_font_weight";

/** The saved heading font, custom family name and custom weight. The caller
 *  checks family and weight against the catalog, falling back to Inter and
 *  Auto when they are unknown. */
export function readHeadingFont(get: (name: string) => string | undefined): {
  font: HeadingFont;
  customFamily: string | null;
  customWeight: number | null;
} {
  const raw = get(HEADING_FONT_COOKIE);
  const font = (HEADING_FONTS as readonly string[]).includes(raw ?? "") ? (raw as HeadingFont) : DEFAULT_HEADING_FONT;
  let customFamily: string | null = null;
  try {
    const encoded = get(CUSTOM_FONT_COOKIE);
    customFamily = encoded ? decodeURIComponent(encoded) : null;
  } catch {
    // A malformed cookie is no family.
  }
  const weight = Number(get(CUSTOM_WEIGHT_COOKIE));
  const customWeight = Number.isInteger(weight) && weight >= 1 && weight <= 1000 ? weight : null;
  return { font, customFamily, customWeight };
}

export function headingFontCookie(value: HeadingFont): string {
  return `${HEADING_FONT_COOKIE}=${value}; path=/; max-age=${MAX_AGE}; samesite=lax`;
}

export function customFontCookie(family: string): string {
  return `${CUSTOM_FONT_COOKIE}=${encodeURIComponent(family)}; path=/; max-age=${MAX_AGE}; samesite=lax`;
}

/** Stores the custom weight; `null` (Auto) clears the cookie. */
export function customWeightCookie(weight: number | null): string {
  return weight === null
    ? `${CUSTOM_WEIGHT_COOKIE}=; path=/; max-age=0; samesite=lax`
    : `${CUSTOM_WEIGHT_COOKIE}=${weight}; path=/; max-age=${MAX_AGE}; samesite=lax`;
}
