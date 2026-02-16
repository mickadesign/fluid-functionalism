import { forwardRef, type ButtonHTMLAttributes } from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import type { LucideIcon } from "lucide-react";
import { cn } from "../lib/utils";
import { fontWeights } from "../lib/font-weight";

const buttonVariants = cva(
  [
    "relative inline-flex items-center justify-center rounded-lg outline-none cursor-pointer",
    "transition-all duration-80",
    "disabled:opacity-50 disabled:pointer-events-none",
    "focus-visible:ring-1 focus-visible:ring-[#6B97FF] focus-visible:ring-offset-2",
    "active:scale-[0.97]",
  ],
  {
    variants: {
      variant: {
        primary: "bg-foreground text-background hover:bg-foreground/90",
        secondary: "bg-accent text-foreground hover:bg-accent/80",
        tertiary:
          "border border-border text-foreground bg-transparent hover:bg-muted",
        ghost:
          "text-muted-foreground bg-transparent hover:bg-muted hover:text-foreground",
      },
      size: {
        sm: "h-8 px-3 text-[12px] gap-1.5",
        md: "h-9 px-4 text-[13px] gap-2",
        lg: "h-10 px-5 text-[14px] gap-2",
        icon: "h-9 w-9 p-0",
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
    const isIconOnly = size === "icon";
    const iconSize = size === "sm" ? 14 : 16;

    return (
      <Comp
        ref={ref}
        className={cn(buttonVariants({ variant, size, className }))}
        disabled={disabled || loading}
        style={{ fontVariationSettings: fontWeights.medium }}
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
                className="h-4 w-4 animate-spin"
                viewBox="0 0 24 24"
                fill="none"
              >
                <circle
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="3"
                  className="opacity-25"
                />
                <path
                  d="M12 2a10 10 0 0 1 10 10"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
              </svg>
            </span>
          </>
        ) : (
          <>
            {LeadingIcon && !isIconOnly && (
              <LeadingIcon size={iconSize} strokeWidth={2} />
            )}
            {children}
            {TrailingIcon && !isIconOnly && (
              <TrailingIcon size={iconSize} strokeWidth={2} />
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
