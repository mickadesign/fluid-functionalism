"use client";

import {
  forwardRef,
  useRef,
  useState,
  useEffect,
  useCallback,
  type HTMLAttributes,
} from "react";
import {
  motion,
  useMotionValue,
  useTransform,
  animate,
  AnimatePresence,
  type MotionValue,
} from "framer-motion";
import * as SliderPrimitive from "@radix-ui/react-slider";
import { cn } from "@/lib/utils";
import { springs } from "@/lib/springs";
import { fontWeights } from "@/lib/font-weight";
import { useShape } from "@/lib/shape-context";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type SliderValue = number | [number, number];
type ValuePosition = "left" | "right" | "top" | "bottom" | "tooltip";

interface SliderProps
  extends Omit<HTMLAttributes<HTMLDivElement>, "onChange" | "defaultValue"> {
  value: SliderValue;
  onChange: (value: SliderValue) => void;
  min?: number;
  max?: number;
  step?: number;
  showSteps?: boolean;
  showValue?: boolean;
  valuePosition?: ValuePosition;
  formatValue?: (v: number) => string;
  label?: string;
  disabled?: boolean;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const THUMB_SIZE = 18;
const THUMB_SIZE_REST = 14;
const TRACK_HEIGHT = 6;
const DOT_SIZE = 4;
const PIP_SIZE = 5;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function valueToPixel(
  v: number,
  min: number,
  max: number,
  trackWidth: number
): number {
  if (max === min) return 0;
  const usable = trackWidth - THUMB_SIZE;
  return ((v - min) / (max - min)) * usable;
}

function pixelToValue(
  px: number,
  min: number,
  max: number,
  step: number,
  trackWidth: number
): number {
  const usable = trackWidth - THUMB_SIZE;
  if (usable <= 0) return min;
  const raw = (px / usable) * (max - min) + min;
  const snapped = Math.round((raw - min) / step) * step + min;
  return Math.max(min, Math.min(max, snapped));
}

function toRadixValue(value: SliderValue): number[] {
  return Array.isArray(value) ? value : [value];
}

// ---------------------------------------------------------------------------
// ValueDisplay (internal)
// ---------------------------------------------------------------------------

interface ValueDisplayProps {
  values: number[];
  editingIndex: number | null;
  onStartEdit: (index: number) => void;
  onCommitEdit: (index: number, v: number) => void;
  onCancelEdit: () => void;
  min: number;
  max: number;
  step: number;
  formatValue: (v: number) => string;
  label?: string;
  isRange: boolean;
  isInteracting: boolean;
}

function ValueDisplay({
  values,
  editingIndex,
  onStartEdit,
  onCommitEdit,
  onCancelEdit,
  min,
  max,
  step,
  formatValue,
  label,
  isRange,
  isInteracting,
}: ValueDisplayProps) {
  const shape = useShape();
  const [inputValue, setInputValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editingIndex !== null) {
      setInputValue(String(values[editingIndex]));
      requestAnimationFrame(() => inputRef.current?.select());
    }
  }, [editingIndex, values]);

  const commitEdit = useCallback(
    (index: number) => {
      const parsed = parseFloat(inputValue);
      if (!isNaN(parsed)) {
        const clamped = Math.max(min, Math.min(max, parsed));
        const snapped = Math.round((clamped - min) / step) * step + min;
        onCommitEdit(index, snapped);
      } else {
        onCancelEdit();
      }
    },
    [inputValue, min, max, step, onCommitEdit, onCancelEdit]
  );

  const renderValue = (index: number) => {
    if (editingIndex === index) {
      return (
        <span className="inline-grid text-[13px]">
          {/* Ghost for layout stability — widest possible value */}
          <span
            className="col-start-1 row-start-1 invisible"
            style={{ fontVariationSettings: fontWeights.medium }}
            aria-hidden="true"
          >
            {label ? `${label}: ` : ""}
            {formatValue(max)}
          </span>
          <span className="col-start-1 row-start-1 flex items-center gap-1">
            {label && (
              <span className="text-muted-foreground">{label}:</span>
            )}
            <input
              ref={inputRef}
              type="number"
              value={inputValue}
              min={min}
              max={max}
              step={step}
              onChange={(e) => setInputValue(e.target.value)}
              onBlur={() => commitEdit(index)}
              onKeyDown={(e) => {
                if (e.key === "Enter") commitEdit(index);
                if (e.key === "Escape") onCancelEdit();
              }}
              aria-label={`Edit slider value${isRange ? (index === 0 ? " (start)" : " (end)") : ""}`}
              className={cn(
                "w-[5ch] bg-transparent text-foreground outline-none border-b border-border text-center",
                shape.input
              )}
              style={{ fontVariationSettings: fontWeights.medium }}
            />
          </span>
        </span>
      );
    }

    return (
      <span
        className="cursor-text select-none"
        onClick={() => onStartEdit(index)}
      >
        {formatValue(values[index])}
      </span>
    );
  };

  // Measure widest possible formatted value for stable column width
  const widestText = isRange
    ? `${formatValue(max)} — ${formatValue(max)}`
    : formatValue(max);
  const charCount = (label ? `${label}: ` : "").length + widestText.length;

  return (
    <span
      className={cn(
        "shrink-0 text-[13px] leading-none text-muted-foreground transition-[font-variation-settings] duration-100",
        "tabular-nums"
      )}
      style={{
        fontVariationSettings: isInteracting
          ? fontWeights.medium
          : fontWeights.normal,
        minWidth: `${charCount + 1}ch`,
      }}
    >
      {label && editingIndex === null && (
        <span className="text-muted-foreground">{label}: </span>
      )}
      {isRange ? (
        <>
          {renderValue(0)}
          <span className="mx-1 text-muted-foreground/50">—</span>
          {renderValue(1)}
        </>
      ) : (
        renderValue(0)
      )}
    </span>
  );
}

// ---------------------------------------------------------------------------
// TooltipValue (internal)
// ---------------------------------------------------------------------------

interface TooltipValueProps {
  value: number;
  formatValue: (v: number) => string;
  motionX: MotionValue<number>;
}

function TooltipValue({ value, formatValue, motionX }: TooltipValueProps) {
  const shape = useShape();
  const tooltipX = useTransform(motionX, (x) => x + THUMB_SIZE / 2);
  return (
    <motion.div
      className="absolute -translate-x-1/2 pointer-events-none z-20"
      style={{
        x: tooltipX,
        top: -16,
      }}
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 4, transition: { duration: 0.1 } }}
      transition={springs.fast}
    >
      <span
        className={cn("text-[12px] text-background tabular-nums whitespace-nowrap bg-foreground px-2 py-1", shape.bg)}
        style={{ fontVariationSettings: fontWeights.medium }}
      >
        {formatValue(value)}
      </span>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Slider
// ---------------------------------------------------------------------------

const Slider = forwardRef<HTMLDivElement, SliderProps>(
  (
    {
      value,
      onChange,
      min = 0,
      max = 100,
      step = 1,
      showSteps = false,
      showValue = true,
      valuePosition = "bottom",
      formatValue = String,
      label,
      disabled = false,
      className,
      ...props
    },
    ref
  ) => {
    const isRange = Array.isArray(value);
    const values = toRadixValue(value);
    const shape = useShape();

    // --- Refs ---
    const trackRef = useRef<HTMLDivElement>(null);
    const trackWidthRef = useRef(0);
    const hasMounted = useRef(false);
    const dragging = useRef(false);
    const activeDragThumb = useRef<number>(0);

    // --- State ---
    const [isHovered, setIsHovered] = useState(false);
    const [isPressed, setIsPressed] = useState(false);
    const [editingIndex, setEditingIndex] = useState<number | null>(null);
    const [hoverPreview, setHoverPreview] = useState<{
      left: number;
      width: number;
      onFilledSide: boolean;
      snappedValue: number;
      cursorX: number;
    } | null>(null);
    const [hoverThumbIndex, setHoverThumbIndex] = useState<number | null>(null);
    const [focusedThumb, setFocusedThumb] = useState<number | null>(null);

    // --- Motion values ---
    const motionX0 = useMotionValue(0);
    const motionX1 = useMotionValue(0);
    const thumbScale = useMotionValue(1);

    // --- Derived motion values for fill ---
    const fillLeft = useTransform(motionX0, (x) =>
      isRange ? x + THUMB_SIZE / 2 : 0
    );
    const fillWidthSingle = useTransform(motionX0, (x) => x + THUMB_SIZE / 2);
    const fillWidthRange = useTransform(
      [motionX0, motionX1] as MotionValue<number>[],
      ([x0, x1]) => (x1 as number) - (x0 as number)
    );
    const fillWidth = isRange ? fillWidthRange : fillWidthSingle;

    // --- Hover preview computation ---
    const computeHoverPreview = useCallback(
      (cursorX: number, trackWidth: number) => {
        // Snap cursor to step grid
        const rawPercent = cursorX / trackWidth;
        const rawVal = rawPercent * (max - min) + min;
        const snappedVal = Math.max(
          min,
          Math.min(max, Math.round((rawVal - min) / step) * step + min)
        );
        const snappedX =
          ((snappedVal - min) / (max - min)) * trackWidth;

        // Find nearest thumb center
        const c0 = motionX0.get() + THUMB_SIZE / 2;
        const c1 = motionX1.get() + THUMB_SIZE / 2;
        const nearestIdx = isRange
          ? (Math.abs(snappedX - c0) <= Math.abs(snappedX - c1) ? 0 : 1)
          : 0;
        const nearest = nearestIdx === 0 ? c0 : c1;

        // Determine if cursor is on the filled side
        const onFilledSide = isRange
          ? snappedX > c0 && snappedX < c1
          : snappedX < c0;

        const left = Math.min(nearest, snappedX);
        const width = Math.abs(snappedX - nearest);
        setHoverPreview({ left, width, onFilledSide, snappedValue: snappedVal, cursorX: snappedX });
        setHoverThumbIndex(nearestIdx);
      },
      [min, max, step, isRange, motionX0, motionX1]
    );

    // --- Mount ---
    useEffect(() => {
      hasMounted.current = true;
    }, []);

    // --- Track width measurement ---
    useEffect(() => {
      const el = trackRef.current;
      if (!el) return;
      const ro = new ResizeObserver(([entry]) => {
        trackWidthRef.current = entry.contentRect.width;
        if (!dragging.current) {
          const px0 = valueToPixel(values[0], min, max, entry.contentRect.width);
          if (hasMounted.current) {
            animate(motionX0, px0, springs.moderate);
          } else {
            motionX0.set(px0);
          }
          if (isRange && values[1] !== undefined) {
            const px1 = valueToPixel(
              values[1],
              min,
              max,
              entry.contentRect.width
            );
            if (hasMounted.current) {
              animate(motionX1, px1, springs.moderate);
            } else {
              motionX1.set(px1);
            }
          }
        }
      });
      ro.observe(el);
      return () => ro.disconnect();
    }, [min, max, isRange, values, motionX0, motionX1]);

    // --- Sync motion values on value change (keyboard, programmatic) ---
    useEffect(() => {
      if (dragging.current) return;
      const tw = trackWidthRef.current;
      if (tw <= 0) return;
      const px0 = valueToPixel(values[0], min, max, tw);
      if (hasMounted.current) {
        animate(motionX0, px0, springs.moderate);
      } else {
        motionX0.set(px0);
      }
      if (isRange && values[1] !== undefined) {
        const px1 = valueToPixel(values[1], min, max, tw);
        if (hasMounted.current) {
          animate(motionX1, px1, springs.moderate);
        } else {
          motionX1.set(px1);
        }
      }
    }, [values, min, max, isRange, motionX0, motionX1]);

    // --- Range crossing prevention ---
    const clampForRange = useCallback(
      (px: number, thumbIndex: number): number => {
        if (!isRange) return px;
        if (thumbIndex === 0) {
          return Math.min(px, motionX1.get() - THUMB_SIZE * 0.5);
        } else {
          return Math.max(px, motionX0.get() + THUMB_SIZE * 0.5);
        }
      },
      [isRange, motionX0, motionX1]
    );

    // --- Emit value change ---
    const emitChange = useCallback(
      (thumbIndex: number, newValue: number) => {
        if (isRange) {
          const newValues: [number, number] = [...(values as [number, number])];
          newValues[thumbIndex] = newValue;
          onChange(newValues);
        } else {
          onChange(newValue);
        }
      },
      [isRange, values, onChange]
    );

    // --- Pointer handlers on track ---
    const handlePointerDown = useCallback(
      (e: React.PointerEvent<HTMLDivElement>) => {
        if (disabled) return;
        if (e.pointerType === "mouse" && e.button !== 0) return;
        e.preventDefault();
        e.stopPropagation(); // Prevent Radix from also handling the drag

        const trackRect = trackRef.current?.getBoundingClientRect();
        if (!trackRect) return;

        const localX = e.clientX - trackRect.left - THUMB_SIZE / 2;
        const clamped = Math.max(
          0,
          Math.min(trackRect.width - THUMB_SIZE, localX)
        );

        // Determine which thumb to drag
        if (isRange) {
          const dist0 = Math.abs(clamped - motionX0.get());
          const dist1 = Math.abs(clamped - motionX1.get());
          activeDragThumb.current = dist0 <= dist1 ? 0 : 1;
        } else {
          activeDragThumb.current = 0;
        }

        dragging.current = true;
        setIsPressed(true);

        const motionX =
          activeDragThumb.current === 0 ? motionX0 : motionX1;

        // Snap to step grid immediately
        const snappedValue = pixelToValue(
          clamped,
          min,
          max,
          step,
          trackRect.width
        );
        const snappedPx = valueToPixel(snappedValue, min, max, trackRect.width);

        // Clamp for range crossing
        const finalPx = clampForRange(
          snappedPx,
          activeDragThumb.current
        );
        // Spring-animate thumb to clicked position
        animate(motionX, finalPx, springs.moderate);

        // Update value
        const finalValue = pixelToValue(
          finalPx,
          min,
          max,
          step,
          trackRect.width
        );
        emitChange(activeDragThumb.current, finalValue);

        // Update tooltip to follow thumb at click position
        const thumbCenter = finalPx + THUMB_SIZE / 2;
        setHoverPreview((prev) => ({
          left: prev?.left ?? 0,
          width: prev?.width ?? 0,
          onFilledSide: prev?.onFilledSide ?? false,
          snappedValue: finalValue,
          cursorX: thumbCenter,
        }));

        (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
      },
      [disabled, isRange, min, max, step, motionX0, motionX1, thumbScale, clampForRange, emitChange]
    );

    const handlePointerMove = useCallback(
      (e: React.PointerEvent<HTMLDivElement>) => {
        if (!dragging.current) return;
        e.stopPropagation();
        const trackRect = trackRef.current?.getBoundingClientRect();
        if (!trackRect) return;

        const localX = e.clientX - trackRect.left - THUMB_SIZE / 2;
        const clamped = Math.max(
          0,
          Math.min(trackRect.width - THUMB_SIZE, localX)
        );

        const motionX =
          activeDragThumb.current === 0 ? motionX0 : motionX1;

        // Snap to step grid during drag
        const snappedValue = pixelToValue(
          clamped,
          min,
          max,
          step,
          trackRect.width
        );
        const snappedPx = valueToPixel(snappedValue, min, max, trackRect.width);
        const finalPx = clampForRange(
          snappedPx,
          activeDragThumb.current
        );
        motionX.set(finalPx);

        const finalValue = pixelToValue(
          finalPx,
          min,
          max,
          step,
          trackRect.width
        );
        emitChange(activeDragThumb.current, finalValue);

        // Update tooltip to follow thumb during drag
        const thumbCenter = finalPx + THUMB_SIZE / 2;
        setHoverPreview((prev) => ({
          left: prev?.left ?? 0,
          width: prev?.width ?? 0,
          onFilledSide: prev?.onFilledSide ?? false,
          snappedValue: finalValue,
          cursorX: thumbCenter,
        }));
      },
      [min, max, step, motionX0, motionX1, clampForRange, emitChange]
    );

    const handlePointerUp = useCallback(() => {
      if (!dragging.current) return;
      dragging.current = false;
      setIsPressed(false);
      // No thumb scale reset needed

      // Spring settle to final quantized position
      const tw = trackWidthRef.current;
      const motionX =
        activeDragThumb.current === 0 ? motionX0 : motionX1;
      const currentPx = motionX.get();
      const snapped = pixelToValue(currentPx, min, max, step, tw);
      const snappedPx = valueToPixel(snapped, min, max, tw);
      animate(motionX, snappedPx, springs.moderate);
    }, [min, max, step, motionX0, motionX1, thumbScale]);

    // --- Radix keyboard handler ---
    const handleRadixChange = useCallback(
      (newValues: number[]) => {
        if (dragging.current) return;
        if (isRange) {
          onChange(newValues as [number, number]);
        } else {
          onChange(newValues[0]);
        }
      },
      [isRange, onChange]
    );

    // --- Click-to-edit handlers ---
    const handleStartEdit = useCallback((index: number) => {
      setEditingIndex(index);
    }, []);

    const handleCommitEdit = useCallback(
      (index: number, v: number) => {
        emitChange(index, v);
        setEditingIndex(null);
      },
      [emitChange]
    );

    const handleCancelEdit = useCallback(() => {
      setEditingIndex(null);
    }, []);

    // --- Step dots ---
    const stepDots = showSteps
      ? Array.from(
          { length: Math.round((max - min) / step) + 1 },
          (_, i) => {
            const v = min + i * step;
            const percent = (v - min) / (max - min);
            return { value: v, percent };
          }
        )
      : [];

    // --- Interaction state for tooltip ---
    const isInteracting = isHovered || isPressed;

    // --- Value display component ---
    const valueDisplay = showValue && valuePosition !== "tooltip" && (
      <ValueDisplay
        values={values}
        editingIndex={editingIndex}
        onStartEdit={handleStartEdit}
        onCommitEdit={handleCommitEdit}
        onCancelEdit={handleCancelEdit}
        min={min}
        max={max}
        step={step}
        formatValue={formatValue}
        label={label}
        isRange={isRange}
        isInteracting={isInteracting}
      />
    );

    // --- Render visual thumb (not Radix — purely visual) ---
    const renderVisualThumb = (index: number) => {
      const motionX = index === 0 ? motionX0 : motionX1;
      return (
        <motion.span
          key={`visual-thumb-${index}`}
          className="flex items-center justify-center pointer-events-none"
          style={{
            width: THUMB_SIZE,
            height: THUMB_SIZE,
            marginTop: -THUMB_SIZE / 2,
            x: motionX,
            position: "absolute",
            top: "50%",
            left: 0,
            zIndex: 10,
          }}
          initial={false}
          transition={springs.moderate}
        >
          <motion.span
            className="block rounded-full"
            initial={false}
            animate={{
              width: (hoverThumbIndex === index) || (isPressed && activeDragThumb.current === index) ? THUMB_SIZE : THUMB_SIZE_REST,
              height: (hoverThumbIndex === index) || (isPressed && activeDragThumb.current === index) ? THUMB_SIZE : THUMB_SIZE_REST,
            }}
            transition={springs.fast}
            style={{
              backgroundColor: "white",
              boxShadow:
                "0 1px 4px rgba(0,0,0,0.15), 0 0 0 1px rgba(0,0,0,0.06)",
            }}
          />
          {/* Focus ring */}
          <motion.span
            className="absolute rounded-full border border-[#6B97FF] pointer-events-none"
            initial={false}
            animate={{
              opacity: focusedThumb === index ? 1 : 0,
              width: THUMB_SIZE + 4,
              height: THUMB_SIZE + 4,
            }}
            transition={springs.fast}
          />
        </motion.span>
      );
    };

    return (
      <div
        ref={ref}
        className={cn(
          "flex flex-col gap-0 w-full select-none touch-none overflow-visible",
          valuePosition === "left" || valuePosition === "right"
            ? "flex-row items-center"
            : "flex-col",
          disabled && "opacity-50 pointer-events-none",
          className
        )}
        {...props}
      >
        {/* Top / Left value */}
        {(valuePosition === "top" || valuePosition === "left") && valueDisplay}

        {/* Track area */}
        <div
          className="relative flex-1 overflow-visible"
          style={{ height: THUMB_SIZE + (valuePosition === "tooltip" ? 16 : 0), paddingTop: valuePosition === "tooltip" ? 16 : 0 }}
          onPointerEnter={() => setIsHovered(true)}
          onPointerLeave={() => {
            setIsHovered(false);
            setHoverPreview(null);
            setHoverThumbIndex(null);
          }}
          onMouseMove={(e) => {
            if (dragging.current) return;
            const trackRect = trackRef.current?.getBoundingClientRect();
            if (!trackRect) return;
            const x = e.clientX - trackRect.left;
            const clamped = Math.max(0, Math.min(trackRect.width, x));
            computeHoverPreview(clamped, trackRect.width);
          }}
        >
          {/* Tooltip values */}
          {showValue && valuePosition === "tooltip" && (
            <AnimatePresence>
              {isInteracting && (
                <TooltipValue
                  key="tooltip-0"
                  value={values[0]}
                  formatValue={formatValue}
                  motionX={motionX0}
                />
              )}
              {isInteracting && isRange && values[1] !== undefined && (
                <TooltipValue
                  key="tooltip-1"
                  value={values[1]}
                  formatValue={formatValue}
                  motionX={motionX1}
                />
              )}
            </AnimatePresence>
          )}

          {/* Radix Slider — invisible, provides ARIA + keyboard nav */}
          <SliderPrimitive.Root
            value={values}
            onValueChange={handleRadixChange}
            min={min}
            max={max}
            step={step}
            disabled={disabled}
            aria-label={label}
            className="absolute inset-0 opacity-0 pointer-events-none"
            style={{ height: THUMB_SIZE }}
          >
            <SliderPrimitive.Track className="w-full h-full">
              <SliderPrimitive.Range />
            </SliderPrimitive.Track>
            <SliderPrimitive.Thumb
              className="block outline-none"
              style={{ width: THUMB_SIZE, height: THUMB_SIZE }}
              onFocus={(e) => { if (e.currentTarget.matches(":focus-visible")) setFocusedThumb(0); }}
              onBlur={() => setFocusedThumb((prev) => prev === 0 ? null : prev)}
            />
            {isRange && (
              <SliderPrimitive.Thumb
                className="block outline-none"
                style={{ width: THUMB_SIZE, height: THUMB_SIZE }}
                onFocus={(e) => { if (e.currentTarget.matches(":focus-visible")) setFocusedThumb(1); }}
                onBlur={() => setFocusedThumb((prev) => prev === 1 ? null : prev)}
              />
            )}
          </SliderPrimitive.Root>

          {/* Visual track with pointer handlers */}
          <div
            ref={trackRef}
            className="relative w-full cursor-pointer py-2"
            style={{ height: THUMB_SIZE + 16 }}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
          >
            {/* Extended hit area — 8px beyond each edge */}
            <div
              className="absolute cursor-pointer"
              style={{ left: -8, right: -8, top: 0, bottom: 0 }}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
            />
            {/* Hover value tooltip */}
            <AnimatePresence>
              {hoverPreview && valuePosition !== "tooltip" && (
                <motion.div
                  key="hover-tooltip"
                  className="absolute -translate-x-1/2 pointer-events-none z-20"
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0, left: hoverPreview.cursorX }}
                  exit={{ opacity: 0, y: 4, transition: { duration: 0.1 } }}
                  transition={springs.fast}
                  style={{
                    top: -20,
                  }}
                >
                  <span
                    className={cn("text-[12px] text-background tabular-nums whitespace-nowrap bg-foreground px-2 py-1", shape.bg)}
                    style={{ fontVariationSettings: fontWeights.medium }}
                  >
                    {formatValue(hoverPreview.snappedValue)}
                  </span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Track background — grows on hover */}
            <motion.div
              className={cn("absolute left-0 right-0", shape.bg)}
              initial={false}
              animate={{
                height: isHovered || isPressed ? 8 : TRACK_HEIGHT,
                top: isHovered || isPressed
                  ? 8 + (THUMB_SIZE - 8) / 2
                  : 8 + (THUMB_SIZE - TRACK_HEIGHT) / 2,
              }}
              transition={springs.fast}
              style={{
                backgroundColor: "var(--accent)",
              }}
            >
              {/* Filled range */}
              <motion.div
                className={cn("absolute h-full", shape.bg)}
                style={{
                  left: fillLeft,
                  width: fillWidth,
                  backgroundColor: "var(--foreground)",
                }}
              />

              {/* Hover preview — unfilled side (dark on track) */}
              <motion.div
                className={cn("absolute h-full pointer-events-none", shape.bg)}
                initial={false}
                animate={{
                  left: hoverPreview && !hoverPreview.onFilledSide ? hoverPreview.left : 0,
                  width: hoverPreview && !hoverPreview.onFilledSide ? hoverPreview.width : 0,
                  opacity: hoverPreview && !hoverPreview.onFilledSide && !isPressed ? 1 : 0,
                }}
                transition={{
                  ...springs.moderate,
                  opacity: { duration: 0.15 },
                }}
                style={{
                  backgroundColor: "color-mix(in srgb, var(--foreground) 20%, transparent)",
                }}
              />

              {/* Hover preview — filled side (light on fill) */}
              <motion.div
                className={cn("absolute h-full pointer-events-none z-[2]", shape.bg)}
                initial={false}
                animate={{
                  left: hoverPreview?.onFilledSide ? hoverPreview.left : 0,
                  width: hoverPreview?.onFilledSide ? hoverPreview.width : 0,
                  opacity: hoverPreview?.onFilledSide && !isPressed ? 1 : 0,
                }}
                transition={{
                  ...springs.moderate,
                  opacity: { duration: 0.15 },
                }}
                style={{
                  backgroundColor: "color-mix(in srgb, var(--background) 25%, transparent)",
                }}
              />

            </motion.div>

            {/* Step dots — outside track bg to avoid border-radius clipping */}
            {stepDots.map(({ value: v, percent }) => {
              const onFilled = isRange
                ? v >= values[0] && v <= values[1]
                : v <= values[0];
              return (
                <div
                  key={v}
                  className="absolute pointer-events-none flex items-center justify-center"
                  style={{
                    left: `calc(${THUMB_SIZE / 2}px + ${percent} * (100% - ${THUMB_SIZE}px))`,
                    top: "50%",
                    width: 0,
                    height: 0,
                  }}
                >
                  <motion.div
                    className="relative rounded-full flex-shrink-0 z-[6]"
                    initial={false}
                    animate={{
                      width: isHovered ? DOT_SIZE * 1.25 : DOT_SIZE,
                      height: isHovered ? DOT_SIZE * 1.25 : DOT_SIZE,
                    }}
                    transition={springs.moderate}
                    style={{
                      backgroundColor: onFilled
                        ? "color-mix(in srgb, var(--background) 20%, var(--foreground))"
                        : "color-mix(in srgb, var(--muted-foreground) 40%, var(--accent))",
                    }}
                  />
                </div>
              );
            })}

            {/* Visual thumbs */}
            {renderVisualThumb(0)}
            {isRange && renderVisualThumb(1)}
          </div>
        </div>

        {/* Bottom / Right value */}
        {(valuePosition === "bottom" || valuePosition === "right") &&
          valueDisplay}
      </div>
    );
  }
);

Slider.displayName = "Slider";

// ---------------------------------------------------------------------------
// SliderComfortable
// ---------------------------------------------------------------------------

interface SliderComfortableProps
  extends Omit<HTMLAttributes<HTMLDivElement>, "onChange" | "defaultValue"> {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  variant?: "pips" | "scrubber";
  label?: string;
  formatValue?: (v: number) => string;
  disabled?: boolean;
}

const SliderComfortable = forwardRef<HTMLDivElement, SliderComfortableProps>(
  (
    {
      value,
      onChange,
      min = 0,
      max = 100,
      step = 1,
      variant = "pips",
      label,
      formatValue = String,
      disabled = false,
      className,
      ...props
    },
    ref
  ) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const dragging = useRef(false);
    const handleDragging = useRef(false);
    const [isHovered, setIsHovered] = useState(false);
    const [isFocused, setIsFocused] = useState(false);
    const shape = useShape();

    const mergedRef = useCallback(
      (el: HTMLDivElement | null) => {
        containerRef.current = el;
        if (typeof ref === "function") (ref as React.RefCallback<HTMLDivElement>)(el);
        else if (ref) (ref as React.RefObject<HTMLDivElement | null>).current = el;
      },
      [ref]
    );

    // Fill motion value (scrubber only)
    const fillPercent = useMotionValue(
      max === min ? 0 : Math.max(0, Math.min(1, (value - min) / (max - min)))
    );
    const fillWidthStyle = useTransform(fillPercent, (p) => `${p * 100}%`);
    const handleLeftStyle = useTransform(fillPercent, (p) => `calc(${p * 100}% - 8px)`);
    const handleLineLeftStyle = useTransform(fillPercent, (p) => `calc(${p * 100}% - 9px)`);
    // Pips-specific: offset by px-3 (12px) padding so fill edge aligns with active pip center
    const pipsFillWidthStyle = useTransform(
      fillPercent,
      (p) => `calc(${p * 100}% + ${20 - 24 * p}px)`
    );
    const pipsHandleLineLeftStyle = useTransform(
      fillPercent,
      (p) => `calc(${p * 100}% + ${11 - 24 * p}px)`
    );
    const pipsMaskStyle = useTransform(fillPercent, (p) => {
      const offset = 12 - 24 * p;
      return `linear-gradient(to right, transparent calc(${p * 100}% + ${offset}px), black calc(${p * 100}% + ${offset + 2}px))`;
    });

    // Sync fill on programmatic value change
    useEffect(() => {
      if (dragging.current || handleDragging.current) return;
      const percent = max === min ? 0 : Math.max(0, Math.min(1, (value - min) / (max - min)));
      animate(fillPercent, percent, springs.fast);
    }, [value, min, max, variant, fillPercent]);

    const pipSteps = Array.from(
      { length: Math.round((max - min) / step) + 1 },
      (_, i) => min + i * step
    );
    const pipCount = pipSteps.length;

    const getValueFromX = useCallback(
      (clientX: number) => {
        const rect = containerRef.current?.getBoundingClientRect();
        if (!rect) return value;
        const x = clientX - rect.left;
        const clamped = Math.max(0, Math.min(rect.width, x));
        if (variant === "pips") {
          if (pipCount <= 1) return value;
          const index = Math.max(
            0,
            Math.min(pipCount - 1, Math.round((clamped / rect.width) * (pipCount - 1)))
          );
          return pipSteps[index];
        } else {
          const raw = min + (clamped / rect.width) * (max - min);
          const snapped = Math.round((raw - min) / step) * step + min;
          return Math.max(min, Math.min(max, snapped));
        }
      },
      [variant, pipSteps, pipCount, min, max, step, value]
    );

    const handlePointerDown = useCallback(
      (e: React.PointerEvent<HTMLDivElement>) => {
        if (disabled) return;
        if (e.pointerType === "mouse" && e.button !== 0) return;
        e.preventDefault();
        dragging.current = true;
        const newVal = getValueFromX(e.clientX);
        onChange(newVal);
        const newPercent = Math.max(0, Math.min(1, (newVal - min) / (max - min)));
        animate(fillPercent, newPercent, springs.fast);
        (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
      },
      [disabled, getValueFromX, onChange, fillPercent, min, max]
    );

    const handlePointerMove = useCallback(
      (e: React.PointerEvent<HTMLDivElement>) => {
        if (!dragging.current) return;
        const newVal = getValueFromX(e.clientX);
        onChange(newVal);
        const newPercent = Math.max(0, Math.min(1, (newVal - min) / (max - min)));
        if (variant === "scrubber") {
          fillPercent.set(newPercent);
        } else {
          animate(fillPercent, newPercent, springs.fast);
        }
      },
      [getValueFromX, onChange, variant, fillPercent, min, max]
    );

    const handlePointerUp = useCallback(() => {
      dragging.current = false;
    }, []);

    // Resize handle drag handlers (direct cursor position)
    const handleResizePointerDown = useCallback(
      (e: React.PointerEvent<HTMLDivElement>) => {
        if (disabled) return;
        if (e.pointerType === "mouse" && e.button !== 0) return;
        e.preventDefault();
        e.stopPropagation();
        handleDragging.current = true;
        const newVal = getValueFromX(e.clientX);
        onChange(newVal);
        fillPercent.set(Math.max(0, Math.min(1, (newVal - min) / (max - min))));
        (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
      },
      [disabled, getValueFromX, onChange, fillPercent, min, max]
    );

    const handleResizePointerMove = useCallback(
      (e: React.PointerEvent<HTMLDivElement>) => {
        if (!handleDragging.current) return;
        const newVal = getValueFromX(e.clientX);
        onChange(newVal);
        fillPercent.set(Math.max(0, Math.min(1, (newVal - min) / (max - min))));
      },
      [getValueFromX, onChange, fillPercent, min, max]
    );

    const handleResizePointerUp = useCallback(() => {
      handleDragging.current = false;
    }, []);

    const handleRadixChange = useCallback(
      (newValues: number[]) => {
        onChange(newValues[0]);
      },
      [onChange]
    );

    const isActive = isHovered || isFocused;

    return (
      <div
        ref={mergedRef}
        className={cn(
          "relative w-full h-8 select-none touch-none border border-border overflow-hidden",
          variant === "scrubber"
            ? "flex items-center gap-3 px-3 cursor-ew-resize"
            : "cursor-pointer",
          shape.bg,
          disabled && "opacity-50 pointer-events-none",
          className
        )}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerEnter={() => setIsHovered(true)}
        onPointerLeave={() => setIsHovered(false)}
        {...props}
      >
        {/* Invisible Radix for keyboard nav + a11y */}
        <SliderPrimitive.Root
          value={[value]}
          onValueChange={handleRadixChange}
          min={min}
          max={max}
          step={step}
          disabled={disabled}
          className="absolute inset-0 opacity-0 pointer-events-none"
        >
          <SliderPrimitive.Track className="w-full h-full">
            <SliderPrimitive.Range />
          </SliderPrimitive.Track>
          <SliderPrimitive.Thumb
            className="block outline-none"
            onFocus={(e) => {
              if (e.currentTarget.matches(":focus-visible")) setIsFocused(true);
            }}
            onBlur={() => setIsFocused(false)}
          />
        </SliderPrimitive.Root>

        {/* Pips: dots layer — z-[1] */}
        {variant === "pips" && (
          <motion.div
            className="absolute inset-0 flex justify-between items-center px-3 pointer-events-none z-[1]"
            style={{ WebkitMaskImage: pipsMaskStyle, maskImage: pipsMaskStyle }}
          >
            {pipSteps.map((pipValue) => {
              const isActivePip = pipValue === value;
              return (
                <div
                  key={pipValue}
                  className="relative flex items-center justify-center"
                  style={{ width: PIP_SIZE, height: PIP_SIZE }}
                >
                  <motion.div
                    className="rounded-full"
                    initial={false}
                    animate={{
                      backgroundColor: isActivePip ? "var(--foreground)" : "var(--muted-foreground)",
                      opacity: isActivePip ? 1 : 0.3,
                    }}
                    transition={springs.fast}
                    style={{ width: PIP_SIZE, height: PIP_SIZE }}
                  />
                  <motion.span
                    className="absolute rounded-full border border-[#6B97FF] pointer-events-none"
                    initial={false}
                    animate={{ opacity: isFocused && isActivePip ? 1 : 0 }}
                    transition={springs.fast}
                    style={{ width: PIP_SIZE + 6, height: PIP_SIZE + 6 }}
                  />
                </div>
              );
            })}
          </motion.div>
        )}

        {/* Pips: label + value BG layer — z-[2] (occludes dots behind text) */}
        {variant === "pips" && (
          <div className="absolute inset-0 flex items-center px-3 z-[2] pointer-events-none" aria-hidden>
            {label && (
              <span className="text-[13px] px-2 bg-background text-transparent select-none">
                {label}
              </span>
            )}
            <span
              className="text-[13px] tabular-nums ml-auto pl-2 bg-background text-transparent select-none"
              style={{ minWidth: `${String(formatValue(max)).length}ch` }}
            >
              {formatValue(value)}
            </span>
          </div>
        )}

        {/* Pips: fill — z-[3] */}
        {variant === "pips" && (
          <motion.div
            className="absolute left-0 top-0 bottom-0 pointer-events-none z-[3]"
            style={{
              width: pipsFillWidthStyle,
              backgroundColor: "color-mix(in srgb, var(--foreground) 8%, transparent)",
            }}
          />
        )}

        {/* Pips: handle line — z-[3] */}
        {variant === "pips" && (
          <motion.div
            className="absolute rounded-full pointer-events-none z-[3]"
            initial={false}
            animate={{
              backgroundColor: isActive
                ? "color-mix(in srgb, var(--foreground) 50%, transparent)"
                : "color-mix(in srgb, var(--foreground) 25%, transparent)",
            }}
            transition={springs.fast}
            style={{
              left: pipsHandleLineLeftStyle,
              top: 8,
              bottom: 8,
              width: 2,
            }}
          />
        )}

        {/* Pips: label + value text layer — z-[4] */}
        {variant === "pips" && (
          <div className="absolute inset-0 flex items-center px-3 z-[4] pointer-events-none">
            {label && (
              <motion.span
                className="text-[13px] px-2"
                initial={false}
                animate={{ color: isActive ? "var(--foreground)" : "var(--muted-foreground)" }}
                transition={springs.fast}
              >
                {label}
              </motion.span>
            )}
            <motion.span
              className="text-[13px] tabular-nums ml-auto pl-2"
              initial={false}
              animate={{ color: isActive ? "var(--foreground)" : "var(--muted-foreground)" }}
              transition={springs.fast}
              style={{ minWidth: `${String(formatValue(max)).length}ch`, textAlign: "right" }}
            >
              {formatValue(value)}
            </motion.span>
          </div>
        )}

        {/* Scrubber: fill */}
        {variant === "scrubber" && (
          <motion.div
            className="absolute left-0 top-0 bottom-0 pointer-events-none"
            style={{
              width: fillWidthStyle,
              backgroundColor: "color-mix(in srgb, var(--foreground) 8%, transparent)",
            }}
          />
        )}

        {/* Scrubber: handle line */}
        {variant === "scrubber" && (
          <motion.div
            className="absolute rounded-full pointer-events-none z-10"
            initial={false}
            animate={{
              backgroundColor: isActive
                ? "color-mix(in srgb, var(--foreground) 50%, transparent)"
                : "color-mix(in srgb, var(--foreground) 25%, transparent)",
            }}
            transition={springs.fast}
            style={{
              left: handleLineLeftStyle,
              top: 8,
              bottom: 8,
              width: 2,
            }}
          />
        )}

        {/* Scrubber: label */}
        {variant === "scrubber" && label && (
          <motion.span
            className="text-[13px] shrink-0 z-10"
            initial={false}
            animate={{ color: isActive ? "var(--foreground)" : "var(--muted-foreground)" }}
            transition={springs.fast}
          >
            {label}
          </motion.span>
        )}

        {/* Scrubber: flex-1 spacer + value */}
        {variant === "scrubber" && (
          <>
            <div className="flex-1" />
            <motion.span
              className="text-[13px] shrink-0 tabular-nums text-right z-10"
              initial={false}
              animate={{ color: isActive ? "var(--foreground)" : "var(--muted-foreground)" }}
              transition={springs.fast}
              style={{ minWidth: `${String(formatValue(max)).length}ch` }}
            >
              {formatValue(value)}
            </motion.span>
          </>
        )}

        {/* Resize handle (scrubber only) */}
        {variant === "scrubber" && (
          <motion.div
            className="absolute top-0 bottom-0 w-2 cursor-ew-resize z-20"
            style={{ left: handleLeftStyle }}
            onPointerDown={handleResizePointerDown}
            onPointerMove={handleResizePointerMove}
            onPointerUp={handleResizePointerUp}
          />
        )}
      </div>
    );
  }
);

SliderComfortable.displayName = "SliderComfortable";

export { Slider, SliderComfortable };
export type { SliderProps, SliderValue, ValuePosition, SliderComfortableProps };
