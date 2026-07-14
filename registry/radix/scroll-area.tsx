"use client";

// Adapted from Lina by SameerJS6 (https://lina.sameer.sh) — lina-radix
// scroll-area. Changes from the original: Lina's gradient-only ScrollMask is
// dropped, the scrollbar is restyled to the shape system,
// and tw-animate-css visibility classes are swapped for a plain opacity
// transition. Falls back to native overflow scrolling on touch-primary devices.

import {
  createContext,
  forwardRef,
  useContext,
  useEffect,
  useRef,
  useState,
  type ComponentPropsWithoutRef,
  type ComponentRef,
} from "react";
import * as ScrollAreaPrimitive from "@radix-ui/react-scroll-area";
import { cn } from "@/lib/utils";
import { useShape } from "@/lib/shape-context";
import { useTouchPrimary } from "@/hooks/use-touch-primary";

// On touch-primary devices the Radix machinery is skipped entirely in favour
// of native overflow scrolling (better physics, momentum, rubber-banding);
// the context lets the exported ScrollBar no-op in that branch.
const ScrollAreaContext = createContext<boolean>(false);

// Whether the scrollbar should currently be shown (hovering the area or
// actively scrolling). Owned by ScrollArea rather than Radix's type="hover"
// machinery: Radix only reveals on hover (never on scroll) and stacks
// conditional Presence layers that fight
// the CSS fade. Default true so a standalone ScrollBar stays visible.
const ScrollbarVisibleContext = createContext<boolean>(true);

// How long the scrollbar lingers after the last scroll event before fading.
// Hover hide is
// immediate — the fade classes add their own 160ms grace.
const SCROLL_LINGER_MS = 600;

type Orientation = "vertical" | "horizontal" | "both";

interface ScrollAreaProps
  extends ComponentPropsWithoutRef<typeof ScrollAreaPrimitive.Root> {
  viewportClassName?: string;
  /** Which axes get scrollbars. Defaults to `"vertical"`. */
  orientation?: Orientation;
}

const ScrollArea = forwardRef<
  ComponentRef<typeof ScrollAreaPrimitive.Root>,
  ScrollAreaProps
>(
  (
    {
      className,
      children,
      // Swallowed: hide timing is owned by the fade classes + scroll linger
      // below, not Radix's hover machinery (see type="always" note).
      scrollHideDelay: _scrollHideDelay,
      viewportClassName,
      orientation = "vertical",
      ...props
    },
    ref
  ) => {
    const isTouch = useTouchPrimary();

    // Hover + scroll visibility, driving the scrollbar fade below. Scroll
    // reveals linger SCROLL_LINGER_MS after the last scroll event.
    const [hovering, setHovering] = useState(false);
    const [scrolling, setScrolling] = useState(false);
    const scrollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    useEffect(
      () => () => {
        if (scrollTimerRef.current) clearTimeout(scrollTimerRef.current);
      },
      []
    );
    const handleScroll = () => {
      setScrolling(true);
      if (scrollTimerRef.current) clearTimeout(scrollTimerRef.current);
      scrollTimerRef.current = setTimeout(() => setScrolling(false), SCROLL_LINGER_MS);
    };

    return (
      <ScrollAreaContext.Provider value={isTouch}>
        {isTouch ? (
          <div
            ref={ref}
            role="group"
            data-slot="scroll-area"
            aria-roledescription="scroll area"
            className={cn("relative overflow-hidden", className)}
            {...props}
          >
            <div
              data-slot="scroll-area-viewport"
              className={cn(
                "size-full rounded-[inherit]",
                orientation === "vertical" && "overflow-y-auto",
                orientation === "horizontal" && "overflow-x-auto",
                orientation === "both" && "overflow-auto",
                viewportClassName
              )}
              tabIndex={0}
            >
              {children}
            </div>
          </div>
        ) : (
          <ScrollbarVisibleContext.Provider value={hovering || scrolling}>
            <ScrollAreaPrimitive.Root
              ref={ref}
              data-slot="scroll-area"
              // type="always" keeps the scrollbar mounted whenever content
              // overflows; show/hide is OUR opacity fade (see ScrollBar), not
              // Radix's hover Presence — which never reveals on scroll and
              // unmounts through layers that a CSS transition can't outlive.
              type="always"
              onPointerEnter={() => setHovering(true)}
              onPointerLeave={() => setHovering(false)}
              className={cn("relative overflow-hidden", className)}
              {...props}
            >
              <ScrollAreaPrimitive.Viewport
                data-slot="scroll-area-viewport"
                onScroll={handleScroll}
                className={cn("size-full rounded-[inherit]", viewportClassName)}
              >
                {children}
              </ScrollAreaPrimitive.Viewport>
              {orientation !== "horizontal" && <ScrollBar orientation="vertical" />}
              {orientation !== "vertical" && <ScrollBar orientation="horizontal" />}
              {orientation === "both" && <ScrollAreaPrimitive.Corner />}
            </ScrollAreaPrimitive.Root>
          </ScrollbarVisibleContext.Provider>
        )}
      </ScrollAreaContext.Provider>
    );
  }
);

ScrollArea.displayName = "ScrollArea";

const ScrollBar = forwardRef<
  ComponentRef<typeof ScrollAreaPrimitive.ScrollAreaScrollbar>,
  ComponentPropsWithoutRef<typeof ScrollAreaPrimitive.ScrollAreaScrollbar>
>(({ className, orientation = "vertical", ...props }, ref) => {
  const isTouch = useContext(ScrollAreaContext);
  const visible = useContext(ScrollbarVisibleContext);
  const shape = useShape();

  if (isTouch) return null;

  return (
    <ScrollAreaPrimitive.ScrollAreaScrollbar
      ref={ref}
      orientation={orientation}
      data-slot="scroll-area-scrollbar"
      // Visibility is OUR hover/scroll state (ScrollbarVisibleContext), not
      // Radix's type="hover" machinery — which never reveals on scroll and
      // unmounts through Presence layers a CSS transition can't outlive.
      // data-visible drives the fade; Radix's own data-state stays "visible"
      // under the Root's type="always" and is ignored.
      data-visible={visible ? "" : undefined}
      // Scrollbar show/hide is plain CSS opacity matching the cue fade —
      // 160ms in, 120ms out (exits faster, per the animation guidelines);
      // spring tokens are framer-motion configs and don't apply here.
      className={cn(
        // The 10px track stays as a comfortable hit target; the thumb inside
        // it rests narrow and low-contrast, then widens + darkens on hover so
        // it gets out of the way until you reach for it.
        "group/scrollbar z-20 flex touch-none select-none",
        // Show immediately; on hide, wait out the 150ms thumb shrink before
        // fading so the thumb visibly narrows back first instead of the fade
        // masking it.
        "opacity-0 transition-opacity duration-120 ease-out delay-160",
        "data-[visible]:opacity-100 data-[visible]:duration-160 data-[visible]:delay-0",
        // Faded out = gone: the always-mounted track must not eat clicks or
        // hovers on content along the edge.
        "pointer-events-none data-[visible]:pointer-events-auto",
        orientation === "vertical" && "h-full w-2.5",
        orientation === "horizontal" && "h-2.5 w-full flex-col",
        className
      )}
      {...props}
    >
      <ScrollAreaPrimitive.ScrollAreaThumb
        data-slot="scroll-area-thumb"
        className={cn(
          // Fixed surface-relative overlay ramp (8 → 12 → 16%) — same tint
          // direction as the menu hover/active tokens, one notch stronger.
          "relative bg-[rgb(var(--overlay)/0.08)] transition-[background-color,width,height] duration-160 ease-in-out",
          "group-hover/scrollbar:bg-[rgb(var(--overlay)/0.12)] active:!bg-[rgb(var(--overlay)/0.16)]",
          shape.bg,
          // -translate nudges the thumb 2px off the container edge; the track
          // (and its 10px hit target) stays flush so edge-throws still land.
          orientation === "vertical" &&
            "mx-auto my-1 w-1 -translate-x-0.5 group-hover/scrollbar:w-1.5",
          orientation === "horizontal" &&
            "my-auto mx-1 h-1 -translate-y-0.5 group-hover/scrollbar:h-1.5"
        )}
      />
    </ScrollAreaPrimitive.ScrollAreaScrollbar>
  );
});

ScrollBar.displayName = "ScrollBar";

export { ScrollArea, ScrollBar };
export type { ScrollAreaProps };
