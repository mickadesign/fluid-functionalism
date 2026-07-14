"use client";

import { useEffect } from "react";

import { useShapeContext, shapeMap, type ShapeVariant } from "@/lib/shape-context";

const shapeOrder = Object.keys(shapeMap) as ShapeVariant[];

/**
 * Docs-site-only global shortcut: R cycles the radius variant. Mount once
 * inside ShapeProvider. Lives here (not in the installed shape-context) so
 * consumer apps never get a bare-keypress listener on document.
 */
export function ShapeShortcut() {
  const { shape, setShape } = useShapeContext();

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "r" && e.key !== "R") return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || (e.target as HTMLElement)?.isContentEditable) return;
      e.preventDefault();
      const idx = shapeOrder.indexOf(shape);
      setShape(shapeOrder[(idx + 1) % shapeOrder.length]);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [shape, setShape]);

  return null;
}
