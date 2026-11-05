"use client";

import { forwardRef, type TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/utils";
import { fontWeights } from "@/lib/font-weight";
import { useShape } from "@/lib/shape-context";
import { useSize, type SizeVariant } from "@/lib/size-context";

// ---------------------------------------------------------------------------
// A multi-line text field with the Input's hairline: fixed --border at rest,
// the hover fill, and a neutral 40% border while focused. It grows with its
// content (field-sizing) from three lines to ten, then scrolls; browsers
// without field-sizing keep the minimum height and scroll.
// ---------------------------------------------------------------------------

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  /** Pins the text and padding to one step of the size ladder. Omitted, it
   *  follows the surrounding SizeProvider. */
  size?: SizeVariant;
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, size, style, ...props }, ref) => {
    const shape = useShape();
    const sizeClasses = useSize(size);
    const compact = sizeClasses.variant === "compact";

    return (
      <textarea
        ref={ref}
        data-slot="textarea"
        className={cn(
          "w-full min-w-0 border border-border bg-transparent text-foreground outline-none",
          "field-sizing-content resize-none",
          "transition-[background-color,border-color] duration-80",
          "placeholder:text-muted-foreground",
          "hover:bg-hover",
          "aria-invalid:border-destructive/50",
          // Focus wins over the error tint while the value is fixed; the
          // stacked variant outranks aria-invalid, which Tailwind sorts last.
          "focus:border-foreground/40 aria-invalid:focus:border-foreground/40 focus:hover:bg-transparent",
          "disabled:opacity-50 disabled:pointer-events-none",
          // The first line sits where an Input's text does: (36 - 2 - 20) / 2
          // = 7px of padding, (28 - 2 - 18) / 2 = 4px compact. The minimum is
          // three body lines plus that padding and the border.
          compact ? "min-h-[64px] py-1" : "min-h-[76px] py-[7px]",
          // It stops growing at ten lines and scrolls from there, so a long
          // paste can't push the form off screen; a className max-h overrides.
          compact ? "max-h-[190px]" : "max-h-[216px]",
          // A full pill radius on a multi-line box reads as a blob, so the
          // pill shape steps down to its merged radius here.
          shape.variant === "pill" ? shape.mergedBg : shape.input,
          sizeClasses.px,
          sizeClasses.field,
          className
        )}
        style={{ fontVariationSettings: fontWeights.normal, ...style }}
        {...props}
      />
    );
  }
);

Textarea.displayName = "Textarea";

export { Textarea };
export type { TextareaProps };
export default Textarea;
