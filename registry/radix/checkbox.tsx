"use client";

import {
  forwardRef,
  useState,
  type ComponentPropsWithoutRef,
  type ElementRef,
} from "react";
import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import { AnimatePresence, motion } from "motion/react";
import { cn } from "@/lib/utils";
import { useSize, type SizeVariant } from "@/lib/size-context";
import { useShape } from "@/lib/shape-context";

// ---------------------------------------------------------------------------
// A single checkbox: the CheckboxGroup square on its own. A 1.5px --border
// box that darkens on hover; checked, the box steps back and a drawn check
// alone marks the state. Pair it with Field and FieldLabel for its text.
// ---------------------------------------------------------------------------

interface CheckboxProps
  extends Omit<
    ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root>,
    "checked" | "defaultChecked" | "onCheckedChange"
  > {
  checked?: boolean;
  defaultChecked?: boolean;
  /** Shows a dash instead of the check: some, not all, of what this box
   *  stands for is on (a select-all over a partial selection). Clicking
   *  it reports `true`. */
  indeterminate?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  /** Pins the box to one step of the size ladder (16px default, 14px
   *  compact). Omitted, it follows the surrounding SizeProvider. */
  size?: SizeVariant;
}

const Checkbox = forwardRef<ElementRef<typeof CheckboxPrimitive.Root>, CheckboxProps>(
  ({ className, checked, defaultChecked = false, indeterminate = false, onCheckedChange, onKeyDown, size, ...props }, ref) => {
    // Controlled or not, the check's enter and exit need the state in
    // render, so the uncontrolled value is mirrored here.
    const [uncontrolled, setUncontrolled] = useState(defaultChecked);
    const isChecked = checked ?? uncontrolled;
    // The dash wins over the check, the way the primitives report it.
    const glyph = indeterminate ? "dash" : isChecked ? "check" : null;
    const compact = useSize(size).variant === "compact";
    const sharp = useShape().variant === "sharp";

    return (
      <CheckboxPrimitive.Root
        ref={ref}
        data-slot="checkbox"
        checked={indeterminate ? "indeterminate" : isChecked}
        onCheckedChange={(value) => {
          const next = value === true;
          if (checked === undefined) setUncontrolled(next);
          onCheckedChange?.(next);
        }}
        onKeyDown={(e) => {
          // In a choice card (a FieldLabel around a whole Field) the box
          // reads as an option to pick, so Enter toggles it like Space. A
          // plain checkbox, even inside a label, leaves Enter to submit its
          // form.
          const card = e.currentTarget.closest("[data-slot=field-label]");
          if (e.key === "Enter" && !e.repeat && card?.querySelector(":scope > [data-slot=field]")) {
            e.preventDefault();
            e.currentTarget.click();
          }
          onKeyDown?.(e);
        }}
        className={cn(
          "relative shrink-0 cursor-pointer border-[1.5px] border-solid border-border bg-transparent p-0 outline-none",
          "transition-[border-color] duration-80",
          // Hovering the box, or the Field row it sits in, darkens the
          // border; a checked box keeps it clear at rest and brings it back
          // on hover.
          "hover:not-data-[state=checked]:border-foreground/40 group-hover/field:not-data-[state=checked]:border-foreground/40",
          "data-[state=checked]:border-transparent data-[state=indeterminate]:border-transparent",
          "hover:data-[state=checked]:border-foreground/40 group-hover/field:enabled:data-[state=checked]:border-foreground/40",
          "aria-invalid:not-data-[state=checked]:border-destructive/50",
          "focus-visible:ring-1 focus-visible:ring-[color:var(--focus-ring,#6B97FF)]",
          "disabled:pointer-events-none disabled:opacity-50",
          compact ? "size-[14px]" : "size-4",
          sharp ? "rounded-none" : compact ? "rounded-[4px]" : "rounded-[5px]",
          className
        )}
        {...props}
      >
        {/* forceMount hands unmounting to AnimatePresence so the retract
            plays; initial={false} shows a box checked at mount finished. */}
        <AnimatePresence initial={false}>
          {glyph && (
            <CheckboxPrimitive.Indicator forceMount asChild>
              <motion.svg
                width={compact ? 16 : 18}
                height={compact ? 16 : 18}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
                className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-foreground"
                initial={{ opacity: 1 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 1 }}
              >
                {/* The check (or dash) draws itself: pathLength 0 → 1 over 0.08s
                    easeOut, back to 0 over 0.04s easeIn. */}
                <motion.path
                  key={glyph}
                  d={glyph === "dash" ? "M7 12H17" : "M6 12L10 16L18 8"}
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1, transition: { duration: 0.08, ease: "easeOut" } }}
                  exit={{ pathLength: 0, transition: { duration: 0.04, ease: "easeIn" } }}
                />
              </motion.svg>
            </CheckboxPrimitive.Indicator>
          )}
        </AnimatePresence>
      </CheckboxPrimitive.Root>
    );
  }
);

Checkbox.displayName = "Checkbox";

export { Checkbox };
export type { CheckboxProps };
