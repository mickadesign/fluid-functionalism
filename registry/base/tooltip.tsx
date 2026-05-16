"use client";

import {
  createContext,
  useContext,
  useState,
  type ReactNode,
} from "react";
import { Tooltip as TooltipPrimitive } from "@base-ui/react/tooltip";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { springs } from "@/lib/springs";
import { fontWeights } from "@/lib/font-weight";
import { useShape } from "@/lib/shape-context";

// ---------------------------------------------------------------------------
// Portal container context
// ---------------------------------------------------------------------------

const TooltipPortalContainerContext = createContext<HTMLElement | null>(null);

function TooltipPortalContainer({
  value,
  children,
}: {
  value: HTMLElement | null;
  children: ReactNode;
}) {
  return (
    <TooltipPortalContainerContext.Provider value={value}>
      {children}
    </TooltipPortalContainerContext.Provider>
  );
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type TooltipSide = "top" | "right" | "bottom" | "left";

interface TooltipProps {
  content: ReactNode;
  children: React.ReactElement;
  side?: TooltipSide;
  sideOffset?: number;
  delayDuration?: number;
  className?: string;
  /** When true, forces the tooltip open. When false, forces it closed. When undefined, uses default hover/focus behavior. */
  forceOpen?: boolean;
  /** Called when the tooltip's internal open state changes (before forceOpen is applied). */
  onOpenChange?: (open: boolean) => void;
}

// ---------------------------------------------------------------------------
// Animation helpers
// ---------------------------------------------------------------------------

function getSlideOffset(side: TooltipSide) {
  switch (side) {
    case "top":
      return { y: 4 };
    case "bottom":
      return { y: -4 };
    case "left":
      return { x: 4 };
    case "right":
      return { x: -4 };
  }
}

// ---------------------------------------------------------------------------
// Tooltip
// ---------------------------------------------------------------------------

function Tooltip({
  content,
  children,
  side = "top",
  sideOffset = 8,
  delayDuration = 200,
  className,
  forceOpen,
  onOpenChange: onOpenChangeProp,
}: TooltipProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = forceOpen !== undefined ? forceOpen : internalOpen;
  const shape = useShape();
  const portalContainer = useContext(TooltipPortalContainerContext);

  const slideOffset = getSlideOffset(side);

  return (
    <TooltipPrimitive.Provider delay={delayDuration}>
      <TooltipPrimitive.Root
        open={open}
        onOpenChange={(v) => {
          setInternalOpen(v);
          onOpenChangeProp?.(v);
        }}
      >
        <TooltipPrimitive.Trigger render={children} />
        <TooltipPrimitive.Portal container={portalContainer ?? undefined}>
          <TooltipPrimitive.Positioner
            side={side}
            sideOffset={sideOffset}
            className="z-50"
          >
            <TooltipPrimitive.Popup
              render={(props, state) => {
                const exiting = state.transitionStatus === "ending";
                const {
                  style: baseStyle,
                  // motion.div has incompatible drag/animation event signatures —
                  // strip the React-DOM versions so they don't fight motion's own.
                  onDrag: _onDrag,
                  onDragStart: _onDragStart,
                  onDragEnd: _onDragEnd,
                  onAnimationStart: _onAnimationStart,
                  onAnimationEnd: _onAnimationEnd,
                  onAnimationIteration: _onAnimationIteration,
                  ...rest
                } = props as React.HTMLAttributes<HTMLDivElement>;
                return (
                  <motion.div
                    {...rest}
                    className={cn(
                      "bg-foreground text-background text-[12px] px-2 py-1",
                      shape.bg,
                      className
                    )}
                    style={{
                      ...(baseStyle as React.CSSProperties | undefined),
                      fontVariationSettings: fontWeights.medium,
                    }}
                    initial={{ opacity: 0, ...slideOffset }}
                    animate={
                      exiting
                        ? { opacity: 0, ...slideOffset }
                        : { opacity: 1, x: 0, y: 0 }
                    }
                    transition={exiting ? { duration: 0.1 } : springs.fast}
                  />
                );
              }}
            >
              {content}
            </TooltipPrimitive.Popup>
          </TooltipPrimitive.Positioner>
        </TooltipPrimitive.Portal>
      </TooltipPrimitive.Root>
    </TooltipPrimitive.Provider>
  );
}

export { Tooltip, TooltipPortalContainer };
export type { TooltipProps, TooltipSide };
