"use client";

import {
  createContext,
  useContext,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { flushSync } from "react-dom";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import {
  animate,
  motion,
  motionValue,
  useMotionValue,
  useReducedMotion,
  type MotionValue,
} from "motion/react";
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
   *  whole tooltip above other fixed layers (default: the --z-tooltip step, 70). */
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

// The bubble's label: inverted text at caption size. Trim recenters it; the
// padding bump only applies where text-box is supported, keeping the same
// overall height (~24px) as untrimmed browsers.
const bubbleText =
  "text-background text-[length:var(--fs-caption,12px)] leading-[var(--lh-caption,16px)] px-2 py-1 [text-box:trim-both_cap_alphabetic] supports-[text-box:trim-both]:py-2";

// ---------------------------------------------------------------------------
// TooltipGroup
// ---------------------------------------------------------------------------

// How long a grouped tooltip stays up after it closes, so the pointer can
// cross the gap to a neighbor without the bubble blinking out.
const GROUP_HOLD_MS = 150;

/** The bubble a group is showing: what the next one takes over from. */
interface GroupEntry {
  shape: HTMLElement;
  content: () => ReactNode;
  isOpen: () => boolean;
  release: () => void;
}

interface GroupStore {
  get: () => GroupEntry | null;
  set: (entry: GroupEntry | null) => void;
}

function createGroupStore(): GroupStore {
  let shown: GroupEntry | null = null;
  return {
    get: () => shown,
    set: (entry) => {
      shown = entry;
    },
  };
}

const TooltipGroupStoreContext = createContext<GroupStore | null>(null);

interface TooltipGroupProps {
  children: ReactNode;
  /** Hover delay before the first tooltip opens, in ms. Defaults to 200. */
  delayDuration?: number;
  /** After a tooltip closes, the others in the group opened within this
   *  window skip the hover delay, in ms. Defaults to 300. */
  skipDelayDuration?: number;
}

function createBubbleValues() {
  return {
    opacity: motionValue(0),
    slide: motionValue(0),
    left: motionValue(0),
    right: motionValue(0),
    top: motionValue(0),
    bottom: motionValue(0),
    rideX: motionValue(0),
    rideY: motionValue(0),
    label: motionValue(1),
    previous: motionValue(0),
  };
}

type BubbleTransition = { type?: "spring"; duration: number; bounce?: number };

// A grouped tooltip's bubble. The first one in enters like any tooltip. One
// that opens while a neighbor's is still up starts from that bubble's shape
// and glides to its own: each tooltip keeps its own popup, placed by the
// primitive, and the dark shape and the label are handed from one to the
// next, so the row reads as a single bubble.
function GroupBubble({
  store,
  open,
  content,
  side,
  className,
  onExited,
}: {
  store: GroupStore;
  open: boolean;
  content: ReactNode;
  side: TooltipSide;
  className?: string;
  onExited: () => void;
}) {
  const shape = useShape();
  const reduceMotion = useReducedMotion();
  const boxRef = useRef<HTMLDivElement>(null);
  const shapeRef = useRef<HTMLDivElement>(null);
  const [previous, setPrevious] = useState<ReactNode>(null);
  const [mv] = useState(createBubbleValues);
  const latest = useRef({ open, content, side, reduceMotion, onExited });
  const live = useRef<{
    entry: GroupEntry | null;
    runs: { stop: () => void }[];
    hold?: ReturnType<typeof setTimeout>;
    released: boolean;
  }>({ entry: null, runs: [], released: false });

  useLayoutEffect(() => {
    latest.current = { open, content, side, reduceMotion, onExited };
  });

  useLayoutEffect(() => {
    const box = boxRef.current;
    const shapeEl = shapeRef.current;
    if (!box || !shapeEl || inDescriptionCopy(box)) return;
    const state = live.current;

    const settle = () => {
      clearTimeout(state.hold);
      for (const run of state.runs) run.stop();
      state.runs = [];
    };
    const play = (
      value: MotionValue<number>,
      to: number,
      transition: BubbleTransition,
      onComplete?: () => void
    ) => {
      state.runs.push(animate(value, to, { ...transition, onComplete }));
    };

    const me = (state.entry ??= {
      shape: shapeEl,
      content: () => latest.current.content,
      isOpen: () => latest.current.open,
      // The next bubble took this one's place: gone at once, no fade.
      release: () => {
        settle();
        state.released = true;
        mv.opacity.set(0);
        latest.current.onExited();
      },
    });

    // The tooltip's own entrance: fade in, 4px toward the trigger.
    const enter = () => {
      const { side: from, reduceMotion: still } = latest.current;
      for (const value of [mv.left, mv.right, mv.top, mv.bottom, mv.rideX, mv.rideY]) {
        value.set(0);
      }
      mv.label.set(1);
      mv.previous.set(0);
      mv.slide.set(still ? 0 : from === "top" || from === "left" ? 4 : -4);
      play(mv.slide, 0, spring.fast);
      play(mv.opacity, 1, spring.fast);
    };

    // Start as the bubble being replaced, then spring to this one's own box.
    // Insets move the shape (a scale would bend its corners), the labels ride
    // its center and crossfade.
    const glide = (from: GroupEntry) => {
      const a = from.shape.getBoundingClientRect();
      const previousContent = from.content();
      from.release();
      const b = box.getBoundingClientRect();
      // Client rects are in screen pixels; a scaled ancestor shrinks them.
      const scale = b.width / box.offsetWidth || 1;
      flushSync(() => setPrevious(previousContent));
      const moves: [MotionValue<number>, number][] = [
        [mv.left, (a.left - b.left) / scale],
        [mv.right, (b.right - a.right) / scale],
        [mv.top, (a.top - b.top) / scale],
        [mv.bottom, (b.bottom - a.bottom) / scale],
        [mv.rideX, (a.left + a.right - b.left - b.right) / 2 / scale],
        [mv.rideY, (a.top + a.bottom - b.top - b.bottom) / 2 / scale],
      ];
      for (const [value, start] of moves) {
        if (latest.current.reduceMotion) {
          value.set(0);
        } else {
          value.set(start);
          play(value, 0, spring.fast);
        }
      }
      mv.slide.set(0);
      mv.opacity.set(1);
      mv.label.set(0);
      play(mv.label, 1, spring.fast);
      mv.previous.set(1);
      play(mv.previous, 0, spring.fast.exit, () => setPrevious(null));
    };

    const exit = () => {
      // A neighbor that opens from here on enters on its own.
      if (store.get() === me) store.set(null);
      play(mv.opacity, 0, spring.fast.exit, () => {
        if (!latest.current.open) latest.current.onExited();
      });
    };

    if (open) {
      settle();
      state.released = false;
      const shown = store.get();
      if (!shown) {
        enter();
        store.set(me);
        return;
      }
      if (shown === me) {
        // Reopened during its own hold: it never left.
        play(mv.slide, 0, spring.fast);
        play(mv.opacity, 1, spring.fast);
        return;
      }
      // A neighbor is showing. Stay hidden until the primitive has placed
      // this popup (a microtask after the commit), then take over from it.
      mv.opacity.set(0);
      const frame = requestAnimationFrame(() => {
        const from = store.get();
        store.set(me);
        if (from && from !== me && !from.isOpen() && from.shape.isConnected) {
          glide(from);
        } else {
          enter();
        }
      });
      return () => cancelAnimationFrame(frame);
    }

    if (state.released) return;
    if (store.get() !== me) {
      exit();
      return;
    }
    state.hold = setTimeout(exit, GROUP_HOLD_MS);
    return () => clearTimeout(state.hold);
  }, [open, store, mv]);

  useEffect(() => {
    const state = live.current;
    return () => {
      clearTimeout(state.hold);
      for (const run of state.runs) run.stop();
      if (state.entry && store.get() === state.entry) store.set(null);
    };
  }, [store]);

  const label = cn(bubbleText, "relative", className);

  return (
    <motion.div
      ref={boxRef}
      className="relative"
      style={{
        opacity: mv.opacity,
        ...(side === "top" || side === "bottom"
          ? { y: mv.slide }
          : { x: mv.slide }),
      }}
    >
      <motion.div
        ref={shapeRef}
        className={cn("absolute bg-foreground", shape.bg)}
        style={{
          left: mv.left,
          right: mv.right,
          top: mv.top,
          bottom: mv.bottom,
        }}
      />
      <motion.div
        className={label}
        style={{
          fontVariationSettings: fontWeights.normal,
          x: mv.rideX,
          y: mv.rideY,
          opacity: mv.label,
        }}
      >
        {content}
      </motion.div>
      {previous != null && (
        <motion.div
          aria-hidden
          className={cn(
            label,
            "pointer-events-none absolute left-1/2 top-1/2 w-max -translate-x-1/2 -translate-y-1/2"
          )}
          style={{
            fontVariationSettings: fontWeights.normal,
            x: mv.rideX,
            y: mv.rideY,
            opacity: mv.previous,
          }}
        >
          {previous}
        </motion.div>
      )}
    </motion.div>
  );
}

// Radix renders a tooltip's children a second time, in the visually hidden
// copy aria-describedby points at. That copy holds no bubble to animate.
const inDescriptionCopy = (el: HTMLElement) =>
  el.closest('[role="tooltip"]') !== null;

/** One fluid tooltip for a row of triggers: the first opens after the delay,
 *  then the bubble glides from trigger to trigger, changing width and label,
 *  instead of closing and reopening. Wrap the row; the Tooltips inside are
 *  written as usual. */
function TooltipGroup({
  children,
  delayDuration = DEFAULT_DELAY,
  skipDelayDuration = 300,
}: TooltipGroupProps) {
  const [store] = useState(createGroupStore);
  return (
    <TooltipGroupStoreContext.Provider value={store}>
      {/* A hoverable bubble keeps the triggers in the pointer's path from
          opening theirs, so in a group it closes with its trigger. */}
      <TooltipProvider
        delayDuration={delayDuration}
        skipDelayDuration={skipDelayDuration}
        disableHoverableContent
      >
        {children}
      </TooltipProvider>
    </TooltipGroupStoreContext.Provider>
  );
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
  const groupStore = useContext(TooltipGroupStoreContext);

  // Set during the render that opens it, so the portal mounts in the same
  // commit as `open` rather than one after.
  if (open && !mounted) setMounted(true);

  // Fallback release for the deferred unmount: onAnimationComplete is the
  // primary signal, but rAF-driven animation callbacks can stall in
  // throttled/background tabs. The exit tween runs at spring.fast.exit, so
  // the fallback tracks that tier. In a group the bubble first holds.
  const exitMs = exitFallbackMs(spring.fast) + (groupStore ? GROUP_HOLD_MS : 0);
  useEffect(() => {
    if (open) return;
    const id = setTimeout(() => setMounted(false), exitMs);
    return () => clearTimeout(id);
  }, [open, exitMs]);

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
            // Radix sizes a wrapper around the content, and a class can't
            // reach it. A grouped bubble that caught the pointer would cover
            // the trigger above it in a grid or a stacked toolbar.
            ref={(node) => {
              if (groupStore && node?.parentElement) {
                node.parentElement.style.pointerEvents = "none";
              }
            }}
            className={cn(
              "z-[var(--z-tooltip,70)]",
              groupStore && "pointer-events-none",
              contentClassName
            )}
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
              {groupStore ? (
                <GroupBubble
                  store={groupStore}
                  open={open}
                  content={content}
                  side={side}
                  className={className}
                  onExited={handleExitComplete}
                />
              ) : (
                <motion.div
                  className={cn(
                    "bg-foreground",
                    bubbleText,
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
              )}
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

export { Tooltip, TooltipGroup, TooltipPortalContainer, TooltipProvider };
export type {
  TooltipGroupProps,
  TooltipProps,
  TooltipProviderProps,
  TooltipSide,
};
