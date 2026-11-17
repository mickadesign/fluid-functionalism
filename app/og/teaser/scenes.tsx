"use client";

import {
  createContext,
  useContext,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type CSSProperties,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { useSearchParams } from "next/navigation";
import { DataTablePlayground } from "@/lib/docs/playgrounds/data-table";
import { PreviewPlaybackContext } from "@/lib/docs/preview-playback";
import { ShapeProvider } from "@/lib/shape-context";
import { SizeProvider } from "@/lib/size-context";
import { ACCENT_PRESETS, type AccentPreset } from "@/lib/accent";
import type { ShapeVariant } from "@/lib/shape-context";
import {
  TeamTable,
  TasksTable,
  FilesTable,
  ChangelogTable,
  FrozenTable,
  ViewsTable,
  ReorderTable,
} from "@/app/docs/data-table/capability-demos";
import { cn } from "@/lib/utils";
import { KeyCaps } from "@/lib/key-cap";
import { useFontsReady } from "@/lib/docs/use-fonts-ready";
import { FakeCursor, useScriptCursor, type Cursor } from "@/app/docs/skill/hero-shared";
import { retypeSteps, setFieldValue } from "@/app/docs/data-table/scripted";
import { LH, LW, type SceneId } from "./scene-list";

// The scenes, each at LW × LH CSS px (see scene-list). Each plays while the
// board's frame is hovered or pinned (a postMessage from board.tsx), and
// always when the page is opened on its own, as a recording would. A
// scene's script also does its own setup and teardown, off camera: the
// recording keeps only the part its caption describes.

/** Every table: one width, its title at one spot, top-left of the frame. */
const TABLE_W = 800;
const TABLE_TOP = 28;

/** A title indents to its table's first data column, which moves with
 *  checkbox and drag-handle columns: every table's title takes one 28px
 *  indent, so it starts at one spot in every scene. Trimmed to its cap
 *  height, its box top is the top of its capitals, which Stage lines up. */
const TITLE_ANCHOR = "[&_:is(h1,h3)]:pl-7! [&_:is(h1,h3)]:[text-box:trim-both_cap_alphabetic]";
/** Where every title's capitals start, below the stage's top. */
const TITLE_CAP_Y = 11;

/** Whether the scene plays. Outside the board (opened alone) it always does. */
const Playing = createContext(true);

/** The video page's cue (video/player.tsx): there each scene runs its
 *  script once per `run`, when the player says, instead of looping on
 *  hover. It sets up only on `prep`, one scene at a time: setups move
 *  focus, and frames running theirs together took it from each other.
 *  `paused` holds a script between steps (what is moving finishes).
 *  `from` starts a run that far in (a seek): the steps before it run at
 *  once, without their waits. */
const Video = createContext({ video: false, run: 0, from: -1, prep: false, paused: false, onscreen: false });

/** Tells the video player when this scene's camera rolls (`lead` ms after
 *  its run starts) and how long it stays on screen (`window` ms). */
/** `keys`: the scene plays from the keyboard, and needs the focus a
 *  recorded page has (the player gives it while the scene is on screen).
 *  Only those scenes get it: a popup open as a scene comes on screen
 *  reads the page gaining focus as focus leaving it, and closes. */
function postReady(lead: number, window_: number, keys = false) {
  window.parent.postMessage({ type: "teaser-ready", lead, window: window_, keys }, window.location.origin);
}

/** One step of a scene's script: runs `next` after `wait` ms of play. A
 *  pause keeps what is left of the wait instead of starting it over. `step`
 *  names the step, unique per step. */
function useStep(next: () => void, wait: number, step: string, enabled = true) {
  const playing = useContext(Playing);
  const left = useRef(wait);
  const current = useRef<string | null>(null);
  const run = useRef(next);
  useEffect(() => {
    run.current = next;
  });
  useEffect(() => {
    if (current.current !== step) {
      current.current = step;
      left.current = wait;
    }
    if (!playing || !enabled) return;
    const start = performance.now();
    const id = setTimeout(() => run.current(), left.current);
    return () => {
      clearTimeout(id);
      if (current.current === step)
        left.current = Math.max(0, left.current - (performance.now() - start));
    };
  }, [playing, step, enabled, wait]);
}

function useReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const q = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduced(q.matches);
    sync();
    q.addEventListener("change", sync);
    return () => q.removeEventListener("change", sync);
  }, []);
  return reduced;
}

type Look = {
  dark?: boolean;
  shape?: ShapeVariant;
  size?: "default" | "compact";
  accent?: AccentPreset;
};

/** A table in its own look: theme, radius, size step and accent, scoped to
 *  this box so the 8 cuts can each differ. */
function Styled({
  look,
  children,
  className,
  style: extra,
}: {
  look: Look;
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}) {
  const accent = look.accent ? ACCENT_PRESETS[look.accent] : null;
  const style = accent
    ? ({
        "--fluid-accent": look.dark ? accent.dark : accent.light,
      } as CSSProperties)
    : undefined;
  return (
    <ShapeProvider defaultShape={look.shape ?? "rounded"}>
      <SizeProvider size={look.size ?? "default"}>
        <div
          className={cn(
            look.dark ? "dark" : "light",
            "bg-background text-foreground",
            className,
          )}
          style={{
            ...style,
            ...extra,
            colorScheme: look.dark ? "dark" : "light",
          }}
        >
          {children}
        </div>
      </SizeProvider>
    </ShapeProvider>
  );
}

/** The docs playground's Components table, as its rail would set it. */
function Components({
  initial,
}: {
  initial?: Parameters<typeof DataTablePlayground>[0]["initial"];
}) {
  return (
    <DataTablePlayground initial={initial}>
      {({ demoPreview }) => demoPreview}
    </DataTablePlayground>
  );
}

/** Places a table in the 16:9 canvas at one width, and moves it up or
 *  down so its title's capitals start TITLE_CAP_Y below the top: a
 *  compact table's smaller title, or a toolbar row of another height,
 *  would otherwise put them a pixel or two off between hard cuts. */
function Stage({ children }: { children: ReactNode }) {
  const outer = useRef<HTMLDivElement>(null);
  const [dy, setDy] = useState(0);
  useLayoutEffect(() => {
    const measure = () => {
      const box = outer.current;
      const title = box?.querySelector("h1, h3");
      if (!box || !title) return;
      const b = box.getBoundingClientRect();
      // The camera's scale, as in Camera.
      const s = b.width / box.offsetWidth;
      const off = (title.getBoundingClientRect().top - b.top) / s;
      setDy((old) => (Math.abs(TITLE_CAP_Y - off) < 0.25 ? old : old + TITLE_CAP_Y - off));
    };
    measure();
    const id = window.setInterval(measure, 500);
    return () => clearInterval(id);
  }, []);
  return (
    <div ref={outer} className="absolute" style={{ width: TABLE_W, left: (LW - TABLE_W) / 2, top: TABLE_TOP }}>
      <div style={{ transform: `translateY(${dy}px)` }}>{children}</div>
    </div>
  );
}

/** Where the camera looks: the first element matching `target`, centred
 *  (then `dx` canvas px to the side), at `zoom` (no target: the whole
 *  frame). `glide` eases the move; without it the shot cuts. */
type Shot = { target?: string; zoom: number; dx?: number; glide?: boolean };
const WIDE: Shot = { zoom: 1 };

/** The camera: a scale on the canvas, centred on the shot's target. Menus
 *  and tooltips open in portals outside it, so they take the same zoom
 *  from a style rule. `settle` measures again while the layout settles
 *  (fonts, the skeleton hand-over); playing, the shot holds still. */
function Camera({
  shot,
  settle = true,
  children,
}: {
  shot: Shot;
  settle?: boolean;
  children: ReactNode;
}) {
  const root = useRef<HTMLDivElement>(null);
  const [at, setAt] = useState({ x: 0, y: 0 });
  const { target, zoom, dx = 0, glide } = shot;
  useLayoutEffect(() => {
    const measure = () => {
      const box = root.current;
      const el = target ? box?.querySelector(target) : null;
      if (!box) return;
      if (!el) {
        setAt((o) => (o.x || o.y ? { x: 0, y: 0 } : o));
        return;
      }
      const b = box.getBoundingClientRect();
      const r = el.getBoundingClientRect();
      // Rects carry the camera's scale; offsetWidth doesn't, so their
      // ratio brings the target back to canvas units.
      const s = b.width / box.offsetWidth;
      const x = Math.round(LW / 2 - (r.left + r.width / 2 - b.left) / s - dx);
      const y = Math.round(LH / 2 - (r.top + r.height / 2 - b.top) / s);
      setAt((o) => (o.x === x && o.y === y ? o : { x, y }));
    };
    measure();
    if (!settle) return;
    const id = window.setInterval(measure, 300);
    return () => clearInterval(id);
  }, [target, zoom, dx, settle]);
  return (
    <div className="absolute inset-0 overflow-hidden">
      {zoom !== 1 && <style>{`[data-radix-popper-content-wrapper]>*{zoom:${zoom}}`}</style>}
      <div
        ref={root}
        className="absolute inset-0"
        style={{
          transform: `scale(${zoom}) translate(${at.x}px, ${at.y}px)`,
          transformOrigin: "50% 50%",
          transition: glide ? "transform 650ms cubic-bezier(0.65, 0, 0.35, 1)" : "none",
        }}
      >
        {children}
      </div>
    </div>
  );
}

// ── The 8 cuts ──────────────────────────────────────────

const CUTS: { look: Look; table: ReactNode }[] = [
  { look: { shape: "sharp", size: "compact" }, table: <TasksTable /> },
  {
    look: { dark: true, shape: "pill", accent: "violet" },
    table: <TeamTable />,
  },
  { look: { shape: "sharp" }, table: <ChangelogTable /> },
  { look: { dark: true, accent: "emerald" }, table: <FilesTable /> },
  { look: { shape: "pill", size: "compact", accent: "orange" }, table: <ViewsTable /> },
  {
    look: { dark: true, shape: "sharp", accent: "amber" },
    table: <FrozenTable />,
  },
  {
    look: { dark: true, shape: "pill", size: "compact", accent: "red" },
    table: <ReorderTable />,
  },
  // Lands on the default look: the table every scene after the cuts uses.
  { look: {}, table: <Components /> },
];

/** 8 compositions, full frame, 0.2s each, hard cuts. All 8 stay mounted
 *  and laid out, so a cut swaps visibility and never waits on a render.
 *  Paused, it holds the current cut; reduced motion holds the first. */
const CUT_MS = 200;
/** The cut that opens with rows selected, and so shows the selection bar. */
const SELECTED_CUT = 1;

function CutsScene() {
  const reduced = useReducedMotion();
  const { video, run, from, prep, paused } = useContext(Video);
  const [cut, setCut] = useState(0);
  useStep(
    () => setCut((c) => (c + 1) % CUTS.length),
    CUT_MS,
    `cut:${cut}`,
    !reduced && !video,
  );
  // The video plays the 8 cuts once per run, from the first.
  useEffect(() => {
    if (video && prep) postReady(0, CUTS.length * CUT_MS);
  }, [video, prep]);
  useScript(
    video && run > 0,
    run,
    CUTS.map((_, i) => ({ ms: CUT_MS, run: () => setCut(i) })),
    false,
    undefined,
    paused,
    from
  );
  const shown = reduced ? 0 : cut;
  return (
    <div className="relative size-full" data-cut={shown}>
      {/* The selection bar lives in <body>, outside its cut: it shows only
          while the cut with selected rows (Team) is on screen. */}
      {shown !== SELECTED_CUT && <style>{`body > :has([aria-label="Selected rows"]){visibility:hidden}`}</style>}
      {CUTS.map((c, i) => (
        <Styled
          key={i}
          look={c.look}
          className={cn("absolute inset-0", TITLE_ANCHOR)}
          // visibility, not display: hidden cuts keep their measured layout.
          style={{ visibility: i === shown ? "visible" : "hidden" }}
        >
          <Stage>{c.table}</Stage>
        </Styled>
      ))}
    </div>
  );
}

// ── Scripted scenes ─────────────────────────────────────

/** One step of a script: `run`, then wait `ms` for the next. `roll` marks
 *  the first step on camera, `end` the first one off it again: the video
 *  keeps what lies between. `wait` (setup only) holds the step until the
 *  page is ready for it: setup runs while other scenes load, and fixed
 *  waits missed menus that opened late. */
type Step = { ms: number; run: () => void; roll?: boolean; end?: boolean; wait?: () => boolean };
const roll = (step: Step): Step => ({ ...step, roll: true });
const end = (step: Step): Step => ({ ...step, end: true });

/** When the camera rolls in a script, and for how long. */
function cueOf(steps: Step[]) {
  let at = 0;
  let lead = -1;
  for (const step of steps) {
    if (step.roll) lead = at;
    if (step.end && lead >= 0) return { lead, window: at - lead };
    at += step.ms;
  }
  return { lead: Math.max(lead, 0), window: at - Math.max(lead, 0) };
}

/** Plays `steps` while `active`, from the first, each run anew (`key`):
 *  in a loop, or once. Stopped midway, `reset` puts the scene back.
 *  `paused` holds it between steps and keeps what was left of the wait.
 *  `from` (a seek, ≥ 0): the steps play at their own pace up to that
 *  time, then the script parks and tells the player, which shows the
 *  scene once every scene it needs has parked and then lets them go
 *  (`teaser-resume`, or unpausing). Played, not skipped: each step finds
 *  the page the step before it left, as in a normal run. */
function useScript(
  active: boolean,
  key: number,
  steps: Step[],
  loop: boolean,
  reset?: () => void,
  paused = false,
  from = -1
) {
  const stepsRef = useRef(steps);
  const resetRef = useRef(reset);
  const pausedRef = useRef(paused);
  const fromRef = useRef(from);
  const control = useRef<{ pause: () => void; resume: () => void } | null>(null);
  useEffect(() => {
    stepsRef.current = steps;
    resetRef.current = reset;
    fromRef.current = from;
  });
  useEffect(() => {
    pausedRef.current = paused;
    if (paused) control.current?.pause();
    else control.current?.resume();
  }, [paused]);
  useEffect(() => {
    if (!active) return;
    let i = 0;
    let timer = 0;
    let done = false;
    let waited = 0;
    let due = 0;
    let left = -1;
    // Script time, and the moment it started: each step is due at its
    // place on that clock, so a timer that fires late takes it out of the
    // next wait instead of pushing every step after it back.
    let elapsed = 0;
    let origin = performance.now();
    // Rolling up to a seek's time: pauses wait until it parks there.
    const parkAt = fromRef.current;
    let rolling = parkAt >= 0;
    const park = (rest: number) => {
      rolling = false;
      left = rest;
      window.parent.postMessage({ type: "teaser-parked" }, window.location.origin);
    };
    const wait = (ms: number) => {
      if (rolling && elapsed + ms >= parkAt) {
        const first = Math.max(0, parkAt - elapsed);
        const go = () => {
          elapsed += first;
          park(ms - first);
        };
        if (first > 0) {
          due = origin + elapsed + first;
          timer = window.setTimeout(go, Math.max(0, due - performance.now()));
        } else go();
        return;
      }
      elapsed += ms;
      due = origin + elapsed;
      if (pausedRef.current && !rolling) {
        elapsed -= ms;
        left = ms;
      } else timer = window.setTimeout(tick, Math.max(0, due - performance.now()));
    };
    const tick = () => {
      const list = stepsRef.current;
      const step = list[i];
      if (step.wait && !step.wait() && waited < 5000) {
        waited += 50;
        wait(50);
        return;
      }
      waited = 0;
      step.run();
      i += 1;
      if (i >= list.length) {
        if (!loop) {
          done = true;
          return;
        }
        i = 0;
      }
      wait(step.ms);
    };
    control.current = {
      pause: () => {
        if (done || left >= 0 || rolling) return;
        clearTimeout(timer);
        left = Math.max(0, due - performance.now());
        elapsed -= left;
      },
      resume: () => {
        if (left < 0) return;
        const ms = left;
        left = -1;
        origin = performance.now() - elapsed;
        wait(ms);
      },
    };
    const go = (e: MessageEvent) => {
      if (e.data?.type === "teaser-resume" && !pausedRef.current) control.current?.resume();
    };
    window.addEventListener("message", go);
    if (rolling && parkAt <= 0) park(0);
    else if (pausedRef.current && !rolling) left = 0;
    else tick();
    return () => {
      window.removeEventListener("message", go);
      clearTimeout(timer);
      control.current = null;
      if (!done) resetRef.current?.();
    };
  }, [active, key, loop]);
}

/** What a scene's script works with. */
type Kit = {
  cursor: Cursor;
  root: () => HTMLElement | null;
  /** Plays the table's 1.5s fetch: skeletons, then the rows. */
  reload: () => void;
  /** Moves the camera. */
  shoot: (shot: Shot) => void;
};

const subscribeNever = () => () => {};

/** The scripted pointer, over the page at the table's place, its size
 *  zoomed with the shot as a recording zoomed in an edit would be. Placed
 *  every frame: the camera moves the table without resizing anything. */
function SceneCursor({
  rootRef,
  cursor,
  size,
}: {
  rootRef: React.RefObject<HTMLElement | null>;
  cursor: Cursor;
  size: number;
}) {
  const box = useRef<HTMLDivElement>(null);
  const mounted = useSyncExternalStore(subscribeNever, () => true, () => false);
  useEffect(() => {
    let id = 0;
    const place = () => {
      const r = rootRef.current?.getBoundingClientRect();
      if (r && box.current) box.current.style.transform = `translate(${r.left}px, ${r.top}px)`;
      id = requestAnimationFrame(place);
    };
    place();
    return () => cancelAnimationFrame(id);
  }, [rootRef, mounted]);
  if (!mounted) return null;
  return createPortal(
    <div ref={box} aria-hidden className="pointer-events-none fixed left-0 top-0 z-[calc(var(--z-popover,60)+20)] size-0">
      <FakeCursor x={cursor.x} y={cursor.y} scale={cursor.scale} opacity={cursor.opacity} size={size} />
    </div>,
    document.body
  );
}

/** Hands the playground's reload to the script. */
function Expose({ value, into }: { value: () => void; into: React.RefObject<() => void> }) {
  useEffect(() => {
    into.current = value;
  });
  return null;
}

/** The Components table under a camera, with a script that plays in a loop
 *  while the frame plays. A script ends where it started: the loop runs it
 *  again from the top. Menus open in portals, so the cursor reaches them. */
function ScriptedComponents({
  script,
  prepare,
  reset,
  initial,
  opening = WIDE,
  keys = false,
}: {
  /** Plays from the keyboard: see postReady. */
  keys?: boolean;
  script: (kit: Kit) => Step[];
  /** Setup that runs once, on load, before the script can play: what a
   *  scene needs in place (a saved view) but never shows being made. */
  prepare?: (kit: Kit) => Step[];
  /** When the frame stops mid-script: back to the opening state. */
  reset?: () => void;
  initial?: Parameters<typeof DataTablePlayground>[0]["initial"];
  /** The shot the scene opens on. */
  opening?: Shot;
}) {
  const playing = useContext(Playing);
  const { video, run, from, prep, paused, onscreen } = useContext(Video);
  const reduced = useReducedMotion();
  const ready = useFontsReady();
  // Off screen, a scene that doesn't play from the keyboard keeps its
  // hands off the page's focus: a menu it opens in its setup took focus
  // from the scene on screen, and a calendar open there closed.
  const onscreenRef = useRef(onscreen);
  useEffect(() => {
    onscreenRef.current = onscreen;
  }, [onscreen]);
  useEffect(() => {
    if (!video || keys) return;
    const focus = HTMLElement.prototype.focus;
    HTMLElement.prototype.focus = function (this: HTMLElement, options?: FocusOptions) {
      if (!onscreenRef.current && !document.hasFocus()) return;
      focus.call(this, options);
    };
    return () => {
      HTMLElement.prototype.focus = focus;
    };
  }, [video, keys]);
  const rootRef = useRef<HTMLDivElement>(null);
  const reloadRef = useRef<() => void>(() => {});
  const [shot, setShot] = useState(opening);
  const [prepared, setPrepared] = useState(!prepare);
  const set = ready && prepared && !reduced;
  const on = video ? set && run > 0 : set && playing;
  const cursor = useScriptCursor(rootRef, on, "[role=menu],[role=dialog],[role=listbox]");
  const kit: Kit = { cursor, root: () => rootRef.current, reload: () => reloadRef.current(), shoot: setShot };
  const steps = script(kit);
  const back = () => {
    setShot(opening);
    reset?.();
  };
  useScript(on, video ? run : 0, steps, !video, back, video && paused, video ? from : -1);
  // The setup, once, as soon as the table is there.
  // The board's frames set up on first play: 9 frames setting up together
  // on load took focus from each other.
  useScript(ready && !prepared && !reduced && (video ? prep : playing), 0, [...(prepare?.(kit) ?? []), { ms: 0, run: () => setPrepared(true) }], false);
  const { lead, window: shown } = cueOf(steps);
  useEffect(() => {
    if (video && prep && ready && prepared) postReady(lead, shown, keys);
  }, [video, prep, ready, prepared, lead, shown, keys]);
  return (
    <Styled look={{}} className={cn("size-full", TITLE_ANCHOR)}>
      <Camera shot={shot} settle={!on}>
        <Stage>
          <div ref={rootRef}>
            <DataTablePlayground initial={initial}>
              {({ demoPreview, onReplay }) => (
                <>
                  {onReplay && <Expose value={onReplay} into={reloadRef} />}
                  {demoPreview}
                </>
              )}
            </DataTablePlayground>
          </div>
        </Stage>
      </Camera>
      <SceneCursor rootRef={rootRef} cursor={cursor} size={24 * shot.zoom} />
    </Styled>
  );
}

const $ = (selector: string) => document.querySelector<HTMLElement>(selector);
/** The menu open on the page (the script's own: nothing else opens one). */
const openMenu = () => $("[role=menu]");
const menuItem = (label: string) =>
  [...(openMenu()?.querySelectorAll<HTMLElement>("[role^=menuitem]") ?? [])].find((el) => el.textContent?.includes(label));
/** The element reading `text`. Labels that change weight carry their text
 *  twice (a hidden sizer beside the shown one), so that counts too. */
const byText = (selector: string, text: string) =>
  [...document.querySelectorAll<HTMLElement>(selector)].find((el) => {
    const t = el.textContent?.trim();
    return t === text || t === text + text;
  });
/** A key pressed where focus is, as a keyboard sends it. */
const press = (key: string, init: KeyboardEventInit = {}) => pressAt(document.activeElement ?? document.body, key, init);
/** A key sent to `at` itself. Cleanup sends its keys this way: in the
 *  video, the scene on screen holds focus, and cleanup off screen must not
 *  take it (focus moved in one frame leaves the others). */
const pressAt = (at: Element | null | undefined, key: string, init: KeyboardEventInit = {}) => {
  if (!at) return;
  at.dispatchEvent(new KeyboardEvent("keydown", { key, bubbles: true, cancelable: true, ...init }));
  at.dispatchEvent(new KeyboardEvent("keyup", { key, bubbles: true, cancelable: true, ...init }));
};
/** Lets go of focus, if this scene holds it. */
const letGo = () => (document.activeElement as HTMLElement | null)?.blur();
const escape = () => press("Escape");
/** For the next `ms`, focus that lands (a closing menu handing it back
 *  to its trigger) is let go at once, before a ring can paint: a script's
 *  focus counts as the keyboard's. */
const noRefocus = (ms = 500) => {
  const drop = (e: FocusEvent) => (e.target as HTMLElement | null)?.blur?.();
  document.addEventListener("focusin", drop, true);
  window.setTimeout(() => document.removeEventListener("focusin", drop, true), ms);
};

/** Glide onto `el` (found when the step runs), rest, then click it. */
function pickSteps(cursor: Cursor, find: () => HTMLElement | null | undefined, glideMs: number, holdMs: number): Step[] {
  return [
    {
      ms: glideMs,
      run: () => {
        const el = find();
        if (el) cursor.goto(el);
      },
    },
    {
      ms: holdMs,
      run: () => {
        const el = find();
        if (!el) return;
        cursor.click();
        el.click();
      },
    },
  ];
}

const rollFirst = ([first, ...rest]: Step[]) => [roll(first), ...rest];

/** Setup: once `ready` holds, `run`, then a beat. */
const when = (ready: () => unknown, run: () => void, ms = 150): Step => ({ ms, run, wait: () => !!ready() });
/** Setup: click what `find` finds, once it is there. */
const click = (find: () => HTMLElement | false | null | undefined, ms = 150): Step =>
  when(find, () => (find() || undefined)?.click(), ms);
const loaded = () => !!$("tbody td") && !$("tbody [data-slot=skeleton]");
const chip = (label: string) => $(`[aria-label="Remove the ${label} filter"]`);

/** A click with no cursor: setup and teardown, off camera. */
const tap = (ms: number, find: () => HTMLElement | null | undefined): Step => ({ ms, run: () => find()?.click() });

const SEARCH_BUTTON = 'button[aria-label="Search components"]';
const searchField = () => $('input[aria-label="Search components"]') as HTMLInputElement | null;

/** Search, 1s close-up: the field opens and "dropdown" types in. The
 *  shot sits left of the button, where the open field grows. */
function SearchScene() {
  const clear = () => {
    const field = searchField();
    if (field) setFieldValue(field, "");
    pressAt(field, "Escape");
  };
  return (
    <ScriptedComponents
      opening={{ target: SEARCH_BUTTON, zoom: 2.6, dx: -94 }}
      script={({ cursor }) => [
        // Off camera: the pointer comes to rest on the button.
        { ms: 700, run: () => cursor.goto(SEARCH_BUTTON) },
        // On camera, 1s.
        roll({
          ms: 250,
          run: () => {
            cursor.click();
            $(SEARCH_BUTTON)?.click();
          },
        }),
        ...retypeSteps(searchField, "", "dropdown", 300),
        // Off camera: empty, closed, and the pointer away.
        end({ ms: 300, run: clear }),
        {
          ms: 600,
          run: () => {
            letGo();
            cursor.goto("tbody tr:nth-child(4) td:nth-child(3)");
          },
        },
      ]}
      reset={clear}
    />
  );
}

const addedField = () => $('input[role=combobox][aria-label="Added between"]');
const addedChip = () => $('[aria-label="Remove the Added filter"]');
/** The date filter's calendar as the video shows it: one month, no
 *  presets beside it (the filter's own popup has both). Shared by the
 *  scenes that pick from it, so it sits in the same place in each. */
const CALENDAR_CSS =
  "[data-slot=date-picker-popup] div:has(> [data-slot=date-picker-presets]){display:none}" +
  "[data-slot=date-picker-popup] [data-slot=calendar-month] ~ [data-slot=calendar-month]{display:none}";
/** A day in the open calendar, by ISO date. */
const dayCell = (iso: string) => $(`[data-day="${iso}"] button`);
const isoDay = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
/** This month, from its 1st to today: picked as two clicks. */
const monthStart = () => {
  const d = new Date();
  return isoDay(new Date(d.getFullYear(), d.getMonth(), 1));
};
const today = () => isoDay(new Date());
/** Off camera: an Added chip with its calendar open. A new chip opens
 *  its calendar itself once it lands, unless it's late: the field is
 *  clicked only while it's still shut (a click on an open one shuts it). */
const openCalendar = () => {
  const field = addedField();
  if (field && field.getAttribute("aria-expanded") !== "true") field.click();
};
const addedSetup = (root: () => HTMLElement | null): Step[] => [
  tap(350, () => root()?.querySelector<HTMLElement>("button[aria-label=Filter]")),
  tap(500, () => menuItem("Added")),
  { ms: 300, run: openCalendar },
  { ms: 200, run: openCalendar },
];
/** The calendar closed, and the field it leaves focused let go: closed
 *  as a pointer would leave it, with no ring. */
const closeCalendar = () => {
  noRefocus();
  pressAt(addedField(), "Escape");
  letGo();
};
const clearAdded = () => {
  pressAt(addedField(), "Escape");
  escape();
  addedChip()?.click();
};

/** Filters, 2.9s on screen: it opens on an "Added between any day" chip
 *  with its calendar open (one month), the cursor picks this month's 1st,
 *  then today, and the rows narrow to the ones added since. The chip's setup and removal are off
 *  camera. */
function FiltersScene() {
  return (
    <>
      {/* The setup's click leaves focus on the Filter button, whose
          tooltip a pointer's click wouldn't raise. (The calendar holds
          tooltips of its own, and stays.) */}
      <style>{"[data-radix-popper-content-wrapper]:has([role=tooltip]):not(:has([data-preset-index])){display:none}" + CALENDAR_CSS}</style>
      <ScriptedComponents
      script={({ cursor, root }) => [
        ...addedSetup(root),
        // On camera: the range's first day, then today, the range drawn,
        // then the rows hold.
        ...rollFirst(pickSteps(cursor, () => dayCell(monthStart()), 500, 300)),
        ...pickSteps(cursor, () => dayCell(today()), 450, 600),
        { ms: 1000, run: closeCalendar },
        // Off camera: the chip goes.
        end(tap(600, addedChip)),
      ]}
      reset={clearAdded}
    />
    </>
  );
}

/** The pointer events a mouse sends on arriving at (or leaving) `el`:
 *  tooltips open on these, which the scripted cursor's mouse events don't
 *  reach. */
function point(el: Element | null, leave = false) {
  if (!el) return;
  const r = el.getBoundingClientRect();
  const at = { clientX: r.left + r.width / 2, clientY: r.top + r.height / 2, pointerType: "mouse", isPrimary: true };
  const types = leave ? ["pointerout", "pointerleave"] : ["pointerover", "pointerenter", "pointermove"];
  for (const type of types)
    el.dispatchEvent(new PointerEvent(type, { ...at, bubbles: type !== "pointerenter" && type !== "pointerleave", cancelable: true }));
}

const TOOLBAR = ["button[aria-label=Filter]", "button[aria-label=Columns]", SEARCH_BUTTON];

/** Toolbar tooltips, 1s close-up: the pointer crosses the 3 icon buttons
 *  and one tooltip glides between them. Each hand-over is sent halfway
 *  through the glide, where the pointer crosses into the next button. */
function TooltipsScene() {
  const [filter, columns, search] = TOOLBAR;
  return (
    <ScriptedComponents
      opening={{ target: columns, zoom: 2.4 }}
      // The cursor's own moves hand the tooltip over (PointerBridge), the
      // moment it crosses into the next button: the bubble glides there.
      script={({ cursor }) => [
        { ms: 500, run: () => cursor.goto(filter) },
        // The first tooltip waits out its delay; the group's next ones don't.
        roll({ ms: 450, run: () => {} }),
        { ms: 550, run: () => cursor.goto(columns) },
        { ms: 550, run: () => cursor.goto(search) },
        // Off camera: away, so the tooltip closes before the next pass.
        end({ ms: 900, run: () => cursor.goto("tbody tr:nth-child(4) td:nth-child(3)") }),
      ]}
      reset={() => TOOLBAR.forEach((b) => point($(b), true))}
    />
  );
}

/** Pointer events for the scripted cursor's mouse events. The cursor
 *  sends mouseover, mouseout and mousemove as it glides; tooltips (and
 *  anything else on pointer events) listen for the pointer kind, so each
 *  scripted mouse event is sent again as one, on the same target. */
function PointerBridge() {
  useEffect(() => {
    const kinds: Record<string, string> = { mouseover: "pointerover", mouseout: "pointerout", mousemove: "pointermove" };
    const relay = (e: MouseEvent) => {
      if (e.isTrusted) return;
      e.target?.dispatchEvent(
        new PointerEvent(kinds[e.type], {
          bubbles: true,
          cancelable: true,
          clientX: e.clientX,
          clientY: e.clientY,
          relatedTarget: e.relatedTarget,
          pointerType: "mouse",
          isPrimary: true,
        })
      );
    };
    for (const type of Object.keys(kinds)) document.addEventListener(type, relay as EventListener, true);
    return () => {
      for (const type of Object.keys(kinds)) document.removeEventListener(type, relay as EventListener, true);
    };
  }, []);
  return null;
}

const VIEW_NAME = "Recent";
const viewTab = () => byText("[role=tab]", VIEW_NAME);
const viewField = () => $('input[aria-label="View name"]') as HTMLInputElement | null;
/** Saved views, the Filters scene carried on: it opens on that scene's
 *  last frame (Added this month, the pointer on today's day) and saves
 *  it. The cursor clicks Save view, "Recent" types into
 *  the new tab, Enter keeps it. */
function ViewsScene() {
  return (
    <>
    <style>{CALENDAR_CSS}</style>
    <ScriptedComponents
      script={({ cursor, root }) => [
        // Off camera: the Filters scene's end, played again (its pick, so
        // the pointer rests where it left it).
        ...addedSetup(root),
        ...pickSteps(cursor, () => dayCell(monthStart()), 450, 200),
        ...pickSteps(cursor, () => dayCell(today()), 450, 200),
        { ms: 400, run: closeCalendar },
        // On camera: Save view, the name, Enter.
        roll({ ms: 550, run: () => cursor.goto(byText("button", "Save view") ?? "") }),
        {
          ms: 350,
          run: () => {
            cursor.click();
            byText("button", "Save view")?.click();
          },
        },
        ...retypeSteps(viewField, "", VIEW_NAME, 250),
        { ms: 1000, run: () => pressAt(viewField(), "Enter") },
        // Off camera: the view deleted (its open tab clicked again names
        // it, and the name's × deletes it), back to All with no filter.
        end(tap(400, viewTab)),
        tap(400, () => $('[aria-label="Delete view"]')),
        { ms: 300, run: letGo },
      ]}
      // Stopped midway: the view (or the filter, before it was saved) goes.
      reset={() => {
        const field = viewField();
        if (field) pressAt(field, "Escape");
        const tab = viewTab();
        if (!tab) return clearAdded();
        tab.click();
        window.setTimeout(() => $('[aria-label="Delete view"]')?.click(), 80);
      }}
    />
    </>
  );
}

/** Loading, 1s close-up on the rows: skeletons cross-fade into data. */
function LoadingScene() {
  return (
    <ScriptedComponents
      opening={{ target: "tbody tr:nth-child(2) td:nth-child(3)", zoom: 2.2 }}
      script={({ reload }) => [
        // The skeletons hold about 2s: the last of them, the cross-fade and
        // the rows are on camera.
        { ms: 1250, run: reload },
        roll({ ms: 1300, run: () => {} }),
        end({ ms: 400, run: () => {} }),
      ]}
    />
  );
}

const editRow = () => $("tbody tr:nth-child(1)");
/** Focus as Tab moves it: the ring shows, as it does for a keyboard. */
const tabTo = (el: HTMLElement | null | undefined) => el?.focus({ focusVisible: true } as FocusOptions);
/** Types into a cell's field: its combobox listens for a real InputEvent. */
const typeInto = (text: string) => {
  const field = document.activeElement;
  if (!(field instanceof HTMLInputElement)) return;
  Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set?.call(field, text);
  field.dispatchEvent(new InputEvent("input", { bubbles: true, data: text, inputType: "insertText" }));
};

/** Editing, 2s, keyboard only: Tab moves the focus from Primitives into
 *  the Props cell, 24 types over 13, Enter commits. Sorted by date, the
 *  row holds its place. */
function EditableScene() {
  const edits = useRef(0);
  const undoEdits = () => {
    for (; edits.current > 0; edits.current--) pressAt(editRow()?.querySelector("td"), "z", { metaKey: true });
  };
  return (
    <>
      {/* The cell's suggestion list ("Use 24") stays shut: the keys
          show as caps instead, as in the shortcuts scene. */}
      <style>{"body > div:has([role=listbox]){display:none}"}</style>
      <ScriptedComponents
        initial={{ editable: true, rowReorder: true }}
        keys
        script={() => [
          // On camera, 2.3s: focus lands on the row's Primitives cell, Tab
          // takes it into Props, 2 and 4 type over 13, Enter keeps 24.
          roll({ ms: 350, run: () => tabTo(editRow()?.querySelector<HTMLElement>('button[aria-label^="Primitives"]')) }),
          {
            ms: 400,
            run: () => {
              showKeys("Tab");
              tabTo(editRow()?.querySelector<HTMLElement>("[aria-label=Props]"));
            },
          },
          {
            ms: 250,
            run: () => {
              showKeys("2");
              typeInto("2");
            },
          },
          {
            ms: 400,
            run: () => {
              showKeys("4");
              typeInto("24");
            },
          },
          {
            ms: 940,
            run: () => {
              showKeys("↵");
              press("Enter");
              edits.current = 1;
            },
          },
          // Off camera: ⌘Z on the row takes the edit back, focus let go.
          end({ ms: 300, run: undoEdits }),
          { ms: 300, run: letGo },
        ]}
        // Stopped midway: an open field cancelled, a committed edit undone.
        reset={() => {
          if (document.activeElement instanceof HTMLInputElement) pressAt(document.activeElement, "Escape");
          undoEdits();
          letGo();
        }}
      />
      <KeyStrokes />
    </>
  );
}

// ── Keystrokes ──────────────────────────────────────────

const KEYS_EVENT = "teaser-keys";
/** Shows a keystroke in the scene's key-cap corner. */
const showKeys = (combo: string) => window.dispatchEvent(new CustomEvent(KEYS_EVENT, { detail: combo }));

/** The keys being pressed, as dark key caps at the bottom centre, `lift`
 *  px up: the one scene about the
 *  keyboard shows what it types (the editing one too). Each press replaces the
 *  last; they fade out after a pause. */
function KeyStrokes({ lift = 12 }: { lift?: number }) {
  const [shown, setShown] = useState<{ combo: string; n: number } | null>(null);
  useEffect(() => {
    let timer = 0;
    const on = (e: Event) => {
      const combo = (e as CustomEvent<string>).detail;
      setShown((old) => ({ combo, n: (old?.n ?? 0) + 1 }));
      clearTimeout(timer);
      timer = window.setTimeout(() => setShown(null), 900);
    };
    window.addEventListener(KEYS_EVENT, on);
    return () => {
      window.removeEventListener(KEYS_EVENT, on);
      clearTimeout(timer);
    };
  }, []);
  return (
    // Dark, whatever the scene's theme: the caps on the dark surface.
    <div
      aria-hidden
      className="pointer-events-none absolute inset-x-0 z-10 flex justify-center transition-opacity duration-150"
      style={{ opacity: shown ? 1 : 0, bottom: lift }}
    >
      <div className="dark rounded-[6px] bg-background p-1 text-foreground [color-scheme:dark]" style={{ zoom: 2 }}>
        {shown && <KeyCaps key={shown.n} keys={shown.combo} />}
      </div>
    </div>
  );
}

/** A shortcut: its keys shown, then the key pressed where focus is. */
const shortcut = (combo: string, key: string, init: KeyboardEventInit = {}) => {
  showKeys(combo);
  press(key, init);
};

const sortedTable = () => !!$('thead [aria-sort="ascending"], thead [aria-sort="descending"]');

/** Power user, 2.5s, keyboard only: ↓ ↓ to a row, ⇧↓ ↓ takes 3, ⌥↑ ↑
 *  lifts them up the list, ⌘Z ⌘Z puts them back. The keys show as caps. */
function ShortcutsScene() {
  const moves = useRef(0);
  const move = (by: number, run: () => void) => {
    run();
    moves.current += by;
  };
  return (
    <>
      <ScriptedComponents
        initial={{ rowReorder: true }}
        keys
        // Once, on load: rows only move unsorted, so the date sort goes
        // (⌥↑ asks, Remove sorting answers).
        prepare={() => [
          when(loaded, () => tabTo($("tbody tr")), 200),
          when(() => document.activeElement?.matches("tbody tr"), () => press("ArrowUp", { altKey: true })),
          click(() => byText("button", "Remove sorting")),
          when(() => !sortedTable() && !byText("button", "Remove sorting"), () => (document.activeElement as HTMLElement | null)?.blur()),
        ]}
        script={() => [
          // On camera: focus lands on the first row, then the keys.
          roll({ ms: 300, run: () => tabTo($("tbody tr")) }),
          { ms: 220, run: () => shortcut("↓", "ArrowDown") },
          { ms: 320, run: () => shortcut("↓", "ArrowDown") },
          { ms: 220, run: () => shortcut("⇧↓", "ArrowDown", { shiftKey: true }) },
          { ms: 380, run: () => shortcut("⇧↓", "ArrowDown", { shiftKey: true }) },
          { ms: 260, run: () => move(1, () => shortcut("⌥↑", "ArrowUp", { altKey: true })) },
          { ms: 450, run: () => move(1, () => shortcut("⌥↑", "ArrowUp", { altKey: true })) },
          { ms: 300, run: () => move(-1, () => shortcut("⌘Z", "z", { metaKey: true })) },
          { ms: 800, run: () => move(-1, () => shortcut("⌘Z", "z", { metaKey: true })) },
          // Off camera: the selection cleared, focus let go.
          end({ ms: 200, run: () => pressAt($("tbody tr td"), "Escape") }),
          { ms: 400, run: letGo },
        ]}
        // Stopped midway: moves still in place undone, the selection cleared.
        reset={() => {
          for (; moves.current > 0; moves.current--) pressAt($("tbody tr td"), "z", { metaKey: true });
          pressAt($("tbody tr td"), "Escape");
          letGo();
        }}
      />
      {/* The selection bar the range brings up stays hidden: only the
          keys show. */}
      <style>{'body > :has([aria-label="Selected rows"]){visibility:hidden}'}</style>
      <KeyStrokes />
    </>
  );
}

/** The undo toast's button (the empty table has an Undo of its own). */
const toastUndo = () =>
  [...document.querySelectorAll<HTMLElement>("button")].find(
    (b) => b.textContent?.startsWith("Undo") && !b.closest("[data-keyboard-scope]")
  );

/** The ending, 2.5s: close on the header box, "Select all 36", pull out,
 *  ⌘K opens the actions for all 36 and Delete 36 rows runs. The undo
 *  that brings them back is off camera. */
function SelectAllScene() {
  const opening: Shot = { target: '[aria-label="Select all rows"]', zoom: 2.4 };
  return (
    <>
    {/* The command menu sits high on a page; the frame is short, so it
        centres in it. `translate` composes with its own motion. */}
    <style>{"[role=dialog]{top:50%!important;translate:0 -50%}"}</style>
    <EmptyCopy />
    <ScriptedComponents
      opening={opening}
      script={({ cursor, shoot }) => [
        { ms: 0, run: () => shoot(opening) },
        { ms: 600, run: () => cursor.goto('[aria-label="Select all rows"]') },
        // On camera.
        roll({
          ms: 550,
          run: () => {
            cursor.click();
            $('[aria-label="Select all rows"]')?.click();
          },
        }),
        { ms: 450, run: () => shoot({ ...WIDE, glide: true }) },
        { ms: 450, run: () => press("k", { metaKey: true }) },
        ...pickSteps(cursor, () => byText("[role=option], [role=menuitem]", "Delete 36 rows"), 450, 1200),
        // Off camera: the toast's Undo brings the rows back and takes the
        // toast with it.
        end(tap(700, toastUndo)),
      ]}
      // Stopped midway: the menu closed, the rows back (deleted) or
      // unselected (selected).
      reset={() => {
        escape();
        const undo = toastUndo();
        if (undo) undo.click();
        else if ($('[aria-label="Select all rows"]')?.getAttribute("aria-checked") === "true") $('[aria-label="Select all rows"]')?.click();
      }}
    />
    </>
  );
}

/** The video's own words for the emptied table, over the playground's
 *  (the docs keep theirs): the loop's last frame asks for the next pass. */
const EMPTY_COPY: [string, string][] = [
  ["No components left", "No components"],
  ["Undo brings back what you deleted.", "Brings back what you deleted."],
  ["Undo", "Let's do it again"],
];
function EmptyCopy() {
  useEffect(() => {
    const swap = () =>
      document.querySelectorAll<HTMLElement>("[data-slot=table-empty] span, [data-slot=table-empty] button").forEach((el) => {
        for (const node of el.childNodes) {
          if (node.nodeType !== Node.TEXT_NODE) continue;
          const to = EMPTY_COPY.find(([from]) => node.textContent === from)?.[1];
          if (to) node.textContent = to;
        }
      });
    const watch = new MutationObserver(swap);
    watch.observe(document.body, { childList: true, subtree: true, characterData: true });
    return () => watch.disconnect();
  }, []);
  return null;
}

const SCENE_VIEWS: Record<SceneId, () => ReactNode> = {
  cuts: () => <CutsScene />,
  search: () => <SearchScene />,
  filters: () => <FiltersScene />,
  tooltips: () => <TooltipsScene />,
  views: () => <ViewsScene />,
  loading: () => <LoadingScene />,
  editable: () => <EditableScene />,
  shortcuts: () => <ShortcutsScene />,
  "select-all": () => <SelectAllScene />,
};

/** The scripted cursor can't trigger :hover, so it marks what it is over
 *  with `data-script-hover` (hero-shared) instead. This copies every
 *  :hover rule on the page onto that attribute, in its own layer, media
 *  and supports blocks, so what the cursor passes over lights up as it
 *  would under a mouse. Rebuilt when stylesheets are added. */
function ScriptHoverStyles() {
  const [css, setCss] = useState("");
  useEffect(() => {
    const mirror = (rules: CSSRuleList): string => {
      let out = "";
      for (const rule of rules) {
        if (rule instanceof CSSStyleRule) {
          if (rule.selectorText.includes(":hover"))
            out += `${rule.selectorText.replaceAll(":hover", "[data-script-hover]")}{${rule.style.cssText}}`;
        } else if (rule instanceof CSSLayerBlockRule) {
          const inner = mirror(rule.cssRules);
          if (inner) out += `@layer ${rule.name}{${inner}}`;
        } else if (rule instanceof CSSMediaRule || rule instanceof CSSSupportsRule) {
          const inner = mirror(rule.cssRules);
          if (inner) out += `@${rule instanceof CSSMediaRule ? "media" : "supports"} ${rule.conditionText}{${inner}}`;
        }
      }
      return out;
    };
    let count = -1;
    const build = () => {
      const sheets = [...document.styleSheets].filter((sheet) => !(sheet.ownerNode as Element | null)?.hasAttribute?.("data-script-hover-css"));
      if (sheets.length === count) return;
      count = sheets.length;
      setCss(
        sheets
          .map((sheet) => {
            try {
              return mirror(sheet.cssRules);
            } catch {
              return "";
            }
          })
          .join("")
      );
    };
    build();
    const id = window.setInterval(build, 1000);
    return () => clearInterval(id);
  }, []);
  return <style data-script-hover-css="">{css}</style>;
}

/** The page one iframe shows: the scene named by `?id`, at 1280×720.
 *  Scripted docs demos inside stay still (PreviewPlaybackContext). */
export function SceneHost() {
  const params = useSearchParams();
  const id = (params.get("id") ?? "cuts") as SceneId;
  const video = params.has("video");
  const [run, setRun] = useState(0);
  const [prep, setPrep] = useState(false);
  const [paused, setPaused] = useState(false);
  const [from, setFrom] = useState(-1);
  const [onscreen, setOnscreen] = useState(false);
  const view = SCENE_VIEWS[id] ?? SCENE_VIEWS.cuts;
  // In the board's iframe the frame says when to play; alone, it plays.
  const [playing, setPlaying] = useState(true);
  useEffect(() => {
    // A menu taking focus scrolls the page to show itself; the frame stays put.
    const pin = () => {
      if (window.scrollX || window.scrollY) window.scrollTo(0, 0);
    };
    window.addEventListener("scroll", pin);
    return () => {
      window.removeEventListener("scroll", pin);
    };
  }, []);
  useEffect(() => {
    if (window.parent !== window) setPlaying(false);
    const hear = (e: MessageEvent) => {
      if (e.origin !== window.location.origin) return;
      if (e.data?.type === "teaser-play") setPlaying(Boolean(e.data.playing));
      if (e.data?.type === "teaser-run") {
        setFrom(typeof e.data.from === "number" ? e.data.from : -1);
        setRun((n) => n + 1);
      }
      if (e.data?.type === "teaser-prepare") setPrep(true);
      if (e.data?.type === "teaser-pause") setPaused(Boolean(e.data.paused));
      if (e.data?.type === "teaser-onscreen") setOnscreen(Boolean(e.data.on));
      // A jump on the timeline: the run stops and the scene resets.
      if (e.data?.type === "teaser-stop") setRun(0);
    };
    window.addEventListener("message", hear);
    // The scene on screen holds focus (the player gives it): Space, from
    // a person, still plays and pauses the video.
    const space = (e: KeyboardEvent) => {
      if (!video || !e.isTrusted || e.key !== " ") return;
      e.preventDefault();
      window.parent.postMessage({ type: "teaser-toggle" }, window.location.origin);
    };
    window.addEventListener("keydown", space, true);
    return () => {
      window.removeEventListener("message", hear);
      window.removeEventListener("keydown", space, true);
    };
  }, [video]);
  return (
    <Video.Provider value={{ video, run, from, prep, paused, onscreen }}>
    <Playing.Provider value={playing && !video}>
      <PreviewPlaybackContext.Provider value={false}>
        {/* The dev overlay's badge would sit in every frame. */}
        <style>{"nextjs-portal{display:none}html,body{overflow:clip}"}</style>
        <ScriptHoverStyles />
        <PointerBridge />
        <div
          className="relative overflow-hidden bg-background"
          style={{ width: LW, height: LH }}
          data-keyboard-scope=""
        >
          {view()}
        </div>
      </PreviewPlaybackContext.Provider>
    </Playing.Provider>
    </Video.Provider>
  );
}
