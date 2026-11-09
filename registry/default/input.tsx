"use client";

import { forwardRef, useRef, useState, type InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";
import { fontWeights } from "@/lib/font-weight";
import { useIcons } from "@/lib/icon-context";
import { nestedRadius, useShape } from "@/lib/shape-context";
import { useSize, type SizeVariant } from "@/lib/size-context";

// ---------------------------------------------------------------------------
// A single-line text field drawn like the Select trigger: a fixed --border
// hairline, the hover fill, and the ladder's height, padding and body text.
// Focus darkens the hairline to a neutral 40% instead of adding an accent
// ring, and it wins over the error tint while the value is being fixed.
// Pair it with Field for a label, a description and an error message.
// ---------------------------------------------------------------------------

const inputClasses = [
  "w-full min-w-0 border border-border bg-transparent text-foreground outline-none",
  "transition-[background-color,border-color] duration-80",
  "placeholder:text-muted-foreground",
  "hover:bg-hover",
  "aria-invalid:border-destructive/50",
  // Focus wins over the error tint while the value is fixed. Tailwind sorts
  // aria-* after focus, so the invalid case needs its own stacked variant.
  "focus:border-foreground/40 aria-invalid:focus:border-foreground/40 focus:hover:bg-transparent",
  "disabled:opacity-50 disabled:pointer-events-none",
  "file:mr-2 file:cursor-pointer file:border-0 file:bg-transparent file:p-0 file:font-[inherit] file:text-[length:inherit] file:text-foreground",
];

interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "size"> {
  /** Pins the field to one step of the size ladder (default 36px, compact
   *  28px). Omitted, it follows the surrounding SizeProvider. */
  size?: SizeVariant;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, size, type = "text", style, onChange, ...props }, ref) => {
    const shape = useShape();
    const sizeClasses = useSize(size);
    const compact = sizeClasses.variant === "compact";
    const icons = useIcons();
    const FileIcon = icons.file;
    const MinusIcon = icons.minus;
    const PlusIcon = icons.plus;
    const inputRef = useRef<HTMLInputElement | null>(null);
    // A file input's text ("No file chosen", then the file name) can't be
    // styled on its own, so the whole input reads muted until a file is
    // picked. The browser's button keeps full contrast throughout.
    const [hasFile, setHasFile] = useState(false);
    const isFile = type === "file";
    const isNumber = type === "number";

    // The stepper buttons sit inset like segmented tabs in their list: 28px
    // buttons 4px from the edge (24px, 2px compact), with corners nested
    // inside the field's.
    const stepInset = compact ? 2 : 4;
    const stepRadius = nestedRadius(shape.bgRadius, stepInset);

    const step = (direction: 1 | -1) => {
      const el = inputRef.current;
      if (!el || el.disabled || el.readOnly) return;
      if (el.step === "any") {
        // stepUp/stepDown throw for step="any", so step by 1 within min and
        // max, through the native setter React's value tracking reads.
        const min = el.min === "" ? -Infinity : Number(el.min);
        const max = el.max === "" ? Infinity : Number(el.max);
        const next = Math.min(max, Math.max(min, (Number(el.value) || 0) + direction));
        Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set?.call(el, String(next));
      } else if (direction === 1) el.stepUp();
      else el.stepDown();
      // stepUp/stepDown skip the value setter React tracks, so this input
      // event reaches onChange like a typed value would.
      el.dispatchEvent(new Event("input", { bubbles: true }));
    };

    const input = (
      <input
        ref={(node) => {
          inputRef.current = node;
          if (typeof ref === "function") ref(node);
          else if (ref) ref.current = node;
        }}
        type={type}
        data-slot="input"
        className={cn(
          inputClasses,
          shape.input,
          sizeClasses.control,
          sizeClasses.px,
          sizeClasses.field,
          isFile && [
            // A file input lays its text out from the top, not centered like
            // a text input, so it gets the padding that puts the line where
            // text sits: (36 - 2 - 20) / 2 = 7px, (28 - 2 - 18) / 2 = 4px
            // compact. On the left it makes room for the icon: px + icon +
            // gap (12 + 16 + 8, 10 + 14 + 4 compact).
            compact ? "py-1 pl-7" : "py-[7px] pl-9",
            !hasFile && "text-muted-foreground",
          ],
          isNumber && [
            // The browser's spinner arrows give way to the stepper buttons.
            "[appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none",
            // Room for both buttons, their inset and the gap before the text:
            // 4 + 28 + 28 + 8, 2 + 24 + 24 + 4 compact.
            compact ? "pr-[54px]" : "pr-[68px]",
          ],
          className
        )}
        style={{ fontVariationSettings: fontWeights.normal, ...style }}
        onChange={(e) => {
          if (isFile) setHasFile(!!e.currentTarget.files?.length);
          onChange?.(e);
        }}
        {...props}
      />
    );

    if (isFile) {
      // Native inputs take no children, so the file icon sits beside the
      // input in a wrapper, over its left padding.
      return (
        <span data-slot="input-file" className="relative block w-full min-w-0">
          <FileIcon
            size={sizeClasses.icon}
            strokeWidth={1.5}
            aria-hidden
            className={cn(
              "pointer-events-none absolute top-1/2 -translate-y-1/2 transition-colors duration-80",
              compact ? "left-2.5" : "left-3",
              hasFile ? "text-foreground" : "text-muted-foreground"
            )}
          />
          {input}
        </span>
      );
    }

    if (isNumber) {
      const stepButton = (direction: 1 | -1) => {
        const Icon = direction === 1 ? PlusIcon : MinusIcon;
        return (
          <button
            type="button"
            // Arrow keys already step the focused input, so the buttons stay
            // out of the tab order and keep focus where it is.
            tabIndex={-1}
            aria-label={direction === 1 ? "Increase" : "Decrease"}
            disabled={props.disabled || props.readOnly}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => step(direction)}
            className={cn(
              "group/step flex shrink-0 cursor-pointer items-center justify-center text-muted-foreground outline-none",
              "transition-colors duration-80 hover:bg-hover hover:text-foreground",
              "disabled:pointer-events-none",
              compact ? "size-6" : "size-7"
            )}
            style={{ borderRadius: stepRadius }}
          >
            <Icon size={sizeClasses.icon} strokeWidth={1.5} aria-hidden />
          </button>
        );
      };

      return (
        <span data-slot="input-number" className="relative block w-full min-w-0">
          {input}
          <span
            className="absolute inset-y-0 flex items-center"
            style={{ right: stepInset }}
          >
            {stepButton(-1)}
            {stepButton(1)}
          </span>
        </span>
      );
    }

    return input;
  }
);

Input.displayName = "Input";

export { Input, inputClasses };
export type { InputProps };
export default Input;
