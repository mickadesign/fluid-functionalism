"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { OgStage, OG_STILL, OG_W, OG_H, PRINCIPLES, SLIDER_TILE_ROTATE, type OgState } from "../og-stage";

// The OG card as a loop in two rounds. Round one: a cursor ticks two
// checkboxes, picks a spring and slides the value up, reading it off the
// slider's hover bubble. Round two: it undoes each of those in the same
// order, so the last frame meets the first. The combobox keeps its
// still-frame chips throughout. Every change is a real state change on a
// real component, so the springs, the fluid hover and the value bubble are
// the library's own.
// `npm run og:video` records it; `?record` drops the page chrome and waits
// for the script to call window.__ogVideo.start().

const DURATION = 13.2;

const ease = (p: number) => (p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2);
const seg = (t: number, a: number, b: number) => Math.min(1, Math.max(0, (t - a) / (b - a)));

// Starting values: what round one changes and round two restores.
const START: OgState = {
  ...OG_STILL,
  checked: [],
  satisfaction: 40,
  spring: "fast",
};

// [on, off] press times for each change. Both rounds take the tiles in the
// same order: checkboxes, radio, slider.
const TICKS: [index: number, on: number, off: number][] = [
  [0, 0.75, 7.65],
  [3, 1.65, 8.55],
];
const MODERATE = [2.75, 9.65] as const;
const SATISFACTION = [4.55, 11.45] as const;
const SWEEP_UP = { from: 3.5, to: 4.4 };
const SWEEP_DOWN = { from: 10.4, to: 11.3 };

// A change takes effect a beat after its press lands.
const after = (t: number, at: number) => t >= at + 0.05;
const between = (t: number, [on, off]: readonly [number, number]) => after(t, on) && !after(t, off);

function stateAt(t: number): OgState {
  return {
    ...START,
    checked: TICKS.filter(([, on, off]) => between(t, [on, off])).map(([i]) => i),
    spring: between(t, MODERATE) ? "moderate" : "fast",
    satisfaction: between(t, SATISFACTION) ? OG_STILL.satisfaction : START.satisfaction,
  };
}

type Point = { x: number; y: number };
// A selector resolves to its element's center; a function returns a point
// in client coordinates, read every frame.
type Anchor = Point | string | (() => Point | null);

const row = (label: string) => `[data-og-stage] [role="checkbox"][aria-label="${label}"]`;
const radio = (label: string) => `[data-og-stage] [role="radio"][aria-label="${label}"]`;
// The compact slider's pointer surface (the first slider in the tile).
const TRACK = `[data-og-tile="sliders"] .cursor-ew-resize`;
const THUMB = `[data-og-tile="sliders"] [role="slider"]`;

// Where the slider reads `value` under the pointer: the inverse of its own
// hover math (layout px from the track's box, THUMB_SIZE 20), riding the
// tile's tilt so the cursor stays on the track.
function sliderAt(value: number) {
  return () => {
    const track = document.querySelector<HTMLElement>(TRACK);
    const thumb = document.querySelector(THUMB);
    if (!track || !thumb) return null;
    const r = track.getBoundingClientRect();
    const w = track.offsetWidth;
    const s = r.width / w;
    const x = r.left + s * (10 + (value / 100) * (w - 20));
    const th = thumb.getBoundingClientRect();
    const tx = th.left + th.width / 2;
    const ty = th.top + th.height / 2;
    return { x, y: ty + (x - tx) * Math.tan((SLIDER_TILE_ROTATE * Math.PI) / 180) };
  };
}

// Each round enters top right and leaves bottom left, off frame, so the
// cursor never shows a jump between rounds or at the wrap.
const ENTER = { x: 1260, y: -40 };
const EXIT = { x: -60, y: 700 };
// The off-frame hop from exit back to entry: no time to travel.
const HOP = 0.001;

// [time, where]. Consecutive keys on the same anchor hold the cursor still;
// every press lands while the cursor is parked.
const PATH: [number, Anchor][] = [
  // Round one: set the values.
  [0, ENTER],
  [0.6, row(PRINCIPLES[0])],
  [0.9, row(PRINCIPLES[0])],
  [1.5, row(PRINCIPLES[3])],
  [1.8, row(PRINCIPLES[3])],
  [2.3, radio("Fast spring")],
  [2.6, radio("Moderate spring")],
  [2.9, radio("Moderate spring")],
  [3.4, sliderAt(START.satisfaction)],
  [SWEEP_UP.from, sliderAt(START.satisfaction)],
  [SWEEP_UP.to, sliderAt(OG_STILL.satisfaction)],
  [4.8, sliderAt(OG_STILL.satisfaction)],
  // A beat off frame on the finished card.
  [5.5, EXIT],
  [6.3, EXIT],
  [6.3 + HOP, ENTER],
  [6.9, ENTER],
  // Round two: the same stops in the same order, each put back.
  [7.5, row(PRINCIPLES[0])],
  [7.8, row(PRINCIPLES[0])],
  [8.4, row(PRINCIPLES[3])],
  [8.7, row(PRINCIPLES[3])],
  [9.2, radio("Moderate spring")],
  [9.5, radio("Fast spring")],
  [9.8, radio("Fast spring")],
  [10.3, sliderAt(OG_STILL.satisfaction)],
  [SWEEP_DOWN.from, sliderAt(OG_STILL.satisfaction)],
  [SWEEP_DOWN.to, sliderAt(START.satisfaction)],
  [11.7, sliderAt(START.satisfaction)],
  [12.4, EXIT],
  [DURATION, EXIT],
];
const SWEEPS = [SWEEP_UP.from, SWEEP_DOWN.from];
const PRESSES = [
  ...TICKS.flatMap(([, on, off]) => [on, off]),
  ...MODERATE,
  ...SATISFACTION,
];

// Groups that react to the pointer. Each gets enter/move/leave as the
// cursor crosses its box, the events a real pointer would send.
const HOVER_ZONES = [
  `[data-og-tile="principles"] [role="group"]`,
  `[data-og-tile="radio-group"] [role="radiogroup"]`,
  // The slider listens on the wrapper around its track: enter turns the
  // hover state on, moves place the preview bar and the value bubble.
  TRACK,
];

declare global {
  interface Window {
    __ogVideo?: { duration: number; start: () => void };
  }
}

export default function OgVideoPage() {
  const [state, setState] = useState<OgState>(START);
  const [record, setRecord] = useState(false);
  const stageRef = useRef<HTMLDivElement>(null);
  const cursorRef = useRef<HTMLDivElement>(null);
  const lastKey = useRef("");
  const startedAt = useRef<number | null>(null);
  const inside = useRef<Set<Element>>(new Set());

  const start = useCallback(() => {
    startedAt.current = performance.now();
  }, []);

  useEffect(() => {
    const isRecord = new URLSearchParams(window.location.search).has("record");
    setRecord(isRecord);
    window.__ogVideo = { duration: DURATION, start };
    let autostart: number | undefined;
    if (!isRecord) {
      document.fonts.ready.then(() => {
        autostart = window.setTimeout(start, 600);
      });
    }
    return () => {
      window.clearTimeout(autostart);
      delete window.__ogVideo;
    };
  }, [start]);

  useEffect(() => {
    let raf = 0;
    const tick = (now: number) => {
      frame(now);
      // Queued after the frame's events, so the hover hooks' own rAF
      // (requested while handling them) runs first next frame instead of
      // being cancelled by the next move, which would starve the highlight.
      raf = requestAnimationFrame(tick);
    };
    const frame = (now: number) => {
      const stage = stageRef.current;
      const cursor = cursorRef.current;
      if (!stage || !cursor || startedAt.current === null) return;
      const t = ((now - startedAt.current) / 1000) % DURATION;

      const next = stateAt(t);
      const key = JSON.stringify(next);
      if (key !== lastKey.current) {
        lastKey.current = key;
        setState(next);
      }

      // Stage coordinates, whatever the preview scale.
      const box = stage.getBoundingClientRect();
      const scale = box.width / OG_W;
      const toStage = (x: number, y: number) => ({ x: (x - box.left) / scale, y: (y - box.top) / scale });
      const resolve = (a: Anchor): Point => {
        if (typeof a === "function") {
          const p = a();
          return p ? toStage(p.x, p.y) : { x: 0, y: 0 };
        }
        if (typeof a !== "string") return a;
        const el = document.querySelector(a);
        if (!el) return { x: 0, y: 0 };
        const r = el.getBoundingClientRect();
        return toStage(r.left + r.width / 2, r.top + r.height / 2);
      };
      let i = 0;
      while (i < PATH.length - 2 && t >= PATH[i + 1][0]) i++;
      const [t0, a0] = PATH[i];
      const [t1, a1] = PATH[i + 1];
      const p0 = resolve(a0);
      const p1 = resolve(a1);
      // The hover sweep glides at an even pace so the bubble counts up
      // steadily; every other move eases like a hand would.
      const p = SWEEPS.includes(t0) ? seg(t, t0, t1) : ease(seg(t, t0, t1));
      const x = p0.x + (p1.x - p0.x) * p;
      const y = p0.y + (p1.y - p0.y) * p;
      const pressed = PRESSES.some((c) => t >= c - 0.08 && t < c + 0.06);
      cursor.style.transform = `translate(${x}px, ${y}px)`;
      (cursor.firstElementChild as HTMLElement).style.transform = `scale(${pressed ? 0.86 : 1})`;

      // Feed the hover hooks the cursor's position, as a real pointer would.
      const clientX = box.left + x * scale;
      const clientY = box.top + y * scale;
      for (const selector of HOVER_ZONES) {
        const zone = document.querySelector(selector);
        if (!zone) continue;
        const r = zone.getBoundingClientRect();
        const over = clientX >= r.left && clientX <= r.right && clientY >= r.top && clientY <= r.bottom;
        const init = { bubbles: true, clientX, clientY, relatedTarget: stage, pointerType: "mouse" };
        if (over) {
          if (!inside.current.has(zone)) {
            inside.current.add(zone);
            // React derives enter from the `out` of the node the pointer
            // left (it drops `over` events whose relatedTarget it owns),
            // so entering is the stage's out, toward the target.
            const enter = { ...init, relatedTarget: zone };
            stage.dispatchEvent(new PointerEvent("pointerout", enter));
            stage.dispatchEvent(new MouseEvent("mouseout", enter));
          }
          zone.dispatchEvent(new PointerEvent("pointermove", init));
          zone.dispatchEvent(new MouseEvent("mousemove", init));
        } else if (inside.current.has(zone)) {
          inside.current.delete(zone);
          zone.dispatchEvent(new PointerEvent("pointerout", init));
          zone.dispatchEvent(new MouseEvent("mouseout", init));
        }
      }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  const cursor = (
    <div
      ref={cursorRef}
      className="absolute left-0 top-0 z-10"
      style={{ transform: "translate(-100px, -100px)" }}
      aria-hidden
    >
      {/* Tip at the element's origin, sized to read in a ~500px preview. */}
      <svg width="30" height="38" viewBox="-1.5 -1.5 21 27" className="origin-top-left drop-shadow-sm transition-transform duration-75">
        <path
          d="M0 0 L0 21 L5.5 16 L9.5 24.5 L13 23 L9 14.8 L16 14.8 Z"
          fill="#0a0a0a"
          stroke="#fff"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );

  if (record) {
    return (
      <div style={{ width: OG_W, height: OG_H }}>
        <OgStage state={state} overlay={cursor} stageRef={stageRef} />
      </div>
    );
  }
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted p-8">
      <OgStage state={state} overlay={cursor} stageRef={stageRef} />
    </div>
  );
}
