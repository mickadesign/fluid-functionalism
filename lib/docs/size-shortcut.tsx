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
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || (e.target as HTMLElement)?.isContentEditable) return;
      e.preventDefault();
      setSize(size === "default" ? "compact" : "default");
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [size, setSize]);

  return null;
}
