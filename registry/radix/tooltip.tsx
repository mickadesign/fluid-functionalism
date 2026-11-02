"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import { motion, useMotionValue } from "motion/react";
import { cn } from "@/lib/utils";
import { spring, exitFallbackMs } from "@/lib/springs";
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
// Provider
// ---------------------------------------------------------------------------

const DEFAULT_DELAY = 200;

// Tracks whether an app-level <TooltipProvider> is above us. Each Tooltip
// only wraps itself in a local primitive Provider when there isn't one —
// a per-instance Provider would defeat cross-tooltip skip-delay grouping
// (moving between adjacent tooltips would re-wait the full delay). Radix's
// Root throws without a Provider, so the local fallback can't be dropped.
const TooltipGroupContext = createContext(false);

interface TooltipProviderProps {
  children: ReactNode;
  /** Hover delay before tooltips open, in ms. Defaults to 200. */
  delayDuration?: number;
  /** After a tooltip closes, adjacent tooltips opened within this window
   *  skip the hover delay, in ms. Defaults to 300. */
  skipDelayDuration?: number;
  /** Closes a tooltip as soon as the pointer leaves its trigger. By default
   *  the pointer may cross to the tooltip, and while it does, triggers in
   *  its path don't open theirs: set this for dense rows of short labels. */
  disableHoverableContent?: boolean;
}

/** Groups descendant Tooltips so that once one opens, moving to an adjacent
 *  trigger shows its tooltip instantly instead of re-waiting the full delay.
 *  Wrap once at the app (or section) level; bare Tooltips still work without
 *  it via a per-instance fallback. */
function TooltipProvider({
  children,
  delayDuration = DEFAULT_DELAY,
  skipDelayDuration = 300,
  disableHoverableContent,
}: TooltipProviderProps) {
  return (
    <TooltipGroupContext.Provider value={true}>
      <TooltipPrimitive.Provider
        delayDuration={delayDuration}
        skipDelayDuration={skipDelayDuration}
        disableHoverableContent={disableHoverableContent}
      >
        {children}
      </TooltipPrimitive.Provider>
    </TooltipGroupContext.Provider>
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
  /** Hover delay before this tooltip opens, in ms. Defaults to 200, or to the
   *  ambient TooltipProvider's delayDuration when one is present. */
  delayDuration?: number;
  className?: string;
  /** Extra classes for the portalled content element — Radix copies its
   *  z-index onto the popper wrapper, so pass a z utility here to lift the
   *  whole tooltip above other fixed layers (default z-50). */
  contentClassName?: string;
  /** When true, forces the tooltip open. When false, forces it closed. When undefined, uses default hover/focus behavior. */
  forceOpen?: boolean;
  /** Follow the cursor along one axis while hovering the trigger — for tall
   *  or wide triggers (the Sidebar rail) where a centered tooltip sits far
   *  from the pointer. The other axis stays anchored by `side`. */
  followCursor?: "x" | "y";
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
  delayDuration,
  className,
  contentClassName,
  forceOpen,
  onOpenChange: onOpenChangeProp,
  followCursor,
}: TooltipProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = forceOpen !== undefined ? forceOpen : internalOpen;
  const [mounted, setMounted] = useState(false);
  const shape = useShape();
  const portalContainer = useContext(TooltipPortalContainerContext);
  const hasAmbientProvider = useContext(TooltipGroupContext);

  // Set during the render that opens it, so the portal mounts in the same
  // commit as `open` rather than one after.
  if (open && !mounted) setMounted(true);

  // Fallback release for the deferred unmount: onAnimationComplete is the
  // primary signal, but rAF-driven animation callbacks can stall in
  // throttled/background tabs. The exit tween runs at spring.fast.exit, so
  // the fallback tracks that tier.
  useEffect(() => {
    if (open) return;
    const id = setTimeout(() => setMounted(false), exitFallbackMs(spring.fast));
    return () => clearTimeout(id);
  }, [open]);

  const handleExitComplete = () => {
    if (!open) setMounted(false);
  };

  // Cursor-follow offset from the trigger's center, driven as a motion value
  // so per-move updates skip React re-renders.
  const followOffset = useMotionValue(0);
  // A force-opened follow-cursor tooltip has no cursor to follow — it rests
  // centered on the trigger until a real pointer takes over.
  useEffect(() => {
    if (forceOpen && followCursor) followOffset.set(0);
  }, [forceOpen, followCursor, followOffset]);
  const handleFollowMove = (event: React.PointerEvent) => {
    if (!followCursor) return;
    const rect = event.currentTarget.getBoundingClientRect();
    followOffset.set(
      followCursor === "y"
        ? event.clientY - (rect.top + rect.height / 2)
        : event.clientX - (rect.left + rect.width / 2)
    );
  };

  const slideOffset = getSlideOffset(side);

  // An explicit delayDuration overrides the ambient provider's delay; left
  // undefined, the Root inherits it from the nearest provider.
  const tooltip = (
    <TooltipPrimitive.Root delayDuration={delayDuration} open={open} onOpenChange={(v) => { setInternalOpen(v); onOpenChangeProp?.(v); }}>
      <TooltipPrimitive.Trigger asChild onPointerMove={followCursor ? handleFollowMove : undefined}>
        {children}
      </TooltipPrimitive.Trigger>
      {mounted && (
        <TooltipPrimitive.Portal forceMount container={portalContainer ?? undefined}>
          <TooltipPrimitive.Content
            side={side}
            sideOffset={sideOffset}
            forceMount
            className={cn("z-50", contentClassName)}
          >
            <motion.div
              style={
                followCursor === "y"
                  ? { y: followOffset }
                  : followCursor === "x"
                    ? { x: followOffset }
                    : undefined
              }
            >
              <motion.div
                className={cn(
                  // Trim recenters the label; the padding bump only applies
                  // where text-box is supported, keeping the same overall
                  // height (~24px) as untrimmed browsers.
                  "bg-foreground text-background text-[length:var(--fs-caption,12px)] leading-[var(--lh-caption,16px)] px-2 py-1",
                  "[text-box:trim-both_cap_alphabetic] supports-[text-box:trim-both]:py-2",
                  shape.bg,
                  className
                )}
                style={{ fontVariationSettings: fontWeights.normal }}
                initial={{ opacity: 0, ...slideOffset }}
                animate={{
                  opacity: open ? 1 : 0,
                  x: 0,
                  y: 0,
                }}
                transition={open ? spring.fast : spring.fast.exit}
                onAnimationComplete={handleExitComplete}
              >
                {content}
              </motion.div>
            </motion.div>
          </TooltipPrimitive.Content>
        </TooltipPrimitive.Portal>
      )}
    </TooltipPrimitive.Root>
  );

  // Fallback: Radix's Root requires a Provider above it, so without an
  // ambient TooltipProvider each instance carries its own with the library's
  // default delay. Grouped skip-delay needs the shared app-level
  // TooltipProvider.
  if (hasAmbientProvider) return tooltip;

  return (
    <TooltipPrimitive.Provider delayDuration={delayDuration ?? DEFAULT_DELAY}>
      {tooltip}
    </TooltipPrimitive.Provider>
  );
}

export { Tooltip, TooltipPortalContainer, TooltipProvider };
export type { TooltipProps, TooltipProviderProps, TooltipSide };
