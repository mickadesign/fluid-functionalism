"use client";

import { useEffect } from "react";

import { useSizeContext } from "@/lib/size-context";

/**
 * Docs-site-only: mirrors the active size step onto `<html data-size>` so the
 * plain-CSS type-scale variables in globals.css (--fs-display … --fs-caption)
 * follow the ladder. Mount once inside the root SizeProvider, next to
 * SizeShortcut. Lives here (not in the installed size-context) so consumer
 * apps never get a document-level side effect.
 */
export function SizeAttribute() {
  const { size } = useSizeContext();

  useEffect(() => {
    document.documentElement.dataset.size = size;
    return () => {
      delete document.documentElement.dataset.size;
    };
  }, [size]);

  return null;
}
