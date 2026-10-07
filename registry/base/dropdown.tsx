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
  type ReactNode,
  type HTMLAttributes,
  type ComponentProps,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu } from "@base-ui/react/menu";
import type { MenuTriggerProps } from "@base-ui/react/menu";
import { useDirection } from "@base-ui/react/direction-provider";
import {
  DropdownContext,
  MenuItem,
  useControllableOpen,
  useDropdown,
  useDropdownMaybe,
  type DropdownContextValue,
  type MenuItemRenderOptions,
} from "@/components/ui/menu-item";
import { cn } from "@/lib/utils";
import { spring, exitFallbackMs } from "@/lib/springs";
import { useFluidHover, isOwnEvent } from "@/hooks/use-fluid-hover";
import {
  useMergeSplitBlocks,
  useSelectionRuns,
  SelectionBackgrounds,
} from "@/hooks/use-merge-split";
import { shapeMap } from "@/lib/shape-context";
import { SizeProvider, useSize, typeClass, type SizeVariant } from "@/lib/size-context";
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
import { FluidHoverHighlight } from "@/components/ui/fluid-hover-highlight";
import {
  SUBMENU_SIDE_OFFSET,
  SUBMENU_ALIGN_OFFSET,
  useSubmenuHost,
  useReportSubmenu,
  SubmenuChevron,
  type DropdownSubTriggerProps,
} from "@/components/ui/dropdown-sub";

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
// role="menu" lives on the popup DropdownContent below, which Base UI wires to
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
            `relative flex flex-col w-72 max-w-full ${shape.container} p-1 select-none`,
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
// Built on Base UI's Menu primitive, which owns the trigger wiring,
// positioning (collision flipping, anchor tracking), dismissal (outside
// press, focus-out, Escape), roving highlight, typeahead, and close-on-select.
// This layer keeps the fluid-hover overlays and the
// spring open/close animation (via actionsRef deferred unmount) — the same
// verified pattern as select.tsx.
// ---------------------------------------------------------------------------

interface DropdownMenuActions {
  unmount: () => void;
  close: () => void;
}

interface DropdownMenuContextValue {
  open: boolean;
  actionsRef: React.RefObject<DropdownMenuActions | null>;
  /** Set by DropdownSub: the content is a submenu. */
  sub: boolean;
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
  const [open, handleOpenChange] = useControllableOpen(openProp, defaultOpen, onOpenChange);
  const actionsRef = useRef<DropdownMenuActions | null>(null);


  const ctx = useMemo(() => ({ open, actionsRef, sub: false }), [open]);

  // A size prop pins the whole compound (trigger content + portalled popup —
  // React context crosses portals) to one ladder step.
  const root = (
    <DropdownMenuContext.Provider value={ctx}>
      <Menu.Root
        open={open}
        onOpenChange={handleOpenChange}
        actionsRef={actionsRef}
        disabled={disabled}
        // Non-modal: the page keeps scrolling and the Positioner tracks the
        // anchor, so the popup follows its trigger instead of detaching.
        modal={false}
      >
        {children}
      </Menu.Root>
    </DropdownMenuContext.Provider>
  );

  return size ? <SizeProvider size={size}>{root}</SizeProvider> : root;
}

DropdownMenu.displayName = "DropdownMenu";

// ---------------------------------------------------------------------------
// DropdownTrigger
//
// Base UI's Menu.Trigger, re-exported under the library name. Composes via
// the `render` prop, so any element can be the trigger:
//
//   <DropdownTrigger render={<Button variant="secondary">Open</Button>} />
// ---------------------------------------------------------------------------

type DropdownTriggerProps = MenuTriggerProps;

const DropdownTrigger = Menu.Trigger;

// ---------------------------------------------------------------------------
// DropdownContent (popup panel)
//
// Portal > Positioner > Popup carrying the exact inline-panel visuals:
// Elevated surface, fluid-hover overlays, animated selected background,
// and animated focus ring. Children are wrapped in a Menu.RadioGroup so
// radio-style MenuItems (boolean `checked`) get correct aria-checked from
// `checkedIndex`.
// ---------------------------------------------------------------------------

type MenuPositionerProps = ComponentProps<typeof Menu.Positioner>;

type LitBy = "open" | "pointer" | "keyboard";

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
  side?: MenuPositionerProps["side"];
  align?: MenuPositionerProps["align"];
  sideOffset?: number;
  /** Shift along the trigger edge, in px. */
  alignOffset?: number;
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
      alignOffset = 0,
    },
    ref
  ) => {
    const { open, actionsRef, sub } = useDropdownMenuContext();
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

    // Submenus opened from these rows: their trigger stays lit while the
    // pointer crosses to them (see dropdown-sub.tsx).
    const submenus = useSubmenuHost(containerRef, hover, open);

    // An optional DropdownSearch child: typing on a focused row is
    // redirected into the field. (The field takes focus itself, a frame
    // after the primitive's own open autofocus.)
    const {
      host: searchHost,
      hasSearch,
      searchTakesFocus,
      searchMounted,
      onKeyDownCapture: redirectTypingToSearch,
    } = useDropdownSearchHost(open);

    // Open ready to act: focus the first enabled row (a mounted search field
    // takes focus itself instead). A frame after the primitive's own open
    // autofocus, which lands on the popup for pointer opens. Not for a
    // submenu: hovering its trigger must leave focus in the parent, and a
    // keyboard open already lands on its first row.
    useEffect(() => {
      if (!open || sub) return;
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
    }, [open, sub, hasSearch]);

    // Release Base UI's deferred unmount once the exit tween has played.
    // onAnimationComplete on the motion.div is the primary signal; this
    // timeout is a fallback for throttled/background tabs where rAF-driven
    // animation callbacks can stall. The popup exits with spring.fast, so the
    // fallback tracks that tier's exit duration plus a safety buffer.
    useEffect(() => {
      if (open) return;
      const id = setTimeout(
        () => actionsRef.current?.unmount(),
        exitFallbackMs(spring.fast)
      );
      return () => clearTimeout(id);
    }, [open, actionsRef]);

    // The popup keeps its rows registered between opens, so their rects
    // were taken while it was hidden: re-measure once it is open and laid out.
    useEffect(() => {
      if (!open) return;
      remeasure();
    }, [open, remeasure]);

    const multiple = checkedIndices != null;
    const checkedRect =
      !multiple && checkedIndex != null ? itemRects[checkedIndex] : null;
    // What lights the highlight: the open itself (its first-row focus), the
    // pointer, or the keyboard. A highlight that appears from nothing fades
    // in at `from` and glides to its row. That suits the pointer entering the
    // list (it rises from the checked row toward the cursor), not a row lit
    // by the open or by arrowing in from the search field: those would slide
    // over from the checked row, so they fade in where they are.
    // The handlers read the ref: a key press updates it before the focus it
    // moves arrives, in the same event. The render reads the state, which
    // the highlight's `from` depends on. Each open starts over as "open".
    const litByRef = useRef<LitBy>("open");
    const [litBy, setLitBy] = useState<LitBy>("open");
    const [litByOpen, setLitByOpen] = useState(open);
    if (litByOpen !== open) {
      setLitByOpen(open);
      if (open) setLitBy("open");
    }
    useEffect(() => {
      if (open) litByRef.current = "open";
    }, [open]);
    const markLitBy = (by: LitBy) => {
      litByRef.current = by;
      setLitBy(by);
    };
    // Multiple: one merged block per contiguous run of checked rows.
    const runs = useSelectionRuns(checkedIndices ?? []);
    const blocks = useMergeSplitBlocks(runs, open ? itemRects : [], shape.bgRadius);
    // Inside the popup, Base UI's Menu.Item / Menu.RadioItem own the role,
    // aria-checked, tabIndex, roving highlight, typeahead, and Enter/Space/
    // click activation. The row's handler goes on the primitive as onClick:
    // Enter/Space call that prop directly and dispatch no DOM click, so an
    // onClick on the render div would only hear the mouse. The render div
    // carries the Fluid Functionalism visuals and the fluid-hover registration.
    const renderMenuItem = useCallback(
      ({
        radio,
        checkbox,
        checked,
        value,
        disabled,
        label,
        closeOnClick,
        onActivate,
        element,
        children,
      }: MenuItemRenderOptions) =>
        checkbox ? (
          // onActivate toggles the consumer state; the primitive only owns
          // the role, aria-checked, and keyboard activation.
          <Menu.CheckboxItem
            checked={!!checked}
            disabled={disabled}
            label={label}
            closeOnClick={closeOnClick}
            onClick={onActivate}
            render={element}
          >
            {children}
          </Menu.CheckboxItem>
        ) : radio ? (
          <Menu.RadioItem
            value={value}
            disabled={disabled}
            label={label}
            closeOnClick={closeOnClick}
            onClick={onActivate}
            render={element}
          >
            {children}
          </Menu.RadioItem>
        ) : (
          <Menu.Item
            disabled={disabled}
            label={label}
            closeOnClick={closeOnClick}
            onClick={onActivate}
            render={element}
          >
            {children}
          </Menu.Item>
        ),
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
        onSubmenuOpenChange: submenus.onSubmenuOpenChange,
      }),
      [
        registerItem,
        activeIndex,
        checkedIndex,
        multiple,
        checkedIndices,
        renderMenuItem,
        submenus.onSubmenuOpenChange,
      ]
    );

    return (
      <Menu.Portal>
        <Menu.Positioner
          side={side}
          align={align}
          sideOffset={sideOffset}
          alignOffset={alignOffset}
          className="z-50 outline-none"
        >
          <motion.div
            className={popupMotionClass}
            initial={{ opacity: 0, y: "var(--popup-enter-y)", scaleY: 0.96 }}
            animate={
              open
                ? { opacity: 1, y: 0, scaleY: 1 }
                : { opacity: 0, y: "var(--popup-enter-y)", scaleY: 0.96 }
            }
            transition={open ? spring.fast : spring.fast.exit}
            // Base UI defers unmount while actionsRef is set; release it once
            // the exit spring has finished so the close animation fully plays.
            onAnimationComplete={() => {
              if (!open) actionsRef.current?.unmount();
            }}
          >
            <DropdownContext.Provider value={contentCtx}>
            <DropdownSearchHostContext.Provider value={searchHost}>
              <Menu.Popup
                render={
                  <Elevated
                    offset={2}
                    shadowLevel={3}
                    ref={ref}
                  />
                }
                // The handlers below skip events from an open submenu: it
                // renders through a portal, so its events bubble here
                // through React, and focus on a submenu row would light the
                // parent row with the same index. The gap click already
                // ignores them in the hook.
                onKeyDownCapture={(e) => {
                  if (!isOwnEvent(e)) return;
                  markLitBy("keyboard");
                  redirectTypingToSearch(e);
                }}
                onMouseEnter={(e) => {
                  if (!isOwnEvent(e)) return;
                  markLitBy("pointer");
                  submenus.onMouseEnter();
                }}
                onMouseMove={(e) => {
                  if (!isOwnEvent(e)) return;
                  markLitBy("pointer");
                  submenus.onMouseMove(e);
                }}
                onClick={handlers.onClick}
                onMouseLeave={(e) => {
                  if (!isOwnEvent(e)) return;
                  submenus.onMouseLeave();
                }}
                onFocus={(e) => {
                  if (!isOwnEvent(e)) return;
                  const indexAttr = (e.target as HTMLElement)
                    .closest("[data-fluid-hover-index]")
                    ?.getAttribute("data-fluid-hover-index");
                  // Keyboard navigation moves the hover background only — no
                  // ring: in a menu the highlighted row is the focus indicator.
                  if (indexAttr != null) {
                    // With an autofocusing search field, the primitive's open
                    // autofocus lands on the first row a frame before the
                    // field takes over: that row stays unlit.
                    if (litByRef.current === "open" && searchTakesFocus()) return;
                    setActiveIndex(Number(indexAttr));
                  } else if (e.target !== e.currentTarget) {
                    // Focus moved to a non-row inside the popup, such as the
                    // search field: no row is highlighted any more. The field
                    // is a stop like a row, it just draws no background. The
                    // popup focusing itself (pointer leaving a row) doesn't
                    // count.
                    setActiveIndex(null);
                  }
                }}
                onBlur={(e) => {
                  if (!isOwnEvent(e)) return;
                  // The popup itself takes focus when the pointer leaves a row; only a
                  // departure from the whole popup ends the hover session.
                  if (e.currentTarget.contains(e.relatedTarget as Node))
                    return;
                  // Focus moving into an open submenu keeps its trigger lit.
                  if (submenus.holding()) return;
                  setActiveIndex(null);
                }}
                className={cn(
                  // min-w tracks the trigger via the Positioner's
                  // --anchor-width var. A submenu's anchor is a row, so it
                  // keeps its own narrower width instead.
                  `flex flex-col ${sub ? "w-56" : "w-72 min-w-[var(--anchor-width)]"} max-w-full max-h-[min(480px,var(--available-height))] overflow-hidden ${shape.container} select-none outline-none`,
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
                  from={litBy === "pointer" ? checkedRect : null}
                  className={shape.bg}
                />

                {/* display: contents keeps items direct flex children of the
                    wrapper so fluid hover measurement and gap layout still work,
                    while the group provides the radio value context. */}
                <Menu.RadioGroup
                  value={checkedIndex ?? null}
                  className="contents"
                >
                  {children}
                </Menu.RadioGroup>
                  </div>
                </ScrollArea>
              </Menu.Popup>
            </DropdownSearchHostContext.Provider>
            </DropdownContext.Provider>
          </motion.div>
        </Menu.Positioner>
      </Menu.Portal>
    );
  }
);

DropdownContent.displayName = "DropdownContent";

// ---------------------------------------------------------------------------
// DropdownSub, DropdownSubTrigger, DropdownSubContent (submenus)
//
//   <DropdownSub>
//     <DropdownSubTrigger index={2} icon={Palette} label="Theme" />
//     <DropdownSubContent checkedIndex={theme}>
//       <MenuItem index={0} label="Light" checked={theme === 0} … />
//     </DropdownSubContent>
//   </DropdownSub>
//
// Base UI's SubmenuRoot owns hover-to-open, the safe area, →/← and Escape.
// DropdownSub gives its content its own open state (and deferred unmount),
// so DropdownSubContent is the same popup as DropdownContent, beside its
// trigger row instead of below a trigger. The trigger is a MenuItem with a
// trailing chevron, indexed among its parent's rows; the submenu's rows
// index from 0 again.
// ---------------------------------------------------------------------------

interface DropdownSubProps {
  children: ReactNode;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

function DropdownSub({
  children,
  open: openProp,
  defaultOpen = false,
  onOpenChange,
}: DropdownSubProps) {
  const [open, handleOpenChange] = useControllableOpen(openProp, defaultOpen, onOpenChange);
  const actionsRef = useRef<DropdownMenuActions | null>(null);


  const ctx = useMemo(() => ({ open, actionsRef, sub: true }), [open]);

  return (
    <DropdownMenuContext.Provider value={ctx}>
      <Menu.SubmenuRoot
        open={open}
        onOpenChange={handleOpenChange}
        actionsRef={actionsRef}
      >
        {children}
      </Menu.SubmenuRoot>
    </DropdownMenuContext.Provider>
  );
}

DropdownSub.displayName = "DropdownSub";

const DropdownSubTrigger = forwardRef<HTMLDivElement, DropdownSubTriggerProps>(
  ({ index, ...props }, ref) => {
    const parent = useDropdown();
    const { open } = useDropdownMenuContext();
    useReportSubmenu(parent.onSubmenuOpenChange, index, open);
    const lit = parent.activeIndex === index;

    // The row renders through the parent's MenuItem, wrapped in the submenu
    // trigger primitive instead of a plain item.
    const renderMenuItem = useCallback(
      ({ disabled, label, onActivate, element, children }: MenuItemRenderOptions) => (
        <Menu.SubmenuTrigger
          disabled={disabled}
          label={label}
          onClick={onActivate}
          render={element}
        >
          {children}
          <SubmenuChevron lit={lit} />
        </Menu.SubmenuTrigger>
      ),
      [lit]
    );
    const ctx = useMemo(() => ({ ...parent, renderMenuItem }), [parent, renderMenuItem]);

    return (
      <DropdownContext.Provider value={ctx}>
        <MenuItem ref={ref} index={index} {...props} />
      </DropdownContext.Provider>
    );
  }
);

DropdownSubTrigger.displayName = "DropdownSubTrigger";

type DropdownSubContentProps = Omit<DropdownContentProps, "side" | "align">;

/** The submenu popup: DropdownContent beside its trigger row, the first row
 *  level with the trigger. It opens toward the reading direction's end,
 *  read from Base UI's DirectionProvider like Radix reads its own. The side
 *  stays physical (not `inline-end`) so the popup's enter choreography,
 *  keyed on `data-side`, still applies. */
const DropdownSubContent = forwardRef<HTMLDivElement, DropdownSubContentProps>(
  (
    {
      sideOffset = SUBMENU_SIDE_OFFSET,
      alignOffset = SUBMENU_ALIGN_OFFSET,
      ...props
    },
    ref
  ) => {
    const direction = useDirection();
    return (
      <DropdownContent
        ref={ref}
        side={direction === "rtl" ? "left" : "right"}
        align="start"
        sideOffset={sideOffset}
        alignOffset={alignOffset}
        {...props}
      />
    );
  }
);

DropdownSubContent.displayName = "DropdownSubContent";

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
        typeClass("caption", compact ? "compact" : "default"),
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
  DropdownSub,
  DropdownSubTrigger,
  DropdownSubContent,
  DropdownSearch,
  DropdownEmpty,
};
// DropdownContextValue and MenuItemRenderOptions are already re-exported
// above next to their import — repeating them here is a duplicate-export
// build error.
export type {
  DropdownProps,
  DropdownMenuProps,
  DropdownTriggerProps,
  DropdownContentProps,
  DropdownSubProps,
  DropdownSubTriggerProps,
  DropdownSubContentProps,
  DropdownSearchProps,
};
export default Dropdown;
