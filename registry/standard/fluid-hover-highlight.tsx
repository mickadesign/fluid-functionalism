"use client";

import { useLayoutEffect, useRef, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import type { ItemRect, UseFluidHoverReturn } from "@/hooks/use-fluid-hover";

// ---------------------------------------------------------------------------
// Standard hover's highlight: a plain fill on the lit item. It appears and
// leaves with the pointer, with no travel between items and no fade. Same
// props as fluid hover's highlight, so components render it unchanged; the
// motion-only props (`from`, `fadeIn`, `transition`) are accepted and unused.
//
//   const hover = useFluidHover(ref);
//   <FluidHoverHighlight hover={hover} className={shape.bg} />
// ---------------------------------------------------------------------------

/** What the highlight reads off the hook. */
export type FluidHoverSource = Pick<
  UseFluidHoverReturn,
  "activeIndex" | "itemRects" | "isMeasured" | "session"
>;

interface HighlightFromHook {
  /** The hook's return value. The highlight sits on
   *  `itemRects[activeIndex]` once `isMeasured`. */
  hover: FluidHoverSource;
  /** Keep the list's state but show nothing (a closed popup). */
  hidden?: boolean;
  rect?: never;
  session?: never;
}

interface HighlightFromRect {
  /** For lists that resolve their own rect: the rect to sit on, in the
   *  container's coordinate space. `null` hides the highlight. */
  rect: ItemRect | null;
  session: number;
  hover?: never;
  hidden?: never;
}

export type FluidHoverHighlightProps = (HighlightFromHook | HighlightFromRect) & {
  /** Unused by standard hover (nothing travels). */
  from?: ItemRect | null;
  /** Unused by standard hover (nothing fades). */
  fadeIn?: boolean;
  /** Radius, z-index, anything else. Merged onto
   *  `absolute bg-hover pointer-events-none`. */
  className?: string;
  /** Unused by standard hover (nothing travels). */
  transition?: unknown;
  /** Where the fill is, each time it moves or goes (opacity 0): for what
   *  must sit with it from outside (a table's fill over frozen columns).
   *  Fluid hover reports every frame of its glide; here, each change. */
  onFrame?: (box: { y: number; height: number; opacity: number }) => void;
  /** Sits on the fill, positioned against it. */
  children?: ReactNode;
};

export function FluidHoverHighlight(props: FluidHoverHighlightProps) {
  let rect: ItemRect | null;
  if (props.hover) {
    const { activeIndex, itemRects, isMeasured } = props.hover;
    rect =
      !props.hidden && isMeasured && activeIndex !== null
        ? (itemRects[activeIndex] ?? null)
        : null;
  } else rect = props.rect;
  const { onFrame } = props;
  const top = rect?.top ?? null;
  const height = rect?.height ?? null;
  // The last place it was, so "gone" is reported where it left from.
  const last = useRef({ y: 0, height: 0 });
  useLayoutEffect(() => {
    if (!onFrame) return;
    if (top !== null && height !== null) last.current = { y: top, height };
    onFrame({ ...last.current, opacity: top === null ? 0 : 1 });
  }, [onFrame, top, height]);
  if (!rect) return null;
  return (
    <div
      data-slot="fluid-hover-highlight"
      className={cn("pointer-events-none absolute left-0 top-0 bg-hover", props.className)}
      style={{
        transform: `translate(${rect.left}px, ${rect.top}px)`,
        width: rect.width,
        height: rect.height,
      }}
    >
      {props.children}
    </div>
  );
}
