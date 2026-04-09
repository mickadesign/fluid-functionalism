"use client";

import {
  useRef,
  useEffect,
  createContext,
  useContext,
  forwardRef,
  Children,
  type ReactNode,
  type HTMLAttributes,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useIcon } from "@/lib/icon-context";
import type { IconName } from "@/lib/icon-context";
import { springs } from "@/lib/springs";
import { fontWeights } from "@/lib/font-weight";
import { useShape } from "@/lib/shape-context";
import { useProximityHover, type ItemRect } from "@/hooks/use-proximity-hover";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/registry/default/accordion";
import { Badge } from "@/registry/default/badge";
import type { BadgeColor } from "@/registry/default/badge";

// ─── Step List Context (proximity hover inside content) ─────────────────────

interface StepListContextValue {
  registerItem: (index: number, element: HTMLElement | null) => void;
  activeIndex: number | null;
}

const StepListContext = createContext<StepListContextValue | null>(null);

// ─── ThinkingSteps (root) ───────────────────────────────────────────────────

interface ThinkingStepsProps extends HTMLAttributes<HTMLDivElement> {
  defaultOpen?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: ReactNode;
}

const ThinkingSteps = forwardRef<HTMLDivElement, ThinkingStepsProps>(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  ({ defaultOpen = true, open, onOpenChange, children, className, defaultValue: _, ...props }, ref) => {
    const controlled = open !== undefined;
    return (
      <Accordion
        ref={ref}
        type="single"
        collapsible
        {...(controlled
          ? { value: open ? "thinking" : "" }
          : { defaultValue: defaultOpen ? "thinking" : "" }
        )}
        onValueChange={
          onOpenChange ? (v: string) => onOpenChange(v === "thinking") : undefined
        }
        className={cn("w-80 max-w-full", className)}
        {...props}
      >
        {/* Hide standalone accordion expanded bg */}
        <AccordionItem value="thinking" className="[&>.absolute]:hidden">
          {children}
        </AccordionItem>
      </Accordion>
    );
  }
);
ThinkingSteps.displayName = "ThinkingSteps";

// ─── ThinkingStepsHeader ────────────────────────────────────────────────────

interface ThinkingStepsHeaderProps extends HTMLAttributes<HTMLButtonElement> {
  children?: ReactNode;
}

const ThinkingStepsHeader = forwardRef<
  HTMLButtonElement,
  ThinkingStepsHeaderProps
>(({ children = "Thinking", className, ...props }, ref) => {
  return (
    <AccordionTrigger
      ref={ref}
      className={cn("[&>span:first-child]:flex-none", className)}
      {...props}
    >
      {children}
    </AccordionTrigger>
  );
});
ThinkingStepsHeader.displayName = "ThinkingStepsHeader";

// ─── ThinkingStepsContent ───────────────────────────────────────────────────

interface ThinkingStepsContentProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

const ThinkingStepsContent = forwardRef<
  HTMLDivElement,
  ThinkingStepsContentProps
// eslint-disable-next-line @typescript-eslint/no-unused-vars
>(({ children, className, ...props }, ref) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const shape = useShape();
  const { activeIndex, itemRects, sessionRef, handlers, registerItem, measureItems } =
    useProximityHover(containerRef);

  // Remeasure when children change (new steps streaming in)
  const childCount = Children.count(children);
  useEffect(() => {
    measureItems();
  }, [measureItems, childCount]);

  const activeRect: ItemRect | null =
    activeIndex !== null ? itemRects[activeIndex] ?? null : null;

  return (
    <AccordionContent>
      <StepListContext.Provider value={{ registerItem, activeIndex }}>
        <div
          ref={(node) => {
            (containerRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
            if (typeof ref === "function") ref(node);
            else if (ref) (ref as React.MutableRefObject<HTMLDivElement | null>).current = node;
          }}
          className={cn("relative flex flex-col", className)}
          onMouseEnter={handlers.onMouseEnter}
          onMouseMove={handlers.onMouseMove}
          onMouseLeave={handlers.onMouseLeave}
        >
          {/* Proximity hover background */}
          <AnimatePresence>
            {activeRect && (
              <motion.div
                key={sessionRef.current}
                className={`absolute ${shape.bg} bg-accent/40 dark:bg-accent/25 pointer-events-none z-0`}
                initial={{ opacity: 0, ...activeRect }}
                animate={{ opacity: 1, ...activeRect }}
                exit={{ opacity: 0, transition: { duration: 0.06 } }}
                transition={{ ...springs.fast, opacity: { duration: 0.08 } }}
              />
            )}
          </AnimatePresence>
          {children}
        </div>
      </StepListContext.Provider>
    </AccordionContent>
  );
});
ThinkingStepsContent.displayName = "ThinkingStepsContent";

// ─── ThinkingStep ───────────────────────────────────────────────────────────

type StepStatus = "complete" | "active" | "pending";

interface ThinkingStepProps {
  icon?: IconName;
  showIcon?: boolean;
  label: string;
  description?: string;
  status?: StepStatus;
  index: number;
  delay?: number;
  isLast?: boolean;
  children?: ReactNode;
  className?: string;
}

function ThinkingStep({
  icon = "dot",
  showIcon = true,
  label,
  description,
  status = "complete",
  index,
  delay = 0,
  isLast = false,
  children,
  className,
}: ThinkingStepProps) {
    const internalRef = useRef<HTMLDivElement>(null);
    const stepCtx = useContext(StepListContext);
    const Icon = useIcon(icon);
    const shape = useShape();

    // Register with proximity hover (depend on registerItem, not full context)
    const registerItem = stepCtx?.registerItem;
    useEffect(() => {
      if (registerItem) {
        registerItem(index, internalRef.current);
        return () => registerItem(index, null);
      }
    }, [index, registerItem]);

    if (status === "pending") return null;

    const isActive = status === "active";

    return (
      /* Outer: animates height to create space smoothly */
      <motion.div
        className={cn("relative z-10 overflow-hidden", className)}
        initial={{ height: 0 }}
        animate={{ height: "auto" }}
        transition={springs.slow}
      >
        {/* Inner: fades content in after space starts opening */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.24, delay: 0.08, ease: "easeOut" }}
        >
          {/* Content row — this is the proximity hover target */}
          <div
            ref={internalRef}
            data-proximity-index={index}
            className={cn("flex gap-2.5 px-2 py-1.5", shape.item)}
          >
            {/* Icon */}
            <div className="shrink-0 pt-0.5">
              {showIcon ? (
                <Icon
                  size={14}
                  strokeWidth={1.5}
                  className="text-muted-foreground"
                />
              ) : (
                <div className="w-[14px] h-[14px] flex items-center justify-center">
                  <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/60" />
                </div>
              )}
            </div>

            {/* Text content */}
            <div className="flex-1 flex flex-col gap-1 min-w-0">
              <span
                className={cn(
                  "text-[13px] leading-tight",
                  isActive && "shimmer-text"
                )}
                style={{ fontVariationSettings: fontWeights.medium }}
              >
                {label}
                {isActive && "…"}
              </span>
              {description && (
                <span className="text-[12px] text-muted-foreground leading-snug">
                  {description}
                </span>
              )}
              {children}
            </div>
          </div>

          {/* Connector line — outside hover target */}
          {!isLast && (
            <div className="flex pl-2 py-0">
              <div className="w-[14px] flex justify-center">
                <div className="w-px h-2 bg-border/60" />
              </div>
            </div>
          )}
        </motion.div>
      </motion.div>
    );
}

// ─── ThinkingStepSources ────────────────────────────────────────────────────

interface ThinkingStepSourcesProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

const ThinkingStepSources = forwardRef<HTMLDivElement, ThinkingStepSourcesProps>(
  ({ children, className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("flex flex-wrap gap-1.5 mt-1", className)}
        {...props}
      >
        {children}
      </div>
    );
  }
);
ThinkingStepSources.displayName = "ThinkingStepSources";

// ─── ThinkingStepSource ─────────────────────────────────────────────────────

interface ThinkingStepSourceProps {
  color?: BadgeColor;
  delay?: number;
  children: ReactNode;
  className?: string;
}

function ThinkingStepSource({ color = "gray", delay = 0, children, className }: ThinkingStepSourceProps) {
  return (
    <motion.span
      initial={{ opacity: 0, scale: 0.85, filter: "blur(4px)" }}
      animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
      transition={{
        ...springs.moderate,
        delay,
        filter: { duration: 0.12, delay },
      }}
    >
      <Badge variant="solid" size="sm" color={color} className={className}>
        {children}
      </Badge>
    </motion.span>
  );
}
ThinkingStepSource.displayName = "ThinkingStepSource";

// ─── ThinkingStepImage ──────────────────────────────────────────────────────

interface ThinkingStepImageProps {
  src: string;
  alt?: string;
  caption?: string;
  delay?: number;
  className?: string;
}

function ThinkingStepImage({ src, alt = "", caption, delay = 0, className }: ThinkingStepImageProps) {
  const shape = useShape();
  return (
    <motion.div
      className={cn("mt-1.5", className)}
      initial={{ opacity: 0, filter: "blur(4px)" }}
      animate={{ opacity: 1, filter: "blur(0px)" }}
      transition={{
        opacity: { duration: 0.2, delay, ease: "easeOut" },
        filter: { duration: 0.15, delay },
      }}
    >
      <img
        src={src}
        alt={alt}
        className={cn(
          "w-full max-w-[200px] object-cover",
          shape.container
        )}
      />
      {caption && (
        <span className="text-[11px] text-muted-foreground mt-1 block">
          {caption}
        </span>
      )}
    </motion.div>
  );
}
ThinkingStepImage.displayName = "ThinkingStepImage";

// ─── Exports ────────────────────────────────────────────────────────────────

export {
  ThinkingSteps,
  ThinkingStepsHeader,
  ThinkingStepsContent,
  ThinkingStep,
  ThinkingStepSources,
  ThinkingStepSource,
  ThinkingStepImage,
};

export type {
  ThinkingStepsProps,
  ThinkingStepsHeaderProps,
  ThinkingStepsContentProps,
  ThinkingStepProps,
  ThinkingStepSourcesProps,
  ThinkingStepSourceProps,
  ThinkingStepImageProps,
  StepStatus,
};
