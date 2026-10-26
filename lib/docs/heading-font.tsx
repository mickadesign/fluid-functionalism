"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import {
  HEADING_FONTS,
  customFontCookie,
  customWeightCookie,
  headingFontCookie,
  type HeadingFont,
} from "@/lib/docs/site-settings";
import {
  WEIGHT_NAMES,
  customHeadingVars,
  googleFontHref,
  googleFontWeights,
  nearestGoogleFontWeight,
  type GoogleFont,
} from "@/lib/docs/google-fonts";
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/flavored/select";
import { GoogleFontPicker } from "@/lib/docs/google-font-picker";
import { showShortcutToast } from "@/lib/docs/settings-toast";

/** The built-in choices. "custom" reads as the picked family's name. */
const BUILT_IN_LABELS = {
  inter: "Inter",
  "source-serif": "Source Serif 4",
} as const satisfies Partial<Record<HeadingFont, string>>;

export function headingFontLabel(font: HeadingFont, custom: GoogleFont | null): string {
  return font === "custom" ? (custom?.n ?? "Custom") : BUILT_IN_LABELS[font];
}

interface HeadingFontContextValue {
  font: HeadingFont;
  /** The Google Fonts family behind "custom", once one was picked. */
  custom: GoogleFont | null;
  /** The choices on offer: "custom" only once a family was picked. */
  fonts: readonly HeadingFont[];
  /** Switches the heading font. "custom" with no family yet opens the picker. */
  setFont: (font: HeadingFont) => void;
  /** Opens the Google Fonts picker. */
  browse: () => void;
  /** The weight every heading takes in the custom family; `null` is Auto,
   *  the role weights (550, display 700). */
  weight: number | null;
  setWeight: (weight: number | null) => void;
}

/** Puts a custom family's name and weight on <html>, replacing the last. */
function applyCustomVars(font: GoogleFont, weight: number | null) {
  const root = document.documentElement.style;
  root.removeProperty("--font-custom-weight");
  for (const [name, value] of Object.entries(customHeadingVars(font, weight))) root.setProperty(name, value);
}

const HeadingFontContext = createContext<HeadingFontContextValue | null>(null);

/**
 * Docs-site-only: the font of the site's headings, set from the right panel,
 * the typography page, or F. The choice lives on `<html data-font>`
 * (globals.css swaps the family from there) and in the `ff_font` cookie; a
 * custom Google Fonts family also sets `--font-custom` on <html> and the
 * `ff_font_custom` cookie. The root layout reads both back, so the first
 * paint already has them. Mounts the Google Fonts picker.
 */
export function HeadingFontProvider({
  defaultFont,
  defaultCustom,
  defaultWeight,
  children,
}: {
  defaultFont: HeadingFont;
  defaultCustom: GoogleFont | null;
  defaultWeight: number | null;
  children: ReactNode;
}) {
  const [font, setFontState] = useState(defaultFont);
  const [custom, setCustom] = useState(defaultCustom);
  const [weight, setWeightState] = useState(defaultWeight);
  const [picking, setPicking] = useState(false);

  const apply = useCallback((next: HeadingFont) => {
    setFontState(next);
    document.documentElement.dataset.font = next;
    document.cookie = headingFontCookie(next);
  }, []);

  const setFont = useCallback(
    (next: HeadingFont) => {
      if (next === "custom" && !custom) setPicking(true);
      else apply(next);
    },
    [apply, custom]
  );

  // A new family keeps the picked weight when it has it, else the nearest
  // weight it does have.
  const pick = useCallback(
    (family: GoogleFont) => {
      const nextWeight = weight === null ? null : nearestGoogleFontWeight(family, weight);
      setCustom(family);
      setWeightState(nextWeight);
      applyCustomVars(family, nextWeight);
      document.cookie = customFontCookie(family.n);
      document.cookie = customWeightCookie(nextWeight);
      apply("custom");
    },
    [apply, weight]
  );

  const setWeight = useCallback(
    (next: number | null) => {
      setWeightState(next);
      if (custom) applyCustomVars(custom, next);
      document.cookie = customWeightCookie(next);
    },
    [custom]
  );

  const value = useMemo<HeadingFontContextValue>(
    () => ({
      font,
      custom,
      fonts: custom ? HEADING_FONTS : HEADING_FONTS.filter((f) => f !== "custom"),
      setFont,
      browse: () => setPicking(true),
      weight,
      setWeight,
    }),
    [font, custom, setFont, weight, setWeight]
  );

  return (
    <HeadingFontContext.Provider value={value}>
      {/* Rendered in place, not hoisted with `precedence`: a hoisted
          stylesheet suspends the commit until it loads. */}
      {font === "custom" && custom && <link rel="stylesheet" href={googleFontHref(custom)} />}
      {children}
      <GoogleFontPicker open={picking} onOpenChange={setPicking} current={custom?.n ?? null} onPick={pick} />
    </HeadingFontContext.Provider>
  );
}

export function useHeadingFont(): HeadingFontContextValue {
  const ctx = useContext(HeadingFontContext);
  if (!ctx) throw new Error("useHeadingFont must be used inside HeadingFontProvider");
  return ctx;
}

/**
 * Docs-site-only global shortcut: F cycles the heading fonts on offer and
 * toasts the result. Mount once inside HeadingFontProvider. Same guards as
 * the other settings shortcuts: no modifiers, and fields and open popups own
 * their keys.
 */
export function HeadingFontShortcut() {
  const { font, fonts, custom, setFont } = useHeadingFont();
  // Read at keypress time: two quick presses can land before the re-render
  // that would hand the listener the new font, and both would pick the same.
  const fontRef = useRef(font);
  useEffect(() => {
    fontRef.current = font;
  }, [font]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "f" && e.key !== "F") return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const target = e.target instanceof HTMLElement ? e.target : null;
      if (target?.tagName === "INPUT" || target?.tagName === "TEXTAREA" || target?.isContentEditable) return;
      if (target?.closest('[role="listbox"], [role="menu"], [role="dialog"], [role="combobox"], [role="option"]')) return;
      e.preventDefault();
      const next = fonts[(fonts.indexOf(fontRef.current) + 1) % fonts.length];
      fontRef.current = next;
      setFont(next);
      showShortcutToast("F", `Heading font set to ${headingFontLabel(next, custom)}`);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [fonts, custom, setFont]);

  return null;
}

/** "Auto" in the weight select: the role weights. */
const AUTO_WEIGHT = "auto";

/**
 * Docs-site-only: the custom family's heading weight, Auto (the role
 * weights) or any weight the family has. Renders nothing unless a custom
 * family is the heading font.
 */
export function HeadingWeightSelect({ triggerClassName }: { triggerClassName?: string }) {
  const { font, custom, weight, setWeight } = useHeadingFont();
  if (font !== "custom" || !custom) return null;
  const weights = googleFontWeights(custom);
  return (
    <Select
      value={weight === null ? AUTO_WEIGHT : String(weight)}
      onValueChange={(v) => setWeight(v === AUTO_WEIGHT ? null : Number(v))}
    >
      <SelectTrigger variant="borderless" className={triggerClassName} aria-label="Heading weight" />
      <SelectContent>
        <SelectItem value={AUTO_WEIGHT} index={0}>
          Auto
        </SelectItem>
        {weights.map((w, i) => (
          <SelectItem key={w} value={String(w)} index={i + 1}>
            {`${WEIGHT_NAMES[w] ?? "Weight"} ${w}`}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
