"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";

import {
  ACCENT_ORDER,
  ACCENT_PRESETS,
  accentCss,
  accentHex,
  presetForHex,
  type AccentPreset,
} from "@/lib/accent";
import { customAccentCookie } from "@/lib/docs/site-settings";
import { showShortcutToast } from "@/lib/docs/settings-toast";

interface AccentContextValue {
  /** The preset: the starter setting, kept even under a custom color. */
  preset: AccentPreset;
  /** The visitor's own color (6-digit hex), overriding the preset. */
  custom: string | null;
  /** The color on screen, on the theme showing now. */
  hex: string;
  /** Whether the dark theme is showing: presets have a shade per theme. */
  dark: boolean;
  /** Picks a preset and drops any custom color. */
  setPreset: (preset: AccentPreset) => void;
  /** Takes any 6-digit hex: a preset's hex selects that preset. */
  setColor: (hex: string) => void;
}

const AccentContext = createContext<AccentContextValue | null>(null);

// The theme showing: a .light or .dark class on <html> pins it, else the OS
// decides. Light on the server, which can't know the OS: the CSS value is
// light-dark() either way, so only JS readers (the picker) wait a frame.
function subscribeScheme(onChange: () => void) {
  const media = window.matchMedia("(prefers-color-scheme: dark)");
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
  media.addEventListener("change", onChange);
  return () => {
    observer.disconnect();
    media.removeEventListener("change", onChange);
  };
}

function readDark() {
  const root = document.documentElement.classList;
  if (root.contains("dark")) return true;
  if (root.contains("light")) return false;
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

function useDarkScheme() {
  return useSyncExternalStore(subscribeScheme, readDark, () => false);
}

/**
 * Docs-site-only: the accent (--fluid-accent) behind every focus ring and
 * accented detail, set from the right panel or A. The preset is a "Make them
 * yours" setting (SettingsPersistence writes its cookie); a custom color has
 * its own cookie, written here once the color settles. Either way the color
 * lands inline on <html>, which the root layout also renders, so the first
 * paint has it.
 */
export function AccentProvider({
  defaultPreset,
  defaultCustom,
  children,
}: {
  defaultPreset: AccentPreset;
  defaultCustom: string | null;
  children: ReactNode;
}) {
  const [preset, setPresetState] = useState(defaultPreset);
  const [custom, setCustom] = useState(defaultCustom);
  const dark = useDarkScheme();
  const hex = accentHex(preset, custom, dark);
  const css = accentCss(preset, custom);

  useEffect(() => {
    document.documentElement.style.setProperty("--fluid-accent", css);
  }, [css]);

  // The custom color's cookie, written once the color settles: a picker drag
  // changes it every frame. Nothing is written until it differs from what the
  // server rendered, so a first visit sets no cookie.
  const written = useRef(defaultCustom);
  useEffect(() => {
    if (custom === written.current) return;
    const id = setTimeout(() => {
      written.current = custom;
      document.cookie = customAccentCookie(custom);
    }, 250);
    return () => clearTimeout(id);
  }, [custom]);

  const setPreset = useCallback((next: AccentPreset) => {
    setPresetState(next);
    setCustom(null);
  }, []);

  const setColor = useCallback(
    (next: string) => {
      const match = presetForHex(next);
      if (match) {
        setPreset(match);
        return;
      }
      setCustom(next.toUpperCase());
    },
    [setPreset]
  );

  const value = useMemo(
    () => ({ preset, custom, hex, dark, setPreset, setColor }),
    [preset, custom, hex, dark, setPreset, setColor]
  );

  return <AccentContext.Provider value={value}>{children}</AccentContext.Provider>;
}

/** The presets as a ColorPicker's swatches, in panel order: each preset's
 *  shade for the theme showing, named in its tooltip. */
const SWATCHES = {
  light: ACCENT_ORDER.map((p) => ({ color: ACCENT_PRESETS[p].light, label: ACCENT_PRESETS[p].label })),
  dark: ACCENT_ORDER.map((p) => ({ color: ACCENT_PRESETS[p].dark, label: ACCENT_PRESETS[p].label })),
};
export function accentSwatches(dark: boolean) {
  return SWATCHES[dark ? "dark" : "light"];
}

/** A ColorPicker's parsed color as the 6-digit uppercase hex the accent
 *  stores (it has no alpha). */
export function accentHexOf({ r, g, b }: { r: number; g: number; b: number }): string {
  return "#" + [r, g, b].map((v) => Math.round(v).toString(16).padStart(2, "0")).join("").toUpperCase();
}

export function useAccent(): AccentContextValue {
  const ctx = useContext(AccentContext);
  if (!ctx) throw new Error("useAccent must be used inside AccentProvider");
  return ctx;
}

/**
 * Docs-site-only global shortcut: A cycles the accent presets (from blue
 * when a custom color is on) and toasts the result. Same guards as the other
 * settings shortcuts.
 */
export function AccentShortcut() {
  const { preset, custom, setPreset } = useAccent();
  // Read at keypress time, so quick presses each advance one step.
  const currentRef = useRef<AccentPreset | null>(custom ? null : preset);
  useEffect(() => {
    currentRef.current = custom ? null : preset;
  }, [preset, custom]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "a" && e.key !== "A") return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const target = e.target instanceof HTMLElement ? e.target : null;
      if (target?.tagName === "INPUT" || target?.tagName === "TEXTAREA" || target?.isContentEditable) return;
      if (target?.closest('[role="listbox"], [role="menu"], [role="dialog"], [role="combobox"], [role="option"]')) return;
      e.preventDefault();
      const current = currentRef.current;
      const next = current === null ? ACCENT_ORDER[0] : ACCENT_ORDER[(ACCENT_ORDER.indexOf(current) + 1) % ACCENT_ORDER.length];
      currentRef.current = next;
      setPreset(next);
      showShortcutToast("A", `Accent set to ${ACCENT_PRESETS[next].label}`);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [setPreset]);

  return null;
}
