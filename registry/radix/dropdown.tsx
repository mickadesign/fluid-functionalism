"use client";

import {
  useRef,
  useState,
  useEffect,
  useCallback,
  useMemo,
  createContext,
  useContext,
  forwardRef,
  cloneElement,
  type ReactNode,
  type ReactElement,
  type HTMLAttributes,
  type ComponentPropsWithoutRef,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu";
import { cn } from "@/lib/utils";
import { spring, exitFallbackMs } from "@/lib/springs";
import { useFluidHover } from "@/hooks/use-fluid-hover";
import {
  useMergeSplitBlocks,
  useSelectionRuns,
  SelectionBackgrounds,
} from "@/hooks/use-merge-split";
import { shapeMap } from "@/lib/shape-context";
import { SizeProvider, useSize, type SizeVariant } from "@/lib/size-context";
import { Elevated } from "@/lib/elevated";
import {
  popupMotionClass,
  popupScrollAreaClass,
  popupViewportClass,
  isDisabledRow,
} from "@/lib/popup";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DropdownSearch,
  DropdownEmpty,
  DropdownSearchHostContext,
  useDropdownSearchHost,
  type DropdownSearchProps,
} from "@/components/ui/dropdown-search";
import {
  DropdownContext,
  useDropdown,
  useDropdownMaybe,
  type DropdownContextValue,
  type MenuItemRenderOptions,
} from "@/components/ui/menu-item";
import { FluidHoverHighlight } from "@/components/ui/fluid-hover-highlight";

// Dropdown opts out of the global pill/rounded shape context — popover surfaces
// look cleaner with the smaller "rounded" radii regardless of how the rest of
// the UI is shaped (the heavy pill bubbling distorts perceived padding at this
// scale and produces the corner-shadow asymmetry).
const shape = shapeMap.rounded;

// ---------------------------------------------------------------------------
// Panel context — shared by the inline Dropdown and the popup DropdownContent.
//
// The context object itself lives in menu-item.tsx so MenuItem resolves
// whichever dropdown provider actually wraps it, even when dropdowns built
// on different primitives render side by side. Re-exported here so the
// public dropdown API is unchanged.
// ---------------------------------------------------------------------------

export { useDropdown, useDropdownMaybe };
export type { DropdownContextValue, MenuItemRenderOptions };

// ---------------------------------------------------------------------------
// Dropdown (inline panel)
//
// An always-rendered panel — no trigger, positioning, or dismissal. Because it
// sits statically in the page it does NOT claim popup menu semantics: the
// container is a plain role="group" (pass `aria-label` to name it). The real
// role="menu" lives on the popup DropdownContent below, which Radix wires to
// a trigger. Consumers who hand-roll a trigger around the inline panel get
// grouping semantics rather than a falsely-announced popup menu.
// ---------------------------------------------------------------------------

interface DropdownProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  checkedIndex?: number;
  /** Multiple selection: the checked rows. Rows become checkbox items and
   *  contiguous runs share one merged background (see CheckboxGroup). */
  checkedIndices?: number[];
  /** Pins the panel's rows to one step of the size ladder (default 36px,
   *  compact 28px — see /docs/sizes). Omitted, they follow the surrounding
   *  SizeProvider. */
  size?: SizeVariant;
}

const Dropdown = forwardRef<HTMLDivElement, DropdownProps>(
  ({ children, checkedIndex, checkedIndices, size, className, ...props }, ref) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const hover = useFluidHover(containerRef, { isItemDisabled: isDisabledRow });
    const {
      activeIndex,
      setActiveIndex,
      itemRects,
      handlers,
      registerItem,
    } = hover;

    const [focusedIndex, setFocusedIndex] = useState<number | null>(null);

    const multiple = checkedIndices != null;
    const checkedRect =
      !multiple && checkedIndex != null ? itemRects[checkedIndex] : null;
    const focusRect = focusedIndex !== null ? itemRects[focusedIndex] : null;
    // Multiple: one merged block per contiguous run of checked rows.
    const runs = useSelectionRuns(checkedIndices ?? []);
    const blocks = useMergeSplitBlocks(runs, itemRects, shape.bgRadius);
    const panelCtx = useMemo(
      () => ({ registerItem, activeIndex, checkedIndex, multiple, checkedIndices }),
      [registerItem, activeIndex, checkedIndex, multiple, checkedIndices]
    );
    const panel = (
      <DropdownContext.Provider value={panelCtx}>
        <Elevated
          offset={2}
          shadowLevel={3}
          ref={(node) => {
            (containerRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
            if (typeof ref === "function") ref(node);
            else if (ref) (ref as React.MutableRefObject<HTMLDivElement | null>).current = node;
          }}
          onMouseEnter={handlers.onMouseEnter}
          onMouseMove={handlers.onMouseMove}
          onMouseLeave={handlers.onMouseLeave}
          onClick={handlers.onClick}
          onFocus={(e) => {
            const indexAttr = (e.target as HTMLElement)
              .closest("[data-fluid-hover-index]")
              ?.getAttribute("data-fluid-hover-index");
            if (indexAttr != null) {
              const idx = Number(indexAttr);
              setActiveIndex(idx);
              setFocusedIndex(
                (e.target as HTMLElement).matches(":focus-visible") ? idx : null
              );
            }
          }}
          onBlur={(e) => {
            if (containerRef.current?.contains(e.relatedTarget as Node)) return;
            setFocusedIndex(null);
            setActiveIndex(null);
          }}
          onKeyDown={(e) => {
            const items = Array.from(
              containerRef.current?.querySelectorAll(
                '[role="menuitem"], [role="menuitemradio"], [role="menuitemcheckbox"]'
              ) ?? []
            ) as HTMLElement[];
            const currentIdx = items.indexOf(e.target as HTMLElement);
            if (currentIdx === -1) return;

            if (["ArrowDown", "ArrowUp", "ArrowRight", "ArrowLeft"].includes(e.key)) {
              e.preventDefault();
              const next = ["ArrowDown", "ArrowRight"].includes(e.key)
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
            `relative flex flex-col w-72 max-w-full  p-1 select-none`,
            className
          )}
          {...props}
        >
          {/* Selected backgrounds — merged runs in multiple mode */}
          {multiple && <SelectionBackgrounds blocks={blocks} />}

          {/* Selected background */}
          <AnimatePresence>
            {checkedRect && (
              <motion.div
                className={`absolute ${shape.bg} bg-active pointer-events-none`}
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

          {/* Hover background */}
          <FluidHoverHighlight
            hover={hover}
            from={checkedRect}
            className={shape.bg}
          />

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
        </Elevated>
      </DropdownContext.Provider>
    );

    // A size prop pins every row in the panel to one ladder step.
    return size ? <SizeProvider size={size}>{panel}</SizeProvider> : panel;
  }
);

Dropdown.displayName = "Dropdown";

// ---------------------------------------------------------------------------
// DropdownMenu (popup root)
//
// Built on Radix's DropdownMenu primitive, which owns the trigger wiring,
// positioning (collision flipping, anchor tracking), dismissal (outside
// press, focus-out, Escape), roving highlight, typeahead, and close-on-select.
// This layer keeps the fluid-hover overlays and the
// spring open/close animation. Radix has no actionsRef-style deferred unmount,
// so the portal lifetime is managed with local `mounted` state (the same
// pattern the Dialog and MobileDrawer components use).
// ---------------------------------------------------------------------------

interface DropdownMenuContextValue {
  open: boolean;
  disabled: boolean;
}

const DropdownMenuContext = createContext<DropdownMenuContextValue | null>(null);

function useDropdownMenuContext() {
  const ctx = useContext(DropdownMenuContext);
  if (!ctx)
    throw new Error(
      "DropdownMenu compound components must be inside <DropdownMenu>"
    );
  return ctx;
}

interface DropdownMenuProps {
  children: ReactNode;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  disabled?: boolean;
  /** Pins trigger-side content and the portalled popup rows to one step of
   *  the size ladder (default 36px, compact 28px — see /docs/sizes).
   *  Omitted, they follow the surrounding SizeProvider. */
  size?: SizeVariant;
}

function DropdownMenu({
  children,
  open: openProp,
  defaultOpen = false,
  onOpenChange,
  disabled = false,
  size,
}: DropdownMenuProps) {
  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  const open = openProp !== undefined ? openProp : internalOpen;

  const handleOpenChange = useCallback(
    (next: boolean) => {
      if (openProp === undefined) setInternalOpen(next);
      onOpenChange?.(next);
    },
    [openProp, onOpenChange]
  );

  const ctx = useMemo(() => ({ open, disabled }), [open, disabled]);

  // A size prop pins the whole compound (trigger content + portalled popup —
  // React context crosses portals) to one ladder step.
  const root = (
    <DropdownMenuContext.Provider value={ctx}>
      {/* Root is always controlled by `open` (defaultOpen seeds local state
          instead of being forwarded), so DropdownContent can drive the exit
          animation before the portal unmounts. Non-modal: the page keeps
          scrolling and the popup tracks its anchor instead of detaching. */}
      <DropdownMenuPrimitive.Root
        open={open}
        onOpenChange={handleOpenChange}
        modal={false}
      >
        {children}
      </DropdownMenuPrimitive.Root>
    </DropdownMenuContext.Provider>
  );

  return size ? <SizeProvider size={size}>{root}</SizeProvider> : root;
}

DropdownMenu.displayName = "DropdownMenu";

// ---------------------------------------------------------------------------
// DropdownTrigger
//
// Radix's DropdownMenu.Trigger behind a Base-UI-style `render` prop, so
// any element can be the trigger with the same public API:
//
//   <DropdownTrigger render={<Button variant="secondary">Open</Button>} />
//
// `render` maps to Radix's asChild composition. Root-level `disabled` parity
// with Base UI's Menu.Root: the flag flows through context onto the trigger.
// ---------------------------------------------------------------------------

interface DropdownTriggerProps
  extends Omit<
    ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Trigger>,
    "asChild"
  > {
  /** Element to render as the trigger (Base-UI-style `render` composition
   *  API). */
  render?: ReactElement;
}

const DropdownTrigger = forwardRef<HTMLButtonElement, DropdownTriggerProps>(
  ({ render, children, disabled, ...props }, ref) => {
    const { disabled: rootDisabled } = useDropdownMenuContext();
    const isDisabled = disabled || rootDisabled;

    if (render) {
      return (
        <DropdownMenuPrimitive.Trigger
          ref={ref}
          asChild
          disabled={isDisabled}
          {...props}
        >
          {render}
        </DropdownMenuPrimitive.Trigger>
      );
    }
    return (
      <DropdownMenuPrimitive.Trigger ref={ref} disabled={isDisabled} {...props}>
        {children}
      </DropdownMenuPrimitive.Trigger>
    );
  }
);

DropdownTrigger.displayName = "DropdownTrigger";

// ---------------------------------------------------------------------------
// DropdownContent (popup panel)
//
// Portal > Content carrying the exact inline-panel visuals: Elevated surface,
// fluid-hover overlays, animated selected background, and animated focus
// ring. Children are wrapped in a RadioGroup so radio-style MenuItems
// (boolean `checked`) get correct aria-checked from `checkedIndex` (Radix
// radio values are strings, so the index maps through String()).
// ---------------------------------------------------------------------------

type RadixContentProps = ComponentPropsWithoutRef<
  typeof DropdownMenuPrimitive.Content
>;

interface DropdownContentProps {
  children: ReactNode;
  className?: string;
  /** Index of the checked item. Drives the animated selected background and
   *  the radio-group value announced to assistive tech. */
  checkedIndex?: number;
  /** Multiple selection: the checked rows. Rows become checkbox items that
   *  keep the menu open when toggled, and contiguous runs share one merged
   *  background (see CheckboxGroup). */
  checkedIndices?: number[];
  side?: RadixContentProps["side"];
  align?: RadixContentProps["align"];
  sideOffset?: number;
}

const DropdownContent = forwardRef<HTMLDivElement, DropdownContentProps>(
  (
    {
      className,
      children,
      checkedIndex,
      checkedIndices,
      side = "bottom",
      align = "start",
      sideOffset = 6,
    },
    ref
  ) => {
    const { open } = useDropdownMenuContext();
    const containerRef = useRef<HTMLDivElement>(null);

    const hover = useFluidHover(containerRef, { isItemDisabled: isDisabledRow });
    const {
      activeIndex,
      setActiveIndex,
      itemRects,
      handlers,
      registerItem,
      remeasure,
    } = hover;

    // An optional DropdownSearch child: typing on a focused row is
    // redirected into the field. (The field takes focus itself, a frame
    // after the primitive's own open autofocus.)
    const {
      host: searchHost,
      hasSearch,
      searchMounted,
      onKeyDownCapture: redirectTypingToSearch,
      isSearchField,
      highlightFirst,
    } = useDropdownSearchHost(open, { containerRef, setActiveIndex });

    // Open ready to act: focus the first enabled row (a mounted search field
    // takes focus itself instead). A frame after the primitive's own open
    // autofocus, which lands on the popup for pointer opens.
    useEffect(() => {
      if (!open) return;
      let inner: number | undefined;
      const outer = requestAnimationFrame(() => {
        inner = requestAnimationFrame(() => {
          if (hasSearch()) return;
          const container = containerRef.current;
          if (!container || container.contains(document.activeElement) && document.activeElement !== container) return;
          const first = container.querySelector<HTMLElement>(
            '[role="menuitem"]:not([aria-disabled="true"]), [role="menuitemradio"]:not([aria-disabled="true"]), [role="menuitemcheckbox"]:not([aria-disabled="true"])'
          );
          first?.focus();
        });
      });
      return () => {
        cancelAnimationFrame(outer);
        if (inner !== undefined) cancelAnimationFrame(inner);
      };
    }, [open, hasSearch]);

    // Portal lifetime: mounts as soon as `open` flips true; on close it stays
    // mounted (forceMount below) until the exit tween finishes.
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
      if (open) setMounted(true);
    }, [open]);

    // Fallback release for the deferred unmount: onAnimationComplete on the
    // motion.div is the primary signal, but rAF-driven animation callbacks
    // can stall in throttled/background tabs. The popup exits with
    // spring.fast, so the fallback tracks that tier's exit duration plus a
    // safety buffer.
    useEffect(() => {
      if (open) return;
      const id = setTimeout(() => setMounted(false), exitFallbackMs(spring.fast));
      return () => clearTimeout(id);
    }, [open]);

    // The popup keeps its rows registered between opens, so their rects
    // were taken while it was hidden: re-measure once it is open and laid out.
    useEffect(() => {
      if (!open || !mounted) return;
      remeasure();
    }, [open, mounted, remeasure]);

    const multiple = checkedIndices != null;
    const checkedRect =
      !multiple && checkedIndex != null ? itemRects[checkedIndex] : null;
    // Multiple: one merged block per contiguous run of checked rows.
    const runs = useSelectionRuns(checkedIndices ?? []);
    const blocks = useMergeSplitBlocks(runs, open ? itemRects : [], shape.bgRadius);
    // Inside the popup, Radix's Item / RadioItem own the role, aria-checked,
    // tabIndex, roving highlight, typeahead, and Enter/Space/click activation
    // (keyboard activation synthesizes a click, so the row div's onClick also
    // fires for keyboard). The styled div composes via asChild, with the row
    // content cloned back in as its children.
    const renderMenuItem = useCallback(
      ({
        radio,
        checkbox,
        checked,
        value,
        disabled,
        label,
        closeOnClick,
        element,
        children,
      }: MenuItemRenderOptions) => {
        const commonProps = {
          asChild: true,
          disabled,
          textValue: label,
          // Radix closes the menu on select by default; preventing the select
          // event keeps it open — Base UI's closeOnClick={false} parity.
          onSelect: closeOnClick
            ? undefined
            : (event: Event) => event.preventDefault(),
        };
        const item = cloneElement(element, {}, children);
        if (checkbox) {
          // The row's own onClick toggles the consumer state; the primitive
          // only owns the role, aria-checked, and keyboard activation.
          return (
            <DropdownMenuPrimitive.CheckboxItem checked={!!checked} {...commonProps}>
              {item}
            </DropdownMenuPrimitive.CheckboxItem>
          );
        }
        return radio ? (
          <DropdownMenuPrimitive.RadioItem value={String(value)} {...commonProps}>
            {item}
          </DropdownMenuPrimitive.RadioItem>
        ) : (
          <DropdownMenuPrimitive.Item {...commonProps}>
            {item}
          </DropdownMenuPrimitive.Item>
        );
      },
      []
    );

    const contentCtx = useMemo(
      () => ({
        registerItem,
        activeIndex,
        checkedIndex,
        multiple,
        checkedIndices,
        inMenu: true,
        renderMenuItem,
      }),
      [registerItem, activeIndex, checkedIndex, multiple, checkedIndices, renderMenuItem]
    );

    if (!mounted) return null;

    return (
      <DropdownMenuPrimitive.Portal forceMount>
        <DropdownMenuPrimitive.Content
          asChild
          forceMount
          side={side}
          align={align}
          sideOffset={sideOffset}
        >
          <motion.div
            className={cn("z-50 outline-none", popupMotionClass)}
            initial={{ opacity: 0, y: "var(--popup-enter-y)", scaleY: 0.96 }}
            animate={
              open
                ? { opacity: 1, y: 0, scaleY: 1 }
                : { opacity: 0, y: "var(--popup-enter-y)", scaleY: 0.96 }
            }
            transition={open ? spring.fast : spring.fast.exit}
            // Release the deferred unmount once the exit spring has finished
            // so the close animation fully plays.
            onAnimationComplete={() => {
              if (!open) setMounted(false);
            }}
          >
            <DropdownContext.Provider value={contentCtx}>
            <DropdownSearchHostContext.Provider value={searchHost}>
              <Elevated
                offset={2}
                shadowLevel={3}
                ref={ref}
                onKeyDownCapture={redirectTypingToSearch}
                onMouseEnter={handlers.onMouseEnter}
                onMouseMove={handlers.onMouseMove}
                onClick={handlers.onClick}
                onMouseLeave={() => {
                  handlers.onMouseLeave();
                  // The pointer's session is over; a focused search field
                  // gets its first-row highlight back.
                  if (isSearchField(document.activeElement)) highlightFirst();
                }}
                onFocus={(e) => {
                  const indexAttr = (e.target as HTMLElement)
                    .closest("[data-fluid-hover-index]")
                    ?.getAttribute("data-fluid-hover-index");
                  // Keyboard navigation moves the hover background only — no
                  // ring: in a menu the highlighted row is the focus indicator.
                  if (indexAttr != null) {
                    setActiveIndex(Number(indexAttr));
                  } else if (isSearchField(e.target)) {
                    // The search field: the first row (what Enter picks)
                    // carries the highlight while it has focus.
                    highlightFirst();
                  } else if (e.target !== e.currentTarget) {
                    // Focus moved to some other non-row inside the popup: no
                    // row is highlighted any more. The popup focusing itself
                    // (pointer leaving a row) doesn't count.
                    setActiveIndex(null);
                  }
                }}
                onBlur={(e) => {
                  // The popup itself takes focus when the pointer leaves a row; only a
                  // departure from the whole popup ends the hover session.
                  if (e.currentTarget.contains(e.relatedTarget as Node))
                    return;
                  setActiveIndex(null);
                }}
                className={cn(
                  // min-w tracks the trigger; the available-height guard maps
                  // Base UI's --available-height to Radix's equivalent var.
                  `flex flex-col w-72 max-w-full min-w-[var(--radix-dropdown-menu-trigger-width)] max-h-[min(480px,var(--radix-dropdown-menu-content-available-height))] overflow-hidden ${shape.container} select-none outline-none`,
                  className
                )}
              >
                {/* The list scrolls inside a ScrollArea; this wrapper is the rows'
                    offsetParent, so the overlays scroll with them. */}
                <ScrollArea className={popupScrollAreaClass} viewportClassName={cn(popupViewportClass, !searchMounted && "scroll-fade")}>
                  <div
                    ref={containerRef}
                    className="relative flex flex-col p-1"
                  >
                {/* Selected backgrounds — merged runs in multiple mode */}
                {multiple && <SelectionBackgrounds blocks={blocks} />}

                {/* Selected background */}
                <AnimatePresence>
                  {checkedRect && (
                    <motion.div
                      className={`absolute ${shape.bg} bg-active pointer-events-none`}
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

                {/* Hover background */}
                <FluidHoverHighlight
                  hover={hover}
                  from={checkedRect}
                  className={shape.bg}
                />

                {/* display: contents keeps items direct flex children of the
                    wrapper so fluid hover measurement and gap layout still work,
                    while the group provides the radio value context. */}
                <DropdownMenuPrimitive.RadioGroup
                  value={checkedIndex != null ? String(checkedIndex) : undefined}
                  className="contents"
                >
                  {children}
                </DropdownMenuPrimitive.RadioGroup>
                  </div>
                </ScrollArea>
              </Elevated>
            </DropdownSearchHostContext.Provider>
            </DropdownContext.Provider>
          </motion.div>
        </DropdownMenuPrimitive.Content>
      </DropdownMenuPrimitive.Portal>
    );
  }
);

DropdownContent.displayName = "DropdownContent";

// ---------------------------------------------------------------------------
// DropdownLabel
// ---------------------------------------------------------------------------

const DropdownLabel = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
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

DropdownLabel.displayName = "DropdownLabel";

// ---------------------------------------------------------------------------
// DropdownSeparator
// ---------------------------------------------------------------------------

const DropdownSeparator = forwardRef<
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

DropdownSeparator.displayName = "DropdownSeparator";

export {
  Dropdown,
  DropdownLabel,
  DropdownSeparator,
  DropdownMenu,
  DropdownTrigger,
  DropdownContent,
  DropdownSearch,
  DropdownEmpty,
};
export type {
  DropdownProps,
  DropdownMenuProps,
  DropdownTriggerProps,
  DropdownContentProps,
  DropdownSearchProps,
};
export default Dropdown;
