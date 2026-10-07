"use client";

import {
  useRef,
  useState,
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
import { omit } from "@/lib/omit";
import { fontWeights } from "@/lib/font-weight";
import { useFluidHover, useRegisterFluidHoverItem } from "@/hooks/use-fluid-hover";
import {
  useMergeSplitBlocks,
  useSelectionRuns,
  SelectionBackgrounds,
} from "@/hooks/use-merge-split";
import { useShape } from "@/lib/shape-context";
import { SizeProvider, useSize, type SizeVariant } from "@/lib/size-context";
import { FluidHoverHighlight } from "@/components/ui/fluid-hover-highlight";

// ---------------------------------------------------------------------------
// CheckboxGroup is a vertical list of CheckboxItem rows sharing one fluid
// hover scope. The group paints everything that spans rows: the checked
// backgrounds (contiguous checked rows merge into one block), the hover
// highlight, and one focus ring that springs between rows. Each row is the
// focusable role="checkbox" element; the primitive inside it is only the
// square and its check mark. The parent owns state: the group reads the
// whole checked set, each item its own `checked` and `onToggle`.
// ---------------------------------------------------------------------------

// True only while a row's mousedown handler moves focus onto the row. Chrome
// reports a focus() call from script as :focus-visible, so without this flag
// every click would draw the keyboard focus ring. focus() fires its focus
// events synchronously, so the flag never outlives that one call.
let pointerFocusRedirect = false;

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
  /** Checked row indices. The group needs the whole set, not just each row's
   *  `checked`, to merge contiguous rows into one background. */
  checkedIndices: Set<number>;
  /** Pins the group's rows to one step of the size ladder (default 36px,
   *  compact 28px). Omitted, it follows the surrounding
   *  SizeProvider. */
  size?: SizeVariant;
}

const CheckboxGroup = forwardRef<HTMLDivElement, CheckboxGroupProps>(
  ({ children, checkedIndices, size, className, ...props }, ref) => {
    const containerRef = useRef<HTMLDivElement>(null);

    const hover = useFluidHover(containerRef);
    const {
      activeIndex,
      setActiveIndex,
      itemRects,
      handlers,
      registerItem,
    } = hover;

    // Contiguous checked rows, each run with a stable ID. The ID keys the
    // background block, so keeping it lets framer grow or shrink the block in
    // place when a neighbour is checked instead of exiting the old block and
    // entering a new one.
    const checkedGroups = useSelectionRuns([...checkedIndices]);

    const [focusedIndex, setFocusedIndex] = useState<number | null>(null);

    const focusRect = focusedIndex !== null ? itemRects[focusedIndex] : null;
    const shape = useShape();

    // Selected backgrounds, with the merge/split boundary animation when one
    // unchecked row bridges or splits two checked runs.
    // The hook owns that choreography and its timing; the group only supplies
    // the runs, the measured row rects and the corner radius for the shape.
    const blocks = useMergeSplitBlocks(checkedGroups, itemRects, shape.mergedRadius);

    const group = (
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
          onClick={handlers.onClick}
          // Focus drives the same activeIndex as hover, so the highlight, the
          // border and the label color follow the keyboard too. The focus ring
          // shows for keyboard focus only, never after a click.
          onFocus={(e) => {
            const indexAttr = (e.target as HTMLElement)
              .closest("[data-fluid-hover-index]")
              ?.getAttribute("data-fluid-hover-index");
            if (indexAttr != null) {
              const idx = Number(indexAttr);
              setActiveIndex(idx);
              // A row focused by its own mousedown gets no ring, even though
              // the browser reports that focus as :focus-visible.
              setFocusedIndex(
                !pointerFocusRedirect &&
                  (e.target as HTMLElement).matches(":focus-visible")
                  ? idx
                  : null
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
              containerRef.current?.querySelectorAll("[data-fluid-hover-index]") ?? []
            ) as HTMLElement[];
            const currentIdx = items.indexOf(e.target as HTMLElement);
            if (currentIdx === -1) return;

            // Up/Down move focus only, wrapping at both ends; Home/End jump to
            // the first and last row. Space or Enter on a row toggles it.
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
          // select-none keeps rapid clicks on rows from selecting the label text.
          className={cn(
            "relative flex flex-col w-72 max-w-full select-none",
            className
          )}
          {...props}
        >
          {/* Selected backgrounds (merged for contiguous checked items).
              A run is normally one block; mid merge/split it is drawn as two
              abutting halves — see useMergeSplitBlocks. */}
          <SelectionBackgrounds blocks={blocks} />

          {/* Hover background */}
          <FluidHoverHighlight
            hover={hover}
            className={shape.bg}
          />

          {/* Focus ring */}
          {/* One shared ring springs between rows on spring.fast. It sits 2px
              outside the row and shape.focusRing is the row radius + 2px, so
              the corners stay concentric; z-20 lifts it above the rows. */}
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
      </CheckboxGroupContext.Provider>
    );

    // A size prop pins every row in the group to one ladder step.
    return size ? <SizeProvider size={size}>{group}</SizeProvider> : group;
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
    const { registerItem, activeIndex } = useCheckboxGroup();

    useRegisterFluidHoverItem(registerItem, index, internalRef);

    const isActive = activeIndex === index;
    const shape = useShape();
    const sizeClasses = useSize();
    const compact = sizeClasses.variant === "compact";

    return (
      <div
        ref={(node) => {
          (internalRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
          if (typeof ref === "function") ref(node);
          else if (ref) (ref as React.MutableRefObject<HTMLDivElement | null>).current = node;
        }}
        data-fluid-hover-index={index}
        // Every row is its own tab stop: checkboxes toggle independently, so
        // there is no roving tabindex.
        tabIndex={0}
        // The row, not the primitive, carries the role, state and name: it is
        // the element that takes focus.
        role="checkbox"
        aria-checked={checked}
        aria-label={label}
        onClick={onToggle}
        onMouseDown={(e) => {
          // Clicking the 16px checkbox square would natively focus the hidden
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
          pointerFocusRedirect = true;
          try {
            e.currentTarget.focus();
          } finally {
            pointerFocusRedirect = false;
          }
        }}
        // The row is a div, so it handles Space and Enter itself;
        // preventDefault keeps Space from scrolling the page.
        onKeyDown={(e) => {
          if (e.key === " " || e.key === "Enter") {
            e.preventDefault();
            onToggle();
          }
        }}
        className={cn(
          // Fixed height (was py-1.5 around a 19.5px line box ≈ 31.5px) so the
          // text-box trim on the label doesn't shrink the row.
          `relative z-10 flex ${sizeClasses.control} items-center ${sizeClasses.gap} ${shape.item} ${sizeClasses.px} cursor-pointer outline-none`,
          className
        )}
        {...props}
      >
        {/* Checkbox: Base UI primitive for accessibility. It has no
            onCheckedChange on purpose; the row toggles for it (see onClick). */}
        <CheckboxPrimitive.Root
          checked={checked}
          // Out of the tab order and hidden from assistive tech: the row already
          // is the checkbox, so exposing the primitive too would announce every
          // option twice.
          tabIndex={-1}
          aria-hidden
          className={cn(
            "relative shrink-0 appearance-none bg-transparent p-0 border-0 outline-none cursor-pointer",
            compact ? "w-[14px] h-[14px]" : "w-[16px] h-[16px]"
          )}
          // Base UI swallows a click on the square and replays it on its
          // hidden input, which sits inside this row, so the replay bubbles
          // to the row's onClick. Stop the original click here so the row
          // sees one click and toggles once. Listening to onCheckedChange as
          // well would toggle a second time and undo the first.
          onClick={(e) => e.stopPropagation()}
        >
          {/* Border */}
          {/* Checked: the border turns transparent and the check alone marks
              the state. Unchecked: hover or focus darkens it from border to
              neutral-400 (neutral-500 dark) over 80ms. */}
          <div
            className={cn(
              "absolute inset-0 border-solid transition-all duration-80",
              compact ? "rounded-[4px]" : "rounded-[5px]",
              checked
                ? "border-[1.5px] border-transparent"
                : isActive
                ? "border-[1.5px] border-neutral-400 dark:border-neutral-500"
                : "border-[1.5px] border-border"
            )}
          />
          {/* Check mark */}
          {/* keepMounted hands unmounting to AnimatePresence: without it Base UI
              drops the indicator as soon as the box unchecks and the retract
              never plays. */}
          {/* initial={false}: a row checked at mount shows the finished
              check instead of drawing it, so default selections don't
              animate on page load. */}
          <AnimatePresence initial={false}>
            {checked && (
              <CheckboxPrimitive.Indicator
                keepMounted
                render={(indicatorProps) => {
                  const rest = omit(
                    indicatorProps as React.HTMLAttributes<SVGSVGElement>,
                    [
                      "style",
                      "onDrag",
                      "onDragStart",
                      "onDragEnd",
                      "onAnimationStart",
                      "onAnimationEnd",
                      "onAnimationIteration",
                    ]
                  );
                  return (
                    <motion.svg
                      {...rest}
                      width={compact ? 16 : 18}
                      height={compact ? 16 : 18}
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
                      {/* The check draws itself: pathLength 0 → 1 over
                          0.08s easeOut on check, back to 0 over 0.04s
                          easeIn on uncheck. */}
                      <motion.path
                        d="M6 12L10 16L18 8"
                        initial={{ pathLength: 0 }}
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
        <span className={cn("inline-grid", sizeClasses.text)}>
          {/* Always semibold, so the grid cell is sized for the heaviest
              weight and the row never shifts when the label gains weight. */}
          <span
            className="col-start-1 row-start-1 invisible [text-box:trim-both_cap_alphabetic]"
            style={{ fontVariationSettings: fontWeights.semibold }}
            aria-hidden="true"
          >
            {label}
          </span>
          {/* Weight changes only when checked ('wght' 400 → 550), so weight
              marks state; color goes muted → foreground when checked, hovered
              or focused. Both transition over 80ms. */}
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
