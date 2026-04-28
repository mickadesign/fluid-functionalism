"use client";

import { forwardRef, type ButtonHTMLAttributes } from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import type { IconComponent } from "@/lib/icon-context";
import { cn } from "@/lib/utils";
import { useShape } from "@/lib/shape-context";

const buttonVariants = cva(
  [
    "group relative inline-flex items-center justify-center outline-none cursor-pointer",
    "text-box-trim-both text-box-edge-cap-alphabetic",
    "transition-all duration-80",
    "disabled:opacity-50 disabled:pointer-events-none",
    "focus-visible:ring-1 focus-visible:ring-[#6B97FF]",
  ],
  {
    variants: {
      variant: {
        primary: "bg-foreground text-background hover:bg-foreground/90 active:bg-foreground/80",
        secondary: "bg-accent text-foreground hover:bg-accent/80 active:bg-accent",
        tertiary:
          "border border-border text-foreground bg-transparent hover:bg-hover active:bg-active",
        ghost:
          "text-muted-foreground bg-transparent hover:bg-hover hover:text-foreground active:bg-active",
      },
      size: {
        sm: "h-7 px-3 text-[12px] gap-1",
        md: "h-8 px-4 text-[13px] gap-1.5",
        lg: "h-9 px-5 text-[14px] gap-1.5",
        "icon-sm": "h-8 w-8 p-0 [&_svg]:h-3.5 [&_svg]:w-3.5",
        icon: "h-9 w-9 p-0 [&_svg]:h-4 [&_svg]:w-4",
        "icon-lg": "h-10 w-10 p-0 [&_svg]:h-5 [&_svg]:w-5",
      },
      iconLeft: { true: "" },
      iconRight: { true: "" },
    },
    compoundVariants: [
      { size: "sm", iconLeft: true, className: "pl-[6px]" },
      { size: "md", iconLeft: true, className: "pl-[10px]" },
      { size: "lg", iconLeft: true, className: "pl-[14px]" },
      { size: "sm", iconRight: true, className: "pr-[6px]" },
      { size: "md", iconRight: true, className: "pr-[10px]" },
      { size: "lg", iconRight: true, className: "pr-[14px]" },
    ],
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
  leadingIcon?: IconComponent;
  trailingIcon?: IconComponent;
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
      style,
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
        className={cn(
          buttonVariants({
            variant,
            size,
            iconLeft: !isIconOnly && !!LeadingIcon,
            iconRight: !isIconOnly && !!TrailingIcon,
          }),
          shape.button,
          className
        )}
        disabled={disabled || loading}
        style={style}
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
            <span>{children}</span>
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
