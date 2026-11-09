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
import { hoverModeCookie, HOVER_MODES, type HoverMode } from "@/lib/docs/site-settings";
import { showShortcutToast } from "@/lib/docs/settings-toast";

export const HOVER_MODE_LABELS: Record<HoverMode, string> = {
  fluid: "Fluid",
  standard: "Standard",
};

interface HoverModeContextValue {
  mode: HoverMode;
  setMode: (next: HoverMode) => void;
}

const HoverModeContext = createContext<HoverModeContextValue | null>(null);

/**
 * Docs-site-only: which hover every list on the site runs, fluid or
 * standard, set from the right panel or H. The site's `@/hooks/use-fluid-hover`
 * and `@/components/ui/fluid-hover-highlight` shims read it and hand each
 * component the matching implementation, the same files an install from
 * `r/` or `r/standard/` gets. Saved in the `ff_hover` cookie; the root
 * layout reads it back.
 */
export function HoverModeProvider({
  defaultMode,
  children,
}: {
  defaultMode: HoverMode;
  children: ReactNode;
}) {
  const [mode, setModeState] = useState(defaultMode);
  const setMode = useCallback((next: HoverMode) => {
    setModeState(next);
    document.cookie = hoverModeCookie(next);
  }, []);
  const value = useMemo(() => ({ mode, setMode }), [mode, setMode]);
  return <HoverModeContext.Provider value={value}>{children}</HoverModeContext.Provider>;
}

/** Pins a subtree to one hover whatever the setting says: the fluid hover
 *  page's demos exist to show the glide. */
export function HoverModeOverride({ mode, children }: { mode: HoverMode; children: ReactNode }) {
  const parent = useContext(HoverModeContext);
  const value = useMemo(() => ({ mode, setMode: parent?.setMode ?? (() => {}) }), [mode, parent]);
  return <HoverModeContext.Provider value={value}>{children}</HoverModeContext.Provider>;
}

/** The hover in effect here. Fluid outside the provider (tests, the OG
 *  stage), which is what an install from `r/` gets. */
export function useHoverMode(): HoverMode {
  return useContext(HoverModeContext)?.mode ?? "fluid";
}

export function useHoverModeSetting(): HoverModeContextValue {
  const ctx = useContext(HoverModeContext);
  if (!ctx) throw new Error("useHoverModeSetting must be used inside HoverModeProvider");
  return ctx;
}

/**
 * Docs-site-only global shortcut: H flips the hover and toasts the result.
 * Same guards as the other settings shortcuts: no modifiers, and fields and
 * open popups own their keys.
 */
export function HoverModeShortcut() {
  const { mode, setMode } = useHoverModeSetting();
  const modeRef = useRef(mode);
  useEffect(() => {
    modeRef.current = mode;
  }, [mode]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "h" && e.key !== "H") return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const target = e.target instanceof HTMLElement ? e.target : null;
      if (target?.tagName === "INPUT" || target?.tagName === "TEXTAREA" || target?.isContentEditable) return;
      if (target?.closest('[role="listbox"], [role="menu"], [role="dialog"], [role="combobox"], [role="option"]')) return;
      e.preventDefault();
      const next = HOVER_MODES[(HOVER_MODES.indexOf(modeRef.current) + 1) % HOVER_MODES.length];
      modeRef.current = next;
      setMode(next);
      showShortcutToast("H", `Hover set to ${HOVER_MODE_LABELS[next]}`);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [setMode]);

  return null;
}
