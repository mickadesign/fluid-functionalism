"use client";

import { memo, useEffect, useMemo, useRef, useState } from "react";
import { STAGE_W, STAGE_H } from "./glyphs";
import { SWITCH_FIELD } from "./glyph-config";
import { Switch } from "@/registry/radix/switch";

const FALLBACK = "500";

// GitHub octocat mark (16×16), same path the site's GitHub button uses — drawn
// into the raster so it becomes part of the switch glyph.
const GITHUB_PATH =
  "M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27s1.36.09 2 .27c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0016 8c0-4.42-3.58-8-8-8z";

type Cell = { x: number; y: number; inGlyph: boolean };

// Rasterize `text` (the live star count) to an offscreen canvas, auto-fitting
// the Inter Bold size to the stage, then tile the WHOLE stage with switches.
// Cells whose center is inside the glyphs are "glyph" switches; the rest are
// inert background. Runs client-side (needs canvas + the loaded webfont).
function buildSwitchField(text: string): Cell[] {
  if (typeof document === "undefined") return [];
  const { stepX, stepY } = SWITCH_FIELD;
  const canvas = document.createElement("canvas");
  canvas.width = STAGE_W;
  canvas.height = STAGE_H;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return [];
  ctx.fillStyle = "#000";
  ctx.textBaseline = "middle";
  // Auto-fit so [GitHub mark] + gap + number together fill the stage width
  // (and stay within height). LOGO/GAP are sized relative to the font px.
  const LOGO = 0.82;
  const GAP = 0.32;
  ctx.font = "700 100px Inter, sans-serif";
  const k = (ctx.measureText(text).width || 1) / 100; // number width per font px
  const fontSize = Math.min(
    (STAGE_W - 110) / (LOGO + GAP + k),
    (STAGE_H - 44) / LOGO,
    440
  );
  ctx.font = `700 ${fontSize}px Inter, sans-serif`;
  const numW = ctx.measureText(text).width;
  const logoSize = fontSize * LOGO;
  const gap = fontSize * GAP;
  const groupW = logoSize + gap + numW;
  const startX = (STAGE_W - groupW) / 2;
  const cy = STAGE_H / 2;
  // GitHub mark on the left
  const s = logoSize / 16;
  ctx.save();
  ctx.translate(startX + 8, cy - logoSize / 2); // nudge the mark 8px right
  ctx.scale(s, s);
  ctx.fill(new Path2D(GITHUB_PATH));
  ctx.restore();
  // number to the right
  ctx.textAlign = "left";
  ctx.fillText(text, startX + logoSize + gap, cy + fontSize * 0.04);
  const data = ctx.getImageData(0, 0, STAGE_W, STAGE_H).data;
  const inFill = (x: number, y: number) => {
    x |= 0;
    y |= 0;
    if (x < 0 || y < 0 || x >= STAGE_W || y >= STAGE_H) return false;
    return data[(y * STAGE_W + x) * 4 + 3] > 12;
  };

  const cells: Cell[] = [];
  for (let y = 6; y <= STAGE_H - 6; y += stepY) {
    for (let x = 6; x <= STAGE_W - 6; x += stepX) {
      cells.push({ x, y, inGlyph: inFill(x, y) });
    }
  }
  return cells;
}

// Memoized so a cascade tick (which flips one index) only re-renders the single
// switch whose `checked` actually changed — `onToggle` stays referentially
// stable per index.
const FieldSwitch = memo(function FieldSwitch({
  x,
  y,
  scale,
  checked,
  onToggle,
}: {
  x: number;
  y: number;
  scale: number;
  checked: boolean;
  onToggle: () => void;
}) {
  return (
    <div
      className="absolute"
      style={{ left: x, top: y, transform: `translate(-50%, -50%) scale(${scale})` }}
    >
      <Switch label="" checked={checked} onToggle={onToggle} className="!p-0 !gap-0" />
    </div>
  );
});

export default function StarsPage() {
  // Scale the fixed-size stage down to fit narrow viewports.
  const wrapRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const update = () => setScale(Math.min(1, el.clientWidth / STAGE_W));
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Live GitHub star count → the number rendered as switches. Polls our cached
  // /api/stars route so the page updates while it's open.
  const [stars, setStars] = useState<number | null>(null);
  useEffect(() => {
    let alive = true;
    const load = () =>
      fetch("/api/stars")
        .then((r) => (r.ok ? r.json() : null))
        .then((d) => {
          if (alive && typeof d?.stars === "number") setStars(d.stars);
        })
        .catch(() => {});
    load();
    const id = setInterval(load, 30000);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, []);

  const text = stars != null ? String(stars) : FALLBACK;

  // Build the field client-side, rebuilding when the count changes (and once
  // webfonts settle). Every switch starts OFF — the background switches are
  // inert filler; only the glyph switches light up via the cascade.
  const [pts, setPts] = useState<Cell[]>([]);
  const [states, setStates] = useState<boolean[]>([]);
  useEffect(() => {
    let cancelled = false;
    const build = () => {
      if (cancelled) return;
      const field = buildSwitchField(text);
      setPts(field);
      setStates(new Array(field.length).fill(false));
    };
    build();
    document.fonts?.ready.then(build);
    return () => {
      cancelled = true;
    };
  }, [text]);

  // Stable per-index toggles so manual hover/click stays cheap and memo-friendly.
  const toggles = useMemo(
    () =>
      pts.map((_, i) => () =>
        setStates((s) => {
          const next = s.slice();
          next[i] = !next[i];
          return next;
        })
      ),
    [pts]
  );

  // Footer button: cascade every switch ON one-by-one (10ms apart); click again
  // to sweep them all OFF in reverse (5ms apart). Re-clicking mid-run cancels.
  // Driven by rAF (not one timer per switch) so the stagger stays time-accurate
  // and we batch each frame's flips into a single state update.
  const rafRef = useRef<number | null>(null);
  useEffect(
    () => () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    },
    []
  );

  const runCascade = () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);

    // Direction derives from the glyph's current state: if most glyph switches
    // are off, sweep them ON; otherwise sweep OFF. Background switches are never
    // touched. Only act on those that need flipping; ON sweeps top→bottom, OFF
    // rewinds bottom→top.
    const glyph: number[] = [];
    for (let i = 0; i < pts.length; i++) if (pts[i].inGlyph) glyph.push(i);
    const onCount = glyph.reduce((n, i) => n + (states[i] ? 1 : 0), 0);
    const turnOn = onCount < glyph.length / 2;
    const delay = turnOn ? SWITCH_FIELD.cascadeOnMs : SWITCH_FIELD.cascadeOffMs;

    const work: number[] = [];
    if (turnOn) {
      for (const i of glyph) if (!states[i]) work.push(i);
    } else {
      for (let k = glyph.length - 1; k >= 0; k--)
        if (states[glyph[k]]) work.push(glyph[k]);
    }

    const start = performance.now();
    let done = 0;
    const tick = (now: number) => {
      // How many switches should have flipped by now, given the per-switch delay.
      const should = Math.min(work.length, Math.floor((now - start) / delay) + 1);
      if (should > done) {
        const batch = work.slice(done, should);
        done = should;
        setStates((s) => {
          const next = s.slice();
          for (const idx of batch) next[idx] = turnOn;
          return next;
        });
      }
      rafRef.current = done < work.length ? requestAnimationFrame(tick) : null;
    };
    rafRef.current = requestAnimationFrame(tick);
  };

  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center gap-10 overflow-hidden bg-background px-4 py-16 text-foreground">
      <div
        ref={wrapRef}
        className="w-full max-w-[1000px]"
        style={{ height: STAGE_H * scale }}
      >
        <div
          className="relative"
          style={{
            width: STAGE_W,
            height: STAGE_H,
            transform: `scale(${scale})`,
            transformOrigin: "top left",
          }}
        >
          <div className="absolute inset-0">
            {pts.map((p, i) => (
              <FieldSwitch
                key={i}
                x={p.x}
                y={p.y}
                scale={SWITCH_FIELD.scale}
                checked={!!states[i]}
                onToggle={toggles[i]}
              />
            ))}
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={runCascade}
        className="text-[13px] text-muted-foreground transition-colors hover:text-foreground cursor-pointer"
      >
        {text} stars. Thank you.
      </button>
    </div>
  );
}
