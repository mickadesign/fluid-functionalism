// ---------------------------------------------------------------------------
// The accent: the one brand color of the system, read by every focus ring,
// the switch track, the drop and swatch rings and the copy highlight through
// --fluid-accent (globals.css derives --focus-ring from it). Hover and
// selected highlights stay neutral on purpose.
//
// The presets (the system's blue and Tailwind's hues, each a light and a dark
// shade) travel as a "Make them yours" setting (cookie ff_accent, a word in
// the starter slug). A custom color is site-only (cookie ff_accent_custom)
// and reaches installs through the copied prompt. Server-safe: the root
// layout, the starter generator and the client all read it.
// ---------------------------------------------------------------------------

export type AccentPreset =
  | "red"
  | "orange"
  | "amber"
  | "yellow"
  | "lime"
  | "green"
  | "emerald"
  | "teal"
  | "cyan"
  | "sky"
  | "blue"
  | "indigo"
  | "violet"
  | "purple"
  | "fuchsia"
  | "pink"
  | "rose";

export interface AccentColor {
  label: string;
  /** On the light theme. */
  light: string;
  /** On the dark theme. */
  dark: string;
}

/** The presets in panel order, by hue. Blue is the system's own, the same
 *  on both themes. Every other preset is a Tailwind hue, as hex: its 600 shade
 *  on light (2.9 to 6.5:1 on white) and its 400 shade on dark (5.7 to 11.7:1),
 *  so a focus ring stays clear on either. Tailwind's own blue is left out:
 *  the system's blue holds that place. */
export const ACCENT_PRESETS: Record<AccentPreset, AccentColor> = {
  red: { label: "Red", light: "#E7000B", dark: "#FF6467" },
  orange: { label: "Orange", light: "#F54900", dark: "#FF8904" },
  amber: { label: "Amber", light: "#E17100", dark: "#FFB900" },
  yellow: { label: "Yellow", light: "#D08700", dark: "#FDC700" },
  lime: { label: "Lime", light: "#5EA500", dark: "#9AE600" },
  green: { label: "Green", light: "#00A63E", dark: "#05DF72" },
  emerald: { label: "Emerald", light: "#009966", dark: "#00D492" },
  teal: { label: "Teal", light: "#009689", dark: "#00D5BE" },
  cyan: { label: "Cyan", light: "#0092B8", dark: "#00D3F2" },
  sky: { label: "Sky", light: "#0084D1", dark: "#00BCFF" },
  blue: { label: "Blue", light: "#6B97FF", dark: "#6B97FF" },
  indigo: { label: "Indigo", light: "#4F39F6", dark: "#7C86FF" },
  violet: { label: "Violet", light: "#7F22FE", dark: "#A684FF" },
  purple: { label: "Purple", light: "#9810FA", dark: "#C27AFF" },
  fuchsia: { label: "Fuchsia", light: "#C800DE", dark: "#ED6AFF" },
  pink: { label: "Pink", light: "#E60076", dark: "#FB64B6" },
  rose: { label: "Rose", light: "#EC003F", dark: "#FF637E" },
};

export const ACCENT_ORDER = Object.keys(ACCENT_PRESETS) as AccentPreset[];

export const DEFAULT_ACCENT: AccentPreset = "blue";

/** The accent as a CSS value, for site code that draws in it (inspect
 *  rulers, spec-sheet guides, annotations). SVG presentation attributes
 *  can't read var(): pass it through style or as the CSS color under
 *  currentColor. */
export const ACCENT_VAR = "var(--fluid-accent, #6B97FF)";

/** A 6-digit hex color, the only custom accent shape the site stores. */
export function isAccentHex(value: string | null | undefined): value is string {
  return !!value && /^#[0-9a-fA-F]{6}$/.test(value);
}

/** The preset a hex color is, on either theme, if any (case-insensitive). */
export function presetForHex(hex: string): AccentPreset | null {
  const upper = hex.toUpperCase();
  return ACCENT_ORDER.find((p) => ACCENT_PRESETS[p].light === upper || ACCENT_PRESETS[p].dark === upper) ?? null;
}

/** The accent as a CSS value for --fluid-accent: the custom color, the
 *  preset's one color, or light-dark() over its two. light-dark() follows the
 *  color-scheme of the element that declares the property (<html>). */
export function accentCss(preset: AccentPreset, custom: string | null): string {
  if (custom) return custom;
  const { light, dark } = ACCENT_PRESETS[preset];
  return light === dark ? light : `light-dark(${light}, ${dark})`;
}

/** The color on screen on one theme: the custom one when set, else the
 *  preset's shade for that theme. */
export function accentHex(preset: AccentPreset, custom: string | null, dark: boolean): string {
  return custom ?? ACCENT_PRESETS[preset][dark ? "dark" : "light"];
}

/** How the accent reads in words: "Violet", or the custom hex. */
export function accentLabel(preset: AccentPreset, custom: string | null): string {
  return custom ? custom.toUpperCase() : ACCENT_PRESETS[preset].label;
}

/** WCAG contrast ratio between two 6-digit hex colors. */
export function contrastRatio(a: string, b: string): number {
  const luminance = (hex: string) => {
    const [r, g, b] = [1, 3, 5].map((i) => {
      const c = parseInt(hex.slice(i, i + 2), 16) / 255;
      return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

/** Below this against the page, a 1px focus ring gets hard to find. The
 *  presets all clear it: 2.8:1 and up on light, 5.7:1 and up on dark. */
export const LOW_ACCENT_CONTRAST = 2;
