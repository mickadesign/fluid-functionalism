import { forwardRef, useRef, useEffect, type HTMLAttributes } from "react";
import { motion } from "framer-motion";
import * as SwitchPrimitive from "@radix-ui/react-switch";
import { cn } from "../lib/utils";
import { springs } from "../lib/springs";
import { fontWeights } from "../lib/font-weight";

interface SwitchProps extends HTMLAttributes<HTMLDivElement> {
  label: string;
  checked: boolean;
  onToggle: () => void;
  disabled?: boolean;
}

const TRACK_WIDTH = 34;
const TRACK_HEIGHT = 20;
const THUMB_SIZE = 16;
const THUMB_OFFSET = 2;
const THUMB_TRAVEL = TRACK_WIDTH - THUMB_SIZE - THUMB_OFFSET * 2;

const Switch = forwardRef<HTMLDivElement, SwitchProps>(
  ({ label, checked, onToggle, disabled = false, className, ...props }, ref) => {
    const hasMounted = useRef(false);

    useEffect(() => {
      hasMounted.current = true;
    }, []);

    return (
      <div
        ref={ref}
        className={cn(
          "relative z-10 flex items-center gap-2.5 px-3 py-2 cursor-pointer select-none",
          disabled && "opacity-50 pointer-events-none",
          className
        )}
        onClick={() => !disabled && onToggle()}
        {...props}
      >
        {/* Switch */}
        <SwitchPrimitive.Root
          checked={checked}
          onCheckedChange={() => onToggle()}
          disabled={disabled}
          tabIndex={0}
          className={cn(
            "relative shrink-0 rounded-full outline-none cursor-pointer",
            "transition-colors duration-80",
            checked
              ? "bg-[#6B97FF]"
              : "bg-accent",
            "focus-visible:ring-1 focus-visible:ring-[#6B97FF] focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          )}
          style={{ width: TRACK_WIDTH, height: TRACK_HEIGHT }}
          onClick={(e) => e.stopPropagation()}
        >
          <SwitchPrimitive.Thumb asChild>
            <motion.span
              className="absolute top-0 left-0 block rounded-full bg-white shadow-sm"
              style={{ width: THUMB_SIZE, height: THUMB_SIZE }}
              initial={false}
              animate={{
                x: checked ? THUMB_OFFSET + THUMB_TRAVEL : THUMB_OFFSET,
                y: THUMB_OFFSET,
              }}
              transition={hasMounted.current ? springs.fast : { duration: 0 }}
            />
          </SwitchPrimitive.Thumb>
        </SwitchPrimitive.Root>

        {/* Label */}
        <span className="inline-grid text-[13px]">
          <span
            className="col-start-1 row-start-1 invisible"
            style={{ fontVariationSettings: fontWeights.semibold }}
            aria-hidden="true"
          >
            {label}
          </span>
          <span
            className={cn(
              "col-start-1 row-start-1 transition-[color,font-variation-settings] duration-80",
              checked ? "text-foreground" : "text-muted-foreground"
            )}
            style={{
              fontVariationSettings: checked
                ? fontWeights.semibold
                : fontWeights.normal,
            }}
          >
            {label}
          </span>
        </span>
      </div>
    );
  }
);

Switch.displayName = "Switch";

export { Switch };
export type { SwitchProps };
