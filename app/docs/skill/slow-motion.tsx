"use client";

import { createContext, useContext, useEffect, useRef, type RefObject } from "react";
import { MotionGlobalConfig, frameData } from "framer-motion";

// ---------------------------------------------------------------------------
// Slow motion for the /docs/skill hero, from 1x down to 0.1x.
//
// Framer Motion has no time scale, so this drives its clock by hand: with
// `useManualTiming` on, every JS-driven animation reads `frameData.timestamp`,
// which a rAF loop here advances by the real frame delta times the rate.
// Framer hands opacity/transform/filter to WAAPI, and CSS transitions (the
// weight change) are WAAPI too; those get `playbackRate`, scoped to the hero.
// Framer also stamps each WAAPI animation's `startTime` from its own clock,
// which falls behind real time once slowed, so the browser would think the
// animation had already ended. `animate()` is wrapped to translate that
// stamp back to real time; framer keeps its own copy, so its math holds.
// The clock is page-wide, so it only runs while the hero is mounted and
// gives control back to framer when the page unmounts.
// ---------------------------------------------------------------------------

const SpeedContext = createContext(1);
export const SpeedProvider = SpeedContext.Provider;

/** The hero's current rate, for scripts that wait on timers. */
export function useSpeed() {
  return useContext(SpeedContext);
}

/** A ref that always holds the latest rate, for loops that read it mid-run. */
export function useSpeedRef() {
  const speed = useSpeed();
  const ref = useRef(speed);
  ref.current = speed;
  return ref;
}

/** A frame longer than this is a stall (a throttled or backgrounded tab),
 *  not motion, so the clock skips it instead of leaping. A tight cap would
 *  slow everything down whenever frames arrive late. */
const MAX_FRAME_MS = 250;

export function useSlowMotion(rootRef: RefObject<HTMLElement | null>, rate: number) {
  const rateRef = useRef(rate);
  rateRef.current = rate;

  useEffect(() => {
    let last = performance.now();
    let virtual = last;
    frameData.timestamp = virtual;
    MotionGlobalConfig.useManualTiming = true;

    // Coming back to the tab, start counting from now.
    const onVisible = () => {
      if (!document.hidden) last = performance.now();
    };
    document.addEventListener("visibilitychange", onVisible);

    // Translate framer's startTime stamps into document time, and slow any
    // animation that starts inside the hero from its first frame.
    const startTime = Object.getOwnPropertyDescriptor(Animation.prototype, "startTime")!;
    const originalAnimate = Element.prototype.animate;
    Element.prototype.animate = function (this: Element, ...args: Parameters<Element["animate"]>) {
      const animation = originalAnimate.apply(this, args);
      Object.defineProperty(animation, "startTime", {
        configurable: true,
        get: () => startTime.get!.call(animation),
        set: (value: CSSNumberish | null) => {
          const offset = Number(document.timeline.currentTime) - frameData.timestamp;
          startTime.set!.call(animation, value == null ? value : Number(value) + offset);
        },
      });
      if (rootRef.current?.contains(this)) animation.playbackRate = rateRef.current;
      return animation;
    };

    let raf = 0;
    const tick = (now: number) => {
      const elapsed = now - last;
      const dt = elapsed > MAX_FRAME_MS ? 0 : elapsed;
      last = now;
      const r = rateRef.current;
      virtual += dt * r;
      frameData.delta = dt * r;
      frameData.timestamp = virtual;

      const root = rootRef.current;
      if (root) {
        for (const animation of root.getAnimations({ subtree: true })) {
          if (animation.playbackRate !== r) animation.playbackRate = r;
        }
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener("visibilitychange", onVisible);
      Element.prototype.animate = originalAnimate;
      MotionGlobalConfig.useManualTiming = false;
    };
  }, [rootRef]);
}
