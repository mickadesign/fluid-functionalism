"use client";

import {
  useRef,
  useState,
  useEffect,
  createContext,
  useContext,
  forwardRef,
  type ReactNode,
  type HTMLAttributes,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Checkbox as CheckboxPrimitive } from "@base-ui/react/checkbox";
import { cn } from "@/lib/utils";
import { spring } from "@/lib/springs";
import { fontWeights } from "@/lib/font-weight";
import { useProximityHover } from "@/hooks/use-proximity-hover";
import { useMergeSplitBlocks, SelectionBackgrounds } from "@/hooks/use-merge-split";
import { useShape } from "@/lib/shape-context";

interface CheckboxGroupContextValue {
  registerItem: (index: number, element: HTMLElement | null) => void;
  activeIndex: number | null;
}

const CheckboxGroupContext = createContext<CheckboxGroupContextValue | null>(
  null
);

function useCheckboxGroup() {
  const ctx = useContext(CheckboxGroupContext);
  if (!ctx)
    throw new Error("useCheckboxGroup must be used within a CheckboxGroup");
  return ctx;
}

interface CheckboxGroupProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  checkedIndices: Set<number>;
}

const CheckboxGroup = forwardRef<HTMLDivElement, CheckboxGroupProps>(
  ({ children, checkedIndices, className, ...props }, ref) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const groupIdCounter = useRef(0);
    const prevGroupMap = useRef(new Map<number, number>());

    const {
      activeIndex,
      setActiveIndex,
      itemRects,
      sessionRef,
      handlers,
      registerItem,
      measureItems,
    } = useProximityHover(containerRef);

    useEffect(() => {
      measureItems();
    }, [measureItems, children]);

    // Group contiguous checked indices into runs with stable IDs
    const runs: { start: number; end: number }[] = [];
    const sortedChecked = [...checkedIndices].sort((a, b) => a - b);
    for (const idx of sortedChecked) {
      const last = runs[runs.length - 1];
      if (last && idx === last.end + 1) {
        last.end = idx;
      } else {
        runs.push({ start: idx, end: idx });
      }
    }

    // Assign stable IDs: reuse previous ID if any member overlaps
    const usedIds = new Set<number>();
    const newGroupMap = new Map<number, number>();
    const checkedGroups = runs.map((run) => {
      let stableId: number | null = null;
      for (let i = run.start; i <= run.end; i++) {
        const prevId = prevGroupMap.current.get(i);
        if (prevId !== undefined && !usedIds.has(prevId)) {
          stableId = prevId;
          break;
        }
      }
      const id = stableId ?? ++groupIdCounter.current;
      usedIds.add(id);
      for (let i = run.start; i <= run.end; i++) {
        newGroupMap.set(i, id);
      }
      return { ...run, id };
    });
    prevGroupMap.current = newGroupMap;

    const [focusedIndex, setFocusedIndex] = useState<number | null>(null);

    const activeRect = activeIndex !== null ? itemRects[activeIndex] : null;
    const focusRect = focusedIndex !== null ? itemRects[focusedIndex] : null;
    const isHoveringOther =
      activeIndex !== null && !checkedIndices.has(activeIndex);
    const shape = useShape();

    // Selected backgrounds, with the merge/split boundary animation when one
    // unchecked row bridges or splits two checked runs.
    const blocks = useMergeSplitBlocks(checkedGroups, itemRects, shape.mergedRadius);

    return (
      <CheckboxGroupContext.Provider value={{ registerItem, activeIndex }}>
        <div
          ref={(node) => {
            (containerRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
            if (typeof ref === "function") ref(node);
            else if (ref) (ref as React.MutableRefObject<HTMLDivElement | null>).current = node;
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
                (e.target as HTMLElement).matches(":focus-visible") ? idx : null
              );
            }
          }}
          onBlur={(e) => {
            // Don't clear hover when focus moves to another item within the group
            if (containerRef.current?.contains(e.relatedTarget as Node)) return;
            setFocusedIndex(null);
            setActiveIndex(null);
          }}
          onKeyDown={(e) => {
            // Scope to row wrappers only. The inner checkbox primitive also
            // carries role="checkbox", so a bare [role="checkbox"] selector
            // matches twice per row and arrows skip onto the hidden control.
            const items = Array.from(
              containerRef.current?.querySelectorAll("[data-proximity-index]") ?? []
            ) as HTMLElement[];
            const currentIdx = items.indexOf(e.target as HTMLElement);
            if (currentIdx === -1) return;

            if (["ArrowDown", "ArrowUp"].includes(e.key)) {
              e.preventDefault();
              const next = e.key === "ArrowDown"
                ? (currentIdx + 1) % items.length
                : (currentIdx - 1 + items.length) % items.length;
              items[next].focus();
            } else if (e.key === "Home") {
              e.preventDefault();
              items[0]?.focus();
            } else if (e.key === "End") {
              e.preventDefault();
              items[items.length - 1]?.focus();
            }
          }}
          role="group"
          className={cn(
            "relative flex flex-col w-72 max-w-full select-none",
            className
          )}
          {...props}
        >
          {/* Selected backgrounds (merged for contiguous checked items).
              A run is normally one block; mid merge/split it is drawn as two
              abutting halves — see useMergeSplitBlocks. */}
          <SelectionBackgrounds blocks={blocks} dimmed={isHoveringOther} />

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
                className={`absolute ${shape.focusRing} pointer-events-none z-20 border border-[#6B97FF]`}
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
      </CheckboxGroupContext.Provider>
    );
  }
);

CheckboxGroup.displayName = "CheckboxGroup";

interface CheckboxItemProps extends HTMLAttributes<HTMLDivElement> {
  label: string;
  index: number;
  checked: boolean;
  onToggle: () => void;
}

const CheckboxItem = forwardRef<HTMLDivElement, CheckboxItemProps>(
  ({ label, index, checked, onToggle, className, ...props }, ref) => {
    const internalRef = useRef<HTMLDivElement>(null);
    const hasMounted = useRef(false);
    const { registerItem, activeIndex } = useCheckboxGroup();

    useEffect(() => {
      registerItem(index, internalRef.current);
      return () => registerItem(index, null);
    }, [index, registerItem]);

    useEffect(() => {
      hasMounted.current = true;
    }, []);

    const isActive = activeIndex === index;
    const skipAnimation = !hasMounted.current;
    const shape = useShape();

    return (
      <div
        ref={(node) => {
          (internalRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
          if (typeof ref === "function") ref(node);
          else if (ref) (ref as React.MutableRefObject<HTMLDivElement | null>).current = node;
        }}
        data-proximity-index={index}
        tabIndex={0}
        role="checkbox"
        aria-checked={checked}
        aria-label={label}
        onClick={onToggle}
        onMouseDown={(e) => {
          // Clicking the 15px checkbox square would natively focus the hidden
          // primitive (nearest focusable ancestor of the click target), after
          // which arrow-key nav dead-zones: the group keydown handler can't
          // find the target among the row wrappers. Prevent the native focus
          // move (click still fires) and land focus on the row instead. Skip
          // genuinely interactive children so we don't hijack their focus.
          const interactive = (e.target as HTMLElement).closest(
            'button:not([tabindex="-1"]), a[href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
          );
          if (interactive && interactive !== e.currentTarget) return;
          e.preventDefault();
          e.currentTarget.focus();
        }}
        onKeyDown={(e) => {
          if (e.key === " " || e.key === "Enter") {
            e.preventDefault();
            onToggle();
          }
        }}
        className={cn(
          // Fixed height (was py-1.5 around a 19.5px line box ≈ 31.5px) so the
          // text-box trim on the label doesn't shrink the row.
          `relative z-10 flex h-8 items-center gap-2.5 ${shape.item} px-3 cursor-pointer outline-none`,
          className
        )}
        {...props}
      >
        {/* Checkbox — Base UI primitive for accessibility */}
        <CheckboxPrimitive.Root
          checked={checked}
          onCheckedChange={() => onToggle()}
          tabIndex={-1}
          aria-hidden
          className="relative w-[15px] h-[15px] shrink-0 appearance-none bg-transparent p-0 border-0 outline-none cursor-pointer"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Border */}
          <div
            className={cn(
              "absolute inset-0 rounded-[5px] border-solid transition-all duration-80",
              checked
                ? "border-[1.5px] border-transparent"
                : isActive
                ? "border-[1.5px] border-neutral-400 dark:border-neutral-500"
                : "border-[1.5px] border-border"
            )}
          />
          {/* Check mark */}
          <AnimatePresence>
            {checked && (
              <CheckboxPrimitive.Indicator
                keepMounted
                render={(indicatorProps) => {
                  const {
                    style: _s,
                    onDrag: _onDrag,
                    onDragStart: _onDragStart,
                    onDragEnd: _onDragEnd,
                    onAnimationStart: _onAnimationStart,
                    onAnimationEnd: _onAnimationEnd,
                    onAnimationIteration: _onAnimationIteration,
                    ...rest
                  } = indicatorProps as React.HTMLAttributes<SVGSVGElement>;
                  return (
                    <motion.svg
                      {...rest}
                      width={18}
                      height={18}
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-foreground"
                      initial={{ opacity: 1 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 1 }}
                    >
                      <motion.path
                        d="M6 12L10 16L18 8"
                        initial={{ pathLength: skipAnimation ? 1 : 0 }}
                        animate={{
                          pathLength: 1,
                          transition: { duration: 0.08, ease: "easeOut" },
                        }}
                        exit={{
                          pathLength: 0,
                          transition: { duration: 0.04, ease: "easeIn" },
                        }}
                      />
                    </motion.svg>
                  );
                }}
              />
            )}
          </AnimatePresence>
        </CheckboxPrimitive.Root>

        {/* Label */}
        {/* Both stacked spans carry the text-box trim so the invisible bold
            sizer and the visible label keep identical boxes. */}
        <span className="inline-grid text-[13px]">
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
              checked || isActive
                ? "text-foreground"
                : "text-muted-foreground"
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

CheckboxItem.displayName = "CheckboxItem";

export { CheckboxGroup, CheckboxItem };
export default CheckboxGroup;
