"use client";

import {
  useRef,
  useState,
  useEffect,
  useMemo,
  createContext,
  useContext,
  forwardRef,
  type ReactNode,
  type HTMLAttributes,
  type InputHTMLAttributes,
} from "react";
import { Field } from "@base-ui/react/field";
import type { IconComponent } from "@/lib/icon-context";
import { cn } from "@/lib/utils";
import { fontWeights } from "@/lib/font-weight";
import { useShape } from "@/lib/shape-context";
import { SizeProvider, useSize, type SizeVariant } from "@/lib/size-context";
import { useProximityHover } from "@/hooks/use-proximity-hover";

interface InputGroupContextValue {
  registerItem: (index: number, element: HTMLElement | null) => void;
  activeIndex: number | null;
}

const InputGroupContext = createContext<InputGroupContextValue | null>(null);

function useInputGroup() {
  const ctx = useContext(InputGroupContext);
  if (!ctx)
    throw new Error("useInputGroup must be used within an InputGroup");
  return ctx;
}

interface InputGroupProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  /** Pins the group's fields to one step of the size ladder (default 36px,
   *  compact 28px — see /docs/sizes). Omitted, they follow the surrounding
   *  SizeProvider. */
  size?: SizeVariant;
}

const InputGroup = forwardRef<HTMLDivElement, InputGroupProps>(
  ({ children, size, className, ...props }, ref) => {
    const containerRef = useRef<HTMLDivElement>(null);

    const { activeIndex, handlers, registerItem, measureItems } =
      useProximityHover(containerRef);

    useEffect(() => {
      measureItems();
    }, [measureItems, children]);

    const contextValue = useMemo(
      () => ({ registerItem, activeIndex }),
      [registerItem, activeIndex]
    );

    const group = (
      <InputGroupContext.Provider value={contextValue}>
        <div
          ref={(node) => {
            (containerRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
            if (typeof ref === "function") ref(node);
            else if (ref) (ref as React.MutableRefObject<HTMLDivElement | null>).current = node;
          }}
          onMouseEnter={handlers.onMouseEnter}
          onMouseMove={handlers.onMouseMove}
          onMouseLeave={handlers.onMouseLeave}
          // `relative` makes this div the fields' offsetParent — the proximity
          // hook measures items via offsetTop and compares against
          // container-relative mouse coords, so the two coordinate spaces must
          // share this origin (same as every other proximity consumer).
          className={cn("relative flex flex-col gap-3 w-72 max-w-full", className)}
          {...props}
        >
          {children}
        </div>
      </InputGroupContext.Provider>
    );

    // A size prop pins every field in the group to one ladder step.
    return size ? <SizeProvider size={size}>{group}</SizeProvider> : group;
  }
);

InputGroup.displayName = "InputGroup";

interface InputFieldProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "onChange" | "index"> {
  label: string;
  /** Keep the label for assistive tech but don't render it — for inline
   *  fields (a toolbar search) where the placeholder carries the meaning. */
  labelHidden?: boolean;
  placeholder?: string;
  icon?: IconComponent;
  index: number;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  disabled?: boolean;
  className?: string;
}

const InputField = forwardRef<HTMLDivElement, InputFieldProps>(
  (
    {
      label,
      labelHidden,
      placeholder,
      icon: Icon,
      index,
      value,
      onChange,
      error,
      disabled,
      className,
      ...props
    },
    ref
  ) => {
    const internalRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLElement | null>(null);
    const { registerItem, activeIndex } = useInputGroup();
    const [isFocused, setIsFocused] = useState(false);
    const shape = useShape();
    const sizeClasses = useSize();
    const compact = sizeClasses.variant === "compact";

    useEffect(() => {
      registerItem(index, internalRef.current);
      return () => registerItem(index, null);
    }, [index, registerItem]);

    const isActive = activeIndex === index;
    const labelActive = isActive || isFocused;

    const handleFocus = () => {
      setIsFocused(true);
    };

    const handleBlur = () => {
      setIsFocused(false);
    };

    // Input container classes
    let bgClass: string;
    let ringClass: string;

    if (disabled) {
      bgClass = "bg-transparent";
      ringClass = "ring-border";
    } else if (error) {
      bgClass = isFocused ? "bg-card" : isActive ? "bg-destructive-light/60" : "bg-transparent";
      ringClass = isFocused || isActive ? "ring-destructive/50" : "ring-transparent";
    } else if (isFocused) {
      bgClass = "bg-card";
      ringClass = "ring-border";
    } else if (isActive) {
      bgClass = "bg-muted/50";
      ringClass = "ring-border";
    } else {
      bgClass = "bg-transparent";
      ringClass = "ring-transparent";
    }

    return (
      // Base UI Field wires the accessibility plumbing: Field.Label's htmlFor
      // targets the control, Field.Error's generated id lands in the control's
      // aria-describedby, and `invalid` drives aria-invalid / data-invalid.
      <Field.Root
        ref={(node) => {
          (internalRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
          if (typeof ref === "function") ref(node);
          else if (ref) (ref as React.MutableRefObject<HTMLDivElement | null>).current = node;
        }}
        invalid={!!error}
        disabled={disabled}
        className={cn(
          "flex flex-col gap-1 cursor-text",
          disabled && "opacity-50 pointer-events-none",
          className
        )}
      >
        {/* Label — sr-only when hidden so the field keeps its accessible
            name and the htmlFor wiring. */}
        <Field.Label
          className={cn(
            labelHidden ? "sr-only" : "inline-grid",
            sizeClasses.text,
            // One notch tighter than the ladder's control padding — the field
            // ring is invisible at rest, so the roomier inset reads as a gap.
            !labelHidden && (compact ? "pl-2" : "pl-2.5")
          )}
        >
          <span
            className="col-start-1 row-start-1 invisible"
            style={{ fontVariationSettings: fontWeights.semibold }}
            aria-hidden="true"
          >
            {label}
          </span>
          <span
            className={cn(
              "col-start-1 row-start-1",
              error ? "text-destructive" : "text-muted-foreground"
            )}
            style={{
              fontVariationSettings: fontWeights.normal,
            }}
          >
            {label}
          </span>
        </Field.Label>

        {/* Input container */}
        <div
          onMouseDown={(e) => {
            // The old wrapper was one big <label>, so a click anywhere (icon,
            // padding) focused the input. Keep that, without disturbing the
            // input's own caret placement.
            if (e.target === inputRef.current) return;
            e.preventDefault();
            inputRef.current?.focus();
          }}
          className={cn(
            // Fixed height (was py-2 around the line box) so the field sits
            // exactly on the ladder's control height.
            `flex items-center ${sizeClasses.gap} ${shape.input} ${
              compact ? "px-2" : "px-2.5"
            } ${sizeClasses.control} ring-1 transition-all duration-80`,
            bgClass,
            ringClass
          )}
        >
          {Icon && (
            <Icon
              size={sizeClasses.icon}
              strokeWidth={labelActive ? 2 : 1.5}
              className={cn(
                "shrink-0 transition-[color,stroke-width] duration-80",
                labelActive
                  ? "text-foreground"
                  : "text-muted-foreground"
              )}
            />
          )}
          <Field.Control
            ref={inputRef}
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onFocus={handleFocus}
            onBlur={handleBlur}
            placeholder={placeholder}
            className={cn(
              "w-full bg-transparent text-foreground placeholder:text-muted-foreground outline-none font-[inherit]",
              sizeClasses.text
            )}
            style={{ fontVariationSettings: fontWeights.normal }}
            {...props}
          />
        </div>

        {/* Error message — `match` pins it visible while our controlled
            `error` prop is standing. */}
        {error && (
          <Field.Error
            match
            className={cn(
              "text-destructive",
              compact ? "text-[11px] pl-2" : "text-[12px] pl-2.5"
            )}
            style={{ fontVariationSettings: fontWeights.medium }}
          >
            {error}
          </Field.Error>
        )}
      </Field.Root>
    );
  }
);

InputField.displayName = "InputField";

export { InputGroup, InputField };
export default InputGroup;
