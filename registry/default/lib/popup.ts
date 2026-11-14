import { createElement, useEffect, useLayoutEffect, useState, type MouseEvent, type RefObject } from "react";
import { createPortal } from "react-dom";

// ---------------------------------------------------------------------------
// Shared popup chrome for the dropdown, select, and combobox popups: the
// enter/exit choreography classes and the ScrollArea sizing the list scrolls
// inside. One definition, so the three popups never drift apart.
// ---------------------------------------------------------------------------

/**
 * Enter/exit choreography follows the RESOLVED side — the one the positioner
 * lands on after collision flipping, not the requested one. The primitive
 * stamps `data-side` (on the positioner, or on the content itself); these
 * rules turn it into the transform origin and the 4px slide offset, so a
 * popup that flips above its anchor grows upward from its bottom edge.
 * Motion resolves the CSS variable when the tween starts, by which
 * time the position is settled.
 */
export const popupMotionClass =
  "origin-top [--popup-enter-y:-4px] " +
  "data-[side=top]:origin-bottom data-[side=top]:[--popup-enter-y:4px] " +
  "[[data-side=top]_&]:origin-bottom [[data-side=top]_&]:[--popup-enter-y:4px] " +
  "data-[side=left]:origin-right data-[side=left]:[--popup-enter-y:0px] " +
  "[[data-side=left]_&]:origin-right [[data-side=left]_&]:[--popup-enter-y:0px] " +
  "data-[side=right]:origin-left data-[side=right]:[--popup-enter-y:0px] " +
  "[[data-side=right]_&]:origin-left [[data-side=right]_&]:[--popup-enter-y:0px]";

/**
 * Popup lists scroll inside ScrollArea: the hover-revealed thumb instead of
 * the platform scrollbar, and a scroll-aware fade on the viewport. The popup
 * is only max-height constrained, so the viewport's percentage height can't
 * resolve — it inherits the max-height instead (the ScrollArea root inherits
 * it from the popup) and sizes to its rows up to that. The scroll primitive's
 * inline-styled sizer is forced back to a plain block so rows can shrink and
 * truncate; the `[style]` qualifier keeps that off the rows' own wrapper on
 * touch devices, where ScrollArea renders no sizer.
 */
export const popupScrollAreaClass = "min-h-0 flex-1 max-h-[inherit]";
export const popupViewportClass =
  "!h-auto max-h-[inherit] [&>div[style]]:!block [&>div[style]]:!min-w-0 [--scroll-fade-size:32px]";

/** Keys that count as keyboard navigation inside a popup (earn the ring). */
export const POPUP_NAV_KEYS = [
  "ArrowDown",
  "ArrowUp",
  "ArrowLeft",
  "ArrowRight",
  "Home",
  "End",
  "PageUp",
  "PageDown",
  "Tab",
];

/**
 * Rows the fluid hover must skip: a disabled row is neither a target
 * nor a hover stop, whichever attribute the primitive marks it with.
 */
export function isDisabledRow(el: HTMLElement): boolean {
  return el.getAttribute("aria-disabled") === "true" || el.hasAttribute("data-disabled");
}

/** Whether `el` scrolls on one axis and still has room in that direction. */
function canScroll(overflow: string, delta: number, at: number, size: number, view: number) {
  if (!delta || (overflow !== "auto" && overflow !== "scroll")) return false;
  return delta < 0 ? at > 0 : Math.ceil(at + view) < size;
}

/**
 * The nearest element around `el` that a wheel of this delta would move,
 * short of the document, which the browser scrolls by itself.
 */
function scrollerFor(el: Element, dx: number, dy: number): Element | null {
  const root = document.scrollingElement;
  for (let node: Element | null = el; node && node !== root && node !== document.body; node = node.parentElement) {
    const style = getComputedStyle(node);
    if (
      canScroll(style.overflowY, dy, node.scrollTop, node.scrollHeight, node.clientHeight) ||
      canScroll(style.overflowX, dx, node.scrollLeft, node.scrollWidth, node.clientWidth)
    )
      return node;
  }
  return null;
}

/**
 * A clear layer laid over the page, just under an open popup. While the
 * popup is open the pointer lights nothing else, so its trigger stays the
 * one thing marked, and a press on the layer is a press outside the popup,
 * which closes it. Render it beside the popup's content, never inside it.
 *
 * `anchor` cuts a hole over an element that stays live while the popup is
 * open, such as a combobox's text field.
 *
 * The wheel passes through: the layer sits under `body`, so on its own a
 * wheel over it could only reach the document, and a scrolling panel
 * underneath would hold still for as long as the popup is open.
 */
export function PopupShield({
  open,
  anchor,
}: {
  open: boolean;
  anchor?: RefObject<Element | null>;
}) {
  const [shield, setShield] = useState<HTMLDivElement | null>(null);
  useLayoutEffect(() => {
    const el = anchor?.current;
    if (!shield || !el) return;
    const cut = () => {
      const r = el.getBoundingClientRect();
      shield.style.setProperty(
        "clip-path",
        "polygon(evenodd, 0 0, 100% 0, 100% 100%, 0 100%, 0 0, " +
          `${r.left}px ${r.top}px, ${r.left}px ${r.bottom}px, ${r.right}px ${r.bottom}px, ` +
          `${r.right}px ${r.top}px, ${r.left}px ${r.top}px)`
      );
    };
    cut();
    const observer = new ResizeObserver(cut);
    observer.observe(el);
    // The anchor can move without resizing or scrolling, when content
    // above it changes height. The body resizing catches most of that.
    observer.observe(document.body);
    window.addEventListener("scroll", cut, true);
    window.addEventListener("resize", cut);
    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", cut, true);
      window.removeEventListener("resize", cut);
    };
  }, [shield, anchor]);

  useEffect(() => {
    if (!shield) return;
    const onWheel = (e: WheelEvent) => {
      // Ctrl + wheel is a pinch zoom, not a scroll.
      if (e.ctrlKey) return;
      const under = document
        .elementsFromPoint(e.clientX, e.clientY)
        .find((el) => el.getAttribute("data-slot") !== "popup-shield");
      const scroller = under && scrollerFor(under, e.deltaX, e.deltaY);
      // No panel to move: the browser scrolls the document as usual.
      if (!scroller) return;
      e.preventDefault();
      const unit =
        e.deltaMode === WheelEvent.DOM_DELTA_LINE
          ? 16
          : e.deltaMode === WheelEvent.DOM_DELTA_PAGE
            ? scroller.clientHeight
            : 1;
      scroller.scrollBy(e.deltaX * unit, e.deltaY * unit);
    };
    // Not passive: a wheel handed to a panel must not also move the page.
    shield.addEventListener("wheel", onWheel, { passive: false });
    return () => shield.removeEventListener("wheel", onWheel);
  }, [shield]);

  if (!open || typeof document === "undefined") return null;
  return createPortal(
    createElement("div", {
      ref: setShield,
      "aria-hidden": true,
      "data-slot": "popup-shield",
      // pointer-events-auto: a modal dialog turns the pointer off for
      // everything outside itself, and this layer sits outside.
      className: "pointer-events-auto fixed inset-0 z-[calc(var(--z-popover,60)-1)]",
      onContextMenu: (e: MouseEvent) => e.preventDefault(),
    }),
    document.body
  );
}
