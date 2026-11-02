"use client";

import { useEffect, useRef } from "react";

import { useThemeContext } from "@/registry/default/lib/theme-context";
import { useShapeContext } from "@/lib/shape-context";
import { useSizeContext } from "@/lib/size-context";
import { useIconLibrary } from "@/lib/docs/icon-playground";
import { useBase } from "@/lib/base-context";
import { settingCookie, type SiteSettings } from "@/lib/docs/site-settings";
import { useAccent } from "@/lib/docs/accent";

/** Where the primitive choice lived before the settings moved to cookies. */
const LEGACY_BASE_KEY = "ff:base";

/**
 * Docs-site-only: writes each "Make them yours" setting to its cookie when it
 * changes, whether from the panel, a keyboard shortcut (T, R, S, I, A; F has its own writer in heading-font.tsx, and the custom accent its own in accent.tsx), or the
 * /demo settings slide. The root layout reads the cookies back on the next
 * request (see site-settings.ts). Mount once inside every settings provider.
 */
export function SettingsPersistence() {
  const { theme } = useThemeContext();
  const { shape } = useShapeContext();
  const { size } = useSizeContext();
  const { iconLibrary } = useIconLibrary();
  const { base, setBase } = useBase();
  const { preset: accent } = useAccent();

  const current: SiteSettings = { theme, shape, size, icons: iconLibrary, base, accent };
  // The values the server rendered: no write until one of them changes, so a
  // first visit sets no cookies at all.
  const written = useRef(current);

  useEffect(() => {
    const before = written.current;
    for (const key of Object.keys(current) as (keyof SiteSettings)[]) {
      if (current[key] === before[key]) continue;
      document.cookie = settingCookie(key, current[key] as never);
    }
    written.current = current;
  });

  // One-time move of the primitive choice out of localStorage. A cookie, once
  // written, wins, so this only runs for visitors who picked before the move.
  useEffect(() => {
    try {
      const legacy = localStorage.getItem(LEGACY_BASE_KEY);
      if (legacy === null) return;
      localStorage.removeItem(LEGACY_BASE_KEY);
      const hasCookie = document.cookie.split("; ").some((c) => c.startsWith("ff_base="));
      if (!hasCookie && (legacy === "radix" || legacy === "base")) setBase(legacy);
    } catch {
      // localStorage may be unavailable (private mode); nothing to move.
    }
  }, [setBase]);

  return null;
}
