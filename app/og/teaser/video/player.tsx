"use client";

import { useEffect, useRef, useState } from "react";
import { Pause, Play } from "lucide-react";
import { Button } from "@/registry/radix/button";
import { Slider } from "@/registry/radix/slider";
import { Tabs, TabsItem } from "@/registry/radix/tabs";
import { LH, LW, SCENES } from "../scene-list";

type Cue = { lead: number; window: number; keys: boolean };
type Event = { t: number; kind: "run" | "show"; i: number };

/** Before the first cut: time for the scene with the longest lead to set up. */
const PREROLL_MS = 400;
/** After a seek's stop, time for the scenes' resets to land before they
 *  roll again (and for a slider drag to come to rest). */
const SETTLE_MS = 300;
/** A scene that never parks doesn't hold the video longer than this. */
const PARK_TIMEOUT_MS = 8000;
/** The controls' height under the frame: the scrubber row and the tabs. */
const BAR_H = 128;

/** The teaser: every scene in its own iframe, stacked, each told when to
 *  run (its `lead` before its cut, so its setup happens off screen) and
 *  shown, with a hard cut, for its `window`. Scenes report both once set
 *  up. Hidden frames stay rendered (opacity, not visibility), so the one
 *  coming up runs at full speed.
 *
 *  Time is the player's own clock: it moves only while playing, and a
 *  pause holds every scene's script between steps. The slider seeks to
 *  any time, a tab to the start of its scene. A seek stops and resets
 *  every scene, then plays each one the new time needs from its start,
 *  hidden, at its own pace, up to that time (where it parks): the frame
 *  shows again, and the clock moves, once they all have. Nothing is
 *  skipped, so a seek lands on the same frame a straight run shows. `?record` hides the controls and fills
 *  the window with the frame. */
export function Player() {
  const frames = useRef<(HTMLIFrameElement | null)[]>([]);
  const [cues, setCues] = useState<(Cue | null)[]>(() => SCENES.map(() => null));
  const [shown, setShown] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [record, setRecord] = useState(false);
  const [scale, setScale] = useState(1);
  const [time, setTime] = useState(0);
  const [cueing, setCueing] = useState(false);
  const seekRef = useRef<(t: number) => void>(() => {});
  const cutsRef = useRef<number[]>([]);
  const playingRef = useRef(playing);
  const loaded = cues.filter(Boolean).length;
  const ready = loaded === SCENES.length;

  useEffect(() => {
    playingRef.current = playing;
  }, [playing]);

  useEffect(() => {
    const isRecord = new URLSearchParams(window.location.search).has("record");
    setRecord(isRecord);
    const fit = () =>
      setScale(
        isRecord
          ? Math.min(window.innerWidth / LW, window.innerHeight / LH)
          : Math.min((window.innerWidth - 32) / LW, (window.innerHeight - BAR_H - 32) / LH, 1.6)
      );
    fit();
    window.addEventListener("resize", fit);
    return () => window.removeEventListener("resize", fit);
  }, []);

  useEffect(() => {
    const hear = (e: MessageEvent) => {
      if (e.origin !== window.location.origin || e.data?.type !== "teaser-ready") return;
      const i = frames.current.findIndex((f) => f?.contentWindow === e.source);
      if (i < 0) return;
      setCues((old) => old.map((c, j) => (j === i ? { lead: e.data.lead, window: e.data.window, keys: !!e.data.keys } : c)));
    };
    window.addEventListener("message", hear);
    return () => window.removeEventListener("message", hear);
  }, []);

  // Setup, one scene at a time (each moves focus, and frames doing it
  // together took it from each other): the next is asked once the last
  // has answered, again every 500ms until it does (it may not be
  // listening yet).
  useEffect(() => {
    if (ready) return;
    const next = cues.findIndex((c) => !c);
    const ask = () => send(frames.current, next, { type: "teaser-prepare" });
    ask();
    const id = window.setInterval(ask, 500);
    return () => clearInterval(id);
  }, [cues, ready]);

  // Paused, every scene holds between steps.
  useEffect(() => {
    if (ready) sendAll(frames.current, { type: "teaser-pause", paused: !playing });
  }, [playing, ready]);

  // The clock: virtual time that moves only while playing. Each scene runs
  // `lead` ms before its cut and holds the screen for its window; the
  // events of this pass and the next are queued and fired as time passes.
  const timeline = ready ? (cues as Cue[]) : null;
  useEffect(() => {
    if (!timeline) return;
    const cuts: number[] = [];
    let sum = 0;
    for (const c of timeline) {
      cuts.push(sum);
      sum += c.window;
    }
    const total = sum;
    const lead = Math.max(...timeline.map((c) => c.lead));
    const pass = (n: number): Event[] =>
      timeline
        .flatMap((c, i) => [
          { t: n * total + cuts[i] - c.lead, kind: "run" as const, i },
          { t: n * total + cuts[i], kind: "show" as const, i },
        ])
        .sort((a, b) => a.t - b.t);
    cutsRef.current = cuts;
    let now = -(lead + PREROLL_MS);
    let queue = [...pass(0), ...pass(1)];
    let passes = 2;
    let last = performance.now();
    let frame = 0;
    let shownTime = -1;
    // A seek in progress: its id (a newer one cancels it), the scenes it
    // waits on, and the scene it shows when they have parked.
    let seek = 0;
    let cue: { waiting: Set<number>; show: number; timer: number } | null = null;
    const fire = (e: Event) => {
      if (e.kind === "run") send(frames.current, e.i, { type: "teaser-run" });
      else setShown(e.i);
    };
    const paint = () => {
      const at = Math.round((now < 0 ? 0 : now % total) / 50) * 50;
      if (at !== shownTime) setTime((shownTime = at));
    };
    const step = (t: number) => {
      if (playingRef.current && !cue) now += t - last;
      last = t;
      while (!cue && queue.length && queue[0].t <= now) fire(queue.shift() as Event);
      if (queue.length < timeline.length * 2) queue.push(...pass(passes++));
      paint();
      frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    // Cued: the frame shows, and scenes that should be playing go on.
    const done = () => {
      if (!cue) return;
      clearTimeout(cue.timer);
      setShown(cue.show);
      cue = null;
      setCueing(false);
      if (playingRef.current) sendAll(frames.current, { type: "teaser-resume" });
    };
    const hear = (e: MessageEvent) => {
      if (e.origin !== window.location.origin || e.data?.type !== "teaser-parked" || !cue) return;
      const i = frames.current.findIndex((f) => f?.contentWindow === e.source);
      cue.waiting.delete(i);
      if (!cue.waiting.size) done();
    };
    window.addEventListener("message", hear);
    // A seek: every scene stops and resets and time moves to `t`. Once
    // the resets have landed, each scene that would be running by then
    // plays up to it, hidden, and parks.
    seekRef.current = (t: number) => {
      sendAll(frames.current, { type: "teaser-stop" });
      const n = Math.floor(Math.max(now, 0) / total);
      now = n * total + Math.min(Math.max(t, 0), total - 1);
      const at = now;
      let show = 0;
      timeline.forEach((_, i) => {
        if (cuts[i] <= at - n * total) show = i;
      });
      queue = [...pass(n), ...pass(n + 1)].filter((e) => e.t > at);
      passes = n + 2;
      if (cue) clearTimeout(cue.timer);
      const id = ++seek;
      cue = { waiting: new Set(), show, timer: 0 };
      setCueing(true);
      paint();
      cue.timer = window.setTimeout(() => {
        if (id !== seek || !cue) return;
        timeline.forEach((c, i) => {
          const start = n * total + cuts[i] - c.lead;
          if (start <= at && at < n * total + cuts[i] + c.window) {
            cue?.waiting.add(i);
            send(frames.current, i, { type: "teaser-run", from: at - start });
          }
        });
        if (!cue.waiting.size) return done();
        cue.timer = window.setTimeout(done, PARK_TIMEOUT_MS);
      }, SETTLE_MS);
    };
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("message", hear);
      if (cue) clearTimeout(cue.timer);
    };
  }, [timeline]);

  // A keyboard scene on screen holds real focus, as a page being
  // recorded does: without it, it acts on a page that isn't focused (a
  // field takes typing but never shows or commits it). Focus is left
  // alone for the others: one coming on screen with a popup open (a
  // calendar) closed it as focus moved in or out. Taken back after each
  // click on the controls.
  const keysShown = !!cues[shown]?.keys;
  // Each scene hears whether it's the one on screen (see the scenes' focus
  // guard).
  useEffect(() => {
    if (ready) frames.current.forEach((_, i) => send(frames.current, i, { type: "teaser-onscreen", on: i === shown && !cueing }));
  }, [shown, cueing, ready]);
  useEffect(() => {
    if (ready && !cueing && keysShown) frames.current[shown]?.contentWindow?.focus();
  }, [shown, cueing, ready, keysShown]);

  // Space plays and pauses (from a scene too, which holds focus).
  useEffect(() => {
    const toggle = (e: MessageEvent) => {
      if (e.origin === window.location.origin && e.data?.type === "teaser-toggle") setPlaying((p) => !p);
    };
    window.addEventListener("message", toggle);
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== " " || (e.target as Element | null)?.closest("button, input")) return;
      e.preventDefault();
      setPlaying((p) => !p);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("message", toggle);
    };
  }, []);

  const total = cues.reduce((sum, c) => sum + (c?.window ?? 0), 0);

  return (
    <main className="fixed inset-0 flex flex-col items-center justify-center overflow-hidden bg-background text-foreground">
      {/* The dev overlay's badge would sit over the frame. */}
      <style>{"nextjs-portal{display:none}"}</style>
      <div
        className="relative shrink-0 overflow-hidden rounded-[2px] ring-1 ring-border/60"
        style={{ width: LW * scale, height: LH * scale }}
      >
        {SCENES.map((s, i) => (
          <iframe
            key={s.id}
            ref={(el) => {
              frames.current[i] = el;
            }}
            title={s.title}
            src={`/og/teaser/scene?id=${s.id}&video`}
            className="pointer-events-none absolute left-0 top-0 origin-top-left border-0"
            style={{
              width: LW,
              height: LH,
              transform: `scale(${scale})`,
              opacity: i === shown && !cueing ? 1 : 0,
              zIndex: i === shown ? 1 : 0,
            }}
          />
        ))}
        {ready && cueing && (
          <p className="absolute inset-x-0 bottom-3 z-10 text-center font-mono text-site-caption text-muted-foreground">
            Cueing
          </p>
        )}
        {!ready && (
          <p className="absolute inset-x-0 bottom-3 z-10 text-center font-mono text-site-caption text-muted-foreground">
            Setting up scenes {loaded}/{SCENES.length}
          </p>
        )}
      </div>
      {!record && (
        <div className="flex w-full shrink-0 flex-col justify-center gap-4 px-4" style={{ height: BAR_H, maxWidth: LW * scale + 32 }}>
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              aria-label={playing ? "Pause" : "Play"}
              disabled={!ready}
              onClick={() => setPlaying((p) => !p)}
            >
              {playing ? <Pause /> : <Play />}
            </Button>
            <span className="w-14 shrink-0 font-mono text-site-caption tabular-nums text-muted-foreground">
              {(time / 1000).toFixed(1)}s
            </span>
            <Slider
              className="min-w-0 flex-1"
              variant="scrubber"
              value={time}
              min={0}
              max={Math.max(total, 1)}
              step={50}
              disabled={!ready}
              formatValue={() => ""}
              onChange={(v) => seekRef.current(v as number)}
            />
            <span className="w-14 shrink-0 text-right font-mono text-site-caption tabular-nums text-muted-foreground">
              {(total / 1000).toFixed(1)}s
            </span>
          </div>
          {/* One row: past the window's width it scrolls sideways. */}
          <Tabs
            selectedIndex={shown}
            onSelect={(i) => ready && seekRef.current(cutsRef.current[i] ?? 0)}
            className="max-w-full flex-nowrap overflow-x-auto [scrollbar-width:none]"
            aria-label="Scenes"
          >
            {SCENES.map((s, i) => (
              <TabsItem key={s.id} index={i} label={`${i + 1} · ${s.label}`} />
            ))}
          </Tabs>
        </div>
      )}
    </main>
  );
}

/** A message to one scene's frame. */
function send(frames: (HTMLIFrameElement | null)[], i: number, data: object) {
  frames[i]?.contentWindow?.postMessage(data, window.location.origin);
}

/** A message to every scene's frame. */
function sendAll(frames: (HTMLIFrameElement | null)[], data: object) {
  frames.forEach((_, i) => send(frames, i, data));
}
