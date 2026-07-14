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
import { Accordion as AccordionPrimitive } from "@base-ui/react/accordion";

// SSR-safe layout effect (client components still server-render in Next).
const useIsoLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;
import { cn } from "@/lib/utils";
import { useIcon } from "@/lib/icon-context";
import { spring } from "@/lib/springs";
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

    useEffect(() => {
      measureItems();
      measureFullItems();
    }, [measureItems, measureFullItems, openValuesKey]);

    const [focusedIndex, setFocusedIndex] = useState<number | null>(null);

    const activeRect = activeIndex !== null ? itemRects[activeIndex] : null;
    const focusRect = focusedIndex !== null ? itemRects[focusedIndex] : null;
    const isHoveringNonOpen =
      activeIndex !== null && !openItemRects.has(activeIndex);
    const shape = useShape();

    const {
      value: _value,
      defaultValue: _defaultValue,
      onValueChange: _onValueChange,
      collapsible: _collapsible,
      type: _type,
      ...htmlProps
    } = rest as Record<string, unknown>;

    // Translate FF API → Base UI Accordion API.
    // Base UI always uses `value: string[]` and a `multiple: boolean`. In
    // single mode we wrap the active value in a single-element array.
    const baseValue: string[] =
      type === "multiple"
        ? (props as AccordionGroupMultipleProps).value ??
          internalMultipleValue
        : (() => {
            const v =
              (props as AccordionGroupSingleProps).value ?? internalSingleValue;
            return v ? [v] : [];
          })();

    const baseOnValueChange = (next: string[]) => {
      if (type === "multiple") handleMultipleValueChange(next);
      else handleSingleValueChange(next[0] ?? "");
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

    return (
      <AccordionGroupContext.Provider value={groupContextValue}>
        <AccordionPrimitive.Root
          value={baseValue}
          onValueChange={baseOnValueChange}
          multiple={type === "multiple"}
          render={(rootProps) => {
            const {
              style: _baseStyle,
              onDrag: _onDrag,
              onDragStart: _onDragStart,
              onDragEnd: _onDragEnd,
              onAnimationStart: _onAnimationStart,
              onAnimationEnd: _onAnimationEnd,
              onAnimationIteration: _onAnimationIteration,
              ...restRoot
            } = rootProps as React.HTMLAttributes<HTMLDivElement>;
            return (
              <div
                {...restRoot}
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
            );
          }}
        />
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
    void collapsible; // Base UI's single-mode is always collapsible.

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

    const baseValue: string[] =
      type === "multiple"
        ? (value as string[] | undefined) ?? internalMultipleValue
        : (() => {
            const v = (value as string | undefined) ?? internalSingleValue;
            return v ? [v] : [];
          })();

    const baseOnValueChange = (next: string[]) => {
      if (type === "multiple") handleMultipleChange(next);
      else handleSingleChange(next[0] ?? "");
    };

    return (
      <AccordionPrimitive.Root
        value={baseValue}
        onValueChange={baseOnValueChange}
        multiple={type === "multiple"}
        render={(rootProps) => {
          const { style: _s, ...restRoot } = rootProps as React.HTMLAttributes<HTMLDivElement>;
          return (
            <div
              {...restRoot}
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
          );
        }}
      />
    );
  }
);

Accordion.displayName = "Accordion";

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

    useEffect(() => {
      if (groupCtx?.grouped && index !== undefined) {
        groupCtx.registerItem(index, triggerRef.current);
        return () => groupCtx.registerItem(index, null);
      }
    }, [index, groupCtx]);

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
          value={value}
          disabled={disabled}
          render={(itemProps) => {
            const { style: _s, ...restItem } = itemProps as React.HTMLAttributes<HTMLDivElement>;
            return (
              <div
                {...restItem}
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
              </div>
            );
          }}
        />
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
      // Render Header as a <div>. Base UI's Header defaults to <h3>, which
      // would be more semantic but breaks the ancestor selectors the styles
      // rely on.
      <AccordionPrimitive.Header render={<div />}>
        <AccordionPrimitive.Trigger
          ref={ref as React.Ref<HTMLElement>}
          className={cn(
            `relative z-10 flex items-center gap-2.5 ${shape.item} px-3 py-2 w-full cursor-pointer outline-none select-none`,
            !groupCtx?.grouped &&
              "focus-visible:ring-1 focus-visible:ring-[color:var(--focus-ring,#6B97FF)] focus-visible:ring-offset-0",
            className
          )}
          {...(props as React.ButtonHTMLAttributes<HTMLButtonElement>)}
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

          {/* Chevron */}
          <motion.span
            className="shrink-0 inline-flex items-center justify-center"
            animate={{ rotate: isOpen ? 90 : 0 }}
            transition={spring.fast}
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
      </AccordionPrimitive.Header>
    );

    if (groupCtx?.grouped) {
      return <div ref={triggerRef}>{triggerContent}</div>;
    }

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

    // Whether the framer-motion height exit animation has fully finished.
    // Base UI's Panel would apply `hidden` the moment a controlled item
    // closes (useCollapsibleRoot sets `mounted = false` in a layout effect
    // when no CSS transition/animation is detected on the panel element, and
    // useCollapsiblePanel derives `hidden = !open && !mounted`) — which is
    // `display: none` and would freeze the exit animation mid-flight. So we
    // take over the `hidden` attribute below and only apply it once the exit
    // has actually completed.
    const [exitComplete, setExitComplete] = useState(!isOpen);
    if (isOpen && exitComplete) {
      // Reset during render so the panel is un-hidden before the opening
      // animation's first paint.
      setExitComplete(false);
    }

    // Render through `<AccordionPrimitive.Panel keepMounted>` so the panel
    // element persists through the exit animation and the trigger ↔ panel
    // ARIA contract stays intact: the panel carries `role="region"`,
    // `aria-labelledby` and the id that the Trigger's `aria-controls` points
    // to. The framer-motion height animation lives one level down inside the
    // persistent panel element and flips its target with `isOpen` (content
    // stays mounted so it can be measured).
    return (
      <AccordionPrimitive.Panel
        keepMounted
        render={(panelProps) => {
          const {
            // Applied too early for our exit animation (see above); we
            // control the attribute ourselves.
            hidden: _baseHidden,
            // Only carries the --accordion-panel-height/width vars, which
            // stay 'auto' since Base UI never measures JS-driven animations;
            // dropped for parity with the Root/Item render props above.
            style: _baseStyle,
            ...restPanel
          } = panelProps as React.HTMLAttributes<HTMLDivElement> & {
            hidden?: boolean;
          };
          return (
            <div {...restPanel} hidden={!isOpen && exitComplete}>
              <motion.div
                ref={ref}
                className={cn("overflow-hidden", className)}
                initial={{ height: isOpen ? "auto" : 0 }}
                animate={{ height: isOpen ? contentHeight ?? 0 : 0 }}
                // bounce: 0 — pure height looks better without overshoot.
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
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                {...(props as any)}
              >
                <div
                  ref={measureRef}
                  className="px-3 pb-3 pt-1 text-[13px] text-muted-foreground"
                >
                  {children}
                </div>
              </motion.div>
            </div>
          );
        }}
      />
    );
  }
);

AccordionContent.displayName = "AccordionContent";

export {
  Accordion,
  AccordionGroup,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
};
export default Accordion;
