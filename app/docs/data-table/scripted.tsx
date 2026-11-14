"use client";

import { useEffect, useState, type RefObject } from "react";
import { createPortal } from "react-dom";
import { FakeCursor, type Cursor } from "@/app/docs/skill/hero-shared";

// The scripted cursor for this page's demos, as the skill page plays its
// examples: usePlayback / useLoop / useScriptCursor from hero-shared, drawn
// here over the page rather than inside the demo. A drag lifts its ghost
// into a layer above the page (portalled to body), and a cursor inside the
// preview's own stacking context would pass under it.

/** How long a glide takes (hero-shared's GLIDE_MS), for steps timed here. */
export const GLIDE = 500;

/** The cursor, in a box laid exactly over `rootRef` in the page's own
 *  coordinates: it scrolls with the page, and is placed again when the
 *  page's layout changes. */
export function CursorLayer({
  rootRef,
  cursor,
  playing,
}: {
  rootRef: RefObject<HTMLElement | null>;
  cursor: Cursor;
  /** The script's cursor steps aside while a visitor's own is in the demo. */
  playing: boolean;
}) {
  const [at, setAt] = useState<{ left: number; top: number } | null>(null);
  // An effect, not a layout effect: this renders inside the root, and a
  // child's layout effects run before its parent's ref is attached.
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const place = () => {
      const r = root.getBoundingClientRect();
      const next = { left: r.left + window.scrollX, top: r.top + window.scrollY };
      setAt((old) => (old && old.left === next.left && old.top === next.top ? old : next));
    };
    place();
    // Anything above the demo changing height moves it down the page.
    const observer = new ResizeObserver(place);
    observer.observe(document.body);
    observer.observe(root);
    window.addEventListener("resize", place);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", place);
    };
  }, [rootRef]);
  if (!at) return null;
  return createPortal(
    <div
      aria-hidden
      className="pointer-events-none absolute z-[calc(var(--z-popover,60)+1)] size-0 transition-opacity duration-150"
      style={{ ...at, opacity: playing ? 1 : 0 }}
    >
      <FakeCursor x={cursor.x} y={cursor.y} scale={cursor.scale} opacity={cursor.opacity} />
    </div>,
    document.body
  );
}

/** The steps of one scripted drag: glide to `from` and rest on it, press,
 *  carry to `to` (off its center by `offset`, which picks the side it
 *  drops on), let go, then hold `holdMs` on the result. */
export function dragSteps(
  cursor: Cursor,
  from: string,
  to: string,
  offset: { x?: number; y?: number },
  holdMs: number
) {
  return [
    { ms: GLIDE + 450, run: () => cursor.goto(from) },
    { ms: 250, run: () => cursor.press() },
    { ms: GLIDE + 350, run: () => cursor.goto(to, 0, offset) },
    { ms: holdMs, run: () => cursor.release() },
  ];
}
