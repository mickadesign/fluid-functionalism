"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Button } from "@/registry/radix/button";
import { Elevated } from "@/lib/elevated";
import { ScrollArea } from "@/registry/radix/scroll-area";
import { Tooltip } from "@/registry/radix/tooltip";
import { useIcon } from "@/lib/icon-context";
import { spring } from "@/lib/springs";

// ---------------------------------------------------------------------------
// Pen menu for demo cards: a small ghost button in the card's bottom-right
// corner that opens the slide's playground controls (the same PlaygroundPanel
// the doc page parks in its right rail) in an anchored popover.
//
// The panel portals to <body> with fixed positioning — the BentoCard clips
// its children (overflow-hidden rounded corners), so an in-card popover would
// be cut off on short cards. Anchoring keeps it glued to the button across
// resizes and scrolls while open.
// ---------------------------------------------------------------------------

const PANEL_WIDTH = 300;
const PANEL_GAP = 8;
// Breathing room between the panel and the viewport edge it grows toward.
const VIEWPORT_MARGIN = 16;

export function PlaygroundMenu({
  label,
  children,
}: {
  /** Accessible name for the button + panel, e.g. "Customize Card". */
  label: string;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion() ?? false;
  const PencilIcon = useIcon("pencil");

  // Anchor: the panel's right edge lines up with the button's, and it opens
  // toward whichever side has more room — upward from the button's top edge in
  // practice, since the pen sits in the card's footer. Fixed coords, so they're
  // re-measured on resize/scroll while open.
  const [pos, setPos] = useState<{
    right: number;
    top?: number;
    bottom?: number;
    maxHeight: number;
  } | null>(null);
  const measure = useCallback(() => {
    const rect = buttonRef.current?.getBoundingClientRect();
    if (!rect) return;
    const vh = window.innerHeight;
    const right = window.innerWidth - rect.right;
    // Anchored edges, clamped so the panel never hangs past either viewport
    // edge — the pen can sit below the fold (a tall demo card) or near the top
    // after scrolling, and a raw button-relative offset would push the panel
    // off-screen in both cases.
    const bottom = Math.max(vh - rect.top + PANEL_GAP, VIEWPORT_MARGIN);
    const top = Math.max(
      Math.min(rect.bottom + PANEL_GAP, vh - VIEWPORT_MARGIN),
      VIEWPORT_MARGIN
    );
    const above = vh - bottom - VIEWPORT_MARGIN;
    const below = vh - top - VIEWPORT_MARGIN;
    // Up unless down genuinely has more room — the panel is tall and the pen
    // sits in the card footer, so up is nearly always the roomier side.
    return above >= below
      ? setPos({ right, bottom, maxHeight: Math.max(above, 200) })
      : setPos({ right, top, maxHeight: Math.max(below, 200) });
  }, []);

  useEffect(() => {
    if (!open) return;
    measure();
    window.addEventListener("resize", measure);
    window.addEventListener("scroll", measure, true);
    return () => {
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", measure, true);
    };
  }, [open, measure]);

  // Scroll only when the controls genuinely don't fit. The panel takes its
  // content's natural height, capped at the space available — a DEFINITE
  // height, because the ScrollArea viewport is `size-full` (height: 100%) and
  // would resolve to auto against a max-height-only parent, clipping the
  // overflow instead of scrolling it. The scroll-fade mask follows the same
  // measurement: its static fallback would otherwise dim the first and last
  // row of a panel that fits fine.
  const contentRef = useRef<HTMLDivElement>(null);
  const [contentHeight, setContentHeight] = useState<number | null>(null);
  useEffect(() => {
    if (!open) {
      setContentHeight(null);
      return;
    }
    // Depends on `pos` too: the panel only renders once the anchor is
    // measured, so on the tick `open` flips there is no content node yet.
    const el = contentRef.current;
    if (!el) return;
    // offsetHeight, not getBoundingClientRect — the panel scales during its
    // enter animation, which would skew a rect-based measurement.
    const sync = () => setContentHeight(el.offsetHeight);
    sync();
    const ro = new ResizeObserver(sync);
    ro.observe(el);
    return () => ro.disconnect();
  }, [open, pos]);

  const panelHeight =
    pos && contentHeight != null
      ? Math.min(contentHeight, pos.maxHeight)
      : undefined;
  const overflowing =
    pos != null && contentHeight != null && contentHeight > pos.maxHeight + 1;

  // Light dismiss: outside pointerdown, or Escape (which also hands focus
  // back to the pen button so keyboard flow continues where it left off).
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      const t = e.target as Node;
      if (buttonRef.current?.contains(t) || panelRef.current?.contains(t))
        return;
      // Selects inside the panel portal their own popups to <body> — a click
      // in one of those must not read as "outside".
      if ((t as Element).closest?.("[data-radix-popper-content-wrapper], [role='listbox'], [data-floating-ui-portal]"))
        return;
      setOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        buttonRef.current?.querySelector("button")?.focus();
      }
    };
    window.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <>
      <div ref={buttonRef}>
        <Tooltip content="Playground" side="top">
          <Button
            variant="ghost"
            size="icon-compact"
            aria-label={label}
            aria-haspopup="dialog"
            aria-expanded={open}
            active={open}
            onClick={() => setOpen((v) => !v)}
          >
            <PencilIcon />
          </Button>
        </Tooltip>
      </div>
      {typeof document !== "undefined" &&
        createPortal(
          <AnimatePresence>
            {open && pos && (
              <motion.div
                key="panel"
                ref={panelRef}
                role="dialog"
                aria-label={label}
                className="fixed z-50"
                style={{
                  right: pos.right,
                  top: pos.top,
                  bottom: pos.bottom,
                  width: PANEL_WIDTH,
                  // Grow from the anchored edge — the one nearest the pen.
                  transformOrigin:
                    pos.bottom != null ? "bottom right" : "top right",
                }}
                initial={
                  reduceMotion
                    ? { opacity: 0 }
                    : {
                        opacity: 0,
                        y: pos.bottom != null ? 4 : -4,
                        scaleY: 0.96,
                      }
                }
                animate={
                  reduceMotion
                    ? { opacity: 1 }
                    : { opacity: 1, y: 0, scaleY: 1 }
                }
                exit={{ opacity: 0, transition: spring.fast.exit }}
                transition={spring.fast}
              >
                {/* Same elevation contract as the Dropdown popup: two steps
                    above the substrate for the background, with a fixed
                    shadow-3 weight. The panel inside (PlaygroundPanel's
                    bg-muted card) then reads against a real surface color
                    rather than a flat background. */}
                <Elevated offset={2} shadowLevel={3} className="rounded-lg">
                  <ScrollArea
                    className="rounded-[inherit]"
                    style={{ height: panelHeight, maxHeight: pos.maxHeight }}
                    viewportClassName={overflowing ? "scroll-fade" : undefined}
                  >
                    {/* Measured for the height above — must not be the
                        scrolling box itself, so its height stays
                        content-driven. */}
                    <div ref={contentRef}>{children}</div>
                  </ScrollArea>
                </Elevated>
              </motion.div>
            )}
          </AnimatePresence>,
          document.body
        )}
    </>
  );
}
