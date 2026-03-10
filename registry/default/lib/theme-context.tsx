"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";

type Theme = "system" | "light" | "dark";

const themeOrder: Theme[] = ["system", "light", "dark"];

interface ThemeContextValue {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

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

  const setTheme = useCallback((next: Theme) => {
    const root = document.documentElement;
    root.classList.add("transitioning");
    void root.offsetHeight;
    setThemeState(next);
    setTimeout(() => root.classList.remove("transitioning"), 200);
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove("light", "dark");
    if (theme !== "system") root.classList.add(theme);
  }, [theme]);

  // Global keyboard shortcut: T to cycle theme
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "t" && e.key !== "T") return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || (e.target as HTMLElement)?.isContentEditable) return;
      e.preventDefault();
      setThemeState((prev) => {
        const idx = themeOrder.indexOf(prev);
        const next = themeOrder[(idx + 1) % themeOrder.length];
        const root = document.documentElement;
        root.classList.add("transitioning");
        void root.offsetHeight;
        root.classList.remove("light", "dark");
        if (next !== "system") root.classList.add(next);
        setTimeout(() => root.classList.remove("transitioning"), 200);
        return next;
      });
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export { ThemeProvider, useThemeContext };
export type { Theme };
