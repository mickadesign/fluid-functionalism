"use client";

import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
  forwardRef,
  type HTMLAttributes,
  type ReactElement,
  type ReactNode,
} from "react";
import type { IconComponent } from "@/lib/icon-context";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { fontWeights } from "@/lib/font-weight";
import { shapeMap } from "@/lib/shape-context";
import { useSize } from "@/lib/size-context";
import { useRegisterFluidHoverItem } from "@/hooks/use-fluid-hover";

// MenuItem is only used inside Dropdown, which opts out of the global pill
// shape — see dropdown.tsx for the rationale.
const shape = shapeMap.rounded;

// ---------------------------------------------------------------------------
// Dropdown context — the single shared context for every Dropdown build.
//
// It lives here rather than in the dropdown module so that (a) MenuItem stays
// primitive-free and self-contained, and (b) dropdowns built on different
// primitives (Radix, Base UI) can render side by side — each provides this
// same context object, so MenuItem resolves whichever provider actually
// wraps it. The dropdown module re-exports useDropdown from here, keeping
// its public API unchanged.
// ---------------------------------------------------------------------------

/** What MenuItem hands to the popup's primitive wrapper. `element` is the
 *  styled row div (visuals + fluid hover registration, no children); `children`
 *  is the row content (icon, label, check). The dropdown wraps them in its
 *  own Item / RadioItem primitive, so MenuItem itself stays primitive-free. */
export interface MenuItemRenderOptions {
  /** Radio-style option (boolean `checked` on MenuItem) vs plain action item. */
  radio: boolean;
  /** Checkbox-style option: a boolean `checked` inside a multiple-selection
   *  dropdown (`checkedIndices`). Takes precedence over `radio`. */
  checkbox: boolean;
  /** The item's checked state (radio and checkbox items). */
  checked?: boolean;
  /** The item's index — doubles as the radio value. */
  value: number;
  disabled?: boolean;
  label: string;
  closeOnClick: boolean;
  /** The row's activation (consumer onClick, then onSelect). The dropdown
   *  hands it to its primitive item as `onClick`, never to `element`: Base
   *  UI's Enter/Space runs the item's own onClick prop without dispatching a
   *  DOM click, so a handler on the rendered div would only hear the mouse. */
  onActivate?: (e: React.MouseEvent<HTMLDivElement>) => void;
  element: ReactElement;
  children: ReactNode;
}

export interface DropdownContextValue {
  registerItem: (index: number, element: HTMLElement | null) => void;
  activeIndex: number | null;
  checkedIndex?: number;
  /** Multiple selection (`checkedIndices` on the dropdown): rows are
   *  checkbox items and activating one keeps the menu open by default. */
  multiple?: boolean;
  checkedIndices?: number[];
  /** True when items render inside a Menu popup (DropdownContent), where the
   *  primitive's Item / RadioItem own roles, roving highlight, typeahead,
   *  and activation. MenuItem switches its rendering accordingly. */
  inMenu?: boolean;
  /** Popup-only: wraps a MenuItem's styled div in the dropdown's menu-item
   *  primitive. Absent in the inline Dropdown panel, where MenuItem renders
   *  its own ARIA menuitem div. */
  renderMenuItem?: (opts: MenuItemRenderOptions) => ReactElement;
  /** Popup-only: a DropdownSubTrigger reports its submenu opening and
   *  closing here, so the menu keeps that row lit while the pointer crosses
   *  to the submenu and while it is inside it. */
  onSubmenuOpenChange?: (index: number, open: boolean) => void;
}

export const DropdownContext = createContext<DropdownContextValue | null>(null);

export function useDropdown() {
  const ctx = useContext(DropdownContext);
  if (!ctx) throw new Error("useDropdown must be used within a Dropdown");
  return ctx;
}

/** Null-safe context read for callers that render outside a provider. */
export function useDropdownMaybe() {
  return useContext(DropdownContext);
}

/**
 * Open state for DropdownMenu and DropdownSub: controlled by `open` when it
 * is passed, else local state seeded by `defaultOpen`. Either way the
 * primitive is always handed a controlled value, so the popup can play its
 * exit tween before it unmounts.
 */
export function useControllableOpen(
  openProp: boolean | undefined,
  defaultOpen: boolean,
  onOpenChange?: (open: boolean) => void
) {
  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  const open = openProp !== undefined ? openProp : internalOpen;
  const setOpen = useCallback(
    (next: boolean) => {
      if (openProp === undefined) setInternalOpen(next);
      onOpenChange?.(next);
    },
    [openProp, onOpenChange]
  );
  return [open, setOpen] as const;
}

export interface MenuItemProps extends HTMLAttributes<HTMLDivElement> {
  /** Optional leading icon. When omitted, the row renders text-only with no
   *  reserved icon column. */
  icon?: IconComponent;
  label: string;
  index: number;
  /** When a boolean, the item is a radio-style option (role="menuitemradio"
   *  with aria-checked). When undefined, it is a plain action item
   *  (role="menuitem", no checked state announced). */
  checked?: boolean;
  onSelect?: () => void;
  disabled?: boolean;
  /** Popup-only (inside DropdownContent): whether activating the item closes
   *  the menu. Ignored in the inline Dropdown panel. @default true */
  closeOnClick?: boolean;
}

const MenuItem = forwardRef<HTMLDivElement, MenuItemProps>(
  (
    {
      icon: Icon,
      label,
      index,
      checked,
      onSelect,
      disabled,
      closeOnClick,
      className,
      onClick,
      ...props
    },
    ref
  ) => {
    const internalRef = useRef<HTMLDivElement>(null);
    const {
      registerItem,
      activeIndex,
      checkedIndex,
      multiple,
      checkedIndices,
      renderMenuItem,
    } = useDropdown();
    const isCheckbox = !!multiple && typeof checked === "boolean";

    useRegisterFluidHoverItem(registerItem, index, internalRef);

    const isActive = activeIndex === index;
    const sizeClasses = useSize();

    const mergeRef = (node: HTMLDivElement | null) => {
      (internalRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
      if (typeof ref === "function") ref(node);
      else if (ref) (ref as React.MutableRefObject<HTMLDivElement | null>).current = node;
    };

    const handleActivate = disabled
      ? undefined
      : (e: React.MouseEvent<HTMLDivElement>) => {
          onClick?.(e);
          onSelect?.();
        };

    const itemClassName = cn(
      // Fixed height (was py-2 around a 19.5px line box ≈ 35.5px) so the
      // text-box trim on the label doesn't shrink the row. shrink-0 because
      // menu popups are max-height flex columns — without it a long list
      // compresses rows to fit instead of scrolling.
      `relative z-10 flex ${sizeClasses.control} shrink-0 items-center ${sizeClasses.gap} ${shape.item} ${sizeClasses.itemPx} cursor-pointer outline-none`,
      disabled && "opacity-50 pointer-events-none",
      className
    );

    const content = (
      <>
        {Icon && (
          <span className="inline-grid">
            <span className="col-start-1 row-start-1 invisible">
              <Icon size={sizeClasses.icon} strokeWidth={2} />
            </span>
            <Icon
              size={sizeClasses.icon}
              strokeWidth={isActive || checked ? 2 : 1.5}
              className={cn(
                "col-start-1 row-start-1 transition-[color,stroke-width] duration-80",
                isActive || checked
                  ? "text-foreground"
                  : "text-muted-foreground"
              )}
            />
          </span>
        )}
        {/* Both stacked spans carry the text-box trim so the invisible bold
            sizer and the visible label keep identical boxes. */}
        <span className={cn("inline-grid flex-1", sizeClasses.text)}>
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
              isActive || checked
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
        {/* initial={false}: a row checked at mount shows the finished
            check instead of drawing it, so default selections don't
            animate on page load. */}
        <AnimatePresence initial={false}>
          {checked && (
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
              className="text-foreground shrink-0"
              initial={{ opacity: 1 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 1 }}
            >
              <motion.path
                d="M4 12L9 17L20 6"
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
          )}
        </AnimatePresence>
      </>
    );

    if (renderMenuItem) {
      // Inside DropdownContent, the menu-item primitive (supplied by the
      // surrounding DropdownContent through context) owns the role,
      // aria-checked, tabIndex, roving highlight, typeahead, and Enter/Space/
      // click activation. handleActivate rides on the primitive as onActivate,
      // not on the div: that is the handler keyboard activation calls. The
      // styled div carries the Fluid Functionalism visuals and the
      // fluid-hover registration; MenuItem itself imports no primitive.
      return renderMenuItem({
        radio: !isCheckbox && typeof checked === "boolean",
        checkbox: isCheckbox,
        checked,
        value: index,
        disabled,
        label,
        // Toggling one of several stays open; picking one of one closes.
        closeOnClick: closeOnClick ?? !multiple,
        onActivate: handleActivate,
        element: (
          <div
            ref={mergeRef}
            data-fluid-hover-index={index}
            aria-label={label}
            className={itemClassName}
            {...props}
          />
        ),
        children: content,
      });
    }

    return (
      <div
        ref={mergeRef}
        data-fluid-hover-index={index}
        // Disabled items are never the roving tab stop.
        tabIndex={
          !disabled && index === (checkedIndex ?? checkedIndices?.[0] ?? 0) ? 0 : -1
        }
        role={
          isCheckbox
            ? "menuitemcheckbox"
            : typeof checked === "boolean"
              ? "menuitemradio"
              : "menuitem"
        }
        aria-checked={typeof checked === "boolean" ? checked : undefined}
        aria-disabled={disabled || undefined}
        aria-label={label}
        onClick={handleActivate}
        onKeyDown={(e) => {
          if (disabled) return;
          if (e.key === " " || e.key === "Enter") {
            e.preventDefault();
            onSelect?.();
          }
        }}
        className={itemClassName}
        {...props}
      >
        {content}
      </div>
    );
  }
);

MenuItem.displayName = "MenuItem";

export { MenuItem };
export default MenuItem;
