"use client";

import {
  forwardRef,
  useRef,
  useState,
  useEffect,
  useCallback,
  type HTMLAttributes,
} from "react";
import { motion, useMotionValue, animate } from "framer-motion";
import * as SwitchPrimitive from "@radix-ui/react-switch";
import { cn } from "@/lib/utils";
import { springs } from "@/lib/springs";

interface SwitchProps extends HTMLAttributes<HTMLDivElement> {
  label: string;
  checked: boolean;
  onToggle: () => void;
  disabled?: boolean;
}

const TRACK_WIDTH = 34;
const TRACK_HEIGHT = 20;
const THUMB_SIZE = 16;
const THUMB_OFFSET = 2;
const THUMB_TRAVEL = TRACK_WIDTH - THUMB_SIZE - THUMB_OFFSET * 2;
const PILL_EXTEND = 2;
const PRESS_EXTEND = 4;
const PRESS_SHRINK = 4;
const DRAG_DEAD_ZONE = 2;

const Switch = forwardRef<HTMLDivElement, SwitchProps>(
  ({ label, checked, onToggle, disabled = false, className, ...props }, ref) => {
    const hasMounted = useRef(false);
    const [hovered, setHovered] = useState(false);
    const [pressed, setPressed] = useState(false);

    // Drag refs (not state to avoid re-renders during drag)
    const dragging = useRef(false);
    const didDrag = useRef(false);
    const pointerStart = useRef<{
      clientX: number;
      originX: number;
    } | null>(null);

    // Motion value for thumb x-axis
    const motionX = useMotionValue(
      checked ? THUMB_OFFSET + THUMB_TRAVEL : THUMB_OFFSET
    );

    useEffect(() => {
      hasMounted.current = true;
    }, []);

    // Compute thumb shape
    const thumbWidth = pressed
      ? THUMB_SIZE + PRESS_EXTEND
      : hovered
        ? THUMB_SIZE + PILL_EXTEND
        : THUMB_SIZE;
    const thumbHeight = pressed ? THUMB_SIZE - PRESS_SHRINK : THUMB_SIZE;
    const thumbY = pressed ? THUMB_OFFSET + PRESS_SHRINK / 2 : THUMB_OFFSET;
    const extraWidth = thumbWidth - THUMB_SIZE;
    const thumbX = checked
      ? THUMB_OFFSET + THUMB_TRAVEL - extraWidth
      : THUMB_OFFSET;

    // Sync motionX when thumbX changes (hover/press/checked) and not dragging
    useEffect(() => {
      if (dragging.current) return;
      if (!hasMounted.current) {
        motionX.set(thumbX);
      } else {
        animate(motionX, thumbX, springs.moderate);
      }
    }, [thumbX, motionX]);

    // --- KeyDown handlers

    const handleKeyDown = useCallback(
      (event: ReactKeyboardEvent<HTMLDivElement>) => {
        if (disabled) return;
        if (event.key !== "Enter" && event.key !== " ") return;

        event.preventDefault();
        handleToggle();
      },
      [disabled, handleToggle],
    );

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
          originX: motionX.get(),
        };
        (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
      },
      [disabled, motionX]
    );

    const handlePointerMove = useCallback(
      (e: React.PointerEvent<HTMLDivElement>) => {
        if (!pointerStart.current) return;
        const delta = e.clientX - pointerStart.current.clientX;

        if (!dragging.current) {
          if (Math.abs(delta) < DRAG_DEAD_ZONE) return;
          dragging.current = true;
        }

        const dragMin = THUMB_OFFSET;
        const pressedThumbWidth = THUMB_SIZE + PRESS_EXTEND;
        const dragMax = TRACK_WIDTH - THUMB_OFFSET - pressedThumbWidth;
        const rawX = pointerStart.current.originX + delta;
        motionX.set(Math.max(dragMin, Math.min(dragMax, rawX)));
      },
      [motionX]
    );

    const handlePointerUp = useCallback(
      () => {
        if (!pointerStart.current) return;
        setPressed(false);

        if (dragging.current) {
          didDrag.current = true;
          dragging.current = false;

          const currentX = motionX.get();
          const dragMin = THUMB_OFFSET;
          const pressedThumbWidth = THUMB_SIZE + PRESS_EXTEND;
          const dragMax = TRACK_WIDTH - THUMB_OFFSET - pressedThumbWidth;
          const midpoint = (dragMin + dragMax) / 2;

          const shouldBeOn = currentX > midpoint;

          if (shouldBeOn !== checked) {
            onToggle();
          } else {
            // Snap back to current resting position (un-pressed)
            const snapTarget = checked
              ? THUMB_OFFSET + THUMB_TRAVEL
              : THUMB_OFFSET;
            animate(motionX, snapTarget, springs.moderate);
          }

          requestAnimationFrame(() => {
            didDrag.current = false;
          });
        }

        pointerStart.current = null;
      },
      [checked, onToggle, motionX]
    );

    return (
      <div
        ref={ref}
        role="switch"
        tabIndex={disabled ? -1 : 0}
        aria-checked={checked}
        aria-disabled={disabled}
        className={cn(
          "relative z-10 flex items-center gap-2.5 px-3 py-2 cursor-pointer select-none touch-none",
          disabled && "opacity-50 pointer-events-none",
          className
        )}
        onPointerEnter={(e) => {
          if (e.pointerType === "mouse") setHovered(true);
        }}
        onPointerLeave={() => setHovered(false)}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerDown}
        onKeyDown={handleKeyDown}
        onClick={() => {
          if (disabled || didDrag.current) return;
          onToggle();
        }}
        {...props}
      >
        {/* Switch */}
        <SwitchPrimitive.Root
          checked={checked}
          onCheckedChange={() => {
            if (didDrag.current) return;
            onToggle();
          }}
          disabled={disabled}
          tabIndex={0}
          className={cn(
            "relative shrink-0 rounded-full outline-none cursor-pointer",
            "transition-colors duration-80",
            "focus-visible:ring-1 focus-visible:ring-[#6B97FF] focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          )}
          style={{
            width: TRACK_WIDTH,
            height: TRACK_HEIGHT,
            backgroundColor: checked
              ? hovered ? "#5C89F2" : "#6B97FF"
              : hovered
                ? "color-mix(in oklab, var(--accent), var(--foreground) 10%)"
                : "var(--accent)",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <SwitchPrimitive.Thumb asChild>
            <motion.span
              className="absolute top-0 left-0 block rounded-full bg-white shadow-sm"
              initial={false}
              style={{ x: motionX }}
              animate={{
                y: thumbY,
                width: thumbWidth,
                height: thumbHeight,
              }}
              transition={hasMounted.current ? springs.moderate : { duration: 0 }}
            />
          </SwitchPrimitive.Thumb>
        </SwitchPrimitive.Root>

        {/* Label */}
        <span
          className={cn(
            "text-[13px] transition-[color] duration-80",
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
