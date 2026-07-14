"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useMemo,
  type ReactNode,
} from "react";

import { IconProvider } from "@/lib/icon-context";
import { iconMap, iconLibraryOrder, type IconLibrary } from "@/lib/docs/icon-map";

export { iconLibraryOrder, iconLibraryLabels, type IconLibrary } from "@/lib/docs/icon-map";

interface IconPlaygroundContextValue {
  iconLibrary: IconLibrary;
  setIconLibrary: (lib: IconLibrary) => void;
}

const IconPlaygroundContext = createContext<IconPlaygroundContextValue | null>(null);

/**
 * Returns the current icon library and setter.
 * Throws if used outside IconPlaygroundProvider.
 */
function useIconLibrary() {
  const ctx = useContext(IconPlaygroundContext);
  if (!ctx) throw new Error("useIconLibrary must be used within an IconPlaygroundProvider");
  return ctx;
}

/**
 * Docs-site wrapper around the installed IconProvider: holds the active
 * library choice, feeds the matching icon map down, and binds the global
 * "press I to cycle icon library" shortcut. Installed components never
 * see any of this — they only read the resolved icons from IconProvider.
 */
function IconPlaygroundProvider({
  children,
  defaultLibrary = "lucide",
}: {
  children: ReactNode;
  defaultLibrary?: IconLibrary;
}) {
  const [iconLibrary, setIconLibraryState] = useState<IconLibrary>(defaultLibrary);

  const setIconLibrary = useCallback((next: IconLibrary) => {
    setIconLibraryState(next);
  }, []);

  // Global keyboard shortcut: I to cycle icon library
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "i" && e.key !== "I") return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || (e.target as HTMLElement)?.isContentEditable) return;
      e.preventDefault();
      setIconLibraryState((prev) => {
        const idx = iconLibraryOrder.indexOf(prev);
        return iconLibraryOrder[(idx + 1) % iconLibraryOrder.length];
      });
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  const value = useMemo(
    () => ({ iconLibrary, setIconLibrary }),
    [iconLibrary, setIconLibrary]
  );

  return (
    <IconPlaygroundContext.Provider value={value}>
      <IconProvider icons={iconMap[iconLibrary]}>{children}</IconProvider>
    </IconPlaygroundContext.Provider>
  );
}

export { IconPlaygroundProvider, useIconLibrary };
