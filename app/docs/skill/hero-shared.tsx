"use client";

import { createContext, useContext, useEffect, useRef, useState, type ReactNode, type RefObject } from "react";
import { useInView, useReducedMotion } from "framer-motion";
import { cn } from "@/registry/default/lib/utils";
import { useShape } from "@/registry/default/lib/shape-context";
import { useSpeedRef } from "./slow-motion";

/** Height of every example's frame, so switching tabs never moves the page.
 *  Matches the menu: 5 rows of 36px plus 8px padding top and bottom. */
export const FRAME_H = 196;

/** Whether an example should play its script: on screen, motion allowed,
 *  and no real pointer inside (a visitor takes over until they leave). */
export function usePlayback() {
  const rootRef = useRef<HTMLDivElement>(null);
  const inView = useInView(rootRef, { amount: 0.35 });
  const reduced = useReducedMotion();
  const [userInside, setUserInside] = useState(false);
  const bind = {
    onMouseEnter: () => setUserInside(true),
    onMouseMove: () => setUserInside(true),
    onPointerDown: () => setUserInside(true),
    onMouseLeave: () => setUserInside(false),
  };
  return { rootRef, playing: inView && !reduced && !userInside, bind };
}

export type Side = "generic" | "skill";

/** A beat before the first step, so an example doesn't start mid-glance. */
const FIRST_STEP_MS = 400;

/** How an example reports to the hero's autoplay dots: its full length at
 *  1x and whether it is playing right now (the dot's fill only advances
 *  then), and `done` once both turns played. */
export const CycleContext = createContext<{
  report: (totalMs: number, playing: boolean) => void;
  done: () => void;
}>({ report: () => {}, done: () => {} });

/** Reports length and playback to the hero; returns the callbacks behind a
 *  ref, so scripts never restart on a render. */
export function useCycle(totalMs: number, playing: boolean) {
  const cycle = useContext(CycleContext);
  const ref = useRef(cycle);
  ref.current = cycle;
  useEffect(() => {
    cycle.report(totalMs, playing);
  }, [cycle, totalMs, playing]);
  return ref;
}

/** Runs `steps` once through while `playing`: each step fires its action,
 *  then waits its ms, stretched by the hero's slow-motion rate. After the
 *  last step it tells the hero it is done. Pausing keeps the position, so
 *  the script resumes in place. */
export function useLoop(playing: boolean, steps: Array<{ ms: number; run: () => void }>) {
  const indexRef = useRef(0);
  const stepsRef = useRef(steps);
  stepsRef.current = steps;
  const speedRef = useSpeedRef();
  const cycleRef = useCycle(
    FIRST_STEP_MS + steps.reduce((sum, step) => sum + step.ms, 0),
    playing
  );

  useEffect(() => {
    if (!playing) return;
    let timer: ReturnType<typeof setTimeout>;
    const tick = () => {
      const list = stepsRef.current;
      if (indexRef.current >= list.length) {
        cycleRef.current.done();
        return;
      }
      const step = list[indexRef.current];
      step.run();
      indexRef.current += 1;
      timer = setTimeout(tick, step.ms / speedRef.current);
    };
    timer = setTimeout(tick, FIRST_STEP_MS / speedRef.current);
    return () => clearTimeout(timer);
  }, [playing, speedRef, cycleRef]);
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
      "text-caption transition-colors duration-150",
      active === side ? "text-foreground" : "text-muted-foreground"
    );
  return (
    <div ref={rootRef} className="grid w-full max-w-xl gap-5 sm:grid-cols-2" {...bind}>
      <div className="flex flex-col items-center gap-3">
        <div className={frame} style={style}>
          {generic}
        </div>
        <span className={labelClass("generic")}>
          <span aria-hidden="true">❌</span> Generic AI output
        </span>
      </div>
      <div className="flex flex-col items-center gap-3">
        <div className={frame} style={style}>
          {skill}
        </div>
        <span className={labelClass("skill")}>
          <span aria-hidden="true">✅</span> With the skill
        </span>
      </div>
    </div>
  );
}
