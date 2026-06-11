"use client";

// Base UI flavour of the Fluid Functionalism scroll area. Same API and
// behaviour as the Radix flavour (registry/radix/scroll-area.tsx): shared
// scroll-fade cues, shape-system scrollbar, native overflow fallback on
// touch-primary devices. Scrollbar machinery adapted from Lina by SameerJS6
// (https://lina.sameer.sh); built on @base-ui/react/scroll-area, whose
// scrollbars stay mounted while scrollable and expose hover/scroll state as
// data attributes instead of Radix's show/hide presence animation.

import {
  createContext,
  forwardRef,
  useContext,
  useRef,
  type ComponentPropsWithoutRef,
  type ComponentRef,
} from "react";
import { ScrollArea as ScrollAreaPrimitive } from "@base-ui/react/scroll-area";
import { cn } from "@/lib/utils";
import { useShape } from "@/lib/shape-context";
import { useScrollEdges, ScrollEdgeCue } from "@/lib/scroll-fade";
import { useTouchPrimary } from "@/hooks/use-touch-primary";

// On touch-primary devices the Base UI machinery is skipped entirely in
// favour of native overflow scrolling (better physics, momentum,
// rubber-banding); the context lets the exported ScrollBar no-op there.
const ScrollAreaContext = createContext<boolean>(false);

type Orientation = "vertical" | "horizontal" | "both";

interface ScrollAreaProps extends ComponentPropsWithoutRef<"div"> {
  viewportClassName?: string;
  /** Surface-gradient + chevron cues at edges with more content. Auto-shows
   *  on overflow; set to `false` to disable. Defaults to `true`. */
  scrollFade?: boolean;
  /** Cue band size in px along the scroll axis. Defaults to 52. */
  cueSize?: number;
  /** Which axes get scrollbars and edge cues. Defaults to `"vertical"`. */
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
      viewportClassName,
      scrollFade = true,
      cueSize = 52,
      orientation = "vertical",
      ...props
    },
    ref
  ) => {
    const viewportRef = useRef<HTMLDivElement>(null);
    const isTouch = useTouchPrimary();
    const edges = useScrollEdges(viewportRef, {
      enabled: scrollFade,
      axis: orientation,
    });

    // Cues read the substrate surface from context — ScrollArea doesn't
    // elevate, so the gradient matches whatever background it sits on.
    const cues = scrollFade && (
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-10 overflow-hidden rounded-[inherit]"
      >
        {orientation !== "horizontal" && (
          <>
            <ScrollEdgeCue mode="absolute" edge="top" visible={edges.top} size={cueSize} />
            <ScrollEdgeCue mode="absolute" edge="bottom" visible={edges.bottom} size={cueSize} />
          </>
        )}
        {orientation !== "vertical" && (
          <>
            <ScrollEdgeCue mode="absolute" edge="left" visible={edges.left} size={cueSize} />
            <ScrollEdgeCue mode="absolute" edge="right" visible={edges.right} size={cueSize} />
          </>
        )}
      </div>
    );

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
              ref={viewportRef}
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
            {cues}
          </div>
        ) : (
          <ScrollAreaPrimitive.Root
            ref={ref}
            data-slot="scroll-area"
            className={cn("relative overflow-hidden", className)}
            {...props}
          >
            <ScrollAreaPrimitive.Viewport
              ref={viewportRef}
              data-slot="scroll-area-viewport"
              className={cn("size-full rounded-[inherit]", viewportClassName)}
            >
              {/* Content gives Base UI an intrinsic size to measure
                  horizontal overflow against. */}
              <ScrollAreaPrimitive.Content>
                {children}
              </ScrollAreaPrimitive.Content>
            </ScrollAreaPrimitive.Viewport>
            {cues}
            {orientation !== "horizontal" && <ScrollBar orientation="vertical" />}
            {orientation !== "vertical" && <ScrollBar orientation="horizontal" />}
            {orientation === "both" && <ScrollAreaPrimitive.Corner />}
          </ScrollAreaPrimitive.Root>
        )}
      </ScrollAreaContext.Provider>
    );
  }
);

ScrollArea.displayName = "ScrollArea";

const ScrollBar = forwardRef<
  ComponentRef<typeof ScrollAreaPrimitive.Scrollbar>,
  ComponentPropsWithoutRef<typeof ScrollAreaPrimitive.Scrollbar>
>(({ className, orientation = "vertical", ...props }, ref) => {
  const isTouch = useContext(ScrollAreaContext);
  const shape = useShape();

  if (isTouch) return null;

  return (
    <ScrollAreaPrimitive.Scrollbar
      ref={ref}
      orientation={orientation}
      data-slot="scroll-area-scrollbar"
      // Base UI keeps the scrollbar mounted while scrollable; visibility is
      // a plain opacity transition off its hover/scroll state attributes
      // (160ms, matching the cue fade — spring tokens are framer-motion
      // configs and don't apply here).
      className={cn(
        "absolute z-20 flex touch-none select-none p-px",
        "opacity-0 transition-opacity duration-160 ease-out",
        "data-[hovering]:opacity-100 data-[scrolling]:opacity-100",
        "hover:bg-hover",
        orientation === "vertical" &&
          "top-0 right-0 h-full w-2.5 border-l border-l-transparent",
        orientation === "horizontal" &&
          "bottom-0 left-0 w-full h-2.5 flex-col border-t border-t-transparent",
        className
      )}
      {...props}
    >
      <ScrollAreaPrimitive.Thumb
        data-slot="scroll-area-thumb"
        className={cn(
          "relative origin-center bg-border transition-[scale]",
          shape.bg,
          orientation === "vertical" &&
            "w-full h-[var(--scroll-area-thumb-height)] my-1 active:scale-y-95",
          orientation === "horizontal" &&
            "h-full w-[var(--scroll-area-thumb-width)] active:scale-x-[0.98]"
        )}
      />
    </ScrollAreaPrimitive.Scrollbar>
  );
});

ScrollBar.displayName = "ScrollBar";

export { ScrollArea, ScrollBar };
export type { ScrollAreaProps };
