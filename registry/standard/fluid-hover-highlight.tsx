"use client";

import { useEffect } from "react";
import { cn } from "@/lib/utils";
import type { ItemRect, UseFluidHoverReturn } from "@/hooks/use-fluid-hover";

// ---------------------------------------------------------------------------
// Standard hover's highlight: a plain fill on the lit item. It appears and
// leaves with the pointer, with no travel between items and no fade. Same
// props as fluid hover's highlight, so components render it unchanged; the
// motion-only props (`from`, `fadeIn`, `transition`) are accepted and unused,
// and `onFrame` reports where the fill sits.
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
  /** Where the highlight is (container coordinates) and how opaque. Standard
   *  hover has no frames in between: it reports each rect it lands on, and
   *  opacity 0 when it leaves. */
  onFrame?: (box: { y: number; height: number; opacity: number }) => void;
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
  const shown = rect !== null;
  const y = rect?.top ?? 0;
  const height = rect?.height ?? 0;
  useEffect(() => {
    onFrame?.({ y, height, opacity: shown ? 1 : 0 });
  }, [onFrame, shown, y, height]);
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
    />
  );
}
