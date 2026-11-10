"use client";

import { inKeyboardScope } from "@/lib/keyboard-scope";
import { useEffect } from "react";

import { useShapeContext } from "@/lib/shape-context";
import { SETTING_VALUES } from "@/lib/docs/site-settings";

// Cycles in the order the settings panel lists the shapes.
const shapeOrder = SETTING_VALUES.shape;

/**
 * Docs-site-only global shortcut: R cycles the radius variant. Mount once
 * inside ShapeProvider. Lives here (not in the installed shape-context) so
 * consumer apps never get a bare-keypress listener on document.
 */
export function ShapeShortcut() {
  const { shape, setShape } = useShapeContext();

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      // Keys typed in a preview belong to the component in it.
      if (inKeyboardScope(e.target)) return;
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
