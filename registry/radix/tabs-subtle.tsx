"use client";

import {
  useRef,
  useState,
  useCallback,
  useEffect,
  createContext,
  useContext,
  forwardRef,
  type ReactNode,
  type HTMLAttributes,
} from "react";
import * as TabsPrimitive from "@radix-ui/react-tabs";
import { motion, AnimatePresence } from "framer-motion";
import type { IconComponent } from "@/lib/icon-context";
import { cn } from "@/lib/utils";
import { spring } from "@/lib/springs";
import { fontWeights } from "@/lib/font-weight";
import { useShape } from "@/lib/shape-context";
import { useProximityHover } from "@/hooks/use-proximity-hover";

interface TabsSubtleContextValue {
  registerTab: (index: number, element: HTMLElement | null) => void;
  hoveredIndex: number | null;
  selectedIndex: number;
  idPrefix: string | undefined;
  activeLabel: boolean;
}

const TabsSubtleContext = createContext<TabsSubtleContextValue | null>(null);

function useTabsSubtle() {
  const ctx = useContext(TabsSubtleContext);
  if (!ctx) throw new Error("useTabsSubtle must be used within a TabsSubtle");
  return ctx;
}

interface TabsSubtleProps extends Omit<HTMLAttributes<HTMLDivElement>, "onSelect"> {
  children: ReactNode;
  selectedIndex: number;
  onSelect: (index: number) => void;
  idPrefix?: string;
  /** When true, only the selected tab shows its text label. Requires icons on tabs. */
  activeLabel?: boolean;
}

const TabsSubtle = forwardRef<HTMLDivElement, TabsSubtleProps>(
  ({ children, selectedIndex, onSelect, idPrefix, activeLabel = false, className, ...props }, ref) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const isMouseInside = useRef(false);
    const shape = useShape();

    const {
      activeIndex: hoveredIndex,
      setActiveIndex: setHoveredIndex,
      itemRects: tabRects,
      handlers,
      registerItem,
      measureItems: measureTabs,
    } = useProximityHover(containerRef, { axis: "x" });

    // Track tab elements locally so we can observe their individual resizes
    const tabElementsRef = useRef(new Map<number, HTMLElement>());
    const registerTab = useCallback(
      (index: number, element: HTMLElement | null) => {
        registerItem(index, element);
        if (element) {
          tabElementsRef.current.set(index, element);
        } else {
          tabElementsRef.current.delete(index);
        }
      },
      [registerItem]
    );

    useEffect(() => {
      measureTabs();
    }, [measureTabs, children]);

    // Observe individual tab buttons for resize (label expand/collapse in activeLabel mode)
    useEffect(() => {
      const elements = tabElementsRef.current;
      if (elements.size === 0) return;
      const ro = new ResizeObserver(() => measureTabs());
      elements.forEach((el) => ro.observe(el));
      return () => ro.disconnect();
    }, [measureTabs, children]);

    // Wrap handlers to track isMouseInside
    const handleMouseMove = useCallback(
      (e: React.MouseEvent) => {
        isMouseInside.current = true;
        handlers.onMouseMove(e);
      },
      [handlers]
    );

    const handleMouseLeave = useCallback(() => {
      isMouseInside.current = false;
      handlers.onMouseLeave();
    }, [handlers]);

    const [focusedIndex, setFocusedIndex] = useState<number | null>(null);

    const selectedRect = tabRects[selectedIndex];
    const hoverRect =
      hoveredIndex !== null ? tabRects[hoveredIndex] : null;
    const focusRect = focusedIndex !== null ? tabRects[focusedIndex] : null;
    const isHoveringSelected = hoveredIndex === selectedIndex;
    const isHovering = hoveredIndex !== null && !isHoveringSelected;

    return (
      <TabsSubtleContext.Provider
        value={{ registerTab, hoveredIndex, selectedIndex, idPrefix, activeLabel }}
      >
        {/* Root is merged into List via `asChild` so a single <div> is
            emitted. Radix owns
            role="tablist", roving tabindex, and Arrow/Home/End keyboard
            navigation. Radix tab values are strings, so the numeric
            selectedIndex is mapped through String()/Number().
            `activationMode="manual"` keeps manual activation: arrows move
            focus, Enter/Space selects. */}
        <TabsPrimitive.Root
          asChild
          value={String(selectedIndex)}
          onValueChange={(value) => onSelect(Number(value))}
          activationMode="manual"
        >
          <TabsPrimitive.List
            ref={(node: HTMLDivElement | null) => {
              containerRef.current = node;
              if (typeof ref === "function") ref(node);
              else if (ref) (ref as React.MutableRefObject<HTMLDivElement | null>).current = node;
            }}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            onFocus={(e: React.FocusEvent<HTMLDivElement>) => {
              const indexAttr = (e.target as HTMLElement)
                .closest("[data-proximity-index]")
                ?.getAttribute("data-proximity-index");
              if (indexAttr != null) {
                const idx = Number(indexAttr);
                setHoveredIndex(idx);
                setFocusedIndex(
                  (e.target as HTMLElement).matches(":focus-visible") ? idx : null
                );
              }
            }}
            onBlur={(e: React.FocusEvent<HTMLDivElement>) => {
              if (containerRef.current?.contains(e.relatedTarget as Node)) return;
              setFocusedIndex(null);
              if (isMouseInside.current) return;
              setHoveredIndex(null);
            }}
            className={cn(
              // -mx-1 px-1 / -my-1 py-1 give the 2px-outset focus ring room
              // to draw without being clipped by overflow-x-auto
              "relative flex items-center gap-0.5 select-none overflow-x-auto max-w-full scrollbar-hide -mx-1 px-1 -my-1 py-1",
              className
            )}
            {...props}
          >
            {/* Selected pill */}
            {selectedRect && (
              <motion.div
                className={cn("absolute bg-active pointer-events-none", shape.bg)}
                initial={false}
                animate={{
                  left: selectedRect.left,
                  width: selectedRect.width,
                  top: selectedRect.top,
                  height: selectedRect.height,
                  opacity: isHovering ? 0.8 : 1,
                }}
                transition={{
                  ...spring.moderate,
                  opacity: { duration: 0.08 },
                }}
              />
            )}

            {/* Hover pill */}
            <AnimatePresence>
              {hoverRect && !isHoveringSelected && selectedRect && (
                <motion.div
                  className={cn("absolute bg-active pointer-events-none", shape.bg)}
                  initial={{
                    left: selectedRect.left,
                    width: selectedRect.width,
                    top: selectedRect.top,
                    height: selectedRect.height,
                    opacity: 0,
                  }}
                  animate={{
                    left: hoverRect.left,
                    width: hoverRect.width,
                    top: hoverRect.top,
                    height: hoverRect.height,
                    opacity: 0.4,
                  }}
                  exit={
                    !isMouseInside.current && selectedRect
                      ? {
                          left: selectedRect.left,
                          width: selectedRect.width,
                          top: selectedRect.top,
                          height: selectedRect.height,
                          opacity: 0,
                          transition: { ...spring.moderate, opacity: { duration: 0.06 } },
                        }
                      : { opacity: 0, transition: spring.fast.exit }
                  }
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
                  className={cn("absolute pointer-events-none z-20 border border-[color:var(--focus-ring,#6B97FF)]", shape.focusRing)}
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
          </TabsPrimitive.List>
        </TabsPrimitive.Root>
      </TabsSubtleContext.Provider>
    );
  }
);

TabsSubtle.displayName = "TabsSubtle";

interface TabsSubtleItemProps extends HTMLAttributes<HTMLButtonElement> {
  icon?: IconComponent;
  label: string;
  index: number;
}

const TabsSubtleItem = forwardRef<HTMLButtonElement, TabsSubtleItemProps>(
  ({ icon: Icon, label, index, className, ...props }, ref) => {
    const internalRef = useRef<HTMLButtonElement | null>(null);
    const shape = useShape();
    const { registerTab, hoveredIndex, selectedIndex, idPrefix, activeLabel } =
      useTabsSubtle();

    useEffect(() => {
      registerTab(index, internalRef.current);
      return () => registerTab(index, null);
    }, [index, registerTab]);

    const isSelected = selectedIndex === index;
    const isActive = hoveredIndex === index || isSelected;
    const collapseLabel = activeLabel && !!Icon;
    const showLabel = !collapseLabel || isSelected;

    const labelContent = (
      // Both stacked spans carry the text-box trim so the invisible bold
      // sizer and the visible label keep identical boxes.
      <span className="inline-grid text-[13px] whitespace-nowrap">
        <span
          className="col-start-1 row-start-1 invisible [text-box:trim-both_cap_alphabetic]"
          style={{ fontVariationSettings: fontWeights.semibold }}
          aria-hidden="true"
        >
          {label}
        </span>
        <span
          className={cn(
            "col-start-1 row-start-1 transition-[color,font-variation-settings] duration-80 [text-box:trim-both_cap_alphabetic]",
            isActive ? "text-foreground" : "text-muted-foreground"
          )}
          style={{
            fontVariationSettings: isSelected
              ? fontWeights.semibold
              : fontWeights.normal,
          }}
        >
          {label}
        </span>
      </span>
    );

    return (
      // Radix Trigger renders a native <button type="button"> and wires
      // role="tab", aria-selected, roving tabindex, and activation for us.
      // id/aria-controls are only overridden when an idPrefix is supplied so
      // externally rendered TabsSubtlePanel elements stay linked.
      <TabsPrimitive.Trigger
        ref={(node: HTMLButtonElement | null) => {
          internalRef.current = node;
          if (typeof ref === "function") ref(node);
          else if (ref) (ref as React.MutableRefObject<HTMLButtonElement | null>).current = node;
        }}
        value={String(index)}
        data-proximity-index={index}
        id={idPrefix ? `${idPrefix}-tab-${index}` : undefined}
        aria-controls={idPrefix ? `${idPrefix}-panel-${index}` : undefined}
        aria-label={collapseLabel && !showLabel ? label : undefined}
        className={cn(
          // Fixed heights (was py-2 around a 19.5px line box ≈ 35.5px) so the
          // text-box trim on the label doesn't shrink the tab.
          "relative z-10 flex items-center px-3 cursor-pointer bg-transparent border-none outline-none",
          collapseLabel ? "h-8" : "h-9 gap-2",
          shape.bg,
          className
        )}
        {...props}
      >
        {Icon && (
          <Icon
            size={16}
            strokeWidth={isActive ? 2 : 1.5}
            className={cn(
              "shrink-0 transition-[color,stroke-width] duration-80",
              isActive ? "text-foreground" : "text-muted-foreground"
            )}
          />
        )}
        {collapseLabel ? (
          <AnimatePresence initial={false}>
            {showLabel && (
              <motion.span
                key="label"
                className="overflow-hidden"
                initial={{ width: 0, opacity: 0, marginLeft: 0 }}
                animate={{ width: "auto", opacity: 1, marginLeft: 8 }}
                exit={{ width: 0, opacity: 0, marginLeft: 0 }}
                transition={{
                  ...spring.fast,
                  opacity: { duration: 0.06 },
                }}
              >
                {labelContent}
              </motion.span>
            )}
          </AnimatePresence>
        ) : (
          labelContent
        )}
      </TabsPrimitive.Trigger>
    );
  }
);

TabsSubtleItem.displayName = "TabsSubtleItem";

interface TabsSubtlePanelProps extends HTMLAttributes<HTMLDivElement> {
  index: number;
  selectedIndex: number;
  idPrefix: string;
  children: ReactNode;
}

// Rendered outside <TabsSubtle> at every call site, so it cannot use Radix's
// Tabs.Content (which requires the Tabs.Root context). It stays a plain
// tabpanel linked to its tab through the shared idPrefix.
const TabsSubtlePanel = forwardRef<HTMLDivElement, TabsSubtlePanelProps>(
  ({ index, selectedIndex, idPrefix, children, className, ...props }, ref) => {
    const isSelected = selectedIndex === index;

    return (
      <div
        ref={ref}
        id={`${idPrefix}-panel-${index}`}
        role="tabpanel"
        aria-labelledby={`${idPrefix}-tab-${index}`}
        hidden={!isSelected}
        tabIndex={-1}
        className={cn("outline-none", className)}
        {...props}
      >
        {isSelected && children}
      </div>
    );
  }
);

TabsSubtlePanel.displayName = "TabsSubtlePanel";

export { TabsSubtle, TabsSubtleItem, TabsSubtlePanel };
export default TabsSubtle;
