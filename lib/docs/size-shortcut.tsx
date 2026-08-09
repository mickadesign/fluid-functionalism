"use client";

import { useEffect } from "react";

import { useSizeContext } from "@/lib/size-context";

/**
 * Docs-site-only global shortcut: S toggles the size variant. Mount once
 * inside SizeProvider. Lives here (not in the installed size-context) so
 * consumer apps never get a bare-keypress listener on document.
 */
export function SizeShortcut() {
  const { size, setSize } = useSizeContext();

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "s" && e.key !== "S") return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const target = e.target as HTMLElement | null;
      if (
        target?.tagName === "INPUT" ||
        target?.tagName === "TEXTAREA" ||
        target?.isContentEditable
      )
        return;
      // Don't steal "s" from an open popup's typeahead ("System", "Sort by",
      // …) — select/menu/dialog content owns the key while it has focus.
      if (
        target?.closest(
          '[role="listbox"], [role="menu"], [role="dialog"], [role="combobox"], [role="option"]'
        )
      )
        return;
      e.preventDefault();
      setSize(size === "default" ? "compact" : "default");
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [size, setSize]);

  return null;
}
