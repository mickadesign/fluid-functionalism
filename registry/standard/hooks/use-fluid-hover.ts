"use client";

import {
  useRef,
  useState,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useSyncExternalStore,
  type Dispatch,
  type RefObject,
  type SetStateAction,
} from "react";

// ---------------------------------------------------------------------------
// Standard hover: the same API as fluid hover, without the glide. The item
// under the pointer lights and nothing else does: no nearest item across
// empty space, no clicks routed from a gap, no highlight travelling between
// rows. Items are still measured, because the components draw their focus
// rings and selected fills from these rects.
// ---------------------------------------------------------------------------

export interface ItemRect {
  top: number;
  height: number;
  left: number;
  width: number;
}

export interface UseFluidHoverOptions {
  /** Kept for API parity with fluid hover. Standard hover lights the item
   *  under the pointer, so the axis has nothing to resolve. */
  axis?: "x" | "y" | "xy";
  /**
   * Makes an item invisible to hit-testing without unregistering it, for
   * rows that stay mounted while clipped away (a collapsed sub-tree).
   */
  isItemDisabled?: (element: HTMLElement) => boolean;
  /** Kept for API parity. Nothing is lit between items, so no click is
   *  routed from a gap. */
  gapClick?: boolean | { maxDistance?: number };
  /** Kept for API parity. Empty space never lights an item. */
  nearest?: boolean;
}

/** The highlighted index as a store rows subscribe to through
 *  `useFluidHoverSelect`, so a change re-renders only the rows it touches. */
export interface FluidHoverActiveStore {
  subscribe: (listener: () => void) => () => void;
  get: () => number | null;
}

export interface UseFluidHoverReturn {
  activeIndex: number | null;
  setActiveIndex: Dispatch<SetStateAction<number | null>>;
  /** `activeIndex` as a stable store, for rows (see `useFluidHoverSelect`). */
  activeStore: FluidHoverActiveStore;
  itemRects: ItemRect[];
  /** True once every registered item has been measured and no remeasure is
   *  pending. Gate absolutely positioned overlays on it. */
  isMeasured: boolean;
  /** Counts pointer entries into the container. */
  session: number;
  /** The same count as `session`, for code that reads it outside a render. */
  sessionRef: RefObject<number>;
  handlers: {
    /** Lights the item under the pointer, or none. Moves that happened in a
     *  portalled child (a row's own dropdown) are ignored. */
    onMouseMove: (e: React.MouseEvent) => void;
    onMouseEnter: () => void;
    onMouseLeave: () => void;
    /** Kept for API parity: a click between items stays where it landed. */
    onClick: (e: React.MouseEvent) => void;
  };
  registerItem: (index: number, element: HTMLElement | null) => void;
  /** Invalidates the published rects and measures again on the next frame,
   *  holding `isMeasured` false until it settles. */
  remeasure: () => void;
  /** Re-reads the rects synchronously, keeping `isMeasured` as it is. */
  measureItems: () => void;
}

/**
 * Whether an event happened inside the element whose handler hears it.
 * React bubbles events from portalled children through their React
 * ancestors; a bare point with no target counts as the list's own.
 */
export function isOwnEvent(e: { currentTarget?: EventTarget | null; target?: EventTarget | null }) {
  const { currentTarget, target } = e;
  if (!(currentTarget instanceof Node) || !(target instanceof Node)) return true;
  return currentTarget.contains(target);
}

/** Set on the highlighted item (boolean attribute). */
export const ACTIVE_ATTR = "data-fluid-hover-active";
/** Set on the container: the highlighted index, or absent. */
export const ACTIVE_INDEX_ATTR = "data-fluid-hover-active-index";

const useIsoLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

/** Frames a remeasure retries while the items still have no layout box (a
 *  popup in the DOM a frame before it is laid out). */
const measurementAttempts = 3;

const noop = () => {};

export function useFluidHover<T extends HTMLElement>(
  containerRef: RefObject<T | null>,
  options: UseFluidHoverOptions = {}
): UseFluidHoverReturn {
  const { isItemDisabled } = options;
  const itemsRef = useRef(new Map<number, HTMLElement>());
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const activeIndexRef = useRef<number | null>(null);
  const listenersRef = useRef(new Set<() => void>());
  const activeStore = useMemo<FluidHoverActiveStore>(
    () => ({
      subscribe: (listener) => {
        listenersRef.current.add(listener);
        return () => {
          listenersRef.current.delete(listener);
        };
      },
      get: () => activeIndexRef.current,
    }),
    []
  );
  useIsoLayoutEffect(() => {
    activeIndexRef.current = activeIndex;
    listenersRef.current.forEach((listener) => listener());
  }, [activeIndex]);

  // The state, in the DOM: the highlighted item carries the attribute, the
  // container the index. Components style lit rows from it.
  useEffect(() => {
    const container = containerRef.current;
    const items = itemsRef.current;
    if (activeIndex === null) container?.removeAttribute(ACTIVE_INDEX_ATTR);
    else container?.setAttribute(ACTIVE_INDEX_ATTR, String(activeIndex));
    const active = activeIndex === null ? undefined : items.get(activeIndex);
    active?.setAttribute(ACTIVE_ATTR, "");
    return () => {
      active?.removeAttribute(ACTIVE_ATTR);
      if (activeIndex !== null) items.get(activeIndex)?.removeAttribute(ACTIVE_ATTR);
    };
  }, [activeIndex, containerRef]);

  const [itemRects, setItemRects] = useState<ItemRect[]>([]);
  const [isMeasured, setIsMeasured] = useState(false);
  const itemRectsRef = useRef<ItemRect[]>([]);
  const [session, setSession] = useState(0);
  const sessionRef = useRef(0);
  const remeasureRafIdRef = useRef<number | null>(null);

  /** Publishes a rect for every registered item, in the container's layout
   *  space (offsets, so a scaling popup doesn't skew them). Returns false,
   *  publishing nothing, while an item has no layout box. */
  const runMeasurement = useCallback(() => {
    const container = containerRef.current;
    if (!container) return false;
    const rects: ItemRect[] = [];
    let everyItemHasLayout = true;
    itemsRef.current.forEach((element, index) => {
      if (element.offsetParent === null && element.offsetWidth === 0 && element.offsetHeight === 0) {
        everyItemHasLayout = false;
        return;
      }
      let top = element.offsetTop;
      let left = element.offsetLeft;
      let ancestor = element.offsetParent as HTMLElement | null;
      while (ancestor && ancestor !== container && container.contains(ancestor)) {
        top += ancestor.offsetTop + ancestor.clientTop;
        left += ancestor.offsetLeft + ancestor.clientLeft;
        ancestor = ancestor.offsetParent as HTMLElement | null;
      }
      rects[index] = { top, height: element.offsetHeight, left, width: element.offsetWidth };
    });
    if (!everyItemHasLayout) return false;
    const prev = itemRectsRef.current;
    let changed = prev.length !== rects.length;
    for (let i = 0; !changed && i < rects.length; i++) {
      const p = prev[i];
      const r = rects[i];
      if (p === r) continue;
      changed =
        !p || !r || p.top !== r.top || p.left !== r.left || p.width !== r.width || p.height !== r.height;
    }
    if (changed) {
      itemRectsRef.current = rects;
      setItemRects(rects);
    }
    return true;
  }, [containerRef]);

  const measureItems = useCallback(() => {
    runMeasurement();
  }, [runMeasurement]);

  // Every trigger (registration, resize) coalesces into one pass on the
  // next frame, the only place readiness is reported.
  const scheduleMeasurement = useCallback(
    (attempts: number) => {
      const attempt = (attemptsLeft: number) => {
        if (remeasureRafIdRef.current !== null) cancelAnimationFrame(remeasureRafIdRef.current);
        remeasureRafIdRef.current = requestAnimationFrame(() => {
          remeasureRafIdRef.current = null;
          if (runMeasurement()) setIsMeasured(true);
          else if (attemptsLeft > 1) attempt(attemptsLeft - 1);
        });
      };
      attempt(attempts);
    },
    [runMeasurement]
  );

  const remeasure = useCallback(() => {
    setIsMeasured(false);
    scheduleMeasurement(measurementAttempts);
  }, [scheduleMeasurement]);

  // Rows that change size in place invalidate the rects too.
  const itemRoRef = useRef<ResizeObserver | null>(null);
  const getItemRo = useCallback(() => {
    if (itemRoRef.current === null && typeof ResizeObserver !== "undefined") {
      itemRoRef.current = new ResizeObserver(() => scheduleMeasurement(measurementAttempts));
    }
    return itemRoRef.current;
  }, [scheduleMeasurement]);

  const registerItem = useCallback(
    (index: number, element: HTMLElement | null) => {
      if (element) {
        itemsRef.current.set(index, element);
        getItemRo()?.observe(element);
        if (index === activeIndexRef.current) element.setAttribute(ACTIVE_ATTR, "");
      } else {
        const previous = itemsRef.current.get(index);
        if (previous) itemRoRef.current?.unobserve(previous);
        previous?.removeAttribute(ACTIVE_ATTR);
        itemsRef.current.delete(index);
        // The lit row is gone: nothing stays lit until the pointer moves.
        if (index === activeIndexRef.current) {
          setActiveIndex((current) =>
            current === index && !itemsRef.current.has(index) ? null : current
          );
        }
      }
      remeasure();
    },
    [remeasure, getItemRo]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isOwnEvent(e)) return;
      const target = e.target as Node;
      // The item under the pointer, or none. Items can nest (a sidebar row's
      // sub-rows sit inside it): the innermost one wins.
      let next: number | null = null;
      let hit: HTMLElement | null = null;
      for (const [index, el] of itemsRef.current) {
        if (!el.contains(target) || isItemDisabled?.(el)) continue;
        if (!hit || hit.contains(el)) {
          hit = el;
          next = index;
        }
      }
      setActiveIndex(next);
    },
    [isItemDisabled]
  );

  const handleMouseEnter = useCallback(() => {
    sessionRef.current += 1;
    setSession(sessionRef.current);
  }, []);

  const handleMouseLeave = useCallback(() => setActiveIndex(null), []);

  // Remeasure when the container resizes: a reflow moves items even though
  // the registered set is unchanged.
  useEffect(() => {
    const container = containerRef.current;
    if (!container || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(() => scheduleMeasurement(measurementAttempts));
    ro.observe(container);
    return () => ro.disconnect();
  }, [containerRef, scheduleMeasurement]);

  useEffect(() => {
    return () => {
      if (remeasureRafIdRef.current !== null) cancelAnimationFrame(remeasureRafIdRef.current);
      itemRoRef.current?.disconnect();
      itemRoRef.current = null;
    };
  }, []);

  return {
    activeIndex,
    setActiveIndex,
    activeStore,
    itemRects,
    isMeasured,
    session,
    sessionRef,
    handlers: {
      onMouseMove: handleMouseMove,
      onMouseEnter: handleMouseEnter,
      onMouseLeave: handleMouseLeave,
      onClick: noop,
    },
    registerItem,
    remeasure,
    measureItems,
  };
}

const subscribeNever = () => () => {};

/**
 * Reads one value derived from the highlighted index, re-rendering only when
 * that value changes. The selector must return a primitive.
 */
export function useFluidHoverSelect<T>(
  store: FluidHoverActiveStore | null | undefined,
  select: (activeIndex: number | null) => T
): T {
  return useSyncExternalStore(
    store?.subscribe ?? subscribeNever,
    () => select(store ? store.get() : null),
    () => select(null)
  );
}

/**
 * Registers an item's element with its list for as long as it is mounted.
 * Either argument may be missing for a row rendered outside a list; then
 * nothing is registered.
 */
export function useRegisterFluidHoverItem(
  registerItem: ((index: number, element: HTMLElement | null) => void) | undefined,
  index: number | undefined,
  ref: RefObject<HTMLElement | null>
) {
  useEffect(() => {
    if (!registerItem || index === undefined) return;
    registerItem(index, ref.current);
    return () => registerItem(index, null);
  }, [index, registerItem, ref]);
}
