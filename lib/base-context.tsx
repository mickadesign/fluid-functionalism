"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  DUAL_FLAVOR_SLUGS as DUAL_FLAVOR_SLUG_LIST,
  FLAVOR_AWARE_SLUGS as FLAVOR_AWARE_SLUG_LIST,
} from "./dual-flavor-slugs.mjs";

export type Base = "radix" | "base";

interface BaseContextValue {
  base: Base;
  setBase: (b: Base) => void;
}

const BaseContext = createContext<BaseContextValue | null>(null);

const STORAGE_KEY = "ff:base";

/**
 * Wraps the app and provides the currently selected primitive flavour
 * (Radix or Base UI). Persisted to localStorage. Default: "radix".
 *
 * The selected flavour drives the install URL surfaced in DocPage and the live
 * demo on dual-flavour doc pages (via `useFlavorComponents`).
 *
 * **Hydration strategy:** the initial state is always `"radix"` so the server
 * render matches the client's first render. After mount, a `useEffect` reads
 * localStorage and (if needed) flips state to `"base"`. This produces a brief
 * paint of Radix-flavoured install URL / Primitive icon before swapping —
 * accepted as the cost of avoiding SSR/CSR hydration mismatches, which would
 * otherwise corrupt SVG attribute trees (icons change shape between renders).
 */
export function BaseProvider({ children }: { children: ReactNode }) {
  const [base, setBaseState] = useState<Base>("radix");

  // After hydration, read persisted preference. Doing this in useEffect (not
  // useState's initializer) keeps the server and first-client renders aligned.
  useEffect(() => {
    try {
      const v = localStorage.getItem(STORAGE_KEY);
      if (v === "base") setBaseState("base");
    } catch {
      // localStorage may be unavailable (private mode); ignore.
    }
  }, []);

  const setBase = useCallback((b: Base) => {
    setBaseState(b);
    try {
      localStorage.setItem(STORAGE_KEY, b);
    } catch {
      // ignore
    }
  }, []);

  const value = useMemo(() => ({ base, setBase }), [base, setBase]);

  return <BaseContext.Provider value={value}>{children}</BaseContext.Provider>;
}

/** Returns the currently-selected primitive flavour and a setter. */
export function useBase(): BaseContextValue {
  const ctx = useContext(BaseContext);
  if (!ctx) {
    // Fallback: not wrapped in provider — return read-only Radix default.
    return { base: "radix", setBase: () => {} };
  }
  return ctx;
}

/**
 * Slugs of components that have both a Radix and a Base UI flavour.
 * Single source of truth lives in `./dual-flavor-slugs.mjs` so the postbuild
 * registry script (Node, mjs) can read the same list.
 */
export const DUAL_FLAVOR_SLUGS: Set<string> = new Set(DUAL_FLAVOR_SLUG_LIST);

/**
 * Slugs of single-source components whose registry deps include dual-flavour
 * components, so their install URL is flavour-specific too.
 */
export const FLAVOR_AWARE_SLUGS: Set<string> = new Set(FLAVOR_AWARE_SLUG_LIST);

/**
 * Build the full registry install URL for a given slug + currently-selected
 * base. For primitive-agnostic components (Badge, Table, etc.), the base is
 * ignored — there's only one source.
 */
export function installUrl(slug: string, base: Base): string {
  if (base === "base" && (DUAL_FLAVOR_SLUGS.has(slug) || FLAVOR_AWARE_SLUGS.has(slug))) {
    return `https://www.fluidfunctionalism.com/r/base/${slug}.json`;
  }
  return `https://www.fluidfunctionalism.com/r/${slug}.json`;
}
