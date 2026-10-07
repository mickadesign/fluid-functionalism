"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  type RefObject,
} from "react";
import { cn } from "@/lib/utils";
import { useIcons } from "@/lib/icon-context";
import { useSize } from "@/lib/size-context";
import type { UseFluidHoverReturn } from "@/hooks/use-fluid-hover";
import type { MenuItemProps } from "@/components/ui/menu-item";

// ---------------------------------------------------------------------------
// Submenus inside a dropdown popup: the primitive-free half.
//
// The primitive (Base UI's SubmenuRoot, Radix's Sub) owns the safe area: the
// pointer can cut diagonally across other rows on its way to an open
// submenu without closing it. The fluid hover would still follow the
// pointer across those rows, so the highlight would point at "Share" while
// the "Move to" submenu stays open. useSubmenuHost stops that: while a
// submenu is open, the parent's highlight stays on its trigger and only
// moves when focus does. Both primitives move focus to another row only
// once the pointer has left the safe area, and close the submenu as they
// do, so the highlight agrees with the primitive's own verdict.
// ---------------------------------------------------------------------------

/** Distance from the trigger row to its submenu, in px. Both primitives
 *  measure from the row, which sits inside the popup's 4px padding, so this
 *  leaves a 2px gap between the two surfaces. */
export const SUBMENU_SIDE_OFFSET = 6;
/** Pulls the submenu up by the popup's padding (p-1), so its first row
 *  lines up with the trigger row. */
export const SUBMENU_ALIGN_OFFSET = -4;

export type DropdownSubTriggerProps = Omit<
  MenuItemProps,
  "checked" | "onSelect" | "closeOnClick"
>;

const ROW_SELECTOR = "[data-fluid-hover-index]";

const useIsoLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

/**
 * The parent popup's side of its submenus. Use `onMouseEnter`,
 * `onMouseMove` and `onMouseLeave` in place of the hook's own, skip
 * clearing on blur while `holding()`, and hand `onSubmenuOpenChange` to the
 * rows through the dropdown context. `open` is the parent popup's own state.
 */
export function useSubmenuHost(
  containerRef: RefObject<HTMLElement | null>,
  hover: Pick<UseFluidHoverReturn, "setActiveIndex" | "handlers">,
  open: boolean
) {
  // The hook's handlers object is new every render, but the functions in it
  // are stable: depend on those, so the callbacks below stay stable too and
  // a trigger's report effect only re-runs when its submenu really changes.
  const { setActiveIndex } = hover;
  const {
    onMouseEnter: hoverEnter,
    onMouseMove: hoverMove,
    onMouseLeave: hoverLeave,
  } = hover.handlers;
  const openIndexRef = useRef<number | null>(null);
  // Read when a submenu closes, in its trigger's effect cleanup. A layout
  // effect refreshes it in the commit's layout phase, before any passive
  // cleanup runs, so a close in the same commit already sees the new value.
  const parentOpenRef = useRef(open);
  useIsoLayoutEffect(() => {
    parentOpenRef.current = open;
  }, [open]);
  // The pointer's last position. While a submenu is open it is read from the
  // document: Base UI switches pointer events off on the parent while the
  // pointer crosses to the submenu, so the parent hears no moves then.
  const pointerRef = useRef<{ x: number; y: number } | null>(null);
  const stopListeningRef = useRef<(() => void) | null>(null);

  const listen = useCallback(() => {
    if (stopListeningRef.current) return;
    const onMove = (e: PointerEvent) => {
      pointerRef.current = { x: e.clientX, y: e.clientY };
    };
    document.addEventListener("pointermove", onMove, { capture: true, passive: true });
    stopListeningRef.current = () => {
      document.removeEventListener("pointermove", onMove, { capture: true });
      stopListeningRef.current = null;
    };
  }, []);

  useEffect(() => () => stopListeningRef.current?.(), []);

  const onSubmenuOpenChange = useCallback(
    (index: number, open: boolean) => {
      if (open) {
        openIndexRef.current = index;
        setActiveIndex(index);
        listen();
        return;
      }
      if (openIndexRef.current !== index) return;
      openIndexRef.current = null;
      stopListeningRef.current?.();
      // The whole menu is closing (a pick, Escape on Radix, a press
      // outside): leave its last highlight to fade out with it.
      if (!parentOpenRef.current) return;
      // Hand the highlight back: to the focused row (the row the primitive
      // moved to, or the trigger after ←), else to the row under the
      // pointer, else to nothing.
      const container = containerRef.current;
      if (!container) return;
      const focused = (document.activeElement as HTMLElement | null)?.closest?.(ROW_SELECTOR);
      if (focused && container.contains(focused)) {
        setActiveIndex(Number(focused.getAttribute("data-fluid-hover-index")));
        return;
      }
      const p = pointerRef.current;
      const r = container.getBoundingClientRect();
      if (p && p.x >= r.left && p.x <= r.right && p.y >= r.top && p.y <= r.bottom) {
        hoverMove({ clientX: p.x, clientY: p.y } as React.MouseEvent);
      } else {
        setActiveIndex(null);
      }
    },
    [containerRef, setActiveIndex, hoverMove, listen]
  );

  const holding = useCallback(() => openIndexRef.current !== null, []);

  // Entering the popup starts a fresh hover session, which re-keys the
  // highlight to fade in from the checked row. A held highlight stays put.
  const onMouseEnter = useCallback(() => {
    if (openIndexRef.current !== null) return;
    hoverEnter();
  }, [hoverEnter]);

  const onMouseMove = useCallback(
    (e: React.MouseEvent) => {
      pointerRef.current = { x: e.clientX, y: e.clientY };
      // The trigger stays lit while its submenu is open, whatever row the
      // pointer crosses: focus moves the highlight instead.
      if (openIndexRef.current !== null) return;
      hoverMove(e);
    },
    [hoverMove]
  );

  const onMouseLeave = useCallback(() => {
    if (openIndexRef.current !== null) return;
    hoverLeave();
  }, [hoverLeave]);

  return { onSubmenuOpenChange, holding, onMouseEnter, onMouseMove, onMouseLeave };
}

/** Reports a trigger's submenu opening and closing to its parent popup. */
export function useReportSubmenu(
  onSubmenuOpenChange: ((index: number, open: boolean) => void) | undefined,
  index: number,
  open: boolean
) {
  useEffect(() => {
    if (!open || !onSubmenuOpenChange) return;
    onSubmenuOpenChange(index, true);
    return () => onSubmenuOpenChange(index, false);
  }, [onSubmenuOpenChange, index, open]);
}

/** The trailing chevron on a submenu trigger row. It lights with the row,
 *  like the leading icon. */
export function SubmenuChevron({ lit }: { lit: boolean }) {
  const icons = useIcons();
  const ChevronRight = icons["chevron-right"];
  const sizeClasses = useSize();
  return (
    <span aria-hidden="true" className="inline-grid shrink-0 rtl:-scale-x-100">
      <ChevronRight
        size={sizeClasses.icon}
        strokeWidth={lit ? 2 : 1.5}
        className={cn(
          "transition-[color,stroke-width] duration-80",
          lit ? "text-foreground" : "text-muted-foreground"
        )}
      />
    </span>
  );
}
