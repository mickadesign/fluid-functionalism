"use client";

import {
  useRef,
  useState,
  useEffect,
  useLayoutEffect,
  useCallback,
  useMemo,
  createContext,
  useContext,
  forwardRef,
  type ReactNode,
  type HTMLAttributes,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import * as AccordionPrimitive from "@radix-ui/react-accordion";

// SSR-safe layout effect (client components still server-render in Next).
const useIsoLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;
import { cn } from "@/lib/utils";
import { useIcon } from "@/lib/icon-context";
import { spring } from "@/lib/springs";
import { fontWeights } from "@/lib/font-weight";
import { useProximityHover } from "@/hooks/use-proximity-hover";
import { useShape } from "@/lib/shape-context";
import { SizeProvider, useSize, type SizeVariant } from "@/lib/size-context";

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
  /** Pins the group's rows to one step of the size ladder (default 36px,
   *  compact 28px — see /docs/sizes). Omitted, they follow the surrounding
   *  SizeProvider. */
  size?: SizeVariant;
} & (AccordionGroupSingleProps | AccordionGroupMultipleProps);

const AccordionGroup = forwardRef<HTMLDivElement, AccordionGroupProps>(
  (props, ref) => {
    const {
      children,
      type = "single",
      size,
      className,
      ...rest
    } = props;

    const containerRef = useRef<HTMLDivElement>(null);
    const fullItemElementsRef = useRef<Map<number, HTMLElement>>(new Map());
    const [openItemRects, setOpenItemRects] = useState<Map<number, ItemRect>>(
      new Map()
    );
    const openItemRectsRef = useRef(openItemRects);

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
      // Skip the state update when nothing moved (mirrors the proximity
      // hook's measureItems guard) — this runs per animation frame via
      // onUpdate, and an unconditional set would invalidate the group
      // context and re-render every item even on no-op remeasures.
      const prev = openItemRectsRef.current;
      let changed = prev.size !== next.size;
      if (!changed) {
        for (const [idx, r] of next) {
          const p = prev.get(idx);
          if (
            !p ||
            p.top !== r.top ||
            p.left !== r.left ||
            p.width !== r.width ||
            p.height !== r.height
          ) {
            changed = true;
            break;
          }
        }
      }
      if (!changed) return;
      openItemRectsRef.current = next;
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

    const openValuesList: string[] =
      type === "multiple"
        ? (props as AccordionGroupMultipleProps).value ?? internalMultipleValue
        : (() => {
            const v =
              (props as AccordionGroupSingleProps).value ?? internalSingleValue;
            return v ? [v] : [];
          })();

    // Keyed on the joined values so the Set (and the group context value
    // below) keeps a stable identity across re-renders where the open values
    // haven't actually changed.
    const openValuesKey = openValuesList.join(",");

    const openValues = useMemo(
      () => new Set(openValuesList),
      // Deliberately keyed on the joined string, not the (fresh) array.
      [openValuesKey]
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

    useEffect(() => {
      measureItems();
      measureFullItems();
    }, [measureItems, measureFullItems, children]);

    // Remeasure when open values change so the first paint already
    // reflects shifted trigger positions.
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

    const remeasure = useCallback(() => {
      measureItems();
      measureFullItems();
    }, [measureItems, measureFullItems]);

    // Memoized: the group re-renders on every proximity-hover mousemove; a
    // fresh context object each time would re-render every item with it.
    const groupContextValue = useMemo<AccordionGroupContextValue>(
      () => ({
        registerItem,
        registerFullItem,
        activeIndex,
        grouped: true,
        remeasure,
        openValues,
        openItemRects,
      }),
      [
        registerItem,
        registerFullItem,
        activeIndex,
        remeasure,
        openValues,
        openItemRects,
      ]
    );

    const group = (
      <AccordionGroupContext.Provider value={groupContextValue}>
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
            onMouseMove={(e) => {
              // Suppress proximity hover when cursor is over an expanded
              // content area (below the item's trigger). This keeps trigger
              // hover scoped to the trigger row only.
              const container = containerRef.current;
              if (container) {
                const cRect = container.getBoundingClientRect();
                const layoutH = container.offsetHeight;
                const visualH = cRect.height;
                const scale = layoutH > 0 ? visualH / layoutH : 1;
                const localY =
                  (e.clientY - cRect.top) / scale + container.scrollTop;
                for (const [idx, full] of openItemRects) {
                  const trigger = itemRects[idx];
                  if (!trigger) continue;
                  const contentTop = trigger.top + trigger.height;
                  const contentBottom = full.top + full.height;
                  if (localY >= contentTop && localY <= contentBottom) {
                    setActiveIndex(null);
                    return;
                  }
                }
              }
              handlers.onMouseMove(e);
            }}
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
              "relative flex flex-col gap-0.5 w-72 max-w-full",
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
                  // Fade in from the item's current rect: with initial={false}
                  // a newly-opened item's background would pop in at full
                  // opacity mid-layout-shift while the previous item's bg is
                  // still fading out — reads as a glitch when switching items
                  // (especially under /demo's scaled card). Geometry still
                  // snaps (duration 0) so the bg hugs the animating item.
                  initial={{
                    top: rect.top,
                    left: rect.left,
                    width: rect.width,
                    height: rect.height,
                    opacity: 0,
                  }}
                  animate={{
                    top: rect.top,
                    left: rect.left,
                    width: rect.width,
                    height: rect.height,
                    opacity: isHoveringNonOpen ? 0.7 : 1,
                  }}
                  exit={{ opacity: 0, transition: spring.moderate.exit }}
                  transition={{
                    top: { duration: 0 },
                    left: { duration: 0 },
                    width: { duration: 0 },
                    height: { duration: 0 },
                    opacity: { duration: 0.12 },
                  }}
                />
              ))}
            </AnimatePresence>

            {/* Hover background */}
            <AnimatePresence>
              {activeRect && (
                <motion.div
                  key={sessionRef.current}
                  className={`absolute ${shape.bg} bg-hover pointer-events-none`}
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
                  exit={{ opacity: 0, transition: spring.fast.exit }}
                  transition={{
                    ...spring.fast,
                    opacity: { duration: 0.08 },
                  }}
                />
              )}
            </AnimatePresence>

            {/* Focus ring */}
            <AnimatePresence>
              {focusRect && (
                <motion.div
                  className={`absolute ${shape.focusRing} pointer-events-none z-20 border border-[color:var(--focus-ring,#6B97FF)]`}
                  initial={false}
                  animate={{
                    left: focusRect.left - 2,
                    top: focusRect.top - 2,
                    width: focusRect.width + 4,
                    height: focusRect.height + 4,
                  }}
                  exit={{ opacity: 0, transition: spring.fast.exit }}
                  transition={{
                    ...spring.fast,
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

    // A size prop pins every row in the group to one ladder step.
    return size ? <SizeProvider size={size}>{group}</SizeProvider> : group;
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
  /** Pins the accordion's rows to one step of the size ladder (default 36px,
   *  compact 28px — see /docs/sizes). Omitted, they follow the surrounding
   *  SizeProvider. */
  size?: SizeVariant;
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
      size,
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

    // `value` is always defined here (internal state is seeded from
    // `defaultValue` above), so the Radix root is permanently controlled and
    // forwarding `defaultValue` would be dead.
    const radixProps =
      type === "multiple"
        ? {
            type: "multiple" as const,
            value: (value as string[] | undefined) ?? internalMultipleValue,
            onValueChange: handleMultipleChange,
          }
        : {
            type: "single" as const,
            collapsible,
            value: (value as string | undefined) ?? internalSingleValue,
            onValueChange: handleSingleChange,
          };

    const root = (
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
            {children}
          </StandaloneOpenContext.Provider>
        </div>
      </AccordionPrimitive.Root>
    );

    // A size prop pins every row to one ladder step.
    return size ? <SizeProvider size={size}>{root}</SizeProvider> : root;
  }
);

Accordion.displayName = "Accordion";

// Standalone context to provide open values without AccordionGroup
const StandaloneOpenContext = createContext<Set<string>>(new Set());

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
    const shape = useShape();

    const isOpen = groupCtx?.grouped
      ? groupCtx.openValues.has(value)
      : standaloneOpen.has(value);

    const triggerRef = useRef<HTMLDivElement>(null);

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
      <AccordionItemContext.Provider value={{ index, value, isOpen, triggerRef }}>
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
                  exit={{ opacity: 0, transition: spring.fast.exit }}
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
    const sizeClasses = useSize();
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
              `relative z-10 flex items-center ${sizeClasses.gap} ${shape.item} ${sizeClasses.px} ${sizeClasses.variant === "compact" ? "py-1" : "py-2"} w-full cursor-pointer outline-none select-none`,
              !groupCtx?.grouped &&
                "focus-visible:ring-1 focus-visible:ring-[color:var(--focus-ring,#6B97FF)] focus-visible:ring-offset-0",
              className
            )}
            {...(props as React.ComponentProps<typeof AccordionPrimitive.Trigger>)}
          >
            {/* Label with dual-layer text */}
            <span className={cn("inline-grid flex-1 text-left", sizeClasses.text)}>
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
              transition={spring.fast}
            >
              <ChevronRight
                size={sizeClasses.icon}
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
              className={`absolute inset-0 ${shape.bg} bg-hover pointer-events-none`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, transition: spring.fast.exit }}
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
    const sizeClasses = useSize();

    // The open height is animated to a self-measured LAYOUT pixel value, not
    // `height: "auto"`: framer resolves an "auto" target by measuring the
    // element's *visual* (transformed) size, so under a scaled ancestor
    // (e.g. /demo's 1.7x card) the animation overshoots to scale× the real
    // height and snaps back when the final "auto" lands — a visible height
    // reduction at the end of every open. offsetHeight and ResizeObserver
    // are transform-immune.
    const innerRef = useRef<HTMLDivElement | null>(null);
    const roRef = useRef<ResizeObserver | null>(null);
    const [contentHeight, setContentHeight] = useState<number | null>(null);
    // Items open at mount render `initial: "auto"` and receive their first
    // pixel target a commit later; that hand-off must SNAP (duration 0), not
    // spring — framer would measure the spring's numeric start visually
    // (scaled) and play a shrink. Items that open later spring normally.
    const needsSnap = useRef(isOpen);

    const measureRef = useCallback((el: HTMLDivElement | null) => {
      roRef.current?.disconnect();
      roRef.current = null;
      innerRef.current = el;
      if (!el) return;
      if (el.offsetHeight > 0) setContentHeight(el.offsetHeight);
      const ro = new ResizeObserver(() => {
        // Ignore the 0 that fires while the panel is display:none.
        if (el.offsetHeight > 0) setContentHeight(el.offsetHeight);
      });
      ro.observe(el);
      roRef.current = ro;
    }, []);

    // Re-measure synchronously (pre-paint) when opening, so the spring's
    // target is the fresh layout height from its first frame.
    useIsoLayoutEffect(() => {
      if (isOpen && innerRef.current && innerRef.current.offsetHeight > 0) {
        setContentHeight(innerRef.current.offsetHeight);
      }
    }, [isOpen]);

    useEffect(() => {
      if (contentHeight !== null) needsSnap.current = false;
    }, [contentHeight]);

    // Content stays mounted so it can be measured; fully-closed panels are
    // display:none (hidden) once the exit finishes, keeping them out of the
    // accessibility tree without cutting the animation short.
    const [exitComplete, setExitComplete] = useState(!isOpen);
    if (isOpen && exitComplete) {
      // Reset during render so the panel is un-hidden before the opening
      // animation's first paint.
      setExitComplete(false);
    }

    return (
      <AccordionPrimitive.Content forceMount asChild {...props}>
        <motion.div
          ref={ref}
          hidden={!isOpen && exitComplete}
          className={cn("overflow-hidden", className)}
          initial={{ height: isOpen ? "auto" : 0 }}
          animate={{ height: isOpen ? contentHeight ?? 0 : 0 }}
          // bounce: 0 — a critically damped spring on body height; pure
          // height has no aesthetic value in bouncing, so a smooth approach
          // reads better.
          transition={
            needsSnap.current
              ? { duration: 0 }
              : { ...spring.moderate, bounce: 0 }
          }
          onUpdate={() => {
            groupCtx?.remeasure();
          }}
          onAnimationComplete={() => {
            groupCtx?.remeasure();
            if (!isOpen) setExitComplete(true);
          }}
        >
          <div
            ref={measureRef}
            className={cn(
              "pt-1 text-muted-foreground",
              sizeClasses.px,
              sizeClasses.text,
              sizeClasses.variant === "compact" ? "pb-2.5" : "pb-3"
            )}
          >
            {children}
          </div>
        </motion.div>
      </AccordionPrimitive.Content>
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
