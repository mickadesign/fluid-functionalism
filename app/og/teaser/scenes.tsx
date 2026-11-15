"use client";

import {
  createContext,
  useContext,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
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
} from "@/app/docs/data-table/capability-demos";
import { cn } from "@/lib/utils";
import { useFontsReady } from "@/lib/docs/use-fonts-ready";
import { useLoop, useScriptCursor, type Cursor } from "@/app/docs/skill/hero-shared";
import { CursorLayer } from "@/app/docs/data-table/scripted";
import { LH, LW, type SceneId } from "./scene-list";

// The scenes, each at LW × LH CSS px (see scene-list). Scenes not yet animated show
// their key frame; animated ones play while the board's frame is hovered
// or pinned (a postMessage from board.tsx), and always when the page is
// opened on its own, as a recording would.

/** Every table: one width, its title at one spot, top-left of the frame. */
const TABLE_W = 800;
const TABLE_TOP = 28;

/** Whether the scene plays. Outside the board (opened alone) it always does. */
const Playing = createContext(true);

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

/** Centers a table in the 16:9 canvas at a readable width. */
function Stage({ children }: { children: ReactNode }) {
  return (
    <div className="absolute" style={{ width: TABLE_W, left: (LW - TABLE_W) / 2, top: TABLE_TOP }}>
      {children}
    </div>
  );
}

/** The camera: zooms the canvas onto the first element matching `target`,
 *  centred, at `zoom`. Measured once the layout settles. */
function Camera({
  target,
  zoom,
  children,
}: {
  target?: string;
  zoom: number;
  children: ReactNode;
}) {
  const root = useRef<HTMLDivElement>(null);
  const [shot, setShot] = useState({ x: 0, y: 0 });
  useLayoutEffect(() => {
    if (!target) return;
    let id = 0;
    const measure = () => {
      const box = root.current;
      const el = box?.querySelector(target);
      if (!box || !el) return;
      const b = box.getBoundingClientRect();
      const r = el.getBoundingClientRect();
      // Rects carry the camera's scale and the page zoom; offsetWidth
      // doesn't, so their ratio brings the target back to canvas units.
      const s = b.width / box.offsetWidth;
      const cx = (r.left + r.width / 2 - b.left) / s;
      const cy = (r.top + r.height / 2 - b.top) / s;
      setShot({ x: LW / 2 - cx, y: LH / 2 - cy });
    };
    // Fonts and the skeleton hand-over move things: measure again a few times.
    const run = () => {
      measure();
      id = window.setTimeout(run, 400);
    };
    run();
    return () => clearTimeout(id);
  }, [target]);
  return (
    <div className="absolute inset-0 overflow-hidden">
      <div
        ref={root}
        className="absolute inset-0"
        style={{
          transform: `scale(${zoom}) translate(${shot.x}px, ${shot.y}px)`,
          transformOrigin: "50% 50%",
        }}
      >
        {children}
      </div>
    </div>
  );
}

// ── The 8 cuts ──────────────────────────────────────────

const CUTS: { look: Look; table: ReactNode }[] = [
  { look: {}, table: <Components /> },
  {
    look: { dark: true, shape: "pill", accent: "violet" },
    table: <TeamTable />,
  },
  { look: { shape: "sharp", size: "compact" }, table: <TasksTable /> },
  { look: { dark: true, accent: "emerald" }, table: <FilesTable /> },
  {
    look: { shape: "pill", size: "compact", accent: "orange" },
    table: (
      <Components
        initial={{
          headerIcons: true,
          filter: "all",
          views: false,
          pageSize: "10",
        }}
      />
    ),
  },
  { look: { shape: "sharp" }, table: <ChangelogTable /> },
  {
    look: { dark: true, shape: "sharp", accent: "amber" },
    table: <FrozenTable />,
  },
  {
    look: { dark: true, shape: "pill", size: "compact", accent: "red" },
    table: (
      <Components
        initial={{ rowReorder: true, views: false, lines: "1" }}
      />
    ),
  },
];

/** 8 compositions, full frame, 0.2s each, hard cuts. All 8 stay mounted
 *  and laid out, so a cut swaps visibility and never waits on a render.
 *  Paused, it holds the current cut; reduced motion holds the first. */
const CUT_MS = 200;
/** The cut that opens with rows selected, and so shows the selection bar. */
const SELECTED_CUT = 1;

function CutsScene() {
  const reduced = useReducedMotion();
  const [cut, setCut] = useState(0);
  useStep(
    () => setCut((c) => (c + 1) % CUTS.length),
    CUT_MS,
    `cut:${cut}`,
    !reduced,
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
          // A title indents to its table's first data column, which moves
          // with checkbox and drag-handle columns: every cut's title is
          // set to one 28px indent, so it starts at one spot.
          className="absolute inset-0 [&_:is(h1,h3)]:pl-7!"
          // visibility, not display: hidden cuts keep their measured layout.
          style={{ visibility: i === shown ? "visible" : "hidden" }}
        >
          <Stage>{c.table}</Stage>
        </Styled>
      ))}
    </div>
  );
}

// ── Demos and details ───────────────────────────────────

function ComponentsScene({
  target,
  zoom = 1,
  loading = false,
}: {
  target?: string;
  zoom?: number;
  loading?: boolean;
}) {
  return (
    <Styled look={{}} className="size-full">
      <Camera target={target} zoom={zoom}>
        <Stage>
          <DataTablePlayground>
            {({ demoPreview, onReplay }) => (
              <>
                {loading && onReplay && <HoldLoading reload={onReplay} />}
                {demoPreview}
              </>
            )}
          </DataTablePlayground>
        </Stage>
      </Camera>
    </Styled>
  );
}

/** Keeps the table in its skeleton for the still: the reload starts a
 *  1.5s fetch, started again before it lands. */
function HoldLoading({ reload }: { reload: () => void }) {
  const ref = useRef(reload);
  useEffect(() => {
    ref.current = reload;
  });
  useEffect(() => {
    ref.current();
    const id = setInterval(() => ref.current(), 1200);
    return () => clearInterval(id);
  }, []);
  return null;
}

// ── Scripted demos ──────────────────────────────────────

type Step = { ms: number; run: () => void };

/** The Components table with a cursor that plays `script` in a loop while
 *  the frame plays. The script gets the cursor and the scene's root; menus
 *  open in portals, so `reach` lets the cursor hover them too. */
function ScriptedComponents({
  script,
  reset,
}: {
  script: (cursor: Cursor, root: () => HTMLElement | null) => Step[];
  reset?: () => void;
}) {
  const playing = useContext(Playing);
  const reduced = useReducedMotion();
  const ready = useFontsReady();
  const rootRef = useRef<HTMLDivElement>(null);
  const on = playing && ready && !reduced;
  const cursor = useScriptCursor(rootRef, on, "[role=menu]");
  useLoop(on, script(cursor, () => rootRef.current), reset);
  return (
    <Styled look={{}} className="size-full">
      <Stage>
        <div ref={rootRef}>
          <CursorLayer rootRef={rootRef} cursor={cursor} playing={on} />
          <DataTablePlayground>{({ demoPreview }) => demoPreview}</DataTablePlayground>
        </div>
      </Stage>
    </Styled>
  );
}

/** The menu open on the page (the script's own: nothing else opens one). */
const openMenu = () => document.querySelector<HTMLElement>("[role=menu]");
const menuItem = (label: string) =>
  [...(openMenu()?.querySelectorAll<HTMLElement>("[role^=menuitem]") ?? [])].find((el) => el.textContent?.includes(label));
const escape = () =>
  (document.activeElement ?? document.body).dispatchEvent(
    new KeyboardEvent("keydown", { key: "Escape", bubbles: true, cancelable: true })
  );

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

/** Filters, 2s on screen: Filter, then Primitives, then None. The chip
 *  lands and the rows narrow from 36 to the 10 with no primitive. After
 *  the hold, the storyboard's loop removes the chip (not in the video). */
function FiltersScene() {
  return (
    <ScriptedComponents
      script={(cursor, root) => [
        ...pickSteps(cursor, () => root()?.querySelector<HTMLElement>("button[aria-label=Filter]"), 500, 450),
        ...pickSteps(cursor, () => menuItem("Primitives"), 450, 450),
        ...pickSteps(cursor, () => menuItem("None"), 450, 300),
        { ms: 1400, run: escape },
        // Loop reset, off camera in the video.
        ...pickSteps(cursor, () => root()?.querySelector<HTMLElement>('[aria-label="Remove the Primitives filter"]'), 500, 900),
      ]}
      reset={() => {
        escape();
        document.querySelector<HTMLElement>('[aria-label="Remove the Primitives filter"]')?.click();
      }}
    />
  );
}

const SCENE_VIEWS: Record<SceneId, () => ReactNode> = {
  cuts: () => <CutsScene />,
  filters: () => <FiltersScene />,
  search: () => (
    <ComponentsScene target="[data-slot=data-table-search]" zoom={2.6} />
  ),
  editable: () => <ComponentsScene />,
  tooltips: () => (
    <ComponentsScene target="[data-slot=data-table-filters]" zoom={2.4} />
  ),
  views: () => <ComponentsScene />,
  loading: () => (
    <ComponentsScene
      target="tbody tr:nth-child(2) td:nth-child(3)"
      zoom={2.2}
      loading
    />
  ),
  selection: () => <ComponentsScene />,
  "select-all": () => (
    <ComponentsScene target={'[aria-label="Select all rows"]'} zoom={2.4} />
  ),
};

/** The page one iframe shows: the scene named by `?id`, at 1280×720.
 *  Scripted docs demos inside stay still (PreviewPlaybackContext). */
export function SceneHost() {
  const id = (useSearchParams().get("id") ?? "cuts") as SceneId;
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
      if (e.origin === window.location.origin && e.data?.type === "teaser-play")
        setPlaying(Boolean(e.data.playing));
    };
    window.addEventListener("message", hear);
    return () => window.removeEventListener("message", hear);
  }, []);
  return (
    <Playing.Provider value={playing}>
      <PreviewPlaybackContext.Provider value={false}>
        {/* The dev overlay's badge would sit in every frame. */}
        <style>{"nextjs-portal{display:none}html,body{overflow:clip}"}</style>
        <div
          className="relative overflow-hidden bg-background"
          style={{ width: LW, height: LH }}
          data-keyboard-scope=""
        >
          {view()}
        </div>
      </PreviewPlaybackContext.Provider>
    </Playing.Provider>
  );
}
