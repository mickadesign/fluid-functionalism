"use client";

import { useEffect, useMemo, useRef, useState, type FocusEvent, type ReactNode, type RefObject, type SyntheticEvent } from "react";
import { animate, motion, useInView, useMotionValue, useReducedMotion, type MotionValue } from "motion/react";
import { cn } from "@/registry/default/lib/utils";
import { usePreviewPlayback } from "@/lib/docs/preview-playback";
import { useShape } from "@/registry/default/lib/shape-context";

/** Height of every example's frame, so switching tabs never moves the page.
 *  Matches the menu: 5 rows of 36px plus 8px padding top and bottom. */
export const FRAME_H = 196;

/** Mouse events the scripted cursor dispatches, so playback can tell them
 *  apart from a visitor's pointer. */
const scriptedEvents = new WeakSet<Event>();
const fromVisitor = (e: SyntheticEvent) => !scriptedEvents.has(e.nativeEvent);

/** Whether an example should play its script: on screen, motion allowed,
 *  and no visitor inside. A real pointer takes over until it leaves, and
 *  keyboard focus until it moves out, so the script never changes what
 *  someone is tabbing through. Only :focus-visible counts: a mouse click
 *  leaves focus on its button after the pointer has gone. */
export function usePlayback() {
  const rootRef = useRef<HTMLDivElement>(null);
  const inView = useInView(rootRef, { amount: 0.35 });
  const reduced = useReducedMotion();
  const playback = usePreviewPlayback();
  const [pointerInside, setPointerInside] = useState(false);
  const [keyboardInside, setKeyboardInside] = useState(false);
  const bind = {
    onMouseEnter: (e: SyntheticEvent) => fromVisitor(e) && setPointerInside(true),
    onMouseMove: (e: SyntheticEvent) => fromVisitor(e) && setPointerInside(true),
    onPointerDown: (e: SyntheticEvent) => fromVisitor(e) && setPointerInside(true),
    onMouseLeave: (e: SyntheticEvent) => fromVisitor(e) && setPointerInside(false),
    onFocus: (e: FocusEvent) => setKeyboardInside(e.target.matches(":focus-visible")),
    onBlur: (e: FocusEvent) => {
      if (!rootRef.current?.contains(e.relatedTarget)) setKeyboardInside(false);
    },
  };
  return { rootRef, playing: playback && inView && !reduced && !pointerInside && !keyboardInside, bind };
}

export type Side = "generic" | "skill";

/** A beat before the first step, so an example doesn't start mid-glance. */
const FIRST_STEP_MS = 400;

/** Loops `steps` while `playing`: each step fires its action, then waits its
 *  ms. Every script ends where it began, so the next pass starts clean.
 *  Pausing keeps the position, so the script resumes in place; `reset` then
 *  undoes whatever a step left mid-gesture (a button held down, a "Copied!"
 *  waiting to revert), so a visitor taking over finds the example at rest. */
export function useLoop(playing: boolean, steps: Array<{ ms: number; run: () => void }>, reset?: () => void) {
  const indexRef = useRef(0);
  const stepsRef = useRef(steps);
  stepsRef.current = steps;
  const resetRef = useRef(reset);
  resetRef.current = reset;

  useEffect(() => {
    if (!playing) return;
    let timer: ReturnType<typeof setTimeout>;
    const tick = () => {
      const list = stepsRef.current;
      const step = list[indexRef.current];
      step.run();
      indexRef.current = (indexRef.current + 1) % list.length;
      timer = setTimeout(tick, step.ms);
    };
    timer = setTimeout(tick, FIRST_STEP_MS);
    return () => {
      clearTimeout(timer);
      resetRef.current?.();
    };
  }, [playing]);
}

/** The scripted pointer: an arrow whose tip sits at (x, y), shrinking on a
 *  click. Shared by every example so they all point the same way. */
function FakeCursor({
  x,
  y,
  scale,
  opacity,
}: {
  x: MotionValue<number>;
  y: MotionValue<number>;
  scale: MotionValue<number>;
  opacity: MotionValue<number>;
}) {
  return (
    <motion.span
      aria-hidden
      // The arrow's tip sits 3px in from the SVG's corner.
      className="pointer-events-none absolute -left-[3px] -top-[3px] z-30 origin-top-left"
      style={{ x, y, scale, opacity }}
    >
      <svg width="18" height="18" viewBox="0 0 24 24">
        <path
          d="m4 4 7.07 17 2.51-7.39L21 11.07z"
          strokeWidth="1.5"
          strokeLinejoin="round"
          className="fill-foreground stroke-background"
        />
      </svg>
    </motion.span>
  );
}

/** How long the cursor takes to glide to its next target. */
const GLIDE_MS = 500;

/** How long the cursor rests on its target before it presses: long enough
 *  to read the hover it lands on, which on TabsSubtle is a faint pill that
 *  a quicker click would replace before anyone sees it. */
const HOVER_MS = 450;

export type Cursor = ReturnType<typeof useScriptCursor>;

/** Set on whatever the scripted cursor is over, and on its ancestors, the
 *  way the browser applies :hover. Script can't trigger :hover itself, so
 *  hover styles in the examples read `:is(:hover,[data-script-hover])`. */
const HOVER_ATTR = "data-script-hover";

/** A cursor that travels across a whole Compare, generic side to skill side,
 *  in its root's coordinates. `goto` glides it to the center of the
 *  `index`th match of `selector` inside the root; `click` plays the press.
 *  While `playing`, it hovers what it passes over like a real pointer: the
 *  element under its tip gets HOVER_ATTR for CSS, and the same mouseover,
 *  mouseout, and mousemove events a mouse sends, so hover driven by script
 *  (fluid hover) follows it too. */
export function useScriptCursor(rootRef: RefObject<HTMLDivElement | null>, playing: boolean) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const scale = useMotionValue(1);
  // Hidden until it has somewhere to be, so it never flashes at the corner.
  const opacity = useMotionValue(0);
  const placed = useRef(false);
  const hovered = useRef<Element | null>(null);

  useEffect(() => {
    const fire = (target: Element, type: string, related: Element | null, at: { x: number; y: number }) => {
      const event = new MouseEvent(type, {
        bubbles: true,
        cancelable: true,
        relatedTarget: related,
        clientX: at.x,
        clientY: at.y,
      });
      scriptedEvents.add(event);
      target.dispatchEvent(event);
    };
    const chain = (el: Element | null) => {
      const out: Element[] = [];
      for (let n = el; n && n !== rootRef.current; n = n.parentElement) out.push(n);
      return out;
    };
    const hoverTo = (next: Element | null, at: { x: number; y: number }) => {
      const prev = hovered.current;
      if (next === prev) return;
      chain(prev).forEach((n) => n.removeAttribute(HOVER_ATTR));
      chain(next).forEach((n) => n.setAttribute(HOVER_ATTR, ""));
      // React derives enter and leave from this pair, as it does for a mouse.
      if (prev) fire(prev, "mouseout", next, at);
      if (next) fire(next, "mouseover", prev, at);
      hovered.current = next;
    };
    const tip = () => {
      const box = rootRef.current?.getBoundingClientRect();
      return box ? { x: box.left + x.get(), y: box.top + y.get() } : { x: 0, y: 0 };
    };
    if (!playing) {
      hoverTo(null, tip());
      return;
    }
    // x and y change together during a glide; hit-test once per pair.
    let queued = false;
    const update = () => {
      queued = false;
      const root = rootRef.current;
      if (!root || !placed.current) return;
      const at = tip();
      const hit = document.elementFromPoint(at.x, at.y);
      const next = hit && hit !== root && root.contains(hit) ? hit : null;
      hoverTo(next, at);
      if (next) fire(next, "mousemove", null, at);
    };
    const schedule = () => {
      if (queued) return;
      queued = true;
      queueMicrotask(update);
    };
    const offX = x.on("change", schedule);
    const offY = y.on("change", schedule);
    return () => {
      offX();
      offY();
      hoverTo(null, tip());
    };
  }, [playing, rootRef, x, y]);

  return useMemo(
    () => ({
      x,
      y,
      scale,
      opacity,
      goto(selector: string, index = 0) {
        const root = rootRef.current;
        const target = root?.querySelectorAll<HTMLElement>(selector)[index];
        if (!root || !target) return;
        const box = root.getBoundingClientRect();
        const to = target.getBoundingClientRect();
        const tx = to.left - box.left + to.width / 2;
        const ty = to.top - box.top + to.height / 2;
        // The first time, drift in from just below and right of the target.
        if (!placed.current) {
          x.set(tx + 24);
          y.set(ty + 24);
          opacity.set(1);
          placed.current = true;
        }
        const glide = { duration: GLIDE_MS / 1000, ease: "easeInOut" } as const;
        animate(x, tx, glide);
        animate(y, ty, glide);
      },
      click() {
        animate(scale, [1, 0.8, 1], { duration: 0.2 });
      },
    }),
    [rootRef, x, y, scale, opacity]
  );
}

/** One scripted glide: to the target, then a rest of `restMs` on it before
 *  the next step. */
export function glideStep(cursor: Cursor, selector: string, index: number, restMs = HOVER_MS) {
  return { ms: GLIDE_MS + restMs, run: () => cursor.goto(selector, index) };
}

/** Two steps for one scripted click: glide to the target and rest on it,
 *  then press it and run `act`, then wait `holdMs` before the next step. */
export function clickStep(cursor: Cursor, selector: string, index: number, act: () => void, holdMs: number) {
  return [
    glideStep(cursor, selector, index),
    {
      ms: holdMs,
      run: () => {
        cursor.click();
        act();
      },
    },
  ];
}

/** Builds turn-by-turn steps: the generic side plays its whole turn, then
 *  the skill side plays the same one. `turn(side)` returns that side's steps. */
export function turns(
  setActive: (side: Side) => void,
  turn: (side: Side) => Array<{ ms: number; run: () => void }>
) {
  return (["generic", "skill"] as const).flatMap((side) => {
    const [first, ...rest] = turn(side);
    return [
      {
        ms: first.ms,
        run: () => {
          setActive(side);
          first.run();
        },
      },
      ...rest,
    ];
  });
}

/** The two-up frame every example shares: generic on the left, the skill on
 *  the right, each captioned. */
export function Compare({
  rootRef,
  bind,
  generic,
  skill,
  bare,
  active,
  cursor,
}: {
  rootRef: RefObject<HTMLDivElement | null>;
  bind: ReturnType<typeof usePlayback>["bind"];
  generic: ReactNode;
  skill: ReactNode;
  /** Lists fill their frame themselves; everything else is centered in a
   *  fixed-height frame. */
  bare?: boolean;
  /** The side whose turn it is; its caption darkens. */
  active?: Side | null;
  /** The scripted cursor, drawn over both sides while the script plays. */
  cursor?: Cursor | null;
}) {
  const shape = useShape();
  const frame = cn(
    "relative w-full overflow-hidden",
    !bare && "flex items-center justify-center",
    shape.container
  );
  const style = bare ? undefined : { height: FRAME_H };
  const labelClass = (side: Side) =>
    cn(
      "text-site-caption transition-colors duration-150",
      active === side ? "text-foreground" : "text-muted-foreground"
    );
  return (
    <div ref={rootRef} className="relative grid w-full max-w-xl gap-5 sm:grid-cols-2" {...bind}>
      <div className="flex flex-col items-center gap-3">
        <div data-side="generic" className={frame} style={style}>
          {generic}
        </div>
        <span className={labelClass("generic")}>
          <span aria-hidden="true">❌</span> Generic AI output
        </span>
      </div>
      <div className="flex flex-col items-center gap-3">
        <div data-side="skill" className={frame} style={style}>
          {skill}
        </div>
        <span className={labelClass("skill")}>
          <span aria-hidden="true">✅</span> With the skill
        </span>
      </div>
      {cursor && <FakeCursor x={cursor.x} y={cursor.y} scale={cursor.scale} opacity={cursor.opacity} />}
    </div>
  );
}
