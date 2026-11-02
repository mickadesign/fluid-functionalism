"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useId,
  useState,
  type CSSProperties,
  type FocusEvent,
  type HTMLAttributes,
  type KeyboardEvent,
  type MouseEvent,
  type ReactNode,
} from "react";
import {
  AnimatePresence,
  animate,
  motion,
  useIsPresent,
  useMotionValue,
  useReducedMotion,
} from "motion/react";
import {
  DayPicker,
  dateMatchModifiers,
  labelDayButton,
  rangeContainsModifiers,
  useDayPicker,
  type CalendarMonth,
  type CustomComponents,
  type DateRange,
  type DayButtonProps,
  type DayPickerProps,
  type DayProps,
  type Formatters,
  type Labels,
  type Matcher,
  type Modifiers,
  type MonthCaptionProps,
  type MonthProps,
  type WeekNumberProps,
  type WeekProps,
} from "@daypicker/react";
import { cn } from "@/lib/utils";
import { omit } from "@/lib/omit";
import { spring, exitFallbackMs } from "@/lib/springs";
import { fontWeights } from "@/lib/font-weight";
import { useShape } from "@/lib/shape-context";
import { useSize, typeClass, type SizeVariant } from "@/lib/size-context";
import { useIcons } from "@/lib/icon-context";
import { POPUP_NAV_KEYS } from "@/lib/popup";
import { useKeyboardNavGate } from "@/hooks/use-keyboard-nav-gate";
import {
  useFluidHover,
  useRegisterFluidHoverItem,
  type ItemRect,
  type UseFluidHoverReturn,
} from "@/hooks/use-fluid-hover";
import { FluidHoverHighlight } from "@/components/ui/fluid-hover-highlight";
import { Button } from "@/components/ui/button";
import { Tooltip } from "@/components/ui/tooltip";

// ---------------------------------------------------------------------------
// Calendar
//
// DayPicker owns the date math, the roving tabindex, the grid keys
// (arrows, PageUp/PageDown, Home/End), locale and selection rules. Every
// part it renders is replaced here by a div with the matching ARIA role, so
// the grid lays out with flex instead of table rules and one fluid hover
// scope can span both months. DayPicker's own `animate` stays off: the
// month slide below is ours.
// ---------------------------------------------------------------------------

type CalendarOrientation = "auto" | "horizontal" | "vertical";

/** Days since the epoch for a local calendar date. Comparing these instead
 *  of Date objects keeps every range check free of time-of-day and DST. */
export function dayNumber(date: Date) {
  return Math.round(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / 86_400_000);
}

function addDays(date: Date, days: number) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
}

/**
 * The three day matchers, mapped onto what DayPicker understands. `booked`
 * and every day outside `available` join `disabled`, so none of them can be
 * picked or focused; `booked` also stays a modifier of its own for the
 * line-through and the accessible label. Exported for the unit test.
 */
export function resolveDayMatchers({
  booked,
  available,
  disabled,
}: {
  booked?: Matcher | Matcher[];
  available?: Matcher | Matcher[];
  disabled?: Matcher | Matcher[];
}) {
  // A Matcher[] and a Date[] both read as "any of these", so arrays flatten.
  const flat = (m: Matcher | Matcher[] | undefined): Matcher[] =>
    m === undefined ? [] : Array.isArray(m) ? m : [m];
  const outside: Matcher[] =
    available === undefined ? [] : [(date: Date) => !dateMatchModifiers(date, available)];
  const unavailable = [...flat(disabled), ...outside];
  const list = [...flat(booked), ...unavailable];
  return {
    disabled: list,
    modifiers: {
      booked: booked ?? false,
      unavailable: unavailable.length > 0 ? unavailable : false,
    } as Record<string, Matcher | Matcher[]>,
  };
}

/** ISO 8601 week numbers by default: they need a Monday start, so the
 *  Monday start comes with them unless the caller picked a Sunday week, in
 *  which case the locale's own numbering applies. Exported for the test. */
export function resolveWeekNumbering(
  showWeekNumber: boolean | undefined,
  weekStartsOn: DayPickerProps["weekStartsOn"],
  ISOWeek: boolean | undefined
) {
  if (ISOWeek !== undefined) return ISOWeek;
  if (!showWeekNumber) return false;
  return weekStartsOn === undefined || weekStartsOn === 1;
}

// ---------------------------------------------------------------------------
// Contexts
// ---------------------------------------------------------------------------

interface CalendarContextValue {
  compact: boolean;
  fill: boolean;
  pill: boolean;
  mode: "single" | "range";
  /** Single mode: the selected day number. */
  selectedDay: number | null;
  /** Range mode: the committed range. */
  range: DateRange | undefined;
  /** A range whose start is picked and whose end is not yet. */
  picking: boolean;
  /** Everything that can't be picked, for the preview's booked-day check. */
  disabledMatchers: Matcher[];
  orientation: "horizontal" | "vertical";
  numberOfMonths: number;
  outsideHidden: boolean;
  showWeekNumber: boolean;
  /** DayPicker's autoFocus: the first focus is the script's, not a key's. */
  autoFocus: boolean;
  /** The caller's hideNavigation / disableNavigation (DayPicker's own nav
   *  is always hidden; the captions render ours). */
  navHidden: boolean;
  /** Extra content under each day's number (a price, a count). */
  dayDetail?: (date: Date) => ReactNode;
}

const CalendarContext = createContext<CalendarContextValue | null>(null);

function useCalendarContext() {
  const ctx = useContext(CalendarContext);
  if (!ctx) throw new Error("Calendar parts must be inside <Calendar>");
  return ctx;
}

interface GridContextValue {
  registerItem: UseFluidHoverReturn["registerItem"];
  gridStart: number;
  /** The band to draw: committed, or start → hovered day while picking. */
  band: { from: number; to: number } | null;
  /** The day the pointer or focus proposes as the end, while picking. */
  previewEnd: number | null;
  direction: number;
  reduceMotion: boolean;
  /** Side by side months: how far one month travels on a month change (its
   *  width plus the gap), so the grids move as one strip. Null otherwise. */
  stride: number | null;
  /** Two months stacked: the slide and the chevrons go up and down. */
  stacked: boolean;
  /** Side by side, the most week rows among the months on screen: every
   *  month takes that height, so none resizes in the middle of a slide. */
  sharedRows: number | null;
  /** The day a range end was just committed on: it takes the gliding
   *  highlight's fill in the same frame, with no fade. */
  committedEnd: number | null;
  /** A committed range a new pick just replaced: its band and ends fade
   *  out instead of vanishing. `id` restarts the fade for each one. */
  ghost: { from: number; to: number; id: number } | null;
}

const GridContext = createContext<GridContextValue | null>(null);

function useGridContext() {
  const ctx = useContext(GridContext);
  if (!ctx) throw new Error("Calendar parts must be inside <Calendar>");
  return ctx;
}

const MonthContext = createContext<{ calendarMonth: CalendarMonth; displayIndex: number } | null>(null);

/** False inside a month grid that is sliding out: its days stay on screen
 *  for the crossfade but leave the hover scope and the tab order. */
const PanelPresentContext = createContext(true);

const useIsoLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

/**
 * True for a month panel that is sliding out of one slot while the same month
 * slides into the neighbouring slot. Both copies share a path, and their
 * translucent range bands and text would stack into a darker blink, so the
 * outgoing copy hides and the incoming one carries the month.
 */
function useShownElsewhere(monthTime: number, present: boolean, stride: number | null) {
  const { months } = useDayPicker();
  return !present && stride !== null && months.some((m) => m.date.getTime() === monthTime);
}

const INDEX_ATTR = "data-calendar-index";

/**
 * A month change. Side by side: every grid travels a full stride, so the
 * month leaving the right slot and the same month entering the left slot
 * share one path and read as one strip sliding under the clip. One month:
 * the same slide over a third of the stride, crossfading where the two
 * meet. `custom` is the direction of travel, read from AnimatePresence so
 * an exiting panel always gets the latest one.
 */
const SINGLE_MONTH_TRAVEL = 1 / 3;

function slideVariants(
  offset: number,
  stride: number | null,
  axis: "x" | "y" = "x",
  single = false
) {
  const carousel = stride !== null && offset > 0;
  const distance = carousel ? (single ? stride * SINGLE_MONTH_TRAVEL : stride) : offset;
  // Full-stride grids hand over in one path; shorter travel overlaps them.
  const solid = carousel && !single;
  const exitTransition = carousel ? spring.moderate : spring.moderate.exit;
  // Stacked months travel up and down, like the layout they sit in.
  const at = (v: number) => (axis === "x" ? { x: v } : { y: v });
  return {
    enter: (d: number) => ({ opacity: solid ? 1 : 0, ...at(d * distance) }),
    center: { opacity: 1, x: 0, y: 0, transition: spring.moderate },
    exit: (d: number) => ({
      opacity: solid ? 1 : 0,
      ...at(-d * distance),
      transition: exitTransition,
    }),
  };
}
/** One day column: the cell size, or the measured column when the months
 *  fill their container (see the grid). The chevrons take one each. */
const COL = "var(--calendar-col, var(--cell-size))";
/** The week-number column: narrower than a day, so the numbers sit close
 *  to the days instead of floating in a full cell. */
export const WEEK_COL_RATIO = 0.75;
const WEEK_COL = "calc(var(--cell-size) * 0.75)";

/**
 * The stacked strip's mask, the scroll-fade recipe twice over. Top: nothing
 * shows above the first caption row (the strip reaches up through the 16px
 * gap to the weekday row, which stays empty), then content fades in over a
 * quarter cell, ending just above the title's cap height. Bottom: content
 * fades over the 24px the strip reaches past the last week (only padding at
 * rest, so nothing on screen dims). A month sliding out either way dissolves
 * there instead of being cut. The chevrons sit in a hole that hides
 * everything from their left edge (16px fade beyond it) down to the 4px
 * margin under their row (faded across it, so the first week stays whole),
 * so a month sliding up goes under them instead of showing through. The hole
 * is the left-fade and bottom-fade gradients intersected, subtracted from
 * the fade.
 */
const STACKED_NAV_WIDTH = `calc(${COL} * 2)`;
const stackedStripMask: CSSProperties = (() => {
  const fade =
    "linear-gradient(to bottom, transparent calc(var(--strip-clip-top) + 16px), #000 calc(var(--strip-clip-top) + 16px + var(--cell-size) / 4), #000 calc(100% - 24px), transparent)";
  const holeLeft = "linear-gradient(to left, #000 calc(100% - 16px), transparent)";
  const holeBottom = "linear-gradient(to bottom, #000 calc(100% - 4px), transparent)";
  // The caption row and its 4px margin: the first week below stays whole.
  const holeSize = `calc(${STACKED_NAV_WIDTH} + 16px) calc(var(--cell-size) + 4px)`;
  return {
    maskImage: `${fade}, ${holeLeft}, ${holeBottom}`,
    maskSize: `100% 100%, ${holeSize}, ${holeSize}`,
    // The hole starts at the first caption row, below the strip's 16px reach.
    maskPosition: "0 0, right 4px top 16px, right 4px top 16px",
    maskRepeat: "no-repeat",
    maskComposite: "subtract, intersect",
  };
})();

/**
 * The side-by-side strip's mask: content fades over 8px at the outer edges.
 * The strip reaches 8px past the months on both sides, so at rest the fade
 * covers only that margin and nothing on screen is dimmed; a month sliding
 * out dissolves there instead of being cut.
 */
const sideStripMask: CSSProperties = (() => {
  const mask = "linear-gradient(to right, transparent, #000 8px, #000 calc(100% - 8px), transparent)";
  return { maskImage: mask, WebkitMaskImage: mask };
})();

/** Parts the pointer passes over without lighting a day (captions, the
 *  weekday row, week numbers, booked days). */
const INERT_ATTR = "data-calendar-inert";
const MONTH_GAP = 24;
const CALENDAR_PAD = 8;

function isDisabledDay(el: HTMLElement) {
  return (el as HTMLButtonElement).disabled || el.getAttribute("aria-disabled") === "true";
}

// ---------------------------------------------------------------------------
// Months: the one fluid hover scope across every month on screen
// ---------------------------------------------------------------------------

function Months({ className, style, children, ...props }: HTMLAttributes<HTMLDivElement>) {
  const cal = useCalendarContext();
  const { months, formatters, labels } = useDayPicker();
  const shape = useShape();
  const containerRef = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion() ?? false;

  const hover = useFluidHover(containerRef, { axis: "xy", isItemDisabled: isDisabledDay });
  const { activeIndex, setActiveIndex, itemRects, isMeasured, handlers, registerItem } = hover;
  const { onMouseMove, onMouseEnter, onMouseLeave, onClick } = handlers;

  const firstDay = months[0]?.weeks[0]?.days[0]?.date;
  const gridStart = firstDay ? dayNumber(firstDay) : 0;
  const monthKey = months[0] ? months[0].date.getTime() : 0;

  // A month change re-registers every day under new indices. The highlight
  // and the ring snap to where focus lands instead of gliding from the old
  // grid's geometry (the keyboard crossing a month boundary), and the grids
  // slide in the direction of travel.
  const [lastMonthKey, setLastMonthKey] = useState(monthKey);
  const [direction, setDirection] = useState(0);
  const [snap, setSnap] = useState(false);
  if (monthKey !== lastMonthKey) {
    setLastMonthKey(monthKey);
    setDirection(monthKey > lastMonthKey ? 1 : -1);
    setSnap(true);
  }
  useEffect(() => {
    if (!snap || !isMeasured) return;
    const id = requestAnimationFrame(() => setSnap(false));
    return () => cancelAnimationFrame(id);
  }, [snap, isMeasured]);

  // Keyboard focus ring: earned by navigation keys, or by focus arriving
  // with :focus-visible (Tab from outside). DayPicker's autoFocus is a
  // script focus, which Chrome marks focus-visible regardless, so the first
  // focus after mount only counts when the gate was seeded by a keyboard
  // trigger.
  const { keyboardNavRef, trackKeyboardNav } = useKeyboardNavGate(true);
  const autoFocusPendingRef = useRef(cal.autoFocus);
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);
  const inertRef = useRef(false);

  const handleMouseMove = (e: MouseEvent) => {
    if (focusedIndex !== null) setFocusedIndex(null);
    if (snap) setSnap(false);
    const target = e.target as Element;
    if (target.closest?.(`[${INERT_ATTR}]`)) {
      if (!inertRef.current) {
        inertRef.current = true;
        onMouseLeave();
      }
      return;
    }
    if (inertRef.current) {
      inertRef.current = false;
      onMouseEnter();
    }
    onMouseMove(e);
  };

  const handleFocus = (e: FocusEvent) => {
    const el = (e.target as HTMLElement).closest?.(`[${INDEX_ATTR}]`);
    if (!el) return;
    const idx = Number(el.getAttribute(INDEX_ATTR));
    setActiveIndex(idx);
    const fromScript = autoFocusPendingRef.current;
    autoFocusPendingRef.current = false;
    const ring =
      keyboardNavRef.current ||
      (!fromScript && (e.target as HTMLElement).matches(":focus-visible"));
    setFocusedIndex(ring ? idx : null);
  };

  const handleBlur = (e: FocusEvent) => {
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    setFocusedIndex(null);
    setActiveIndex(null);
  };

  // Side by side, a month change moves every grid by one month width plus
  // the gap. Measured from the first month (all months share one width).
  // Stacked, it moves every grid by the distance between the two month slots,
  // so the month leaving the lower slot and the same month arriving in the
  // upper one share a path, as side by side. Measured on the layout a change
  // starts from: the arriving month starts exactly where it was shown.
  // A single month slides the same way: out a full width while the next
  // comes in from the other side, so 1 and 2 months feel alike.
  const twoUp = cal.numberOfMonths > 1 && cal.orientation === "horizontal";
  const stacked = cal.numberOfMonths > 1 && cal.orientation === "vertical";
  const sideways = !stacked;
  const [stride, setStride] = useState<number | null>(null);
  useIsoLayoutEffect(() => {
    const container = containerRef.current;
    if (!container) {
      setStride(null);
      return;
    }
    const months = container.querySelectorAll<HTMLElement>('[data-slot="calendar-month"]');
    const [first, second] = [months[0], months[1]];
    if (!first || (stacked && !second)) return;
    const measure = () =>
      setStride(sideways ? first.offsetWidth + MONTH_GAP : second.offsetTop - first.offsetTop);
    measure();
    if (typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(measure);
    ro.observe(first);
    if (second) ro.observe(second);
    return () => ro.disconnect();
  }, [sideways, stacked]);

  // Filling their container, the day columns outgrow the cell size, so the
  // chevrons (one column each) read the measured column instead. Read off a
  // live cell each time: a month change swaps the cells out.
  useIsoLayoutEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    if (!cal.fill) {
      container.style.setProperty("--calendar-col", "var(--cell-size)");
      return;
    }
    const measure = () => {
      const cell = container.querySelector<HTMLElement>('[role="gridcell"]');
      if (!cell) return;
      // Fractional (offsetWidth rounds, which drifts across columns), in
      // layout pixels: the container's own ratio undoes a scaled ancestor.
      const box = container.getBoundingClientRect().width;
      const scale = box ? container.offsetWidth / box : 1;
      container.style.setProperty("--calendar-col", `${cell.getBoundingClientRect().width * scale}px`);
    };
    measure();
    if (typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(measure);
    ro.observe(container);
    return () => ro.disconnect();
    // Week numbers and the month layout change the columns, not the box.
  }, [cal.fill, cal.showWeekNumber, cal.numberOfMonths, cal.orientation]);

  // While a range end is being picked, the band follows the lit day.
  const previewDate =
    cal.picking && activeIndex !== null && firstDay ? addDays(firstDay, activeIndex) : null;
  let previewEnd: number | null = null;
  let band: { from: number; to: number } | null = null;
  if (cal.mode === "range" && cal.range?.from) {
    const from = dayNumber(cal.range.from);
    if (cal.picking) {
      if (previewDate && cal.range.from) {
        const a = cal.range.from < previewDate ? cal.range.from : previewDate;
        const b = cal.range.from < previewDate ? previewDate : cal.range.from;
        const blocked =
          cal.disabledMatchers.length > 0 &&
          rangeContainsModifiers({ from: a, to: b }, cal.disabledMatchers);
        if (!blocked) {
          previewEnd = dayNumber(previewDate);
          band = { from: Math.min(from, previewEnd), to: Math.max(from, previewEnd) };
        }
      }
    } else if (cal.range.to) {
      band = { from, to: dayNumber(cal.range.to) };
    }
  }

  const previewGlides =
    previewEnd !== null && !!cal.range?.from && previewEnd !== dayNumber(cal.range.from);
  // Picking an end, a fresh hover session (the pointer coming back in) starts
  // the solid end opaque under the range start, so it slides out of the
  // first pick instead of fading in wherever the pointer lands.
  const pickStart =
    previewGlides && cal.range?.from && isMeasured
      ? (itemRects[dayNumber(cal.range.from) - gridStart] ?? null)
      : null;
  // Whether the lit day is a filled one (the selected day, or a range end).
  const litDay = activeIndex !== null ? gridStart + activeIndex : null;
  const litFilled =
    litDay !== null &&
    (cal.mode === "single"
      ? cal.selectedDay === litDay
      : (!!cal.range?.from && dayNumber(cal.range.from) === litDay) ||
        (!!cal.range?.to && !cal.picking && dayNumber(cal.range.to) === litDay));

  // The pick that commits a range end hands the gliding fill to the chosen
  // day, which must take it in the same frame. Tracked during render: the
  // last proposed end is the day that was clicked (or entered) when picking
  // stops on a range whose ends include it; Escape restores another range.
  const [pickTrack, setPickTrack] = useState({ picking: cal.picking, end: previewEnd });
  const [committedEnd, setCommittedEnd] = useState<number | null>(null);
  if (pickTrack.picking !== cal.picking || (cal.picking && pickTrack.end !== previewEnd)) {
    if (pickTrack.picking && !cal.picking && pickTrack.end !== null && cal.range?.to) {
      const ends = [dayNumber(cal.range.from!), dayNumber(cal.range.to)];
      if (ends.includes(pickTrack.end)) setCommittedEnd(pickTrack.end);
    }
    setPickTrack({ picking: cal.picking, end: cal.picking ? previewEnd : null });
  }
  const clearCommittedEnd = useCallback(() => setCommittedEnd(null), []);
  // A new pick replacing a committed range leaves the old one as a ghost
  // that fades out on the moderate exit. Tracked during render, compared by
  // day numbers (the range's dates are new objects each render).
  const committed =
    cal.mode === "range" && !cal.picking && cal.range?.from && cal.range.to
      ? { from: dayNumber(cal.range.from), to: dayNumber(cal.range.to) }
      : null;
  const [lastCommitted, setLastCommitted] = useState(committed);
  const [ghost, setGhost] = useState<GridContextValue["ghost"]>(null);
  if (committed?.from !== lastCommitted?.from || committed?.to !== lastCommitted?.to) {
    if (lastCommitted && !committed) setGhost({ ...lastCommitted, id: (ghost?.id ?? 0) + 1 });
    setLastCommitted(committed);
  }
  useEffect(() => {
    if (!ghost) return;
    const id = setTimeout(() => setGhost(null), exitFallbackMs(spring.moderate));
    return () => clearTimeout(id);
  }, [ghost]);
  // Held down on a filled day, its ring goes solid; on an empty one, the
  // hover fill presses like a ghost Button. The press reads before the
  // click commits. The window listener catches a release outside the grid.
  const [pressed, setPressed] = useState(false);
  useEffect(() => {
    if (!pressed) return;
    const release = () => setPressed(false);
    window.addEventListener("mouseup", release);
    return () => window.removeEventListener("mouseup", release);
  }, [pressed]);
  // The cell's usual color fades come back after the moment has passed.
  useEffect(() => {
    if (committedEnd === null) return;
    const id = setTimeout(clearCommittedEnd, exitFallbackMs(spring.moderate));
    return () => clearTimeout(id);
  }, [committedEnd, clearCommittedEnd]);

  // The weekday row sticks while stacked months scroll, so the strip's clip
  // follows its bottom edge: a month sliding up leaves there, never behind it.
  const weekdayRowRef = useRef<HTMLDivElement>(null);
  const stripRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const row = weekdayRowRef.current;
    const strip = stripRef.current;
    if (!stacked || !row || !strip) return;
    // Not clamped: at rest the row's edge meets the strip's top (0), and the
    // mask hides the 16px gap below it down to the first caption row.
    const measure = () => {
      frame = 0;
      const top = row.getBoundingClientRect().bottom - strip.getBoundingClientRect().top;
      strip.style.setProperty("--strip-clip-top", `${top}px`);
    };
    // One read per frame, however many scroll events land in it.
    let frame = 0;
    const update = () => {
      if (!frame) frame = requestAnimationFrame(measure);
    };
    measure();
    // Capture catches whichever ancestor scrolls (a popover, a demo, the page).
    window.addEventListener("scroll", update, { capture: true, passive: true });
    window.addEventListener("resize", update);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", update, { capture: true });
      window.removeEventListener("resize", update);
    };
  }, [stacked]);

  const sharedRows = twoUp ? Math.max(...months.map((m) => m.weeks.length)) : null;

  const gridCtx = useMemo(
    () => ({
      registerItem,
      gridStart,
      band,
      previewEnd,
      direction,
      reduceMotion,
      stride,
      stacked,
      sharedRows,
      committedEnd,
      ghost,
    }),
    // band is rebuilt each render; compare its parts.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      registerItem,
      gridStart,
      band?.from,
      band?.to,
      previewEnd,
      direction,
      reduceMotion,
      stride,
      stacked,
      sharedRows,
      committedEnd,
      ghost,
    ]
  );

  const focusRect: ItemRect | null =
    isMeasured && focusedIndex !== null ? (itemRects[focusedIndex] ?? null) : null;
  const cellRadius = cal.pill ? "rounded-full" : shape.bg;

  // The hover highlight, its inner ring over filled days, and the focus
  // ring. Positioned against the months container either way: the stacked
  // strip isn't a containing block, only a stacking layer.
  const overlays = (
    <>
        <FluidHoverHighlight
          hover={hover}
          className={cn(
            "z-[1]",
            cellRadius,
            // Picking a range end, the highlight is the proposed end: the solid
            // fill glides to the pointer like the single-select highlight
            // instead of jumping from cell to cell. Its ring is the overlay's.
            previewGlides
              ? "bg-foreground"
              : cn(
                  // Otherwise it's the hover fill, pressed like a ghost
                  // Button: a surface 1px in with a same-color 1px spread at
                  // rest, the spread collapsing on press so the fill shrinks
                  // 1px per side and steps to the active token.
                  "bg-transparent before:pointer-events-none before:absolute before:inset-px before:rounded-[inherit] before:bg-[var(--day-press)] before:transition-[box-shadow,background-color] before:[transition-duration:180ms,80ms] before:[transition-timing-function:cubic-bezier(0.23,1,0.32,1),ease]",
                  pressed && !litFilled
                    ? "[--day-press:var(--active)] before:shadow-[0_0_0_0px_var(--day-press)] before:[transition-duration:80ms,80ms]"
                    : "[--day-press:var(--hover)] before:shadow-[0_0_0_1px_var(--day-press)]"
                )
          )}
          from={pickStart}
          fadeIn={!pickStart}
          transition={snap ? false : undefined}
        />
        {/* The highlight sits under a filled start or end, so it brings an
            inner ring on top (1px in, concentric radius) at 40%, gliding on
            the same rect and spring, shown while the lit day is filled. The
            proposed end is a lit filled day too, so the ring stays as it is
            when the click commits it. Pressed, it goes solid. */}
        <FluidHoverHighlight
          hover={hover}
          className={cn(
            "z-[3] bg-transparent",
            cellRadius,
            "before:pointer-events-none before:absolute before:inset-px before:border before:border-background before:transition-opacity before:duration-80",
            cal.pill ? "before:rounded-full" : "before:rounded-[7px]",
            !(litFilled || previewGlides)
              ? "before:opacity-0"
              : pressed
                ? "before:opacity-100"
                : "before:opacity-40"
          )}
          from={pickStart}
          fadeIn={!pickStart}
          transition={snap ? false : undefined}
        />
        <AnimatePresence>
          {focusRect && (
            <motion.div
              data-slot="calendar-focus-ring"
              className={cn(
                "pointer-events-none absolute left-0 top-0 z-[3] border border-[color:var(--focus-ring,#6B97FF)]",
                cal.pill ? "rounded-full" : shape.focusRing
              )}
              initial={{
                opacity: 0,
                x: focusRect.left - 2,
                y: focusRect.top - 2,
                width: focusRect.width + 4,
                height: focusRect.height + 4,
              }}
              animate={{
                opacity: 1,
                x: focusRect.left - 2,
                y: focusRect.top - 2,
                width: focusRect.width + 4,
                height: focusRect.height + 4,
              }}
              exit={{ opacity: 0, transition: spring.fast.exit }}
              transition={{
                ...(snap || reduceMotion ? { duration: 0 } : spring.fast),
                opacity: { duration: 0.08 },
              }}
            />
          )}
        </AnimatePresence>
    </>
  );

  return (
    <div
      ref={containerRef}
      data-slot="calendar-months"
      data-orientation={cal.numberOfMonths > 1 ? cal.orientation : undefined}
      className={cn(
        "relative isolate flex",
        // Stacked, the surface carries on to the sticky weekday row, which
        // must hide what scrolls under it.
        stacked ? "flex-col gap-4 bg-inherit" : "flex-row flex-wrap gap-x-6 gap-y-4",
        // With 2 months, the months sit in a masked strip (below): soft
        // edges side by side, a fade under the weekday row when stacked.
        cal.fill && "w-full",
        className
      )}
      // Seeded at the cell size; filling, the effect above measures it.
      style={{ "--calendar-col": "var(--cell-size)", ...style } as CSSProperties}
      onKeyDownCapture={(e) => {
        if (POPUP_NAV_KEYS.includes(e.key)) trackKeyboardNav(e);
      }}
      onMouseDown={(e) => {
        keyboardNavRef.current = false;
        setFocusedIndex(null);
        if (e.button === 0) setPressed(true);
      }}
      onMouseUp={() => setPressed(false)}
      onMouseEnter={() => {
        inertRef.current = false;
        onMouseEnter();
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={onMouseLeave}
      onClick={onClick}
      onFocus={handleFocus}
      onBlur={handleBlur}
      {...props}
    >
      {/* Stacked, these draw inside the clipped strip (its clip makes its own
          stacking layer), so the numbers stay above the solid preview end. */}
      {/* The hover layers always draw inside the masked strip below (its
          mask makes its own stacking layer), so numbers stay above fills.
          The strip renders from the first frame: adding it later would
          remount the months and strand the stride measurement. */}
      {stacked && months[0] && (
        <div
          ref={weekdayRowRef}
          aria-hidden
          {...{ [INERT_ATTR]: "" }}
          className="sticky top-0 z-[4] flex bg-inherit"
        >
          {cal.showWeekNumber && <span className="w-[calc(var(--cell-size)*0.75)] shrink-0" />}
          {months[0].weeks[0].days.map((day) => (
            <WeekdayCell key={day.isoDate}>
              {formatters.formatWeekdayName(day.date, day.dateLib.options, day.dateLib)}
            </WeekdayCell>
          ))}
          <span className="sr-only">{labels.labelWeekNumberHeader?.()}</span>
        </div>
      )}
      {stacked && !cal.navHidden && (
        // Stacked, the chevrons float over the first caption row, outside the
        // masked strip (whose hole fades the sliding months under them), and
        // pass under the sticky weekday row when a short popup scrolls.
        <div
          {...{ [INERT_ATTR]: "" }}
          // Same rounded row height as the weekday row, with the same fallback.
          className="absolute right-0 top-[calc(var(--cell-size)*0.8_+_16px)] z-[3] flex h-[var(--cell-size)] items-center supports-[width:round(1px,1px)]:top-[calc(round(down,var(--cell-size)*0.8,1px)_+_16px)]"
        >
          <NavGroup buttons={["previous", "next"]} />
        </div>
      )}
      <GridContext.Provider value={gridCtx}>
        {stacked ? (
          // Stacked, the strip's clip starts under the weekday row, so a
          // month sliding up leaves at its edge instead of passing behind it.
          <div
            ref={stripRef}
            // The box reaches 4px past the sides (so the mask never cuts a
            // focus ring), up through the gap to the weekday row and 24px
            // past the bottom for the fades, margins undone by padding. Only
            // the months take the pointer: the reach never covers what sits
            // below the calendar.
            className="pointer-events-none -mx-1 -mb-6 -mt-4 flex flex-col gap-4 px-1 pb-6 pt-4 [&>[data-slot=calendar-month]]:pointer-events-auto"
            style={
              {
                // Seeded here; the effect above keeps it on the weekday row's
                // edge (React leaves it alone while this seed doesn't change).
                "--strip-clip-top": "0px",
                ...stackedStripMask,
              } as CSSProperties
            }
          >
            {overlays}
            {children}
          </div>
        ) : (
          // Sideways (1 month or 2), the strip reaches 8px past the months
          // (and the bottom, for the focus ring), margins undone by padding.
          <div
            className={cn("-mx-2 -mb-2 flex flex-row gap-x-6 px-2 pb-2", cal.fill && "min-w-0 flex-1")}
            style={sideStripMask}
          >
            {overlays}
            {children}
          </div>
        )}
      </GridContext.Provider>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Month, caption and navigation
// ---------------------------------------------------------------------------

function Month({ calendarMonth, displayIndex, className, style, children, ...props }: MonthProps) {
  const cal = useCalendarContext();
  const value = useMemo(() => ({ calendarMonth, displayIndex }), [calendarMonth, displayIndex]);
  return (
    <MonthContext.Provider value={value}>
      <div
        data-slot="calendar-month"
        className={cn("flex flex-col", cal.fill && "min-w-0 flex-1", className)}
        style={style}
        {...props}
      >
        {children}
      </div>
    </MonthContext.Provider>
  );
}

function NavButton({ direction }: { direction: "previous" | "next" }) {
  const cal = useCalendarContext();
  const { previousMonth, nextMonth, goToMonth, labels, dayPickerProps } = useDayPicker();
  const icons = useIcons();
  const Chevron = icons["chevron-right"];
  const target = direction === "previous" ? previousMonth : nextMonth;
  const label =
    direction === "previous"
      ? labels.labelPrevious(previousMonth)
      : labels.labelNext(nextMonth);
  const tooltip = direction === "previous" ? "Previous month" : "Next month";
  const flip = (direction === "previous") !== (dayPickerProps.dir === "rtl");
  // Stacked months page up and down, so the chevrons point that way.
  const stacked = cal.numberOfMonths > 1 && cal.orientation === "vertical";
  return (
    <Tooltip content={tooltip}>
      <Button
        type="button"
        variant="ghost"
        size="icon-compact"
        aria-label={label}
        aria-disabled={target ? undefined : true}
        data-calendar-nav={direction}
        disabled={!target}
        onClick={() => {
          if (!target) return;
          goToMonth(target);
          if (direction === "previous") dayPickerProps.onPrevClick?.(target);
          else dayPickerProps.onNextClick?.(target);
        }}
        // A day's size (a filled column caps at the cell size, like the days),
        // so the chevrons line up with the dates in every configuration. The
        // pair shares one fluid hover highlight, so each button's own hover
        // fill stays off; the press feedback is kept.
        className="relative z-[1] !size-[min(var(--calendar-col,var(--cell-size)),var(--cell-size))] group-hover:[&>span:first-child]:!bg-transparent group-hover:[&>span:first-child]:!shadow-none"
      >
        <Chevron
          size={16}
          className={cn(
            stacked ? (direction === "previous" ? "-rotate-90" : "rotate-90") : flip && "rotate-180"
          )}
        />
      </Button>
    </Tooltip>
  );
}

function NavGroup({ buttons }: { buttons: ("previous" | "next")[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const hover = useFluidHover(ref, { axis: "x", isItemDisabled: isDisabledDay, gapClick: false });
  const shape = useShape();
  const { setActiveIndex } = hover;
  return (
    <div
      ref={ref}
      data-slot="calendar-nav"
      className="relative flex items-center"
      {...hover.handlers}
      onFocus={(e) => {
        const idx = buttons.indexOf(
          (e.target as HTMLElement).getAttribute("data-calendar-nav") as "previous" | "next"
        );
        if (idx >= 0 && (e.target as HTMLElement).matches(":focus-visible")) setActiveIndex(idx);
      }}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) setActiveIndex(null);
      }}
    >
      <FluidHoverHighlight hover={hover} className={cn("z-0", shape.button)} />
      {buttons.map((b, i) => (
        <NavSlot key={b} index={i} registerItem={hover.registerItem}>
          <NavButton direction={b} />
        </NavSlot>
      ))}
    </div>
  );
}

function NavSlot({
  index,
  registerItem,
  children,
}: {
  index: number;
  registerItem: UseFluidHoverReturn["registerItem"];
  children: ReactNode;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  useRegisterFluidHoverItem(registerItem, index, ref);
  // One day column wide, the button centered in it like a day in its cell;
  // the highlight measures the button's box, not the column.
  return (
    <span className="flex w-[var(--calendar-col,var(--cell-size))] justify-center">
      <span ref={ref} className="relative flex">
        {children}
      </span>
    </span>
  );
}

/** The month name. The one sliding out stays visible for the crossfade but
 *  leaves the live region, so a month change is announced once. */
function CaptionText({
  compact,
  monthTime,
  offset,
  stride,
  centered,
  children,
}: {
  compact: boolean;
  monthTime: number;
  offset: number;
  stride: number | null;
  centered: boolean;
  children: ReactNode;
}) {
  const present = useIsPresent();
  const cal = useCalendarContext();
  const { direction, stacked } = useGridContext();
  const shownElsewhere = useShownElsewhere(monthTime, present, stride);
  return (
    <motion.span
      role={present ? "status" : undefined}
      aria-live={present ? "polite" : undefined}
      aria-hidden={present ? undefined : true}
      className={cn(
        "col-start-1 row-start-1 whitespace-nowrap text-foreground [text-box:trim-both_cap_alphabetic]",
        // Centered side by side, where captions are; left everywhere else
        // (one month too), so a shorter title doesn't sit centered in the
        // cell while the longer one leaves, then jump left when it shrinks.
        centered ? "justify-self-center" : "justify-self-start",
        shownElsewhere && "invisible",
        typeClass("body", compact ? "compact" : "default")
      )}
      style={{ fontVariationSettings: fontWeights.semibold }}
      variants={slideVariants(offset, stride, stacked ? "y" : "x", cal.numberOfMonths === 1)}
      custom={direction}
      initial="enter"
      animate="center"
      exit="exit"
    >
      {children}
    </motion.span>
  );
}

/** Mask for a side-by-side caption layer: transparent under the chevron
 *  (one day column, after the week numbers on the left), then a 24px ramp to
 *  opaque, toward `to`. */
function captionFade(to: "left" | "right", weekNumbers: boolean) {
  const nav = to === "right" && weekNumbers ? `calc(${WEEK_COL} + ${COL})` : COL;
  return `linear-gradient(to ${to}, transparent ${nav}, #000 calc(${nav} + 24px))`;
}

/** The single-month caption layer's mask: clear past the right edge and
 *  under the chevron pair (a day column each), then a 24px ramp. */
function oneUpCaptionFade(stride: number, noNav: boolean) {
  const clear = noNav ? `${stride}px` : `calc(${stride}px + ${COL} * 2)`;
  return `linear-gradient(to left, transparent ${clear}, #000 calc(${clear} + 24px))`;
}

function MonthCaption({ calendarMonth, displayIndex, className, style, ...props }: MonthCaptionProps) {
  const cal = useCalendarContext();
  const { formatters } = useDayPicker();
  const grid = useGridContext();
  const last = displayIndex === cal.numberOfMonths - 1;
  const first = displayIndex === 0;
  const twoUp = cal.numberOfMonths > 1 && cal.orientation === "horizontal";
  // One month sliding a full stride: the title passes under the chevrons.
  const oneUp = cal.numberOfMonths === 1 && grid.stride !== null;
  const hideNav = cal.navHidden;

  // Single month and stacked months: caption left, both chevrons right of
  // the first caption. Side by side: captions centered, previous at the far
  // left, next at the far right.
  const navStart: ("previous" | "next")[] = !hideNav && twoUp && first ? ["previous"] : [];
  const stackedLayout = cal.numberOfMonths > 1 && cal.orientation === "vertical";
  const navEnd: ("previous" | "next")[] = hideNav || stackedLayout
    ? []
    : twoUp
      ? last
        ? ["next"]
        : []
      : first
        ? ["previous", "next"]
        : [];
  const key = calendarMonth.date.getTime();
  const offset = grid.reduceMotion ? 0 : 10;
  const caption = (
    // No clip: the label is trimmed to cap height, so a clip would shave its
    // ascenders and round overshoots; the 10px slide fades in and out anyway.
    <span className="relative inline-grid">
      <AnimatePresence initial={false} custom={grid.direction}>
        <CaptionText
          key={key}
          monthTime={key}
          compact={cal.compact}
          offset={offset}
          stride={grid.stride}
          centered={twoUp}
        >
          {formatters.formatCaption(
            calendarMonth.date,
            calendarMonth.weeks[0]?.days[0]?.dateLib.options,
            calendarMonth.weeks[0]?.days[0]?.dateLib
          )}
        </CaptionText>
      </AnimatePresence>
    </span>
  );

  return (
    <div
      data-slot="calendar-caption"
      {...{ [INERT_ATTR]: "" }}
      className={cn(
        "relative flex h-[var(--cell-size)] items-center gap-1",
        twoUp ? "justify-center" : "justify-between pl-2",
        // With week numbers, the title belongs to the days: it starts at the
        // Monday column (centered over the 7 days, side by side).
        cal.showWeekNumber &&
          (twoUp ? "pl-[calc(var(--cell-size)*0.75)]" : "pl-[calc(var(--cell-size)*0.75+0.5rem)]"),
        "mb-1",
        className
      )}
      style={style}
      {...omit(props, ["children"])}
    >
      {twoUp && (
        <div
          className={cn(
            "absolute top-1/2 -translate-y-1/2",
            cal.showWeekNumber ? "left-[calc(var(--cell-size)*0.75)]" : "left-0"
          )}
        >
          {navStart.length > 0 && <NavGroup buttons={navStart} />}
        </div>
      )}
      {twoUp && grid.stride !== null ? (
        // Side by side, captions slide a whole stride. This layer reaches over
        // the neighbouring month (so the incoming caption isn't cut at the
        // gap) and fades out on the chevron's side, like a scroll fade:
        // clear under the chevron, then a 24px ramp, so no title ever slides
        // under it.
        <div
          className="pointer-events-none absolute inset-y-0"
          style={{
            left: first ? 0 : -grid.stride,
            right: last ? 0 : -grid.stride,
            maskImage: captionFade(first ? "right" : "left", cal.showWeekNumber),
            WebkitMaskImage: captionFade(first ? "right" : "left", cal.showWeekNumber),
          }}
        >
          <div
            className="absolute inset-y-0 flex items-center justify-center"
            style={{ left: first ? 0 : grid.stride, right: last ? 0 : grid.stride }}
          >
            {caption}
          </div>
        </div>
      ) : oneUp ? (
        // One month: the title slides a whole stride too. The layer reaches a
        // stride past both sides (the strip fades the far edges) and is clear
        // under the chevron pair, then ramps in over 24px, so the title never
        // slides under the chevrons.
        <>
          <div
            className="pointer-events-none absolute inset-y-0"
            style={{
              left: -grid.stride!,
              right: -grid.stride!,
              maskImage: oneUpCaptionFade(grid.stride!, hideNav),
              WebkitMaskImage: oneUpCaptionFade(grid.stride!, hideNav),
            }}
          >
            <div
              className={cn(
                "absolute inset-y-0 flex items-center",
                cal.showWeekNumber ? "pl-[calc(var(--cell-size)*0.75+0.5rem)]" : "pl-2"
              )}
              style={{ left: grid.stride!, right: grid.stride! }}
            >
              {caption}
            </div>
          </div>
          <span aria-hidden className="flex-1" />
        </>
      ) : (
        caption
      )}
      {twoUp ? (
        <div className="absolute right-0 top-1/2 -translate-y-1/2">
          {navEnd.length > 0 && <NavGroup buttons={navEnd} />}
        </div>
      ) : (
        navEnd.length > 0 && <NavGroup buttons={navEnd} />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Grid
// ---------------------------------------------------------------------------

function MonthGrid({ className, style, children, ...props }: HTMLAttributes<HTMLElement>) {
  return (
    <div
      data-slot="calendar-grid"
      className={cn("flex flex-col", className)}
      style={style}
      {...(props as HTMLAttributes<HTMLDivElement>)}
    >
      {children}
    </div>
  );
}

// The weekday row's height is rounded to whole pixels: the hover layers are
// placed from offsetTop, which rounds, so a fractional row (36 x 0.8 = 28.8)
// would set them a fraction of a pixel off every day below it. Browsers
// without CSS round() keep the plain calc() height.
function WeekdayCell({
  children,
  className,
  label,
}: {
  children: ReactNode;
  className?: string;
  /** The full weekday name: makes the cell the grid's column header. */
  label?: string;
}) {
  const cal = useCalendarContext();
  return (
    <span
      role={label ? "columnheader" : undefined}
      aria-label={label}
      className={cn(
        "flex h-[calc(var(--cell-size)*0.8)] items-center justify-center text-muted-foreground supports-[width:round(1px,1px)]:h-[round(down,calc(var(--cell-size)*0.8),1px)]",
        cal.fill ? "min-w-0 flex-1" : "w-[var(--cell-size)]",
        typeClass("caption", cal.compact ? "compact" : "default"),
        className
      )}
    >
      {children}
    </span>
  );
}

// DayPicker's own weekday row never renders. Stacked months show one row,
// pinned above both grids; sliding sideways (1 month or 2), each month's row
// travels in its panel instead, from the first paint.
function Weekdays() {
  return null;
}

function Weekday({ className, style, children, ...props }: HTMLAttributes<HTMLElement>) {
  const cal = useCalendarContext();
  return (
    <div
      role="columnheader"
      className={cn(
        "flex h-[calc(var(--cell-size)*0.8)] items-center justify-center text-muted-foreground supports-[width:round(1px,1px)]:h-[round(down,calc(var(--cell-size)*0.8),1px)]",
        cal.fill ? "min-w-0 flex-1" : "w-[var(--cell-size)]",
        typeClass("caption", cal.compact ? "compact" : "default"),
        className
      )}
      style={style}
      aria-label={(props as { "aria-label"?: string })["aria-label"]}
    >
      {children}
    </div>
  );
}

function WeekNumberHeader({ className, style, ...props }: HTMLAttributes<HTMLElement>) {
  return (
    <div
      role="columnheader"
      aria-label={(props as { "aria-label"?: string })["aria-label"]}
      className={cn("w-[calc(var(--cell-size)*0.75)] shrink-0", className)}
      style={style}
    />
  );
}

/**
 * The weeks of one month. Each month slides 10px in the direction of
 * travel and crossfades with the grid it replaces; the box springs between
 * 5- and 6-week heights from a measured offsetHeight (never "auto", which
 * overshoots under a scaled ancestor). Reduced motion keeps the crossfade.
 * Both panels share one grid cell, like the caption, so the incoming month
 * is laid out (and its days measured) at the top while the old one fades.
 */
function Weeks({ className, style, children }: HTMLAttributes<HTMLElement>) {
  const month = useContext(MonthContext);
  const grid = useGridContext();
  const height = useMotionValue<number | "auto">("auto");
  // The month the height was last taken from, and the height it settles on.
  const measuredRef = useRef<{ month: number; h: number } | null>(null);
  const [clip, setClip] = useState(false);

  // Only a month change springs. A resize within the same month (fonts and
  // cell sizes settling after mount, a container resize) snaps, so the
  // calendar never grows on first paint.
  const onHeight = useCallback(
    (h: number, monthTime: number) => {
      const last = measuredRef.current;
      measuredRef.current = { month: monthTime, h };
      if (!last || grid.reduceMotion || last.month === monthTime) {
        if (last?.month === monthTime && last.h === h) return;
        height.jump(h);
        setClip(false);
        return;
      }
      if (last.h === h) return;
      setClip(true);
      animate(height, h, { ...spring.moderate, onComplete: () => setClip(false) });
    },
    [grid.reduceMotion, height]
  );

  const key = month ? month.calendarMonth.date.getTime() : 0;
  const offset = grid.reduceMotion ? 0 : 10;

  return (
    <motion.div
      data-slot="calendar-weeks"
      // Clipped while the height springs, so a taller month leaving sideways
      // never spills below. Stacked months travel a whole slot vertically
      // through this box: a clip would slice them flat, so the strip's soft
      // mask is their only edge.
      className={cn("relative grid", clip && !grid.stacked && "[overflow-y:clip]")}
      style={{ height }}
    >
      <AnimatePresence initial={false} custom={grid.direction}>
        <WeeksPanel
          key={key}
          monthTime={key}
          className={className}
          style={style}
          offset={offset}
          stride={grid.stride}
          onHeight={onHeight}
        >
          {children}
        </WeeksPanel>
      </AnimatePresence>
    </motion.div>
  );
}

function WeeksPanel({
  className,
  style,
  children,
  monthTime,
  offset,
  stride,
  onHeight,
}: {
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
  monthTime: number;
  offset: number;
  stride: number | null;
  onHeight: (h: number, monthTime: number) => void;
}) {
  const present = useIsPresent();
  const cal = useCalendarContext();
  const month = useContext(MonthContext);
  const { formatters, labels } = useDayPicker();
  const { direction, stacked, sharedRows } = useGridContext();
  const shownElsewhere = useShownElsewhere(monthTime, present, stride);
  const ref = useRef<HTMLDivElement>(null);
  // Side by side, the weekday row travels with its days, so a slide moves
  // each month as one block instead of sliding days under fixed labels. Known
  // before the stride is measured, so the row is there on the first paint.
  const side = !stacked;
  const firstWeek = month?.calendarMonth.weeks[0]?.days ?? [];
  useIsoLayoutEffect(() => {
    const el = ref.current;
    if (!el || !present) return;
    onHeight(el.offsetHeight, monthTime);
    if (typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(() => onHeight(el.offsetHeight, monthTime));
    ro.observe(el);
    return () => ro.disconnect();
  }, [present, onHeight, monthTime]);
  return (
    <PanelPresentContext.Provider value={present}>
      <motion.div
        ref={ref}
        role="rowgroup"
        aria-hidden={present ? undefined : true}
        className={cn(
          "col-start-1 row-start-1 flex flex-col self-start",
          !present && "pointer-events-none",
          shownElsewhere && "invisible",
          className
        )}
        style={style}
        variants={slideVariants(offset, stride, stacked ? "y" : "x", cal.numberOfMonths === 1)}
        custom={direction}
        initial="enter"
        animate="center"
        exit="exit"
      >
        {side && (
          // The grid's column headers, as DayPicker's own row would give.
          <div role="row" {...{ [INERT_ATTR]: "" }} className="flex">
            {cal.showWeekNumber && (
              <span
                role="columnheader"
                aria-label={labels.labelWeekNumberHeader?.()}
                className="w-[calc(var(--cell-size)*0.75)] shrink-0"
              />
            )}
            {firstWeek.map((day) => (
              <WeekdayCell
                key={day.isoDate}
                label={labels.labelWeekday(day.date, day.dateLib.options, day.dateLib)}
              >
                {formatters.formatWeekdayName(day.date, day.dateLib.options, day.dateLib)}
              </WeekdayCell>
            ))}
          </div>
        )}
        {side && sharedRows !== null && !cal.fill ? (
          // Every month takes the taller month's height, so neither resizes
          // in the middle of a sideways slide.
          <div
            className="flex flex-col"
            style={{ minHeight: `calc(var(--cell-size) * ${sharedRows})` }}
          >
            {children}
          </div>
        ) : (
          children
        )}
      </motion.div>
    </PanelPresentContext.Provider>
  );
}

function Week({ className, style, children }: WeekProps) {
  return (
    <div role="row" className={cn("flex", className)} style={style}>
      {children}
    </div>
  );
}

function WeekNumber({ className, style, children, ...props }: WeekNumberProps) {
  const cal = useCalendarContext();
  return (
    <div
      role="rowheader"
      aria-label={(props as { "aria-label"?: string })["aria-label"]}
      {...{ [INERT_ATTR]: "" }}
      className={cn(
        "flex w-[calc(var(--cell-size)*0.75)] shrink-0 items-center justify-center tabular-nums text-muted-foreground opacity-60",
        cal.fill ? "max-h-[var(--cell-size)]" : "h-[var(--cell-size)]",
        typeClass("caption", cal.compact ? "compact" : "default"),
        className
      )}
      style={style}
    >
      {children}
    </div>
  );
}

/**
 * One gridcell. Draws its slice of the range band: from its center to the
 * edge facing the rest of the range, full width in the middle. Where a week
 * row (or a month, when outside days are hidden) ends, the band gets 2px
 * corners, and 0 on any corner whose row above or below continues the band
 * at that edge, so stacked rows read as one block.
 */
function Day({ day, modifiers, className, style, children, ...props }: DayProps) {
  const cal = useCalendarContext();
  const grid = useGridContext();
  const month = useContext(MonthContext);
  const n = dayNumber(day.date);
  const visible = !modifiers.hidden;
  const nextDay = addDays(day.date, 1);
  const lastOfMonth = nextDay.getMonth() !== day.date.getMonth();
  const firstOfMonth = day.date.getDate() === 1;

  // Whether the day `m` is drawn in this grid with band reaching its left or
  // right edge: the row above or below then touches this corner.
  const weeks = month?.calendarMonth.weeks;
  const gridFirst = weeks?.[0]?.days[0] ? dayNumber(weeks[0].days[0].date) : n;
  const lastWeek = weeks?.[weeks.length - 1]?.days;
  const gridLast = lastWeek?.length ? dayNumber(lastWeek[lastWeek.length - 1].date) : n;
  // The column, read off the grid itself: every week row starts on the
  // week's first day (outside days included, hidden or not), whatever
  // weekStartsOn, locale or ISO numbering decided that day is.
  const weekday = (((n - gridFirst) % 7) + 7) % 7;
  const drawn = (m: number) => {
    if (m < gridFirst || m > gridLast) return false;
    if (!cal.outsideHidden || !month) return true;
    const d = addDays(day.date, m - n);
    return d.getMonth() === month.calendarMonth.date.getMonth();
  };
  const corner = (edge: boolean, touching: boolean) => (edge && !touching ? "2px" : 0);
  // This cell's slice of a band (the live one, or a fading ghost), or null.
  const slice = (band: { from: number; to: number } | null): CSSProperties | null => {
    if (!band || !visible || band.from === band.to || n < band.from || n > band.to) return null;
    const edgeLeft = n > band.from && (weekday === 0 || (firstOfMonth && cal.outsideHidden));
    const edgeRight = n < band.to && (weekday === 6 || (lastOfMonth && cal.outsideHidden));
    const atLeft = (m: number) => drawn(m) && m > band.from && m <= band.to;
    const atRight = (m: number) => drawn(m) && m >= band.from && m < band.to;
    return {
      left: n > band.from ? 0 : "50%",
      right: n < band.to ? 0 : "50%",
      borderTopLeftRadius: corner(edgeLeft, atLeft(n - 7)),
      borderBottomLeftRadius: corner(edgeLeft, atLeft(n + 7)),
      borderTopRightRadius: corner(edgeRight, atRight(n - 7)),
      borderBottomRightRadius: corner(edgeRight, atRight(n + 7)),
    };
  };
  const bandSlice = slice(grid.band);
  const ghost = grid.ghost;
  const ghostSlice = slice(ghost);
  const ghostEnd = !!ghost && visible && (n === ghost.from || n === ghost.to);

  return (
    <div
      role="gridcell"
      aria-selected={(props as { "aria-selected"?: boolean })["aria-selected"]}
      aria-label={(props as { "aria-label"?: string })["aria-label"]}
      data-day={(props as { "data-day"?: string })["data-day"]}
      data-today={modifiers.today || undefined}
      data-outside={day.outside || undefined}
      data-hidden={modifiers.hidden || undefined}
      className={cn(
        "relative flex items-center justify-center p-0",
        cal.fill
          ? "aspect-square max-h-[var(--cell-size)] min-w-0 flex-1"
          : "size-[var(--cell-size)]",
        className
      )}
      style={style}
    >
      {/* The range a new pick replaced: its band slice and filled ends fade
          out together on the moderate exit, under everything live. Its own
          presence scope: the month panel's initial={false} would otherwise
          skip the starting opacity and mount it already faded. */}
      <AnimatePresence>
        {(ghostSlice || ghostEnd) && (
          <motion.span
            key={ghost!.id}
            aria-hidden
            data-slot="calendar-range-ghost"
            className="pointer-events-none absolute inset-0 flex items-center justify-center"
            initial={{ opacity: 1 }}
            animate={{ opacity: 0 }}
            transition={spring.moderate.exit}
          >
            {ghostSlice && <span className="absolute inset-y-0 bg-hover" style={ghostSlice} />}
            {ghostEnd && (
              <span
                className={cn(
                  "relative bg-foreground",
                  cal.fill ? "aspect-square h-full max-w-full" : "size-[var(--cell-size)]",
                  cal.pill ? "rounded-full" : "rounded-lg"
                )}
              />
            )}
          </motion.span>
        )}
      </AnimatePresence>
      {bandSlice && (
        <span
          aria-hidden
          data-slot="calendar-range-band"
          // The hover fill: a long band reads heavier than a small one, so it
          // takes the lightest token; the highlight over it stacks a step up.
          className="pointer-events-none absolute inset-y-0 bg-hover"
          style={bandSlice}
        />
      )}
      {children}
    </div>
  );
}

function DayButton({ day, modifiers, className, style, children, ...props }: DayButtonProps) {
  const cal = useCalendarContext();
  const grid = useGridContext();
  const present = useContext(PanelPresentContext);
  const ref = useRef<HTMLButtonElement>(null);

  // DayPicker moves focus by flagging the day; the button takes it.
  useEffect(() => {
    if (modifiers.focused && present) ref.current?.focus();
  }, [modifiers.focused, present]);

  const n = dayNumber(day.date);
  const index = n - grid.gridStart;
  // Outside days and a grid sliding out stay out of the hover scope.
  useRegisterFluidHoverItem(present && !day.outside ? grid.registerItem : undefined, index, ref);

  const band = grid.band;
  const isEnd =
    cal.mode === "single"
      ? cal.selectedDay === n
      : (!!cal.range?.from && dayNumber(cal.range.from) === n) ||
        (!!cal.range?.to && !cal.picking && dayNumber(cal.range.to) === n);
  const isPreviewEnd = cal.picking && grid.previewEnd === n && !(cal.range?.from && dayNumber(cal.range.from) === n);
  const inMiddle = !!band && n > band.from && n < band.to;
  const booked = !!modifiers.booked;
  const unavailable = !!modifiers.disabled;
  const compact = cal.compact;
  // Optional content under the number (a price). Outside days skip it.
  // Memoized per day: the grid re-renders every day on each pointer move
  // while a range is picked, and the caller's function needn't run then.
  const { dayDetail } = cal;
  const detail = useMemo(
    () => (!day.outside && dayDetail ? dayDetail(day.date) : null),
    // day.date is a new Date each render; its day number is the identity.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [dayDetail, n, day.outside]
  );
  const hasDetail = detail !== null && detail !== undefined && detail !== false && detail !== "";
  // Read after the date, whatever the detail is (text or a styled node).
  const detailId = useId();

  return (
    <button
      ref={ref}
      {...props}
      aria-describedby={hasDetail ? detailId : undefined}
      tabIndex={present ? props.tabIndex : -1}
      {...{ [INDEX_ATTR]: day.outside ? undefined : index }}
      {...(unavailable ? { [INERT_ATTR]: "" } : {})}
      data-selected={isEnd || undefined}
      data-range-middle={inMiddle || undefined}
      data-booked={booked || undefined}
      data-unavailable={unavailable || undefined}
      data-preview-end={isPreviewEnd || undefined}
      className={cn(
        "relative z-[2] flex items-center justify-center p-0 outline-none select-none tabular-nums",
        hasDetail && "flex-col gap-2",
        // While a range end is being picked the fill is the gliding
        // highlight's: cells only swap their number's color, faded over the
        // highlight's arrival so the number never shows on the wrong fill.
        cal.picking
          ? "transition-[color] duration-80"
          : grid.committedEnd === n
            ? // The click that commits the end takes over the highlight's
              // fill in the same frame: a fade would flash an empty cell.
              "transition-none"
            : "transition-[color,background-color,font-variation-settings] duration-80",
        cal.fill ? "aspect-square h-full max-w-full" : "size-[var(--cell-size)]",
        cal.pill ? "rounded-full" : "rounded-lg",
        typeClass("body", compact ? "compact" : "default"),
        isEnd
          ? "bg-foreground text-background"
          : isPreviewEnd
            ? "cursor-pointer text-background"
            : unavailable
            ? cn("cursor-default text-muted-foreground opacity-50", booked && "line-through")
            : day.outside
              ? "cursor-pointer text-muted-foreground opacity-60"
              : "cursor-pointer text-foreground",
        className
      )}
      style={{
        ...style,
        // Selection never changes weight; only today is semibold.
        fontVariationSettings: modifiers.today ? fontWeights.semibold : fontWeights.normal,
      }}
    >
      <span className="[text-box:trim-both_cap_alphabetic]">{children}</span>
      {hasDetail && (
        <span
          id={detailId}
          data-slot="calendar-day-detail"
          className={cn(
            "whitespace-nowrap [text-box:trim-both_cap_alphabetic]",
            typeClass("caption", compact ? "compact" : "default"),
            // Quieter than the number. On a filled day it takes the fill's
            // text color with the number, overriding any color the caller
            // gave it, so a colored price never vanishes on the fill.
            isEnd || isPreviewEnd
              ? "[&_*]:!text-current"
              : !unavailable && "text-muted-foreground"
          )}
          style={{ fontVariationSettings: fontWeights.normal }}
        >
          {detail}
        </span>
      )}
      {/* With a detail under it, today is marked by its weight alone. */}
      {modifiers.today && !hasDetail && (
        <span
          aria-hidden
          data-slot="calendar-today-dot"
          className="absolute bottom-[14%] left-1/2 size-1 -translate-x-1/2 rounded-full bg-current"
        />
      )}
    </button>
  );
}

function Root(props: { rootRef?: React.Ref<HTMLDivElement> } & HTMLAttributes<HTMLDivElement>) {
  return <div data-slot="calendar" {...omit(props, ["rootRef"])} />;
}

const components: Partial<CustomComponents> = {
  Root: Root as CustomComponents["Root"],
  Months: Months as CustomComponents["Months"],
  Month: Month as CustomComponents["Month"],
  MonthCaption: MonthCaption as CustomComponents["MonthCaption"],
  MonthGrid: MonthGrid as unknown as CustomComponents["MonthGrid"],
  Weekdays: Weekdays as unknown as CustomComponents["Weekdays"],
  Weekday: Weekday as unknown as CustomComponents["Weekday"],
  WeekNumberHeader: WeekNumberHeader as unknown as CustomComponents["WeekNumberHeader"],
  Weeks: Weeks as unknown as CustomComponents["Weeks"],
  Week: Week as unknown as CustomComponents["Week"],
  WeekNumber: WeekNumber as unknown as CustomComponents["WeekNumber"],
  Day: Day as unknown as CustomComponents["Day"],
  DayButton: DayButton as CustomComponents["DayButton"],
};

// ---------------------------------------------------------------------------
// Calendar (root)
// ---------------------------------------------------------------------------

type PassThrough = Omit<
  DayPickerProps,
  | "mode"
  | "selected"
  | "onSelect"
  | "required"
  | "disabled"
  | "numberOfMonths"
  | "showOutsideDays"
  | "animate"
  | "min"
  | "max"
  | "excludeDisabled"
  | "resetOnSelect"
>;

interface CalendarBaseProps extends PassThrough {
  /** Days that are taken: unavailable, struck through, and announced as
   *  booked. Any DayPicker matcher. */
  booked?: Matcher | Matcher[];
  /** When set, every day it does NOT match is unavailable. */
  available?: Matcher | Matcher[];
  /** Days that can't be picked (`{ before: today }` for the past). */
  disabled?: Matcher | Matcher[];
  /** 1 or 2 months side by side or stacked. */
  numberOfMonths?: 1 | 2;
  /** Two months: side by side, stacked, or side by side when the container
   *  fits both. Default "auto". */
  orientation?: CalendarOrientation;
  /** Cell size in px. Default 36, or 32 at the compact size. */
  cellSize?: number;
  /**
   * Extra content under each day's number, such as a price: return a short
   * string or node, or null for none. Set a taller `cellSize` (56 and up) to
   * give it room. Screen readers read it after the date (aria-describedby).
   * Keep it a pure function of the date: its result is memoized per day
   * until the function itself changes, so data it reads from outside (a ref,
   * a mutated map) needs a new function to show up.
   */
  dayDetail?: (date: Date) => ReactNode;
  /** Stretch the columns to the container's width; `cellSize` then caps
   *  the row height. */
  fill?: boolean;
  /** Days of the neighbouring months. Default true for 1 month, always off
   *  for 2 so no date shows twice. */
  showOutsideDays?: boolean;
  /** Pins the calendar to one step of the size ladder. */
  size?: SizeVariant;
}

interface CalendarSingleProps extends CalendarBaseProps {
  mode?: "single";
  selected?: Date | undefined;
  onSelect?: (date: Date | undefined) => void;
  required?: boolean;
}

interface CalendarRangeProps extends CalendarBaseProps {
  mode: "range";
  selected?: DateRange | undefined;
  onSelect?: (range: DateRange | undefined) => void;
  required?: boolean;
  /** Fewest nights a range may span. */
  min?: number;
  /** Most nights a range may span. */
  max?: number;
}

type CalendarProps = CalendarSingleProps | CalendarRangeProps;

function Calendar(props: CalendarProps) {
  const {
    mode = "single",
    selected: selectedProp,
    onSelect,
    booked,
    available,
    disabled,
    numberOfMonths = 1,
    orientation = "auto",
    cellSize: cellSizeProp,
    dayDetail,
    fill = false,
    showOutsideDays: showOutsideDaysProp,
    size,
    showWeekNumber,
    weekStartsOn,
    ISOWeek: ISOWeekProp,
    labels: labelsProp,
    formatters: formattersProp,
    className,
    style,
    autoFocus,
    ...rest
  } = props as CalendarBaseProps & {
    mode?: "single" | "range";
    selected?: Date | DateRange;
    onSelect?: (value: Date | DateRange | undefined) => void;
  };
  const sizeClasses = useSize(size);
  const compact = sizeClasses.variant === "compact";
  const shape = useShape();
  const cellSize = cellSizeProp ?? (compact ? 32 : 36);
  const twoMonths = numberOfMonths > 1;
  const showOutsideDays = twoMonths ? false : (showOutsideDaysProp ?? true);

  // Controlled like DayPicker: an `onSelect` makes `selected` the source of
  // truth; without one, `selected` only seeds internal state.
  const [internal, setInternal] = useState<Date | DateRange | undefined>(selectedProp);
  const value = onSelect ? selectedProp : internal;
  const range = mode === "range" ? (value as DateRange | undefined) : undefined;
  const picking = mode === "range" && !!range?.from && !range.to;
  // The range in place before a pick started, for Escape to restore.
  const beforePickRef = useRef<DateRange | undefined>(undefined);

  const commit = useCallback(
    (next: Date | DateRange | undefined) => {
      if (!onSelect) setInternal(next);
      onSelect?.(next);
    },
    [onSelect]
  );

  const matchers = useMemo(
    () => resolveDayMatchers({ booked, available, disabled }),
    [booked, available, disabled]
  );

  const labels = useMemo<Partial<Labels>>(
    () => ({
      labelDayButton: (date, modifiers: Modifiers, options, dateLib) => {
        const base = labelDayButton(date, modifiers, options, dateLib);
        return modifiers.booked ? `${base}, booked` : base;
      },
      ...labelsProp,
    }),
    [labelsProp]
  );

  // Week numbers read like the day numbers beside them: 1, not 01.
  const formatters = useMemo<Partial<Formatters>>(
    () => ({ formatWeekNumber: (n: number) => String(n), ...formattersProp }),
    [formattersProp]
  );

  // "auto": side by side when the container fits both months, stacked
  // otherwise. The width two months need is known from the cell size, so
  // the decision is one comparison per container resize.
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [fits, setFits] = useState(true);
  const neededWidth =
    (7 + (showWeekNumber ? WEEK_COL_RATIO : 0)) * cellSize * 2 + MONTH_GAP + CALENDAR_PAD * 2;
  useIsoLayoutEffect(() => {
    if (orientation !== "auto" || !twoMonths) return;
    const parent = wrapperRef.current?.parentElement;
    if (!parent || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(() => {
      const cs = getComputedStyle(parent);
      const width =
        parent.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
      setFits(width >= neededWidth);
    });
    ro.observe(parent);
    return () => ro.disconnect();
  }, [orientation, twoMonths, neededWidth]);
  const resolvedOrientation: "horizontal" | "vertical" =
    orientation === "auto" ? (fits ? "horizontal" : "vertical") : orientation;

  const ctx = useMemo<CalendarContextValue>(
    () => ({
      compact,
      fill,
      pill: shape.variant === "pill",
      mode,
      selectedDay:
        mode === "single" && value instanceof Date ? dayNumber(value) : null,
      range,
      picking,
      disabledMatchers: matchers.disabled,
      orientation: resolvedOrientation,
      numberOfMonths,
      outsideHidden: !showOutsideDays,
      showWeekNumber: !!showWeekNumber,
      autoFocus: !!autoFocus,
      navHidden: !!rest.hideNavigation || !!rest.disableNavigation,
      dayDetail,
    }),
    [compact, fill, shape.variant, mode, value, range, picking, matchers.disabled, resolvedOrientation, numberOfMonths, showOutsideDays, showWeekNumber, autoFocus, rest.hideNavigation, rest.disableNavigation, dayDetail]
  );

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    // Escape before the second pick puts the previous range back.
    if (e.key === "Escape" && picking) {
      e.stopPropagation();
      commit(beforePickRef.current);
    }
  };

  const ISOWeek = resolveWeekNumbering(showWeekNumber, weekStartsOn, ISOWeekProp);

  const shared = {
    ...rest,
    numberOfMonths,
    showOutsideDays,
    showWeekNumber,
    weekStartsOn,
    ISOWeek,
    autoFocus,
    labels,
    formatters,
    hideNavigation: true,
    disabled: matchers.disabled,
    modifiers: { ...matchers.modifiers, ...rest.modifiers },
    components: { ...components, ...rest.components },
    // bg-inherit passes the surface down to the stacked weekday row.
    className: cn("bg-inherit p-2", fill && "w-full", className),
  };

  const picker =
    mode === "range" ? (
      <DayPicker
        {...(shared as Omit<DayPickerProps, "mode">)}
        mode="range"
        selected={range}
        excludeDisabled
        resetOnSelect
        required={(props as CalendarRangeProps).required as false | undefined}
        min={(props as CalendarRangeProps).min}
        max={(props as CalendarRangeProps).max}
        onSelect={(next: DateRange | undefined) => {
          if (next?.from && !next.to && !picking) beforePickRef.current = range;
          commit(next);
        }}
      />
    ) : (
      <DayPicker
        {...(shared as Omit<DayPickerProps, "mode">)}
        mode="single"
        selected={value instanceof Date ? value : undefined}
        required={(props as CalendarSingleProps).required as false | undefined}
        onSelect={(next: Date | undefined) => commit(next)}
      />
    );

  return (
    <CalendarContext.Provider value={ctx}>
      <div
        ref={wrapperRef}
        data-slot="calendar-root"
        className={cn("rounded-[inherit] bg-inherit", fill ? "w-full" : "w-fit")}
        style={{ "--cell-size": `${cellSize}px`, ...style } as CSSProperties}
        onKeyDown={handleKeyDown}
      >
        {picker}
      </div>
    </CalendarContext.Provider>
  );
}

Calendar.displayName = "Calendar";

export { Calendar };
export type { CalendarProps, CalendarSingleProps, CalendarRangeProps, CalendarOrientation, DateRange, Matcher };
