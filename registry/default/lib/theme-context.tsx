"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
  type ReactNode,
} from "react";

type Theme = "system" | "light" | "dark";

const themeOrder: Theme[] = ["system", "light", "dark"];

interface ThemeContextValue {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

// The page cross-fades between themes as one snapshot (a View Transition),
// on the compositor, instead of every element tweening its own colors.
const CROSS_FADE_CSS =
  "::view-transition-old(root),::view-transition-new(root){animation-duration:180ms;animation-timing-function:ease-in-out}";
// Without View Transitions (or with reduced motion) the swap is instant, and
// components' own color transitions are held off so nothing fades on its own.
const NO_TRANSITIONS_CSS = "*,*::before,*::after{transition:none!important}";

function injectStyle(css: string) {
  const style = document.createElement("style");
  style.textContent = css;
  document.head.appendChild(style);
  return style;
}

/** Runs a theme swap: cross-faded when the browser can, instant otherwise. */
function swapTheme(apply: () => void) {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (!reduceMotion && typeof document.startViewTransition === "function") {
    // The new snapshot is live, so components' own color transitions would
    // still tween inside it: hold them off until the cross-fade ends.
    const style = injectStyle(CROSS_FADE_CSS + NO_TRANSITIONS_CSS);
    const transition = document.startViewTransition(apply);
    // `finished` rejects when a newer swap skips this one; clean up either way.
    const cleanup = () => style.remove();
    transition.finished.then(cleanup, cleanup);
    return;
  }
  const style = injectStyle(NO_TRANSITIONS_CSS);
  apply();
  // Flush the new colors while transitions are off, then let them back on
  // after the next paint.
  void window.getComputedStyle(document.body).color;
  requestAnimationFrame(() => requestAnimationFrame(() => style.remove()));
}

function useThemeContext() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useThemeContext must be used within a ThemeProvider");
  return ctx;
}

function ThemeProvider({
  children,
  defaultTheme = "system",
}: {
  children: ReactNode;
  defaultTheme?: Theme;
}) {
  const [theme, setThemeState] = useState<Theme>(defaultTheme);
  // The first application (mount) swaps silently: only a theme the user
  // picks cross-fades.
  const hasAppliedRef = useRef(false);

  const setTheme = useCallback((next: Theme) => {
    setThemeState(next);
  }, []);

  // Single source of truth for the DOM side effects: swap the root classes.
  useEffect(() => {
    const root = document.documentElement;
    const apply = () => {
      root.classList.remove("light", "dark");
      if (theme !== "system") root.classList.add(theme);
    };
    if (!hasAppliedRef.current) {
      hasAppliedRef.current = true;
      apply();
      return;
    }
    swapTheme(apply);
  }, [theme]);

  // Global keyboard shortcut: T to cycle theme
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "t" && e.key !== "T") return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || (e.target as HTMLElement)?.isContentEditable) return;
      e.preventDefault();
      // Just advance the state — the [theme] effect above applies the DOM.
      setThemeState((prev) => themeOrder[(themeOrder.indexOf(prev) + 1) % themeOrder.length]);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  const value = useMemo(() => ({ theme, setTheme }), [theme, setTheme]);

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export { ThemeProvider, useThemeContext };
export type { Theme };
