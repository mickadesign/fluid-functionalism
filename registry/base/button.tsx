"use client";

import {
  cloneElement,
  forwardRef,
  isValidElement,
  type ButtonHTMLAttributes,
  type ReactElement,
  type ReactNode,
} from "react";
import { Button as ButtonPrimitive } from "@base-ui/react/button";
import { cva, type VariantProps } from "class-variance-authority";
import type { IconComponent } from "@/lib/icon-context";
import { cn } from "@/lib/utils";
import { omit } from "@/lib/omit";
import { useShape } from "@/lib/shape-context";
import { useSizeVariant } from "@/lib/size-context";

const buttonVariants = cva(
  [
    "group relative isolate inline-flex items-center justify-center outline-none cursor-pointer select-none",
    "transition-colors duration-80",
    "disabled:opacity-50 disabled:pointer-events-none",
    "focus-visible:ring-1 focus-visible:ring-[color:var(--focus-ring,#6B97FF)]",
  ],
  {
    variants: {
      variant: {
        primary: "text-background",
        secondary: "text-foreground",
        tertiary: "text-foreground",
        ghost: "text-muted-foreground hover:text-foreground",
      },
      // The two-step size ladder shared by every control — see /docs/sizes.
      // default = 36px control height, compact = 28px for dense surfaces.
      size: {
        default: "h-9 px-4 text-[length:var(--fs-body,13px)] leading-[var(--lh-body,20px)] gap-1.5",
        compact: "h-7 px-3 text-[length:var(--fs-body-compact,12px)] leading-[var(--lh-body-compact,18px)] gap-1",
        icon: "h-9 w-9 p-0 [&_svg]:h-4 [&_svg]:w-4",
        "icon-compact": "h-7 w-7 p-0 [&_svg]:h-3.5 [&_svg]:w-3.5",
      },
      iconLeft: { true: "" },
      iconRight: { true: "" },
    },
    // An icon sits 4px closer to its edge than text does: 12px default and
    // 8px compact, against the 16px / 12px base padding.
    compoundVariants: [
      { size: "compact", iconLeft: true, className: "pl-2" },
      { size: "default", iconLeft: true, className: "pl-3" },
      { size: "compact", iconRight: true, className: "pr-2" },
      { size: "default", iconRight: true, className: "pr-3" },
    ],
    defaultVariants: {
      variant: "primary",
      size: "default",
    },
  }
);

type ButtonSizeCanonical = "default" | "compact" | "icon" | "icon-compact";

/** Public size values: the canonical two-size scale plus the pre-sizes-system
 *  aliases, kept so existing call sites keep compiling. Aliases resolve onto
 *  the canonical ladder (sm → compact; md/lg → default). */
type ButtonSize =
  | ButtonSizeCanonical
  | "sm"
  | "md"
  | "lg"
  | "icon-sm"
  | "icon-lg";

const legacySizeAliases: Partial<Record<ButtonSize, ButtonSizeCanonical>> = {
  sm: "compact",
  md: "default",
  lg: "default",
  "icon-sm": "icon-compact",
  "icon-lg": "icon",
};

interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    Omit<VariantProps<typeof buttonVariants>, "size"> {
  /** Omitted, the button follows the surrounding SizeProvider (default 36px,
   *  compact 28px). Legacy sm/md/lg values still resolve. */
  size?: ButtonSize;
  /** When true, the given single React-element child becomes the rendered element (slot-style). */
  asChild?: boolean;
  /** Base UI's spelling of `asChild`: the element to render as, with the
   *  button's children as its label. Accepted so code written either way
   *  works, including the shadcn CLI's asChild-to-render rewrite in Base UI
   *  projects. */
  render?: ReactElement;
  /** Accepted for Base UI parity and ignored: the button already knows
   *  whether it renders a native button. */
  nativeButton?: boolean;
  loading?: boolean;
  leadingIcon?: IconComponent;
  trailingIcon?: IconComponent;
  /** Force the visual pressed/held state. Useful when the button drives an
   *  external open piece of UI (a popover, dropdown, etc.) so it reads as
   *  engaged while the menu is showing. */
  active?: boolean;
}

/* Press effect: the surface layer sits 1px inside the button and a
   same-color box-shadow spread fills it back out to the full bounds.
   Pressing collapses the spread, shrinking the surface by exactly 1px per
   side at any width — a scale would warp (2% of a 400px button is 8px
   sideways but under 1px vertically). Primary's fills are opaque
   color-mix()es. Secondary's are see-through (--tint), so it takes on the
   surface or tinted banner under it; its fill and spread ring still never
   double up, since an outer shadow renders only outside the surface box. */
const bgVariants: Record<string, string> = {
  primary:
    "[--btn-bg:var(--foreground)] group-hover:[--btn-bg:color-mix(in_oklab,var(--foreground)_90%,var(--background))] group-active:[--btn-bg:color-mix(in_oklab,var(--foreground)_80%,var(--background))] bg-[var(--btn-bg)] shadow-[0_0_0_1px_var(--btn-bg)] group-active:shadow-[0_0_0_0px_var(--btn-bg)]",
  secondary:
    "[--btn-bg:var(--tint)] group-hover:[--btn-bg:var(--tint-hover)] group-active:[--btn-bg:var(--tint)] bg-[var(--btn-bg)] shadow-[0_0_0_1px_var(--btn-bg)] group-active:shadow-[0_0_0_0px_var(--btn-bg)]",
  // The border ring is an outer 1px shadow at rest that hands off to an
  // inset 1px shadow when pressed, so the ring moves inward with the
  // surface. The translucent fill only ever reaches the ring's inner edge
  // (exactly the surface box), so it needs no spread of its own.
  tertiary:
    "bg-transparent shadow-[0_0_0_1px_var(--border),inset_0_0_0_0px_var(--border)] group-hover:bg-hover group-active:bg-active group-active:shadow-[0_0_0_0px_var(--border),inset_0_0_0_1px_var(--border)]",
  // Translucent fill + same-color spread never double up: outer shadows
  // render only outside the surface box.
  ghost:
    "bg-transparent shadow-[0_0_0_1px_transparent] group-hover:bg-hover group-hover:shadow-[0_0_0_1px_var(--hover)] group-active:bg-active group-active:shadow-[0_0_0_0px_var(--active)]",
};

/* Forced-active (`active` prop): pressed colors at full size; the
   geometric press-collapse still reacts on top. */
const activeBgVariants: Record<string, string> = {
  primary:
    "[--btn-bg:color-mix(in_oklab,var(--foreground)_80%,var(--background))] bg-[var(--btn-bg)] shadow-[0_0_0_1px_var(--btn-bg)] group-active:shadow-[0_0_0_0px_var(--btn-bg)]",
  secondary:
    "[--btn-bg:var(--tint)] bg-[var(--btn-bg)] shadow-[0_0_0_1px_var(--btn-bg)] group-active:shadow-[0_0_0_0px_var(--btn-bg)]",
  tertiary:
    "bg-active shadow-[0_0_0_1px_var(--border),inset_0_0_0_0px_var(--border)] group-active:shadow-[0_0_0_0px_var(--border),inset_0_0_0_1px_var(--border)]",
  ghost:
    "bg-active shadow-[0_0_0_1px_var(--active)] group-active:shadow-[0_0_0_0px_var(--active)]",
};

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      asChild = false,
      render,
      loading = false,
      leadingIcon: LeadingIcon,
      trailingIcon: TrailingIcon,
      active = false,
      disabled,
      children,
      style,
      ...rest
    },
    ref
  ) => {
    // nativeButton is accepted for Base UI parity and ignored (see its doc).
    const props = omit(rest, ["nativeButton"]);

    // asChild: the user's element becomes the root while the button's internal
    // structure (bg layer, content wrapper, spinner, icons) survives as its
    // children — the element's own children become the label. We clone the
    // element directly instead of routing through ButtonPrimitive's `render`:
    // Base UI would bolt button semantics (role="button", Space activation)
    // onto e.g. a link, where plain-link output is wanted.
    // `render` is the same thing written the Base UI way, and takes the same
    // path: its element is the root and the children, when given, are the
    // label (otherwise the element keeps its own).
    type SlotElement = ReactElement<{
      children?: ReactNode;
      className?: string;
      style?: React.CSSProperties;
      ref?: React.Ref<HTMLButtonElement>;
    }>;
    const asChildElement =
      render && isValidElement(render)
        ? children === undefined
          ? (render as SlotElement)
          : cloneElement(render as SlotElement, undefined, children)
        : asChild && isValidElement(children)
          ? (children as SlotElement)
          : null;
    const label = asChildElement ? asChildElement.props.children : children;
    // Resolve the size: explicit prop (legacy aliases mapped onto the
    // canonical ladder) > surrounding SizeProvider > default.
    const contextSize = useSizeVariant();
    const resolvedSize: ButtonSizeCanonical = size
      ? legacySizeAliases[size] ?? (size as ButtonSizeCanonical)
      : contextSize === "compact"
        ? "compact"
        : "default";
    const isIconOnly = resolvedSize === "icon" || resolvedSize === "icon-compact";
    const isCompact =
      resolvedSize === "compact" || resolvedSize === "icon-compact";
    const iconSize = isCompact ? 14 : 16;
    // Spinner box tracks the button height so the loading glyph stays
    // proportionate across sizes.
    const spinnerSizeClass = isCompact ? "h-7 w-7" : "h-9 w-9";
    const shape = useShape();
    const bgClass = active
      ? activeBgVariants[variant ?? "primary"]
      : bgVariants[variant ?? "primary"];

    const internals = (
      <>
        <span
          aria-hidden
          className={cn(
            "absolute inset-px rounded-[inherit] transition-[box-shadow,background-color] [transition-duration:180ms,80ms] [transition-timing-function:cubic-bezier(0.23,1,0.32,1),ease] group-active:[transition-duration:80ms,80ms]",
            bgClass
          )}
        />
        <span className="relative inline-flex items-center justify-center gap-[inherit]">
          {loading ? (
            <>
              <span className="flex items-center justify-center gap-[inherit] opacity-0">
                {LeadingIcon && !isIconOnly && (
                  <LeadingIcon size={iconSize} strokeWidth={2} />
                )}
                {label}
                {TrailingIcon && !isIconOnly && (
                  <TrailingIcon size={iconSize} strokeWidth={2} />
                )}
              </span>
              <span className="absolute inset-0 flex items-center justify-center">
                <svg
                  className={spinnerSizeClass}
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <path
                    d="M 12 12 C 14 8.5 19 8.5 19 12 C 19 15.5 14 15.5 12 12 C 10 8.5 5 8.5 5 12 C 5 15.5 10 15.5 12 12 Z"
                    stroke="currentColor"
                    strokeWidth="1.125"
                    strokeLinecap="round"
                    pathLength="100"
                    style={{
                      strokeDasharray: "15 85",
                      animation: "spinner-move 2s linear infinite, spinner-dash 4s ease-in-out infinite",
                    }}
                  />
                </svg>
              </span>
            </>
          ) : isIconOnly ? (
            <span className="[&_svg]:stroke-[1.5] [&_svg]:transition-[stroke-width] [&_svg]:duration-80 group-hover:[&_svg]:stroke-[2]">
              {label}
            </span>
          ) : (
            <>
              {LeadingIcon && (
                <LeadingIcon
                  size={iconSize}
                  strokeWidth={1.5}
                  className="transition-[stroke-width] duration-80 group-hover:stroke-[2]"
                />
              )}
              {/* text-box only applies to block containers, so the trim lives
                  on the label span (a blockified flex item), not the flex root.
                  The button's height is fixed (h-*), so this doesn't change
                  layout — it just centers the cap-to-baseline box optically. */}
              <span className="[text-box:trim-both_cap_alphabetic]">{label}</span>
              {TrailingIcon && (
                <TrailingIcon
                  size={iconSize}
                  strokeWidth={1.5}
                  className="transition-[stroke-width] duration-80 group-hover:stroke-[2]"
                />
              )}
            </>
          )}
        </span>
      </>
    );

    const rootClassName = cn(
      buttonVariants({
        variant,
        size: resolvedSize,
        iconLeft: !isIconOnly && !!LeadingIcon,
        iconRight: !isIconOnly && !!TrailingIcon,
      }),
      shape.button,
      className
    );

    if (asChildElement) {
      const childProps = asChildElement.props;
      return cloneElement(
        asChildElement,
        {
          ...props,
          ref,
          className: cn(rootClassName, childProps.className),
          style: { ...style, ...childProps.style },
        },
        internals
      );
    }

    return (
      <ButtonPrimitive
        // Base UI's `ButtonPrimitive` forwards to an HTMLButtonElement;
        // keep the public ref type narrow so consumers see the right type.
        ref={ref as React.Ref<HTMLButtonElement>}
        className={rootClassName}
        disabled={disabled || loading}
        style={style}
        {...props}
      >
        {internals}
      </ButtonPrimitive>
    );
  }
);

Button.displayName = "Button";

export { Button, buttonVariants };
export type { ButtonProps, ButtonSize };
