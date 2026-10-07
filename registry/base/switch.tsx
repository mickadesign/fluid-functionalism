"use client";

import {
  forwardRef,
  useRef,
  useState,
  useEffect,
  useCallback,
  useId,
  type HTMLAttributes,
} from "react";
import { motion, useMotionValue, animate, type Transition } from "framer-motion";
import { Switch as SwitchPrimitive } from "@base-ui/react/switch";
import { cn } from "@/lib/utils";
import { spring } from "@/lib/springs";
import { omit } from "@/lib/omit";
import { useSize, type SizeVariant } from "@/lib/size-context";

// ---------------------------------------------------------------------------
// Switch is a whole labeled row: a click anywhere on it toggles, and the thumb
// can be dragged across the track. The thumb's x lives in a motion value that
// the pointer writes directly during a drag and that springs to its resting
// spot otherwise. Hover stretches the thumb into a pill; press stretches it
// further and squashes it. `checked` is always owned by the parent: the
// switch never flips itself, it only calls onToggle.
// ---------------------------------------------------------------------------

interface SwitchProps extends HTMLAttributes<HTMLDivElement> {
  label: string;
  checked: boolean;
  /** Called by a click, the keyboard, or a drag released past the
   *  midpoint. Update `checked` here. */
  onToggle: () => void;
  disabled?: boolean;
  /** Overrides the thumb's spring (spring.moderate by default). */
  thumbTransition?: Transition;
  /** Pins the switch to one step of the size ladder.
   *  Omitted, it follows the surrounding SizeProvider. */
  size?: SizeVariant;
}

// Track/thumb geometry per ladder step. The hover pill-extend is the same 2px
// at both steps; only the press extend/squash scales down with the thumb, so the
// compact switch keeps the same feel.
const METRICS = {
  default: {
    trackWidth: 34,
    trackHeight: 20,
    thumbSize: 16,
    pillExtend: 2,
    pressExtend: 4,
    pressShrink: 4,
  },
  compact: {
    trackWidth: 28,
    trackHeight: 16,
    thumbSize: 12,
    pillExtend: 2,
    pressExtend: 3,
    pressShrink: 3,
  },
} as const;

// 2px between a resting thumb and every track edge: each track is its thumb
// plus 4 (20 = 16 + 4, 16 = 12 + 4), so the thumb sits centered.
const THUMB_OFFSET = 2;
// Pointer travel (px) before a press turns into a drag. Under it the
// gesture stays a click, so a tap that wobbles a pixel still toggles.
const DRAG_DEAD_ZONE = 2;

const Switch = forwardRef<HTMLDivElement, SwitchProps>(
  ({ label, checked, onToggle, disabled = false, thumbTransition, size, className, ...props }, ref) => {
    const labelId = useId();
    const hasMounted = useRef(false);
    const [hovered, setHovered] = useState(false);
    const [pressed, setPressed] = useState(false);
    const sizeClasses = useSize(size);
    const m = METRICS[sizeClasses.variant];
    const thumbTravel = m.trackWidth - m.thumbSize - THUMB_OFFSET * 2;

    // Drag refs (not state to avoid re-renders during drag)
    const dragging = useRef(false);
    // didDrag outlives the pointerup by one frame so the click fired by
    // the same release can be swallowed.
    const didDrag = useRef(false);
    // Non-null only while a press is in progress; move, up and cancel
    // ignore events without it.
    const pointerStart = useRef<{
      clientX: number;
      originX: number;
    } | null>(null);

    // The thumb's x is a motion value, not state: a drag writes it on every
    // pointermove without re-rendering, and springs pick up from wherever it
    // was left. It starts at the resting spot for `checked`, so a switch that
    // mounts on doesn't slide across.
    const motionX = useMotionValue(
      checked ? THUMB_OFFSET + thumbTravel : THUMB_OFFSET
    );

    useEffect(() => {
      hasMounted.current = true;
    }, []);

    // Thumb shape. Press wins over hover: +pillExtend wide on hover, +pressExtend wide
    // and pressShrink shorter on press, with y moved down by half the
    // shrink so the thumb squashes toward its own center line.
    const thumbWidth = pressed
      ? m.thumbSize + m.pressExtend
      : hovered
        ? m.thumbSize + m.pillExtend
        : m.thumbSize;
    const thumbHeight = pressed ? m.thumbSize - m.pressShrink : m.thumbSize;
    const thumbY = pressed ? THUMB_OFFSET + m.pressShrink / 2 : THUMB_OFFSET;
    // When checked, the extra width grows leftward (x backs off by extraWidth),
    // so the outer edge stays pinned 2px from the track end instead of
    // poking past it.
    const extraWidth = thumbWidth - m.thumbSize;
    const thumbX = checked
      ? THUMB_OFFSET + thumbTravel - extraWidth
      : THUMB_OFFSET;

    // Sync motionX when thumbX changes (hover, press, checked). Mid-drag the
    // pointer owns x, so this stands down; otherwise x springs on
    // thumbTransition, or spring.moderate by default.
    useEffect(() => {
      if (dragging.current) return;
      if (!hasMounted.current) {
        motionX.set(thumbX);
      } else {
        animate(motionX, thumbX, thumbTransition ?? spring.moderate);
      }
    }, [thumbX, motionX, thumbTransition]);

    // --- Pointer handlers ---

    const handlePointerDown = useCallback(
      (e: React.PointerEvent<HTMLDivElement>) => {
        if (disabled) return;
        if (e.pointerType === "mouse" && e.button !== 0) return;
        setPressed(true);
        dragging.current = false;
        didDrag.current = false;
        pointerStart.current = {
          clientX: e.clientX,
          // Start from where the thumb is now (even mid-spring), so the
          // first drag frame doesn't jump.
          originX: motionX.get(),
        };
        // Capture keeps move and up events on the row after the pointer
        // leaves it, so a drag can overshoot the track and still release.
        (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
      },
      [disabled, motionX]
    );

    const handlePointerMove = useCallback(
      (e: React.PointerEvent<HTMLDivElement>) => {
        if (!pointerStart.current) return;
        const delta = e.clientX - pointerStart.current.clientX;

        // Under the 2px dead zone this is still a click; past it, the thumb
        // follows the pointer 1:1.
        if (!dragging.current) {
          if (Math.abs(delta) < DRAG_DEAD_ZONE) return;
          dragging.current = true;
        }

        // Clamp with the pressed width (the thumb stays stretched for the
        // whole drag), so it never pokes past either end of the track.
        const dragMin = THUMB_OFFSET;
        const pressedThumbWidth = m.thumbSize + m.pressExtend;
        const dragMax = m.trackWidth - THUMB_OFFSET - pressedThumbWidth;
        const rawX = pointerStart.current.originX + delta;
        motionX.set(Math.max(dragMin, Math.min(dragMax, rawX)));
      },
      [motionX, m]
    );

    const handlePointerUp = useCallback(
      () => {
        if (!pointerStart.current) return;
        setPressed(false);

        if (dragging.current) {
          // The release that ends a drag still fires a click; the row's
          // onClick and the primitive's onCheckedChange both check didDrag,
          // so a drag never toggles twice.
          didDrag.current = true;
          dragging.current = false;

          const currentX = motionX.get();
          const dragMin = THUMB_OFFSET;
          const pressedThumbWidth = m.thumbSize + m.pressExtend;
          const dragMax = m.trackWidth - THUMB_OFFSET - pressedThumbWidth;
          const midpoint = (dragMin + dragMax) / 2;

          // Past the midpoint of the drag range means on, short of it means
          // off, whichever side the drag started from.
          const shouldBeOn = currentX > midpoint;

          // A side change toggles, and the parent's new `checked` moves
          // thumbX, so the sync effect springs on from where the drag let go.
          // On the same side thumbX may not change at all, so spring home here.
          if (shouldBeOn !== checked) {
            onToggle();
          } else {
            // Snap back to current resting position (un-pressed)
            const snapTarget = checked
              ? THUMB_OFFSET + thumbTravel
              : THUMB_OFFSET;
            animate(motionX, snapTarget, thumbTransition ?? spring.moderate);
          }

          requestAnimationFrame(() => {
            didDrag.current = false;
          });
        }

        pointerStart.current = null;
      },
      [checked, onToggle, motionX, thumbTransition, m, thumbTravel]
    );

    const handlePointerCancel = useCallback(
      () => {
        if (!pointerStart.current) return;
        setPressed(false);

        if (dragging.current) {
          dragging.current = false;
          // Gesture cancelled by the system: snap back without toggling
          const snapTarget = checked
            ? THUMB_OFFSET + thumbTravel
            : THUMB_OFFSET;
          animate(motionX, snapTarget, thumbTransition ?? spring.moderate);
        }

        pointerStart.current = null;
      },
      [checked, motionX, thumbTransition, thumbTravel]
    );

    return (
      <div
        ref={ref}
        className={cn(
          // The whole row is the pointer target. touch-none stops the browser
          // from claiming a horizontal drag as a scroll (which would cancel
          // it); select-none keeps a drag from selecting the label.
          "relative z-10 flex items-center cursor-pointer select-none touch-none",
          sizeClasses.gap,
          sizeClasses.px,
          sizeClasses.variant === "compact" ? "py-1" : "py-2",
          disabled && "opacity-50 pointer-events-none",
          className
        )}
        // Hover is mouse-only: a finger has no hover, so on touch the thumb
        // only ever takes the press shape.
        onPointerEnter={(e) => {
          if (e.pointerType === "mouse") setHovered(true);
        }}
        onPointerLeave={() => setHovered(false)}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
        // A click anywhere on the row, label included, toggles, unless it is
        // the click that ends a drag.
        onClick={() => {
          if (disabled || didDrag.current) return;
          onToggle();
        }}
        {...props}
      >
        {/* Switch */}
        <SwitchPrimitive.Root
          checked={checked}
          aria-labelledby={labelId}
          // Base UI passes (checked, eventDetails); narrow to () => void for our onToggle.
          onCheckedChange={() => {
            if (didDrag.current) return;
            onToggle();
          }}
          disabled={disabled}
          tabIndex={0}
          className={cn(
            "relative shrink-0 rounded-full outline-none cursor-pointer",
            "transition-colors duration-80",
            // Only on :focus-visible, so a click leaves no ring. The 2px
            // offset is filled with the background to part it from the track.
            "focus-visible:ring-1 focus-visible:ring-[color:var(--focus-ring,#6B97FF)] focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          )}
          style={{
            width: m.trackWidth,
            height: m.trackHeight,
            // On: #6B97FF, darkening to #5C89F2 on hover. Off: --accent, mixing
            // in 10% of the overlay color on hover (darker in light mode,
            // lighter in dark), crossfaded by transition-colors over 80ms.
            backgroundColor: checked
              ? hovered ? "#5C89F2" : "#6B97FF"
              : hovered
                ? "color-mix(in oklab, var(--accent), rgb(var(--overlay)) 10%)"
                : "var(--accent)",
          }}
          // The primitive toggles through onCheckedChange; stopping the click
          // here keeps the row's onClick from toggling a second time.
          onClick={(e) => e.stopPropagation()}
        >
          <SwitchPrimitive.Thumb
            // Renders Base UI's thumb as the motion.span. framer-motion claims
            // onDrag* and onAnimationStart for its own callbacks, so the DOM drag
            // and animation handlers are dropped before spreading the rest; Base
            // UI's style is kept and x is layered on top.
            render={(props) => {
              const { style: baseStyle, ...baseProps } =
                props as React.HTMLAttributes<HTMLSpanElement>;
              const rest = omit(baseProps, [
                "onDrag",
                "onDragStart",
                "onDragEnd",
                "onAnimationStart",
                "onAnimationEnd",
                "onAnimationIteration",
              ]);
              return (
                <motion.span
                  {...rest}
                  // Pinned to the top-left and placed only by the x and y transforms;
                  // width and height carry the hover and press shapes.
                  className="absolute top-0 left-0 block rounded-full bg-white shadow-sm"
                  initial={false}
                  style={{
                    ...(baseStyle as React.CSSProperties | undefined),
                    x: motionX,
                  }}
                  animate={{
                    y: thumbY,
                    width: thumbWidth,
                    height: thumbHeight,
                  }}
                  // Duration 0 on the first render (initial={false} already skips the
                  // entrance), then shape changes ride the same spring as x.
                  transition={hasMounted.current ? (thumbTransition ?? spring.moderate) : { duration: 0 }}
                />
              );
            }}
          />
        </SwitchPrimitive.Root>

        {/* Label */}
        <span
          id={labelId}
          className={cn(
            // text-box trim recenters the letterforms against the track; the
            // track is taller than the label, so layout doesn't change.
            "[text-box:trim-both_cap_alphabetic] transition-[color] duration-80",
            sizeClasses.text,
            // Brightens when on (muted → foreground over 80ms), so
            // on/off reads in the label as well as the track color.
            checked ? "text-foreground" : "text-muted-foreground"
          )}
        >
          {label}
        </span>
      </div>
    );
  }
);

Switch.displayName = "Switch";

export { Switch };
export type { SwitchProps };
