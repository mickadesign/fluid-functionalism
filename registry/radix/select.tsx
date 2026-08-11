"use client";

import {
  forwardRef,
  useRef,
  useEffect,
  useState,
  useCallback,
  useMemo,
  createContext,
  useContext,
  type ReactNode,
  type HTMLAttributes,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cva, type VariantProps } from "class-variance-authority";
import * as SelectPrimitive from "@radix-ui/react-select";
import type { IconComponent } from "@/lib/icon-context";
import { cn } from "@/lib/utils";
import { spring, exitFallbackMs } from "@/lib/springs";
import { useProximityHover } from "@/hooks/use-proximity-hover";
import { useShape } from "@/lib/shape-context";
import { SizeProvider, useSize, type SizeVariant } from "@/lib/size-context";
import { Elevated } from "@/lib/elevated";

// ---------------------------------------------------------------------------
// Select context
//
// Built on Radix Select, which owns positioning (popper collision flipping),
// dismissal (outside press, Escape), list keyboard navigation + typeahead
// (open and closed), combobox ARIA, and the hidden native <select> for forms.
// This layer keeps the proximity-hover overlays, the
// spring open/close animation, and the animated checkmark.
//
// Radix-specific notes (verified against @radix-ui/react-select 2.2.6 dist):
//
// - Value/placeholder: Radix shows the placeholder when its value is "" or
//   undefined, so the root is *always controlled* with our string state
//   ("" = no selection). Passing "" never flips controlled/uncontrolled, and
//   `data-placeholder` lands on the Trigger (not the Value span) — hence the
//   `group-data-[placeholder]:` variant on the value wrapper below.
//
// - Initial label: while closed, Radix renders Content's children into a
//   detached DocumentFragment; the selected SelectItem/ItemText therefore
//   mounts before the popup ever opens and portals its text into the Value
//   node. No item traversal is needed — SelectContent just has to render
//   unconditionally, never gated behind a
//   local mounted flag.
//
// - Exit animation: Radix Select has no Presence/forceMount, so the popup
//   unmounts the instant its `open` flips false. The root therefore keeps two
//   open states: `open` (immediate, drives the motion targets) and
//   `radixOpen` (what Radix sees; released via `unmount()` once the exit
//   tween finishes).
//
// - Radix Select is modal-ish: it scroll-locks the page and disables outside
//   pointer events while open. The Viewport's injected
//   stylesheet hides its own scrollbar, which would leave long lists with no
//   scroll affordance at all (the scroll buttons aren't rendered either) —
//   overridden with `![scrollbar-width:thin]` on the viewport, which also
//   makes Chromium/Safari ignore the ::-webkit-scrollbar{display:none} rule.
// ---------------------------------------------------------------------------

// How long a selection holds the popup open before closing, so the
// acknowledgment — the checkmark drawing in and the selected background
// springing to the picked row — is visible instead of being cut off by the
// ~60ms close fade. Escape and outside presses still close immediately.
const selectionAckMs = 300;

interface SelectContextValue {
  value: string;
  open: boolean;
  /** Releases Radix's open state once the exit animation has played. */
  unmount: () => void;
}

const SelectContext = createContext<SelectContextValue | null>(null);

function useSelectContext() {
  const ctx = useContext(SelectContext);
  if (!ctx) throw new Error("Select compound components must be inside <Select>");
  return ctx;
}

// Content context for proximity hover
interface SelectContentContextValue {
  registerItem: (index: number, element: HTMLElement | null) => void;
  activeIndex: number | null;
  checkedIndex?: number;
}

const SelectContentContext =
  createContext<SelectContentContextValue | null>(null);

// ---------------------------------------------------------------------------
// Select (root)
// ---------------------------------------------------------------------------

interface SelectProps {
  children: ReactNode;
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  disabled?: boolean;
  name?: string;
  required?: boolean;
  /** Pins trigger and popup to one step of the size ladder (default 36px,
   *  compact 28px — see /docs/sizes). Omitted, both follow the surrounding
   *  SizeProvider. */
  size?: SizeVariant;
}

function Select({
  children,
  value,
  defaultValue,
  onValueChange,
  disabled = false,
  name,
  required,
  size,
}: SelectProps) {
  const [internalValue, setInternalValue] = useState(defaultValue ?? "");
  // Visual open state — flips immediately so exit springs start at once.
  const [open, setOpen] = useState(false);
  // What Radix sees. Stays true through the exit tween (Radix has no
  // deferred-unmount API), then `unmount` releases it.
  const [radixOpen, setRadixOpen] = useState(false);
  const currentValue = value !== undefined ? value : internalValue;

  const lastPickRef = useRef(0);
  const ackTimeoutRef = useRef<number | null>(null);
  const cancelAckClose = useCallback(() => {
    if (ackTimeoutRef.current !== null) {
      clearTimeout(ackTimeoutRef.current);
      ackTimeoutRef.current = null;
    }
  }, []);
  useEffect(() => cancelAckClose, [cancelAckClose]);

  const handleValueChange = useCallback(
    (next: string) => {
      lastPickRef.current = performance.now();
      if (value === undefined) setInternalValue(next);
      onValueChange?.(next);
    },
    [value, onValueChange]
  );

  // Picking an item acknowledges before closing: the close is deferred by
  // selectionAckMs so the checkmark draw and the selected background's spring
  // to the picked row are seen. Radix reports no close reason, so a close
  // arriving right after onValueChange is read as selection-driven; every
  // other close (Escape, outside press, trigger toggle) is immediate and
  // cancels any pending acknowledgment; re-picking restarts it.
  const handleOpenChange = useCallback(
    (nextOpen: boolean) => {
      if (!nextOpen && performance.now() - lastPickRef.current < 100) {
        cancelAckClose();
        ackTimeoutRef.current = window.setTimeout(() => {
          ackTimeoutRef.current = null;
          setOpen(false);
        }, selectionAckMs);
        return;
      }
      cancelAckClose();
      setOpen(nextOpen);
      if (nextOpen) setRadixOpen(true);
      // Closing: radixOpen is released by SelectContent once the exit
      // animation completes (onAnimationComplete or the timeout fallback).
    },
    [cancelAckClose]
  );

  const unmount = useCallback(() => setRadixOpen(false), []);

  const ctx = useMemo(
    () => ({ value: currentValue, open, unmount }),
    [currentValue, open, unmount]
  );

  // A size prop pins the whole compound (trigger + portalled popup — React
  // context crosses portals) to one step of the ladder.
  const root = (
    <SelectContext.Provider value={ctx}>
      <SelectPrimitive.Root
        // Always controlled; "" (no selection) shows the placeholder — Radix
        // treats "" and undefined identically for placeholder purposes, but
        // undefined would flip the root to uncontrolled.
        value={currentValue}
        onValueChange={handleValueChange}
        open={radixOpen}
        onOpenChange={handleOpenChange}
        disabled={disabled}
        name={name}
        required={required}
      >
        {children}
      </SelectPrimitive.Root>
    </SelectContext.Provider>
  );

  return size ? <SizeProvider size={size}>{root}</SizeProvider> : root;
}

Select.displayName = "Select";

// ---------------------------------------------------------------------------
// SelectTrigger
// ---------------------------------------------------------------------------

const triggerVariants = cva(
  [
    "group inline-flex items-center justify-between outline-none cursor-pointer",
    "transition-all duration-80",
    "disabled:opacity-50 disabled:pointer-events-none",
    "focus-visible:ring-1 focus-visible:ring-[color:var(--focus-ring,#6B97FF)]",
  ],
  {
    variants: {
      variant: {
        bordered:
          "border border-border bg-transparent text-foreground hover:bg-hover",
        borderless:
          "border border-transparent bg-transparent text-foreground hover:bg-hover",
      },
    },
    defaultVariants: {
      variant: "bordered",
    },
  }
);

interface SelectTriggerProps
  extends Omit<HTMLAttributes<HTMLButtonElement>, "children">,
    VariantProps<typeof triggerVariants> {
  icon?: IconComponent;
  placeholder?: string;
  error?: string;
  /** Size override for the trigger alone. Prefer the `size` prop on <Select>
   *  (or a surrounding SizeProvider) so the popup matches. */
  size?: SizeVariant;
}

const SelectTrigger = forwardRef<HTMLButtonElement, SelectTriggerProps>(
  (
    {
      className,
      variant,
      icon: Icon,
      placeholder = "Select…",
      error,
      size,
      ...props
    },
    ref
  ) => {
    const shape = useShape();
    const sizeClasses = useSize(size);
    const compact = sizeClasses.variant === "compact";

    return (
      <div className="flex flex-col gap-1">
        <SelectPrimitive.Trigger
          ref={ref}
          aria-invalid={!!error || undefined}
          className={cn(
            triggerVariants({ variant }),
            sizeClasses.control,
            sizeClasses.text,
            sizeClasses.px,
            sizeClasses.gap,
            compact ? "min-w-[128px]" : "min-w-[160px]",
            shape.input,
            error && "border-destructive/50 hover:border-destructive/50",
            className
          )}
          {...props}
        >
          <span className={cn("flex items-center min-w-0 flex-1", sizeClasses.gap)}>
            {Icon && (
              <Icon
                size={sizeClasses.icon}
                strokeWidth={1.5}
                className="shrink-0 text-muted-foreground transition-[color,stroke-width] duration-80 group-hover:text-foreground group-hover:stroke-[2]"
              />
            )}
            {/* Radix strips className from Select.Value, and `data-placeholder`
                lives on the Trigger, so the label styling sits on a wrapper
                span keyed off the trigger's `group` class. */}
            {/* py-1/-my-1 keeps truncate's overflow:hidden from clipping
                ascenders/descenders outside the trimmed box. */}
            <span className="min-w-0 flex-1 text-left truncate [text-box:trim-both_cap_alphabetic] py-1 -my-1 group-data-[placeholder]:text-muted-foreground">
              <SelectPrimitive.Value placeholder={placeholder} />
            </span>
          </span>

          <SelectPrimitive.Icon asChild>
            <svg
              width={sizeClasses.icon}
              height={sizeClasses.icon}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              className="shrink-0 text-muted-foreground transition-colors duration-80 group-hover:text-foreground"
            >
              <path d="M6 9l6 6 6-6" />
            </svg>
          </SelectPrimitive.Icon>
        </SelectPrimitive.Trigger>
        {error && (
          <span className="text-[12px] text-destructive pl-3">{error}</span>
        )}
      </div>
    );
  }
);

SelectTrigger.displayName = "SelectTrigger";

// ---------------------------------------------------------------------------
// SelectContent
// ---------------------------------------------------------------------------

interface SelectContentProps {
  className?: string;
  children: ReactNode;
}

const SelectContent = forwardRef<HTMLDivElement, SelectContentProps>(
  ({ className, children }, ref) => {
    const { open, value, unmount } = useSelectContext();
    const shape = useShape();
    const containerRef = useRef<HTMLDivElement>(null);

    const {
      activeIndex,
      setActiveIndex,
      itemRects,
      isMeasured,
      sessionRef,
      handlers,
      registerItem,
      remeasure,
    } = useProximityHover(containerRef);

    const [focusedIndex, setFocusedIndex] = useState<number | null>(null);
    const [checkedIndex, setCheckedIndex] = useState<number | undefined>(
      undefined
    );

    // Release Radix's open state once the exit tween has played.
    // onAnimationComplete on the motion.div is the primary signal; this
    // timeout is a fallback for throttled/background tabs where rAF-driven
    // animation callbacks can stall. The popup exits with spring.fast, so the
    // fallback tracks that tier's exit duration plus a safety buffer.
    useEffect(() => {
      if (open) return;
      const id = setTimeout(() => unmount(), exitFallbackMs(spring.fast));
      return () => clearTimeout(id);
    }, [open, unmount]);

    // Fresh rects once per open. Measuring is the hook's job — it owns the
    // one coalesced pass that item registration and container resizes both
    // feed into, and a second pass from elsewhere is what used to land a
    // corrected rect on an already-mounted overlay. The popup keeps its items
    // registered while it sits hidden between opens, so registration alone
    // would never trigger a fresh pass on reopen.
    useEffect(() => {
      if (!open) return;
      remeasure();
    }, [open, remeasure]);

    // Detect the checked row. Deliberately does NOT remeasure on a value
    // change while open: the rows haven't moved, so the published rects stay
    // trustworthy and only checkedIndex switches — which lets the selected
    // marker spring from the old row to the picked one (the selection
    // acknowledgment) instead of unmounting and snapping.
    useEffect(() => {
      if (!open) return;
      // Double rAF: first waits for React commit, second for layout
      let inner: number;
      const outer = requestAnimationFrame(() => {
        inner = requestAnimationFrame(() => {
          const container = containerRef.current;
          if (container) {
            const items = Array.from(
              container.querySelectorAll("[data-proximity-index]")
            ) as HTMLElement[];
            const idx = items.findIndex(
              (el) => el.getAttribute("data-value") === value
            );
            setCheckedIndex(idx !== -1 ? idx : undefined);
          }
        });
      });
      return () => {
        cancelAnimationFrame(outer);
        cancelAnimationFrame(inner);
      };
    }, [open, value]);

    // Reset every overlay index as the close begins. checkedIndex otherwise
    // lags one open behind value (picking an item closes the popup before the
    // effect above re-syncs it), and a leftover activeIndex is worse: the popup
    // stays mounted through the exit tween, so on reopen the hover pill would
    // still be sitting on the previously active row and spring from there to
    // the row that auto-focus lands on.
    // Keyed on `open` (the visual state), not `radixOpen`: this fires as the
    // close begins, in lockstep with the measure effect above that stops
    // syncing checkedIndex. `radixOpen` would fire later, only after Radix's
    // deferred unmount.
    useEffect(() => {
      if (open) return;
      setCheckedIndex(undefined);
      setActiveIndex(null);
      setFocusedIndex(null);
    }, [open, setActiveIndex]);

    // Overlays read rects only once the hook reports the item set fully
    // measured. Positioning one from an incomplete pass mounts it at the wrong
    // row, and the correcting pass then springs it across the list.
    const activeRect =
      isMeasured && activeIndex !== null ? itemRects[activeIndex] : null;
    const checkedRect =
      isMeasured && checkedIndex != null ? itemRects[checkedIndex] : null;
    const focusRect =
      isMeasured && focusedIndex !== null ? itemRects[focusedIndex] : null;

    const contentCtx = useMemo(
      () => ({ registerItem, activeIndex, checkedIndex }),
      [registerItem, activeIndex, checkedIndex]
    );

    // Rendered unconditionally: while closed, Radix parks these children in a
    // detached DocumentFragment so the items stay registered (typeahead on
    // the closed trigger, native <select> options, and the ItemText → Value
    // label portal all depend on it).
    return (
      <SelectPrimitive.Portal>
        <SelectPrimitive.Content
          position="popper"
          side="bottom"
          align="start"
          sideOffset={6}
          className="z-50"
        >
          <motion.div
            initial={{ opacity: 0, y: -4, scaleY: 0.96 }}
            animate={
              open
                ? { opacity: 1, y: 0, scaleY: 1 }
                : { opacity: 0, y: -4, scaleY: 0.96 }
            }
            transition={open ? spring.fast : spring.fast.exit}
            style={{ transformOrigin: "top center" }}
            // Radix unmounts the popup the moment its open state flips, so
            // that flip is held back (radixOpen in the root) until the exit
            // spring has finished.
            onAnimationComplete={() => {
              if (!open) unmount();
            }}
          >
            <SelectContentContext.Provider value={contentCtx}>
              {/* The Viewport is the scroll container and, via its inline
                  position: relative, the offsetParent the proximity overlay
                  rects anchor to. */}
              <SelectPrimitive.Viewport asChild>
                <Elevated
                  offset={2}
                  shadowLevel={3}
                  ref={(node: HTMLDivElement | null) => {
                    (
                      containerRef as React.MutableRefObject<HTMLDivElement | null>
                    ).current = node;
                    if (typeof ref === "function") ref(node);
                    else if (ref)
                      (
                        ref as React.MutableRefObject<HTMLDivElement | null>
                      ).current = node;
                  }}
                  onMouseEnter={() => {
                    handlers.onMouseEnter();
                    setFocusedIndex(null);
                  }}
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
                    if (containerRef.current?.contains(e.relatedTarget as Node))
                      return;
                    setFocusedIndex(null);
                    setActiveIndex(null);
                  }}
                  className={cn(
                    // min-w tracks the trigger via Radix's popper-provided
                    // vars.
                    // ![scrollbar-width:thin] undoes Radix's injected
                    // scrollbar-hiding stylesheet (see header comment) so
                    // long lists keep a visible scrollbar.
                    `relative flex flex-col gap-0.5 min-w-[var(--radix-select-trigger-width)] max-h-[min(300px,var(--radix-select-content-available-height))] overflow-y-auto ![scrollbar-width:thin] ${shape.container} p-1 select-none outline-none`,
                    className
                  )}
                >
                  {/* The three overlays are torn down as the close begins rather
                      than exit-animated, because an overlay still mounted when the
                      popup reopens is one AnimatePresence re-adopts under its old
                      key: `initial` never runs again, so it keeps the position of the
                      row it had before and animates from there to the new one. The
                      popup's own fade covers their disappearance. */}
                  {/* Selected background */}
                  {open && (
                    <AnimatePresence>
                      {checkedRect && (
                        <motion.div
                          className={`absolute ${shape.bg} bg-active pointer-events-none`}
                          // Position lives in `animate` so an in-session value
                          // change springs the marker to the picked row (the
                          // selection acknowledgment). Safe against the reopen
                          // slide: the `open &&` teardown means no marker
                          // survives a close, and a fresh mount with
                          // initial={false} renders snapped at these values.
                          initial={false}
                          animate={{
                            top: checkedRect.top,
                            left: checkedRect.left,
                            width: checkedRect.width,
                            height: checkedRect.height,
                            opacity: 1,
                          }}
                          exit={{ opacity: 0, transition: spring.moderate.exit }}
                          transition={{
                            ...spring.moderate,
                            opacity: { duration: 0.08 },
                          }}
                        />
                      )}
                    </AnimatePresence>
                  )}

                  {/* Hover background */}
                  {open && (
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
                  )}

                  {/* Focus ring */}
                  {open && (
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
                  )}

                  {children}
                </Elevated>
              </SelectPrimitive.Viewport>
            </SelectContentContext.Provider>
          </motion.div>
        </SelectPrimitive.Content>
      </SelectPrimitive.Portal>
    );
  }
);

SelectContent.displayName = "SelectContent";

// ---------------------------------------------------------------------------
// SelectItem
// ---------------------------------------------------------------------------

interface SelectItemProps extends HTMLAttributes<HTMLDivElement> {
  icon?: IconComponent;
  index: number;
  value: string;
  disabled?: boolean;
}

const SelectItem = forwardRef<HTMLDivElement, SelectItemProps>(
  (
    {
      className,
      children,
      icon: Icon,
      value,
      index,
      disabled = false,
      ...props
    },
    ref
  ) => {
    const selectCtx = useSelectContext();
    const contentCtx = useContext(SelectContentContext);
    const internalRef = useRef<HTMLDivElement>(null);
    const shape = useShape();
    const sizeClasses = useSize();
    const compact = sizeClasses.variant === "compact";
    const hasMounted = useRef(false);

    useEffect(() => {
      hasMounted.current = true;
    }, []);

    // Register with proximity hover. Depends on the (stable) registerItem
    // rather than the content context, which is rebuilt on every activeIndex
    // change: keying the effect to the whole context re-ran it per mousemove,
    // unregistering and re-registering every row and so keeping the hook's
    // measurement permanently unsettled while the pointer moved.
    const registerItem = contentCtx?.registerItem;
    useEffect(() => {
      if (!registerItem) return;
      registerItem(index, internalRef.current);
      return () => registerItem(index, null);
    }, [index, registerItem]);

    const isActive = contentCtx?.activeIndex === index;
    const isChecked = selectCtx.value === value;
    const skipAnimation = !hasMounted.current;

    return (
      <SelectPrimitive.Item
        value={value}
        disabled={disabled}
        textValue={typeof children === "string" ? children : undefined}
        ref={(node: HTMLDivElement | null) => {
          (
            internalRef as React.MutableRefObject<HTMLDivElement | null>
          ).current = node;
          if (typeof ref === "function") ref(node);
          else if (ref)
            (ref as React.MutableRefObject<HTMLDivElement | null>).current =
              node;
        }}
        data-proximity-index={index}
        data-value={value}
        className={cn(
          // Fixed height (was py-2 around a 19.5px line box ≈ 35.5px) so
          // the text-box trim on the item text doesn't shrink the row.
          // shrink-0: the popup is a max-height flex column, so without it
          // a long list compresses rows to fit instead of scrolling.
          `relative z-10 flex ${sizeClasses.control} shrink-0 items-center ${sizeClasses.gap} ${shape.item} ${sizeClasses.itemPx} ${sizeClasses.text} cursor-pointer outline-none select-none`,
          "transition-[color] duration-80",
          isActive || isChecked
            ? "text-foreground"
            : "text-muted-foreground",
          disabled && "opacity-50 pointer-events-none",
          className
        )}
        {...props}
      >
        {Icon && (
          <Icon
            size={sizeClasses.icon}
            strokeWidth={isActive || isChecked ? 2 : 1.5}
            className="shrink-0 transition-[color,stroke-width] duration-80"
          />
        )}

        {/* Layout classes live on the wrapper (Radix strips className from
            ItemText) so the ItemText → trigger portal carries the plain label
            only, not a styled span. Radix's built-in ItemIndicator is not
            rendered — the animated checkmark below keys off our context. */}
        {/* py-1/-my-1 keeps truncate's overflow:hidden from clipping
            ascenders/descenders outside the trimmed box. */}
        <span className="flex-1 min-w-0 truncate [text-box:trim-both_cap_alphabetic] py-1 -my-1">
          <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
        </span>

        {/* Always-rendered fixed slot so the check appearing/disappearing
            never changes the row's intrinsic width — without it the whole
            popup resizes when a selection lands. */}
        <span
          aria-hidden
          className={cn("shrink-0", compact ? "w-3.5 h-3.5" : "w-4 h-4")}
        >
          <AnimatePresence>
            {isChecked && (
              <motion.svg
                key="check"
                width={sizeClasses.icon}
                height={sizeClasses.icon}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-foreground"
                initial={{ opacity: 1 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 1 }}
              >
                <motion.path
                  d="M4 12L9 17L20 6"
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
            )}
          </AnimatePresence>
        </span>
      </SelectPrimitive.Item>
    );
  }
);

SelectItem.displayName = "SelectItem";

// ---------------------------------------------------------------------------
// SelectGroup + SelectLabel + SelectSeparator
//
// Plain presentational divs. Radix's own Select.Label throws when used
// outside a Select.Group, which would forbid a standalone label.
// ---------------------------------------------------------------------------

function SelectGroup({
  children,
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div role="group" className={className} {...props}>
      {children}
    </div>
  );
}

SelectGroup.displayName = "SelectGroup";

const SelectLabel = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    // Group labels are the caption role of the type scale — see /docs/sizes.
    const compact = useSize().variant === "compact";
    return (
    <div
      ref={ref}
      className={cn(
        "px-2 py-1.5 shrink-0 text-muted-foreground",
        compact ? "text-[11px]" : "text-[12px]",
        className
      )}
      {...props}
    />
    );
  }
);

SelectLabel.displayName = "SelectLabel";

const SelectSeparator = forwardRef<
  HTMLDivElement,
  HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    role="separator"
    className={cn("my-1 -mx-1 h-px shrink-0 bg-border/60", className)}
    {...props}
  />
));

SelectSeparator.displayName = "SelectSeparator";

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

export {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectGroup,
  SelectLabel,
  SelectSeparator,
  triggerVariants,
};

export type { SelectProps, SelectTriggerProps, SelectContentProps, SelectItemProps };
