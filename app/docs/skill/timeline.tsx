"use client";

import { useLayoutEffect, useRef, type ReactNode } from "react";
import { animate, motion, useMotionValue, type MotionValue } from "framer-motion";
import { cn } from "@/registry/default/lib/utils";
import { fontWeights } from "@/registry/default/lib/font-weight";
import { spring } from "@/registry/default/lib/springs";
import {
  useFluidHover,
  useRegisterFluidHoverItem,
} from "@/registry/default/hooks/use-fluid-hover";

// ---------------------------------------------------------------------------
// The "What it does" timeline: one continuous line from the top of the first
// title to the end of the last description. With a mouse there are no resting dots: ONE dot
// glides between steps with fluid hover on the fast spring, lighting the
// lines above and below it (each brightest at the dot, fading away from it)
// and bringing the step's title up to full strength. Touch screens, which
// cannot hover, show every dot instead.
// ---------------------------------------------------------------------------

/** The dot: 6px, like CarouselDots. */
const DOT = 6;
/** The title's line is 16px tall with its text starting 5px down, so its
 *  vertical center sits 13px below the step's top. The dot centers there. */
const TITLE_CENTER = 13;
const DOT_TOP = TITLE_CENTER - DOT / 2;
/** One axis for everything: the line's center, 4px in. The 1px line sits
 *  half a pixel either side of it; every dot centers on it. */
const AXIS = 4;
const LINE_LEFT = AXIS - 0.5;
const DOT_LEFT = AXIS - DOT / 2;
/** The highlight lines are drawn at this height and scaled to length, so the
 *  spring moves a transform, never layout. */
const LINE_BASE = 100;
/** The dot's size while hidden: it grows from nothing as it fades in, and
 *  shrinks back to nothing as it fades out. */
const DOT_HIDDEN_SCALE = 0;

const dotCenter = (top: number) => top + TITLE_CENTER;
/** Where the title's text starts inside a step, 8px above its center. The
 *  line begins here on the first step. */
const TITLE_TOP = TITLE_CENTER - 8;

export function Timeline({ steps }: { steps: Array<{ title: string; body: ReactNode }> }) {
  const listRef = useRef<HTMLOListElement>(null);
  const hover = useFluidHover(listRef);
  const { activeIndex, itemRects, isMeasured } = hover;

  const active = isMeasured && activeIndex !== null ? activeIndex : null;
  const centers = itemRects.map((r) => dotCenter(r.top));

  // A stretch of the line between two y positions.
  const segment = (from: number, to: number) => ({
    y: from,
    scaleY: Math.max(to - from, 0) / LINE_BASE,
  });
  // The highlight runs from the hovered dot's edge to the neighbor dots'
  // centers, over the one continuous line.
  // After the pointer leaves, the highlight fades out where it last was
  // instead of sliding back to the first step. (Writing the same value on
  // every render keeps this safe under StrictMode's double render.)
  const lastActive = useRef(0);
  if (active !== null) lastActive.current = active;
  const i = active ?? lastActive.current;
  // The line runs from the top of the first title to the end of the last
  // description, past the first and last dots.
  const first = itemRects[0];
  const last = itemRects[itemRects.length - 1];
  const lineStart = first ? first.top + TITLE_TOP : 0;
  const lineEnd = last ? last.top + last.height : 0;
  const above =
    centers[i] !== undefined
      ? segment(centers[i - 1] ?? lineStart, centers[i] - DOT / 2)
      : null;
  const below =
    centers[i] !== undefined
      ? segment(centers[i] + DOT / 2, centers[i + 1] ?? lineEnd)
      : null;
  const shown = active !== null;
  const dotY = centers[i] !== undefined ? centers[i] - DOT / 2 : 0;
  const aboveAt = above ?? { y: 0, scaleY: 0 };
  const belowAt = below ?? { y: 0, scaleY: 0 };

  // Positions live in motion values so they can jump or glide. While the
  // highlight is hidden they jump: it appears on the step you enter and
  // fades out where you left it, never sliding in from elsewhere. While it
  // shows, they glide on the fast spring. Layout effect: the jump lands
  // before the first visible frame.
  const dotYMv = useMotionValue(dotY);
  const aboveYMv = useMotionValue(aboveAt.y);
  const aboveSMv = useMotionValue(aboveAt.scaleY);
  const belowYMv = useMotionValue(belowAt.y);
  const belowSMv = useMotionValue(belowAt.scaleY);
  const wasShown = useRef(false);
  useLayoutEffect(() => {
    const glide = wasShown.current && shown;
    const moves: Array<[MotionValue<number>, number]> = [
      [dotYMv, dotY],
      [aboveYMv, aboveAt.y],
      [aboveSMv, aboveAt.scaleY],
      [belowYMv, belowAt.y],
      [belowSMv, belowAt.scaleY],
    ];
    const controls = moves.map(([mv, to]) => {
      if (glide) return animate(mv, to, spring.fast);
      mv.jump(to);
      return null;
    });
    wasShown.current = shown;
    return () => controls.forEach((c) => c?.stop());
  }, [shown, dotY, aboveAt.y, aboveAt.scaleY, belowAt.y, belowAt.scaleY, dotYMv, aboveYMv, aboveSMv, belowYMv, belowSMv]);

  return (
    // mt-2: 16px under the section title instead of the usual 8px, so the
    // heading doesn't crowd the line's first stretch.
    <ol ref={listRef} className="relative mt-2 flex flex-col" {...hover.handlers}>
      {/* One continuous line, from the top of the first title to the end
          of the last description. */}
      {centers.length > 0 && (
        <span
          aria-hidden
          className="pointer-events-none absolute top-0 w-px bg-border"
          style={{ left: LINE_LEFT, top: lineStart, height: lineEnd - lineStart }}
        />
      )}
      {/* The gliding highlight: dot, line above, line below. */}
      <motion.span
        aria-hidden
        className="pointer-events-none absolute top-0 z-10 rounded-full bg-foreground"
        style={{ left: DOT_LEFT, width: DOT, height: DOT, y: dotYMv }}
        // Scales up from 0 with the fade on the way in, and back down to 0 on
        // the way out, both on the fast spring. Leaving, the fade waits half
        // the spring so the shrink reads before the dot goes transparent.
        initial={{ opacity: 0, scale: DOT_HIDDEN_SCALE }}
        animate={{ opacity: shown ? 1 : 0, scale: shown ? 1 : DOT_HIDDEN_SCALE }}
        transition={{
          scale: spring.fast,
          opacity: shown ? spring.fast : { ...spring.fast, delay: spring.fast.duration / 2 },
        }}
      />
      <motion.span
        aria-hidden
        className="pointer-events-none absolute top-0 z-10 w-px origin-top bg-gradient-to-t from-muted-foreground/70 to-transparent"
        style={{ left: LINE_LEFT, height: LINE_BASE, y: aboveYMv, scaleY: aboveSMv }}
        initial={{ opacity: 0 }}
        animate={{ opacity: shown && above ? 1 : 0 }}
        transition={spring.fast}
      />
      <motion.span
        aria-hidden
        className="pointer-events-none absolute top-0 z-10 w-px origin-top bg-gradient-to-b from-muted-foreground/70 to-transparent"
        style={{ left: LINE_LEFT, height: LINE_BASE, y: belowYMv, scaleY: belowSMv }}
        initial={{ opacity: 0 }}
        animate={{ opacity: shown && below ? 1 : 0 }}
        transition={spring.fast}
      />
      {steps.map((step, index) => (
        <Step
          key={step.title}
          index={index}
          title={step.title}
          active={active === index}
          registerItem={hover.registerItem}
        >
          {step.body}
        </Step>
      ))}
    </ol>
  );
}

/** One step: its resting dot (touch only), then a title and description
 *  that rest at 70% and come up to full strength while the step is active.
 *  Steps touch (no gap) so the highlight never drops out. */
function Step({
  index,
  title,
  active,
  registerItem,
  children,
}: {
  index: number;
  title: string;
  active: boolean;
  registerItem: (index: number, element: HTMLElement | null) => void;
  children: ReactNode;
}) {
  const ref = useRef<HTMLLIElement>(null);
  useRegisterFluidHoverItem(registerItem, index, ref);
  return (
    <li ref={ref} className="relative pb-4 pl-6 last:pb-0">
      <span
        aria-hidden
        // Resting dots only where there is no hover (touch): with a mouse,
        // the one gliding dot is the only dot. Opaque, with a ring in the
        // page color, so each dot cleanly interrupts the line.
        className="absolute rounded-full bg-[color-mix(in_oklab,var(--muted-foreground)_50%,var(--background))] shadow-[0_0_0_3px_var(--background)] [@media(hover:hover)]:hidden"
        style={{ left: DOT_LEFT, top: DOT_TOP, width: DOT, height: DOT }}
      />
      <span
        className={cn(
          "text-body transition-colors duration-80",
          // Touch never hovers, so its titles stay at full strength.
          active ? "text-foreground" : "text-foreground/70 [@media(hover:none)]:text-foreground"
        )}
        style={{ fontVariationSettings: fontWeights.medium }}
      >
        {title}
      </span>
      <p
        className={cn(
          "mt-0.5 text-body leading-snug transition-colors duration-80",
          active
            ? "text-muted-foreground"
            : "text-muted-foreground/70 [@media(hover:none)]:text-muted-foreground"
        )}
      >
        {children}
      </p>
    </li>
  );
}
