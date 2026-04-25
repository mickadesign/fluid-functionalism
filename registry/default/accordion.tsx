"use client";

import {
  useRef,
  useState,
  useEffect,
  useCallback,
  createContext,
  useContext,
  forwardRef,
  type ReactNode,
  type HTMLAttributes,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import * as AccordionPrimitive from "@radix-ui/react-accordion";
import { cn } from "@/lib/utils";
import { useIcon } from "@/lib/icon-context";
import { springs } from "@/lib/springs";
import { fontWeights } from "@/lib/font-weight";
import { useProximityHover } from "@/hooks/use-proximity-hover";
import { useShape } from "@/lib/shape-context";

// ─── Contexts ────────────────────────────────────────────────────────────────

interface ItemRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

interface AccordionGroupContextValue {
  registerItem: (index: number, element: HTMLElement | null) => void;
  registerFullItem: (index: number, element: HTMLElement | null) => void;
  activeIndex: number | null;
  grouped: true;
  remeasure: () => void;
  openValues: Set<string>;
  openItemRects: Map<number, ItemRect>;
  toggleValue: (value: string) => void;
}

const AccordionGroupContext =
  createContext<AccordionGroupContextValue | null>(null);

function useAccordionGroup() {
  return useContext(AccordionGroupContext);
}

interface AccordionItemContextValue {
  index?: number;
  value: string;
  isOpen: boolean;
  onToggle: () => void;
  triggerRef: React.MutableRefObject<HTMLDivElement | null>;
}

const AccordionItemContext =
  createContext<AccordionItemContextValue | null>(null);

function useAccordionItemContext() {
  const ctx = useContext(AccordionItemContext);
  if (!ctx)
    throw new Error(
      "AccordionTrigger/AccordionContent must be used within an AccordionItem"
    );
  return ctx;
}

// ─── AccordionGroup ──────────────────────────────────────────────────────────

type AccordionGroupSingleProps = {
  type?: "single";
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  collapsible?: boolean;
};

type AccordionGroupMultipleProps = {
  type: "multiple";
  value?: string[];
  defaultValue?: string[];
  onValueChange?: (value: string[]) => void;
};

type AccordionGroupProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
} & (AccordionGroupSingleProps | AccordionGroupMultipleProps);

const AccordionGroup = forwardRef<HTMLDivElement, AccordionGroupProps>(
  (props, ref) => {
    const {
      children,
      type = "single",
      className,
      ...rest
    } = props;

    const containerRef = useRef<HTMLDivElement>(null);
    const fullItemElementsRef = useRef<Map<number, HTMLElement>>(new Map());
    const [openItemRects, setOpenItemRects] = useState<Map<number, ItemRect>>(
      new Map()
    );

    const {
      activeIndex,
      setActiveIndex,
      itemRects,
      sessionRef,
      handlers,
      registerItem,
      measureItems,
    } = useProximityHover(containerRef);

    const registerFullItem = useCallback(
      (index: number, element: HTMLElement | null) => {
        if (element) {
          fullItemElementsRef.current.set(index, element);
        } else {
          fullItemElementsRef.current.delete(index);
        }
      },
      []
    );

    const measureFullItems = useCallback(() => {
      if (!containerRef.current) return;
      const next = new Map<number, ItemRect>();
      // Use offset* (layout coords) to match the proximity hook's items.
      // getBoundingClientRect would return visual coords already scaled by
      // any ancestor transform; once applied as CSS inside the same scaled
      // container, the overlay would scale a second time.
      fullItemElementsRef.current.forEach((el, idx) => {
        next.set(idx, {
          top: el.offsetTop,
          left: el.offsetLeft,
          width: el.offsetWidth,
          height: el.offsetHeight,
        });
      });
      setOpenItemRects(next);
    }, []);

    // Track open values for context
    const [internalSingleValue, setInternalSingleValue] = useState<string>(
      () => {
        if (type === "single") {
          const sp = props as AccordionGroupSingleProps;
          return sp.defaultValue ?? "";
        }
        return "";
      }
    );
    const [internalMultipleValue, setInternalMultipleValue] = useState<
      string[]
    >(() => {
      if (type === "multiple") {
        const mp = props as AccordionGroupMultipleProps;
        return mp.defaultValue ?? [];
      }
      return [];
    });
    const singleOnValueChange = (props as AccordionGroupSingleProps).onValueChange;
    const multipleOnValueChange = (props as AccordionGroupMultipleProps).onValueChange;
    const controlledMultipleValue = (props as AccordionGroupMultipleProps).value;

    const openValues = new Set<string>(
      type === "multiple"
        ? (props as AccordionGroupMultipleProps).value ?? internalMultipleValue
        : (() => {
            const v =
              (props as AccordionGroupSingleProps).value ?? internalSingleValue;
            return v ? [v] : [];
          })()
    );

    const handleSingleValueChange = useCallback(
      (value: string) => {
        const sp = props as AccordionGroupSingleProps;
        if (sp.onValueChange) sp.onValueChange(value);
        else setInternalSingleValue(value);
      },
      [singleOnValueChange]
    );

    const handleMultipleValueChange = useCallback(
      (value: string[]) => {
        const mp = props as AccordionGroupMultipleProps;
        if (mp.onValueChange) mp.onValueChange(value);
        else setInternalMultipleValue(value);
      },
      [multipleOnValueChange]
    );

    const toggleValue = useCallback(
      (val: string) => {
        if (type === "multiple") {
          const current =
            (props as AccordionGroupMultipleProps).value ??
            internalMultipleValue;
          handleMultipleValueChange(current.filter((v) => v !== val));
        } else {
          handleSingleValueChange("");
        }
      },
      [
        type,
        handleSingleValueChange,
        handleMultipleValueChange,
        internalMultipleValue,
        controlledMultipleValue,
      ]
    );

    useEffect(() => {
      measureItems();
      measureFullItems();
    }, [measureItems, measureFullItems, children]);

    // Remeasure synchronously when open values change so the first
    // paint already reflects shifted trigger positions.
    const openValuesKey = [...openValues].join(",");

    useEffect(() => {
      measureItems();
      measureFullItems();
    }, [measureItems, measureFullItems, openValuesKey]);

    const [focusedIndex, setFocusedIndex] = useState<number | null>(null);

    const activeRect = activeIndex !== null ? itemRects[activeIndex] : null;
    const focusRect = focusedIndex !== null ? itemRects[focusedIndex] : null;
    // Dimming: reduce expanded BG opacity when hovering a non-expanded trigger
    const isHoveringNonOpen =
      activeIndex !== null && !openItemRects.has(activeIndex);
    const shape = useShape();

    // Strip non-HTML props before spreading
    const {
      value: _value,
      defaultValue: _defaultValue,
      onValueChange: _onValueChange,
      collapsible: _collapsible,
      type: _type,
      ...htmlProps
    } = rest as Record<string, unknown>;

    // Build Radix root props
    const radixProps =
      type === "multiple"
        ? {
            type: "multiple" as const,
            value:
              (props as AccordionGroupMultipleProps).value ??
              internalMultipleValue,
            onValueChange: handleMultipleValueChange,
          }
        : {
            type: "single" as const,
            collapsible:
              (props as AccordionGroupSingleProps).collapsible ?? true,
            value:
              (props as AccordionGroupSingleProps).value ?? internalSingleValue,
            onValueChange: handleSingleValueChange,
          };

    return (
      <AccordionGroupContext.Provider
        value={{
          registerItem,
          registerFullItem,
          activeIndex,
          grouped: true,
          remeasure: () => {
            measureItems();
            measureFullItems();
          },
          openValues,
          openItemRects,
          toggleValue,
        }}
      >
        <AccordionPrimitive.Root {...radixProps} asChild>
          <div
            ref={(node) => {
              (
                containerRef as React.MutableRefObject<HTMLDivElement | null>
              ).current = node;
              if (typeof ref === "function") ref(node);
              else if (ref)
                (
                  ref as React.MutableRefObject<HTMLDivElement | null>
                ).current = node;
            }}
            onMouseEnter={handlers.onMouseEnter}
            onMouseMove={handlers.onMouseMove}
            onMouseLeave={handlers.onMouseLeave}
            onFocus={(e) => {
              const indexAttr = (e.target as HTMLElement)
                .closest("[data-proximity-index]")
                ?.getAttribute("data-proximity-index");
              if (indexAttr != null) {
                const idx = Number(indexAttr);
                setActiveIndex(idx);
                setFocusedIndex(
                  (e.target as HTMLElement).matches(":focus-visible")
                    ? idx
                    : null
                );
              }
            }}
            onBlur={(e) => {
              if (
                containerRef.current?.contains(e.relatedTarget as Node)
              )
                return;
              setFocusedIndex(null);
              setActiveIndex(null);
            }}
            className={cn(
              "relative flex flex-col gap-0.5 w-72 max-w-full select-none",
              className
            )}
            {...(htmlProps as HTMLAttributes<HTMLDivElement>)}
          >
            {/* Expanded item backgrounds */}
            <AnimatePresence>
              {[...openItemRects.entries()].map(([idx, rect]) => (
                <motion.div
                  key={`expanded-${idx}`}
                  className={`absolute ${shape.bg} bg-accent/20 dark:bg-accent/12 pointer-events-none`}
                  initial={false}
                  animate={{
                    top: rect.top,
                    left: rect.left,
                    width: rect.width,
                    height: rect.height,
                    opacity: isHoveringNonOpen ? 0.7 : 1,
                  }}
                  exit={{ opacity: 0, transition: { duration: 0.12 } }}
                  transition={{
                    top: { duration: 0 },
                    left: { duration: 0 },
                    width: { duration: 0 },
                    height: { duration: 0 },
                    opacity: { duration: 0.08 },
                  }}
                />
              ))}
            </AnimatePresence>

            {/* Hover background */}
            <AnimatePresence>
              {activeRect && (
                <motion.div
                  key={sessionRef.current}
                  className={`absolute ${shape.bg} bg-accent/40 dark:bg-accent/25 pointer-events-none`}
                  initial={{
                    opacity: 0,
                    top: activeRect.top,
                    left: activeRect.left,
                    width: activeRect.width,
                    height: activeRect.height,
                  }}
                  animate={{
                    opacity: 1,
                    top: activeRect.top,
                    left: activeRect.left,
                    width: activeRect.width,
                    height: activeRect.height,
                  }}
                  exit={{ opacity: 0, transition: { duration: 0.06 } }}
                  transition={{
                    ...springs.fast,
                    opacity: { duration: 0.08 },
                  }}
                />
              )}
            </AnimatePresence>

            {/* Focus ring */}
            <AnimatePresence>
              {focusRect && (
                <motion.div
                  className={`absolute ${shape.focusRing} pointer-events-none z-20 border border-[#6B97FF]`}
                  initial={false}
                  animate={{
                    left: focusRect.left - 2,
                    top: focusRect.top - 2,
                    width: focusRect.width + 4,
                    height: focusRect.height + 4,
                  }}
                  exit={{ opacity: 0, transition: { duration: 0.06 } }}
                  transition={{
                    ...springs.fast,
                    opacity: { duration: 0.08 },
                  }}
                />
              )}
            </AnimatePresence>

            {children}
          </div>
        </AccordionPrimitive.Root>
      </AccordionGroupContext.Provider>
    );
  }
);

AccordionGroup.displayName = "AccordionGroup";

// ─── Accordion (Standalone) ──────────────────────────────────────────────────

interface AccordionProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  type?: "single" | "multiple";
  collapsible?: boolean;
  defaultValue?: string | string[];
  value?: string | string[];
  onValueChange?: ((value: string) => void) | ((value: string[]) => void);
}

const Accordion = forwardRef<HTMLDivElement, AccordionProps>(
  (
    {
      children,
      type = "single",
      collapsible = true,
      defaultValue,
      value,
      onValueChange,
      className,
      ...props
    },
    ref
  ) => {
    // Track open values for AccordionItemContext
    const [internalSingleValue, setInternalSingleValue] = useState<string>(
      () => {
        if (type === "single") {
          return (defaultValue as string) ?? "";
        }
        return "";
      }
    );
    const [internalMultipleValue, setInternalMultipleValue] = useState<
      string[]
    >(() => {
      if (type === "multiple") {
        return (defaultValue as string[]) ?? [];
      }
      return [];
    });

    const openValues = new Set<string>(
      type === "multiple"
        ? (value as string[] | undefined) ?? internalMultipleValue
        : (() => {
            const v = (value as string | undefined) ?? internalSingleValue;
            return v ? [v] : [];
          })()
    );

    const handleSingleChange = useCallback(
      (v: string) => {
        if (onValueChange) (onValueChange as (v: string) => void)(v);
        else setInternalSingleValue(v);
      },
      [onValueChange]
    );

    const handleMultipleChange = useCallback(
      (v: string[]) => {
        if (onValueChange) (onValueChange as (v: string[]) => void)(v);
        else setInternalMultipleValue(v);
      },
      [onValueChange]
    );

    const standaloneToggle = useCallback(
      (val: string) => {
        if (type === "multiple") {
          const current =
            (value as string[] | undefined) ?? internalMultipleValue;
          handleMultipleChange(current.filter((v) => v !== val));
        } else {
          handleSingleChange("");
        }
      },
      [type, value, internalMultipleValue, handleSingleChange, handleMultipleChange]
    );

    const radixProps =
      type === "multiple"
        ? {
            type: "multiple" as const,
            value: (value as string[] | undefined) ?? internalMultipleValue,
            defaultValue: defaultValue as string[] | undefined,
            onValueChange: handleMultipleChange,
          }
        : {
            type: "single" as const,
            collapsible,
            value: (value as string | undefined) ?? internalSingleValue,
            defaultValue: defaultValue as string | undefined,
            onValueChange: handleSingleChange,
          };

    return (
      <AccordionPrimitive.Root {...radixProps} asChild>
        <div
          ref={ref}
          className={cn(
            "w-72 max-w-full flex flex-col gap-0.5",
            className
          )}
          {...props}
        >
          <StandaloneOpenContext.Provider value={openValues}>
            <StandaloneToggleContext.Provider value={standaloneToggle}>
              {children}
            </StandaloneToggleContext.Provider>
          </StandaloneOpenContext.Provider>
        </div>
      </AccordionPrimitive.Root>
    );
  }
);

Accordion.displayName = "Accordion";

// Standalone contexts to provide open values and toggle without AccordionGroup
const StandaloneOpenContext = createContext<Set<string>>(new Set());
const StandaloneToggleContext = createContext<(value: string) => void>(
  () => {}
);

// ─── AccordionItem ───────────────────────────────────────────────────────────

interface AccordionItemProps extends HTMLAttributes<HTMLDivElement> {
  value: string;
  index?: number;
  disabled?: boolean;
  children: ReactNode;
}

const AccordionItem = forwardRef<HTMLDivElement, AccordionItemProps>(
  ({ value, index, disabled, children, className, ...props }, ref) => {
    const internalRef = useRef<HTMLDivElement>(null);
    const groupCtx = useAccordionGroup();
    const standaloneOpen = useContext(StandaloneOpenContext);
    const standaloneToggle = useContext(StandaloneToggleContext);
    const shape = useShape();

    const isOpen = groupCtx?.grouped
      ? groupCtx.openValues.has(value)
      : standaloneOpen.has(value);

    const triggerRef = useRef<HTMLDivElement>(null);

    const onToggle = useCallback(() => {
      if (groupCtx?.grouped) {
        groupCtx.toggleValue(value);
      } else {
        standaloneToggle(value);
      }
    }, [groupCtx, standaloneToggle, value]);

    // Register trigger element (not full item) for proximity hover
    useEffect(() => {
      if (groupCtx?.grouped && index !== undefined) {
        groupCtx.registerItem(index, triggerRef.current);
        return () => groupCtx.registerItem(index, null);
      }
    }, [index, groupCtx]);

    // Register full item element for expanded background measurement
    useEffect(() => {
      if (groupCtx?.grouped && index !== undefined) {
        if (isOpen) {
          groupCtx.registerFullItem(index, internalRef.current);
        } else {
          groupCtx.registerFullItem(index, null);
        }
        return () => groupCtx.registerFullItem(index, null);
      }
    }, [index, groupCtx, isOpen]);

    return (
      <AccordionItemContext.Provider value={{ index, value, isOpen, onToggle, triggerRef }}>
        <AccordionPrimitive.Item
          ref={(node) => {
            (
              internalRef as React.MutableRefObject<HTMLDivElement | null>
            ).current = node;
            if (typeof ref === "function") ref(node);
            else if (ref)
              (
                ref as React.MutableRefObject<HTMLDivElement | null>
              ).current = node;
          }}
          value={value}
          disabled={disabled}
          data-proximity-index={index}
          className={cn(!groupCtx?.grouped && "relative", className)}
          {...props}
        >
          {/* Standalone expanded background */}
          {!groupCtx?.grouped && (
            <AnimatePresence>
              {isOpen && (
                <motion.div
                  className={`absolute inset-0 ${shape.bg} bg-accent/20 dark:bg-accent/12 pointer-events-none`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0, transition: { duration: 0.06 } }}
                  transition={{ duration: 0.08 }}
                />
              )}
            </AnimatePresence>
          )}
          {children}
        </AccordionPrimitive.Item>
      </AccordionItemContext.Provider>
    );
  }
);

AccordionItem.displayName = "AccordionItem";

// ─── AccordionTrigger ────────────────────────────────────────────────────────

interface AccordionTriggerProps
  extends HTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
}

const AccordionTrigger = forwardRef<HTMLButtonElement, AccordionTriggerProps>(
  ({ children, className, ...props }, ref) => {
    const ChevronRight = useIcon("chevron-right");
    const groupCtx = useAccordionGroup();
    const { index, isOpen, triggerRef } = useAccordionItemContext();
    const shape = useShape();
    const [isHovered, setIsHovered] = useState(false);

    const isActive = groupCtx?.grouped
      ? groupCtx.activeIndex === index
      : isHovered;

    const triggerContent = (
      <AccordionPrimitive.Header asChild>
        <div>
          <AccordionPrimitive.Trigger
            ref={ref}
            className={cn(
              `relative z-10 flex items-center gap-2.5 ${shape.item} px-3 py-2 w-full cursor-pointer outline-none`,
              !groupCtx?.grouped &&
                "focus-visible:ring-1 focus-visible:ring-[#6B97FF] focus-visible:ring-offset-0",
              className
            )}
            {...(props as React.ComponentProps<typeof AccordionPrimitive.Trigger>)}
          >
            {/* Label with dual-layer text */}
            <span className="inline-grid text-[13px] flex-1 text-left">
              <span
                className="col-start-1 row-start-1 invisible"
                style={{ fontVariationSettings: fontWeights.semibold }}
                aria-hidden="true"
              >
                {children}
              </span>
              <span
                className={cn(
                  "col-start-1 row-start-1 transition-[color,font-variation-settings] duration-80",
                  isOpen || isActive
                    ? "text-foreground"
                    : "text-muted-foreground"
                )}
                style={{
                  fontVariationSettings:
                    isOpen ? fontWeights.semibold : fontWeights.normal,
                }}
              >
                {children}
              </span>
            </span>

            {/* Chevron — right when collapsed, rotates 90° down when expanded */}
            <motion.span
              className="shrink-0 inline-flex items-center justify-center"
              animate={{ rotate: isOpen ? 90 : 0 }}
              transition={springs.fast}
            >
              <ChevronRight
                size={16}
                strokeWidth={isOpen || isActive ? 2 : 1.5}
                className={cn(
                  "transition-[color,stroke-width] duration-80",
                  isOpen || isActive
                    ? "text-foreground"
                    : "text-muted-foreground"
                )}
              />
            </motion.span>
          </AccordionPrimitive.Trigger>
        </div>
      </AccordionPrimitive.Header>
    );

    // In grouped mode, wrap in a div for proximity hover registration
    if (groupCtx?.grouped) {
      return <div ref={triggerRef}>{triggerContent}</div>;
    }

    // Standalone mode: local hover with animated BG
    return (
      <div
        className="relative"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <AnimatePresence>
          {isHovered && (
            <motion.div
              className={`absolute inset-0 ${shape.bg} bg-accent/40 dark:bg-accent/25 pointer-events-none`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, transition: { duration: 0.06 } }}
              transition={{ duration: 0.08 }}
            />
          )}
        </AnimatePresence>
        {triggerContent}
      </div>
    );
  }
);

AccordionTrigger.displayName = "AccordionTrigger";

// ─── AccordionContent ────────────────────────────────────────────────────────

interface AccordionContentProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

const AccordionContent = forwardRef<HTMLDivElement, AccordionContentProps>(
  ({ children, className, ...props }, ref) => {
    const groupCtx = useAccordionGroup();
    const { isOpen } = useAccordionItemContext();

    return (
      <AnimatePresence initial={false}>
        {isOpen && (
          <AccordionPrimitive.Content forceMount asChild {...props}>
            <motion.div
              ref={ref}
              className={cn("overflow-hidden", className)}
              initial={{ height: 0 }}
              animate={{ height: "auto" }}
              exit={{ height: 0 }}
              // bounce: 0 — a critically damped spring on body height.
              // springs.moderate has bounce 0.15 which overshoots the
              // "auto" target by a few px; under an ancestor transform:
              // scale (e.g. /demo's 1.7x card), that overshoot becomes a
              // visible pop. Pure height has no aesthetic value in
              // bouncing, so a smooth approach reads better.
              transition={{ ...springs.moderate, bounce: 0 }}
              onUpdate={() => {
                groupCtx?.remeasure();
              }}
              onAnimationComplete={() => {
                groupCtx?.remeasure();
              }}
            >
              <div className="px-3 pb-3 pt-1 text-[13px] text-muted-foreground">
                {children}
              </div>
            </motion.div>
          </AccordionPrimitive.Content>
        )}
      </AnimatePresence>
    );
  }
);

AccordionContent.displayName = "AccordionContent";

// ─── Exports ─────────────────────────────────────────────────────────────────

export {
  Accordion,
  AccordionGroup,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
};
export default Accordion;
