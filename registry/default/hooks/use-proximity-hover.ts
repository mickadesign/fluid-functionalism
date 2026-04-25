"use client";

import { useRef, useState, useCallback, useEffect, type RefObject } from "react";

export interface ItemRect {
  top: number;
  height: number;
  left: number;
  width: number;
}

interface UseProximityHoverOptions {
  axis?: "x" | "y";
}

interface UseProximityHoverReturn {
  activeIndex: number | null;
  setActiveIndex: (index: number | null) => void;
  itemRects: ItemRect[];
  sessionRef: RefObject<number>;
  handlers: {
    onMouseMove: (e: React.MouseEvent) => void;
    onMouseEnter: () => void;
    onMouseLeave: () => void;
  };
  registerItem: (index: number, element: HTMLElement | null) => void;
  measureItems: () => void;
}

export function useProximityHover<T extends HTMLElement>(
  containerRef: RefObject<T | null>,
  options: UseProximityHoverOptions = {}
): UseProximityHoverReturn {
  const { axis = "y" } = options;
  const itemsRef = useRef(new Map<number, HTMLElement>());
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [itemRects, setItemRects] = useState<ItemRect[]>([]);
  const itemRectsRef = useRef<ItemRect[]>([]);
  const sessionRef = useRef(0);
  const rafIdRef = useRef<number | null>(null);

  const registerItem = useCallback(
    (index: number, element: HTMLElement | null) => {
      if (element) {
        itemsRef.current.set(index, element);
      } else {
        itemsRef.current.delete(index);
      }
    },
    []
  );

  const measureItems = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;
    const rects: ItemRect[] = [];
    itemsRef.current.forEach((element, index) => {
      // Use offset* instead of getBoundingClientRect so measurements are
      // unaffected by CSS transforms (e.g. scaleY animation on the parent
      // motion.div). offsetTop/offsetLeft are layout values relative to the
      // offsetParent (the scroll container), matching the coordinate space
      // used by `position: absolute` children.
      rects[index] = {
        top: element.offsetTop,
        height: element.offsetHeight,
        left: element.offsetLeft,
        width: element.offsetWidth,
      };
    });
    itemRectsRef.current = rects;
    setItemRects(rects);
  }, [containerRef]);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      const mouseX = e.clientX;
      const mouseY = e.clientY;

      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
      }

      rafIdRef.current = requestAnimationFrame(() => {
        rafIdRef.current = null;
        const container = containerRef.current;
        if (!container) return;

        const containerRect = container.getBoundingClientRect();
        const mousePos = axis === "x" ? mouseX : mouseY;

        let closestIndex: number | null = null;
        let closestDistance = Infinity;
        let containingIndex: number | null = null;

        const rects = itemRectsRef.current;
        // Convert content-relative rects to viewport coords using live scroll
        const scrollOffset = axis === "x" ? container.scrollLeft : container.scrollTop;
        const borderOffset = axis === "x" ? container.clientLeft : container.clientTop;
        const containerEdge = axis === "x" ? containerRect.left : containerRect.top;
        // Item rects are layout values (offset*); the container's bounding rect
        // reflects any cumulative ancestor transform: scale. Compute the scale
        // factor so we can map layout coords into the same visual viewport
        // space the mouse cursor lives in.
        const layoutSize = axis === "x" ? container.offsetWidth : container.offsetHeight;
        const visualSize = axis === "x" ? containerRect.width : containerRect.height;
        const scale = layoutSize > 0 ? visualSize / layoutSize : 1;

        for (let index = 0; index < rects.length; index++) {
          const r = rects[index];
          if (!r) continue;

          const contentPos = axis === "x" ? r.left : r.top;
          const itemStart = containerEdge + (borderOffset + contentPos - scrollOffset) * scale;
          const itemSize = (axis === "x" ? r.width : r.height) * scale;
          const itemEnd = itemStart + itemSize;

          if (mousePos >= itemStart && mousePos <= itemEnd) {
            containingIndex = index;
          }

          const itemCenter = itemStart + itemSize / 2;
          const distance = Math.abs(mousePos - itemCenter);

          if (distance < closestDistance) {
            closestDistance = distance;
            closestIndex = index;
          }
        }

        setActiveIndex(containingIndex ?? closestIndex);
      });
    },
    [axis, containerRef]
  );

  const handleMouseEnter = useCallback(() => {
    sessionRef.current += 1;
  }, []);

  const handleMouseLeave = useCallback(() => {
    if (rafIdRef.current !== null) {
      cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = null;
    }
    setActiveIndex(null);
  }, []);

  // Clean up rAF on unmount
  useEffect(() => {
    return () => {
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
      }
    };
  }, []);

  return {
    activeIndex,
    setActiveIndex,
    itemRects,
    sessionRef,
    handlers: {
      onMouseMove: handleMouseMove,
      onMouseEnter: handleMouseEnter,
      onMouseLeave: handleMouseLeave,
    },
    registerItem,
    measureItems,
  };
}

/**
 * Hook for child items to register themselves with the proximity hover system.
 * Call in useEffect with the item's ref and index.
 */
export function useRegisterProximityItem(
  registerItem: (index: number, element: HTMLElement | null) => void,
  index: number,
  ref: RefObject<HTMLElement | null>
) {
  useEffect(() => {
    registerItem(index, ref.current);
    return () => registerItem(index, null);
  }, [index, registerItem, ref]);
}
