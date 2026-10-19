"use client";

import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Base } from "./install-url";

export type { Base };

interface BaseContextValue {
  base: Base;
  setBase: (b: Base) => void;
}

const BaseContext = createContext<BaseContextValue | null>(null);

/**
 * Wraps the app and provides the currently selected primitive flavour
 * (Radix or Base UI). Default: "base".
 *
 * The selected flavour drives the install URL surfaced in DocPage and the
 * rendered code preview / live demo for primitive-touching components.
 *
 * The root layout passes the visitor's saved choice as `defaultBase` (read
 * from the `ff_base` cookie, written by SettingsPersistence), so the server
 * render already has the right flavour and nothing swaps after hydration.
 */
export function BaseProvider({
  children,
  defaultBase = "base",
}: {
  children: ReactNode;
  defaultBase?: Base;
}) {
  const [base, setBase] = useState<Base>(defaultBase);
  const value = useMemo(() => ({ base, setBase }), [base]);
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

// The flavour sets and installUrl live in a plain module so server code (the
// /docs/<slug>.md routes) can use them; re-exported here for client callers.
export {
  DUAL_FLAVOR_SLUGS,
  FLAVORED_SINGLE_SOURCE_SLUGS,
  installUrl,
} from "./install-url";
