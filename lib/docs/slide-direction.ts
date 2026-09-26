"use client";

import { useRef, useState } from "react";
import { spring } from "@/registry/default/lib/springs";

// Shared by the CarouselDots demos (doc page and home tile): slide state
// plus the direction of the last change, and the sideways label motion.

/** How far a slide's label travels sideways on a change, in px. */
const SLIDE_SHIFT = 24;

/** Direction-aware: forward (+1) comes in from the right and leaves to the
 *  left, back (-1) the other way. Pass the direction as `custom` on both the
 *  AnimatePresence and the label, so the leaving one moves the same way. */
export const slideVariants = {
  enter: (dir: number) => ({ opacity: 0, x: dir * SLIDE_SHIFT }),
  center: { opacity: 1, x: 0, transition: spring.moderate },
  exit: (dir: number) => ({ opacity: 0, x: -dir * SLIDE_SHIFT, transition: spring.moderate.exit }),
};

/** A dot picked by hand compares indices, so clicking back from the last
 *  dot to the first goes left; anything else (autoplay wrapping around)
 *  keeps moving forward. Spread `markByHand` on a wrapper around the dots. */
export function useSlideDirection() {
  const [state, setState] = useState({ slide: 0, direction: 1 });
  const byHand = useRef(false);
  const onValueChange = (next: number) => {
    // Read the flag now: React may run the updater after it is reset.
    const picked = byHand.current;
    byHand.current = false;
    setState(({ slide }) => ({
      slide: next,
      direction: picked ? (next > slide ? 1 : -1) : 1,
    }));
  };
  // Pointer or keyboard on the dots marks the next change as a pick.
  const markByHand = {
    onPointerDownCapture: () => {
      byHand.current = true;
    },
    onKeyDownCapture: () => {
      byHand.current = true;
    },
  };
  return { ...state, onValueChange, markByHand };
}
