"use client";

import {
  cloneElement,
  forwardRef,
  isValidElement,
  type ButtonHTMLAttributes,
  type ReactElement,
  type ReactNode,
} from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import type { IconComponent } from "@/lib/icon-context";
import { cn } from "@/lib/utils";
import { omit } from "@/lib/omit";
import { useShape } from "@/lib/shape-context";
import { useSizeVariant } from "@/lib/size-context";

const buttonVariants = cva(
  [
    // whitespace-nowrap: a label never breaks onto 2 lines. It also makes
    // the label the button's narrowest width, so a tight row moves the
    // button (or overflows) instead of squeezing it.
    "group relative isolate inline-flex items-center justify-center outline-none cursor-pointer select-none whitespace-nowrap",
    "transition-colors duration-80",
    // A loading button is disabled too, but stays at full strength: aria-busy
    // marks it as working, not unavailable.
    "disabled:not-aria-busy:opacity-50 disabled:pointer-events-none",
    "focus-visible:ring-1 focus-visible:ring-[color:var(--focus-ring,#6B97FF)]",
  ],
  {
    variants: {
      variant: {
        primary: "text-background",
        secondary: "text-foreground",
        tertiary: "text-foreground",
        ghost: "text-muted-foreground hover:text-foreground",
        // Tailwind reds, with their values as fallbacks for projects that
        // haven't emitted them. A red-500 wash in both themes under a
        // red-700 label (light) or a red-400 label (dark).
        destructive:
          "[--btn-red:var(--color-red-500,oklch(63.7%_0.237_25.331))] text-[color:light-dark(var(--color-red-700,oklch(50.5%_0.213_27.518)),var(--color-red-400,oklch(70.4%_0.191_22.216)))]",
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
  // shadcn's destructive, a red wash under red text, a step stronger:
  // 15% at rest and 25% on hover, 20/30 in dark mode. Pressing returns
  // to the rest wash, as secondary does.
  destructive:
    "[--btn-bg:light-dark(color-mix(in_oklab,var(--btn-red)_15%,transparent),color-mix(in_oklab,var(--btn-red)_20%,transparent))] group-hover:[--btn-bg:light-dark(color-mix(in_oklab,var(--btn-red)_25%,transparent),color-mix(in_oklab,var(--btn-red)_30%,transparent))] group-active:[--btn-bg:light-dark(color-mix(in_oklab,var(--btn-red)_15%,transparent),color-mix(in_oklab,var(--btn-red)_20%,transparent))] bg-[var(--btn-bg)] shadow-[0_0_0_1px_var(--btn-bg)] group-active:shadow-[0_0_0_0px_var(--btn-bg)]",
};

/* A loading button's fill: each variant above minus its group-hover: and
   group-active: overrides, so it holds the rest colors while the pointer is
   still over the button that was just clicked. */
const loadingBgVariants: Record<string, string> = Object.fromEntries(
  Object.entries(bgVariants).map(([variant, classes]) => [
    variant,
    classes
      .split(" ")
      .filter((c) => !c.startsWith("group-hover:") && !c.startsWith("group-active:"))
      .join(" "),
  ])
);

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
  destructive:
    "[--btn-bg:light-dark(color-mix(in_oklab,var(--btn-red)_25%,transparent),color-mix(in_oklab,var(--btn-red)_30%,transparent))] bg-[var(--btn-bg)] shadow-[0_0_0_1px_var(--btn-bg)] group-active:shadow-[0_0_0_0px_var(--btn-bg)]",
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

    // asChild: the user's element becomes the root, but the button's internal
    // structure (bg layer, content wrapper, spinner, icons) must survive. Slot
    // requires exactly one child, so instead of Slottable we clone the user's
    // element with our internals as its children — the element's own children
    // become the label inside the content wrapper.
    // `render` is the same thing written the Base UI way: its element is the
    // root and the children, when given, are the label (otherwise the
    // element keeps its own).
    const asChildElement =
      render && isValidElement(render)
        ? children === undefined
          ? (render as ReactElement<{ children?: ReactNode }>)
          : cloneElement(render as ReactElement<{ children?: ReactNode }>, undefined, children)
        : asChild && isValidElement(children)
          ? (children as ReactElement<{ children?: ReactNode }>)
          : null;
    const Comp = asChildElement ? Slot : "button";
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
    const shape = useShape();
    const bgClass = active
      ? activeBgVariants[variant ?? "primary"]
      : loading
        ? loadingBgVariants[variant ?? "primary"]
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
                {/* Two arcs on one eased lap per second: they stretch while
                    turning fast and shrink back into 2 dots as they settle.
                    The offset moves half the growth so both ends move. The
                    dashes sit at 25% and 75% of the path so neither crosses
                    its start: a dash split there gets 2 extra caps and draws
                    1.5px too long. rotate(-90) puts the dots back at 3 and
                    9 o'clock. The 0.01 dash (not 0) keeps Safari drawing
                    the round caps as dots. */}
                <svg width={iconSize} height={iconSize} viewBox="0 0 16 16" fill="none">
                  <g className="origin-center [transform-box:fill-box] animate-[spinner-turn_1s_cubic-bezier(0.65,0,0.35,1)_infinite] motion-reduce:[animation-duration:2s]">
                    <circle
                      cx="8"
                      cy="8"
                      r="6.25"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      pathLength="100"
                      transform="rotate(-90 8 8)"
                      className="animate-[spinner-breathe_1s_cubic-bezier(0.65,0,0.35,1)_infinite] motion-reduce:[animation-duration:2s]"
                    />
                  </g>
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

    return (
      <Comp
        ref={ref}
        className={cn(
          buttonVariants({
            variant,
            size: resolvedSize,
            iconLeft: !isIconOnly && !!LeadingIcon,
            iconRight: !isIconOnly && !!TrailingIcon,
          }),
          shape.button,
          className
        )}
        // asChild roots (e.g. an anchor) don't take the disabled attribute —
        // Slot would spread it onto the element as invalid HTML.
        disabled={asChildElement ? undefined : disabled || loading}
        aria-busy={loading || undefined}
        style={style}
        {...props}
      >
        {asChildElement
          ? cloneElement(asChildElement, undefined, internals)
          : internals}
      </Comp>
    );
  }
);

Button.displayName = "Button";

export { Button, buttonVariants };
export type { ButtonProps, ButtonSize };
