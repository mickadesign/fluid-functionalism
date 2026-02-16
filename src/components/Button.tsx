import { forwardRef, type ButtonHTMLAttributes } from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import type { LucideIcon } from "lucide-react";
import { cn } from "../lib/utils";
import { fontWeights } from "../lib/font-weight";
import { useShape } from "../lib/shape-context";

const buttonVariants = cva(
  [
    "group relative inline-flex items-center justify-center outline-none cursor-pointer",
    "transition-all duration-80",
    "disabled:opacity-50 disabled:pointer-events-none",
    "focus-visible:ring-1 focus-visible:ring-[#6B97FF] focus-visible:ring-offset-2",
  ],
  {
    variants: {
      variant: {
        primary: "bg-foreground text-background hover:bg-foreground/90 active:bg-foreground/80",
        secondary: "bg-accent text-foreground hover:bg-accent/80 active:bg-accent",
        tertiary:
          "border border-border text-foreground bg-transparent hover:bg-muted active:bg-muted/60",
        ghost:
          "text-muted-foreground bg-transparent hover:bg-muted hover:text-foreground active:bg-muted/60",
      },
      size: {
        sm: "h-8 px-3 text-[12px] gap-1",
        md: "h-9 px-4 text-[13px] gap-1.5",
        lg: "h-10 px-5 text-[14px] gap-1.5",
        "icon-sm": "h-8 w-8 p-0 [&_svg]:h-3.5 [&_svg]:w-3.5",
        icon: "h-9 w-9 p-0 [&_svg]:h-4 [&_svg]:w-4",
        "icon-lg": "h-10 w-10 p-0 [&_svg]:h-5 [&_svg]:w-5",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  }
);

interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
  leadingIcon?: LucideIcon;
  trailingIcon?: LucideIcon;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      asChild = false,
      loading = false,
      leadingIcon: LeadingIcon,
      trailingIcon: TrailingIcon,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const Comp = asChild ? Slot : "button";
    const isIconOnly = size === "icon" || size === "icon-sm" || size === "icon-lg";
    const iconSize = size === "sm" ? 14 : size === "lg" ? 20 : 16;
    const shape = useShape();
    return (
      <Comp
        ref={ref}
        className={cn(buttonVariants({ variant, size }), shape.button, className)}
        disabled={disabled || loading}
        {...props}
      >
        {loading ? (
          <>
            <span className="flex items-center justify-center gap-[inherit] opacity-0">
              {LeadingIcon && !isIconOnly && (
                <LeadingIcon size={iconSize} strokeWidth={2} />
              )}
              {children}
              {TrailingIcon && !isIconOnly && (
                <TrailingIcon size={iconSize} strokeWidth={2} />
              )}
            </span>
            <span className="absolute inset-0 flex items-center justify-center">
              <svg
                className="h-8 w-8"
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
            {children}
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
            <span className="inline-grid">
              <span
                className="col-start-1 row-start-1 invisible"
                style={{ fontVariationSettings: fontWeights.semibold }}
                aria-hidden="true"
              >
                {children}
              </span>
              <span
                className="col-start-1 row-start-1 transition-[font-variation-settings] duration-80 btn-label"
              >
                {children}
              </span>
            </span>
            {TrailingIcon && (
              <TrailingIcon
                size={iconSize}
                strokeWidth={1.5}
                className="transition-[stroke-width] duration-80 group-hover:stroke-[2]"
              />
            )}
          </>
        )}
      </Comp>
    );
  }
);

Button.displayName = "Button";

export { Button, buttonVariants };
export type { ButtonProps };
