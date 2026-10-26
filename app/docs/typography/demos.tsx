"use client";

import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import {
  AnimatePresence,
  animate,
  easeInOut,
  motion,
  useInView,
  useMotionValue,
  useMotionValueEvent,
  useReducedMotion,
  useTransform,
  type AnimationPlaybackControls,
  type MotionValue,
} from "motion/react";
import { cn } from "@/lib/utils";
import { FluidHoverHighlight } from "@/components/ui/fluid-hover-highlight";
import type { ItemRect } from "@/registry/default/hooks/use-fluid-hover";
import { fontWeights } from "@/registry/default/lib/font-weight";
import { useShape } from "@/registry/default/lib/shape-context";
import { typeClass, useSizeVariant } from "@/registry/default/lib/size-context";
import { typeStyles, type TypeScaleRole } from "@/registry/default/lib/type-scale";
import { ScrollArea } from "@/registry/base/scroll-area";
import { ComponentPreview } from "@/lib/docs/ComponentPreview";
import { FakeCursor } from "@/lib/docs/fake-cursor";
import { HeadingWeightSelect, headingFontLabel, useHeadingFont } from "@/lib/docs/heading-font";
import { HEADING_FONTS } from "@/lib/docs/site-settings";
import { nearestGoogleFontWeight } from "@/lib/docs/google-fonts";
import { Button } from "@/components/ui/button";
import { TabsSubtle, TabsSubtleItem } from "@/components/flavored/tabs-subtle";

/** One side of a before/after: a framed specimen with its verdict under it,
 *  as on the fluid hover page. */
function Specimen({
  good,
  caption,
  className,
  children,
}: {
  good: boolean;
  caption: ReactNode;
  className?: string;
  children: ReactNode;
}) {
  const shape = useShape();
  return (
    <div className="flex min-w-0 flex-col items-center gap-3">
      <div className={cn("w-full border border-border/60", shape.container, className)}>{children}</div>
      <span className="flex items-center justify-center gap-2 text-center text-site-caption text-muted-foreground">
        <span aria-hidden="true">{good ? "✅" : "❌"}</span>
        <span>{caption}</span>
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// The scale, as a spec sheet
// ---------------------------------------------------------------------------

/** The 5 styles the page counts, each with the sample it sets (its own job),
 *  its weight, and its color. The numbers come from typeStyles. */
const SPEC: Array<{
  role: TypeScaleRole;
  name: string;
  sample: string;
  weight: "bold" | "semibold" | "normal";
  muted: boolean;
}> = [
  { role: "display", name: "Display", sample: "Page titles", weight: "bold", muted: false },
  { role: "title", name: "Title", sample: "Section titles", weight: "semibold", muted: false },
  { role: "subtitle", name: "Subtitle", sample: "Sub-headings and card titles", weight: "semibold", muted: false },
  { role: "body", name: "Body", sample: "Labels, menu items, and paragraphs", weight: "normal", muted: true },
  { role: "caption", name: "Caption", sample: "Descriptions and meta rows", weight: "normal", muted: true },
];

/** The axes a fontWeights token sets. */
const axes = (fvs: string) => ({
  wght: /'wght' (\d+)/.exec(fvs)?.[1],
  opsz: /'opsz' (\d+)/.exec(fvs)?.[1],
});

const HEADING_ROLES = new Set<TypeScaleRole>(["display", "title", "subtitle"]);

/** What a sample renders at, as the numbers columns show it. */
interface Measured {
  size: number;
  leading: number;
  wght: string;
  opsz: string;
}

/** Reads a sample's rendered size and weight. The heading font modes in
 *  globals.css restyle the heading roles (size, weight, optical size), so
 *  the specimen reports what the page actually draws rather than mirroring
 *  those values. A family without variation settings reports its
 *  font-weight and automatic optical size. */
function measure(el: HTMLElement): Measured {
  const cs = getComputedStyle(el);
  const fvs = cs.fontVariationSettings;
  return {
    size: Math.round(parseFloat(cs.fontSize)),
    leading: Math.round(parseFloat(cs.lineHeight)),
    wght: /"wght" ([\d.]+)/.exec(fvs)?.[1] ?? cs.fontWeight,
    opsz: /"opsz" ([\d.]+)/.exec(fvs)?.[1] ?? "auto",
  };
}

/** The 5 styles as a spec sheet: the name, a live sample, and the font size,
 *  line height, and weight (with its optical size), all at the page's size
 *  step, so S switches every number. */
export function TypeScaleSpecimen() {
  const shape = useShape();
  const step = useSizeVariant() === "compact" ? "compact" : "default";
  const { font, custom, weight } = useHeadingFont();
  // The rendered values, read back after every change that can restyle the
  // samples; the tokens stand in until then (server render, first paint).
  const sampleRefs = useRef(new Map<TypeScaleRole, HTMLElement>());
  const [measured, setMeasured] = useState<Partial<Record<TypeScaleRole, Measured>>>({});
  useLayoutEffect(() => {
    const next: Partial<Record<TypeScaleRole, Measured>> = {};
    for (const [role, el] of sampleRefs.current) {
      const m = measure(el);
      // A custom family draws its nearest cut: with no faux bold, a static
      // family asked for 700 shows its heaviest weight, so report that.
      if (font === "custom" && custom && m.opsz === "auto") {
        m.wght = String(nearestGoogleFontWeight(custom, Number(m.wght)));
      }
      next[role] = m;
    }
    setMeasured(next);
  }, [step, font, custom, weight]);
  const cols = "grid grid-cols-[80px_minmax(0,1fr)_64px_72px_56px] items-center gap-x-4 px-5";
  const num = "font-mono text-site-caption tabular-nums";
  return (
    <ScrollArea
      orientation="horizontal"
      viewportClassName="scroll-fade-x"
      className={cn("w-full border border-border/60", shape.container)}
    >
      <div className="min-w-[560px]">
        <div className={cn(cols, "border-b border-border/60 py-2.5 text-site-caption text-muted-foreground")}>
          <span>Style</span>
          <span>Sample</span>
          <span>Font size</span>
          <span>Line height</span>
          <span>Weight</span>
        </div>
        {SPEC.map(({ role, name, sample, weight, muted }) => {
          const tokens = axes(fontWeights[weight]);
          const { size, leading, wght, opsz } = measured[role] ?? {
            ...typeStyles[role][step],
            wght: tokens.wght,
            opsz: tokens.opsz,
          };
          return (
            <div key={role} className={cn(cols, "border-b border-border/40 py-4 last:border-b-0")}>
              <span className="text-site-body text-foreground" style={{ fontVariationSettings: fontWeights.semibold }}>
                {name}
              </span>
              <span
                // The heading roles follow the heading font (right panel > Heading font, or F).
                // One class each: tailwind-merge reads font-heading and
                // font-heading-display as rival font utilities and keeps one.
                className={cn("min-w-0 truncate", typeClass(role, step), muted ? "text-muted-foreground" : "text-foreground", role === "display" ? "font-heading-display" : HEADING_ROLES.has(role) && "font-heading")}
                style={{ fontVariationSettings: fontWeights[weight] }}
                ref={(el) => {
                  if (el) sampleRefs.current.set(role, el);
                  else sampleRefs.current.delete(role);
                }}
              >
                {sample}
              </span>
              <span className={cn(num, "text-foreground")}>{size}px</span>
              <span className={cn(num, "text-foreground")}>{leading}px</span>
              <span className={cn(num, "flex flex-col items-start")}>
                <span className="text-foreground">{wght}</span>
                <span className="text-muted-foreground">opsz {opsz}</span>
              </span>
            </div>
          );
        })}
      </div>
    </ScrollArea>
  );
}

// ---------------------------------------------------------------------------
// Weight + optical size
// ---------------------------------------------------------------------------

// Measured: weight alone widens it 2.4px, the paired weights 0.1px.
const MENU_LABEL = "Open the settings dialog";

/** One menu item that behaves like a sidebar row: a hover background under
 *  the pointer, and a click that sets the active background and turns the
 *  label semibold. The blue line marks the unselected width; whatever runs
 *  past it is tinted red. */
function WeightItem({
  settings,
  selected,
  onToggle,
  cursor,
  onDelta,
}: {
  settings: readonly [unselected: string, selected: string];
  selected: boolean;
  onToggle: () => void;
  /** The scripted pointer while it plays, and whether it's over the item. */
  cursor: { y: MotionValue<number>; over: boolean } | null;
  onDelta: (px: number) => void;
}) {
  const shape = useShape();
  const frameRef = useRef<HTMLDivElement>(null);
  const rowRef = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLSpanElement>(null);
  // The label at both weights, out of sight, so the line and the tint know
  // both widths whichever one shows.
  const sizerRefs = useRef<(HTMLSpanElement | null)[]>([]);
  // In px from the frame: the unselected label's right edge, how far past it
  // the selected label runs, the label's box, and the item's own box.
  const [marks, setMarks] = useState<{
    edge: number;
    over: number;
    top: number;
    height: number;
    row: ItemRect;
  } | null>(null);
  // A real pointer over the item, and its visit: each visit fades the hover
  // in where it lands, as fluid hover does.
  const [pointerOver, setPointerOver] = useState(false);
  const [visit, setVisit] = useState(0);
  const onDeltaRef = useRef(onDelta);
  onDeltaRef.current = onDelta;

  useLayoutEffect(() => {
    let cancelled = false;
    const measure = () => {
      const frame = frameRef.current;
      const row = rowRef.current;
      const label = labelRef.current;
      const [off, on] = sizerRefs.current.map((el) => el?.getBoundingClientRect().width);
      if (cancelled || !frame || !row || !label || off === undefined || on === undefined) return;
      const f = frame.getBoundingClientRect();
      const l = label.getBoundingClientRect();
      setMarks({
        edge: l.left - f.left + off,
        over: on - off,
        top: l.top - f.top,
        height: l.height,
        row: { top: row.offsetTop, left: row.offsetLeft, width: row.offsetWidth, height: row.offsetHeight },
      });
      onDeltaRef.current(on - off);
    };
    // Widths are only right once Inter has loaded.
    document.fonts.ready.then(measure);
    const ro = new ResizeObserver(measure);
    if (frameRef.current) ro.observe(frameRef.current);
    return () => {
      cancelled = true;
      ro.disconnect();
    };
  }, []);

  const hovered = cursor ? cursor.over : pointerOver;
  const on = selected ? 1 : 0;

  return (
    <div ref={frameRef} className="relative p-1" onMouseEnter={() => setVisit((v) => v + 1)}>
      {/* The active background, in on the click. */}
      <AnimatePresence>
        {selected && marks && (
          <motion.div
            aria-hidden
            className={cn("pointer-events-none absolute bg-active", shape.bg)}
            style={{ left: marks.row.left, top: marks.row.top, width: marks.row.width, height: marks.row.height }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.08 }}
          />
        )}
      </AnimatePresence>
      <FluidHoverHighlight rect={marks && hovered ? marks.row : null} session={visit} className={shape.bg} />
      {marks && (
        <span
          aria-hidden
          className="pointer-events-none absolute inset-y-2 z-20 w-px bg-[#6B97FF]"
          style={{ left: marks.edge }}
        />
      )}
      {/* What spills past the line, tinted over the selected label's end. */}
      {marks && selected && marks.over >= 0.5 && (
        <span
          aria-hidden
          className="pointer-events-none absolute z-20 bg-[#F2555A]/45"
          style={{ left: marks.edge, width: marks.over, top: marks.top - 3, height: marks.height + 6 }}
        />
      )}
      <div
        ref={rowRef}
        onMouseEnter={() => setPointerOver(true)}
        onMouseLeave={() => setPointerOver(false)}
        onClick={onToggle}
        className={cn("relative z-10 flex h-9 cursor-pointer items-center gap-2 px-2", typeClass("body"))}
      >
        <span
          ref={labelRef}
          className={cn(
            "whitespace-nowrap transition-[color,font-variation-settings] duration-80",
            selected || hovered ? "text-foreground" : "text-muted-foreground"
          )}
          style={{ fontVariationSettings: settings[on] }}
        >
          {MENU_LABEL}
        </span>
      </div>
      {settings.map((setting, i) => (
        <span
          key={i}
          ref={(node) => {
            sizerRefs.current[i] = node;
          }}
          aria-hidden
          className={cn("invisible absolute left-0 top-0 whitespace-nowrap", typeClass("body"))}
          style={{ fontVariationSettings: setting }}
        >
          {MENU_LABEL}
        </span>
      ))}
      {cursor && <FakeCursor x={CURSOR_X} y={cursor.y} />}
    </div>
  );
}

// The script, one loop shared by both items so they click together: the
// cursor comes down onto the label, rests a beat, clicks it on, holds long
// enough to read the result, clicks it off, and leaves. The item is 36px
// from a 4px inset; the arrow's tip lands just below its middle, over the
// label's first word, and waits above the frame, in the preview's padding.
const OUT_Y = -28;
const IN_Y = 24;
/** The item's top and bottom edges, for whether the cursor is over it. */
const ITEM_TOP = 4;
const ITEM_BOTTOM = 40;
const CURSOR_X = 56;
const GLIDE_S = 0.6;
const REST_S = 0.2;
const ON_S = 1.4;
const OFF_S = 0.6;
const AWAY_S = 0.4;
const LOOP_S = GLIDE_S + REST_S + ON_S + OFF_S + GLIDE_S + AWAY_S;
const at = (s: number) => s / LOOP_S;
const CLICK_ON = at(GLIDE_S + REST_S);
const CLICK_OFF = at(GLIDE_S + REST_S + ON_S);
const LEAVE = at(GLIDE_S + REST_S + ON_S + OFF_S);
const Y_TIMES = [0, at(GLIDE_S), LEAVE, LEAVE + at(GLIDE_S), 1];
const Y_KEYS = [OUT_Y, IN_Y, IN_Y, OUT_Y, OUT_Y];
const selectedAt = (p: number) => p >= CLICK_ON && p < CLICK_OFF;

const wider = (px: number | null) =>
  px === null ? "" : Math.abs(px) < 0.25 ? ": same width" : `: ${Math.abs(px).toFixed(1)}px wider`;

export function WeightOpszDemo() {
  const [plain, setPlain] = useState<number | null>(null);
  const [paired, setPaired] = useState<number | null>(null);
  // A cursor clicks the item on and off while the demo is on screen, in both
  // at once: 2px is hard to see standing still, and easy to see jump. A real
  // pointer inside the demo takes over and clicks it itself; reduced motion
  // leaves it to the reader, with the item on.
  const rootRef = useRef<HTMLDivElement>(null);
  const inView = useInView(rootRef, { amount: 0.5 });
  const reduceMotion = useReducedMotion();
  const [userInside, setUserInside] = useState(false);
  const scripted = inView && !reduceMotion && !userInside;
  const [selected, setSelected] = useState(true);

  const progress = useMotionValue(0);
  const y = useTransform(progress, Y_TIMES, Y_KEYS, { ease: easeInOut });
  const [scriptOver, setScriptOver] = useState(false);
  const controlsRef = useRef<AnimationPlaybackControls | null>(null);

  // One animation, paused and resumed in place, so the reader's pointer
  // holds the current frame.
  useEffect(() => {
    if (!scripted) {
      controlsRef.current?.pause();
      return;
    }
    if (controlsRef.current) {
      controlsRef.current.play();
      return;
    }
    controlsRef.current = animate(progress, [0, 1], { duration: LOOP_S, ease: "linear", repeat: Infinity });
  }, [scripted, progress]);
  useEffect(() => () => controlsRef.current?.stop(), []);

  useMotionValueEvent(progress, "change", (p) => {
    if (!scripted) return;
    setSelected(selectedAt(p));
    const cy = y.get();
    setScriptOver(cy >= ITEM_TOP && cy <= ITEM_BOTTOM);
  });

  const cursor = scripted ? { y, over: scriptOver } : null;

  return (
    <ComponentPreview hideHeader>
      <div
        ref={rootRef}
        className="grid w-full max-w-xl gap-5 sm:grid-cols-2"
        onMouseEnter={() => setUserInside(true)}
        onMouseMove={() => setUserInside(true)}
        onPointerDown={() => setUserInside(true)}
        onMouseLeave={() => setUserInside(false)}
      >
        {/* Weight alone leaves optical size on auto: the font size, 14 at
            the axis floor, either way. */}
        <Specimen good={false} caption={`Weight only${wider(plain)}`}>
          <WeightItem
            settings={["'wght' 400", "'wght' 550"]}
            selected={selected}
            onToggle={() => setSelected((v) => !v)}
            cursor={cursor}
            onDelta={setPlain}
          />
        </Specimen>
        <Specimen good caption={`Weight + optical size${wider(paired)}`}>
          <WeightItem
            settings={[fontWeights.normal, fontWeights.semibold]}
            selected={selected}
            onToggle={() => setSelected((v) => !v)}
            cursor={cursor}
            onDelta={setPaired}
          />
        </Specimen>
      </div>
    </ComponentPreview>
  );
}

// ---------------------------------------------------------------------------
// Tabular numbers
// ---------------------------------------------------------------------------

// Measured at 13px: Inter's default "1" is 5.3px wide and its "0" 8.2px, so
// the line drifts 6.2px as the count climbs from 10 to 48. Tabular digits are
// all 8.4px, and the line holds still.
const COUNT_FROM = 10;
const COUNT_TO = 48;
const countLabel = (n: number) => `Installed ${n} of ${COUNT_TO} components`;
const TICK_MS = 120;
/** Ticks the finished count holds before the next run. */
const HOLD_TICKS = 10;
const CYCLE_TICKS = COUNT_TO - COUNT_FROM + 1 + HOLD_TICKS;

/** A row whose count climbs. The blue line marks the narrowest count's
 *  width; whatever runs past it is tinted red. */
function CountRow({
  numeric,
  count,
  onDrift,
}: {
  /** `normal-nums` or `tabular-nums`. */
  numeric: string;
  count: number;
  onDrift: (px: number) => void;
}) {
  const frameRef = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLSpanElement>(null);
  // Takes every count's label in turn, out of sight, to measure it.
  const sizerRef = useRef<HTMLSpanElement>(null);
  // In px from the frame: the label's left edge, every count's width, and
  // the label's box.
  const [marks, setMarks] = useState<{
    left: number;
    widths: number[];
    top: number;
    height: number;
  } | null>(null);
  const onDriftRef = useRef(onDrift);
  onDriftRef.current = onDrift;

  useLayoutEffect(() => {
    let cancelled = false;
    const measure = () => {
      const frame = frameRef.current;
      const label = labelRef.current;
      const sizer = sizerRef.current;
      if (cancelled || !frame || !label || !sizer) return;
      const widths: number[] = [];
      for (let n = COUNT_FROM; n <= COUNT_TO; n++) {
        sizer.textContent = countLabel(n);
        widths.push(sizer.getBoundingClientRect().width);
      }
      const f = frame.getBoundingClientRect();
      const l = label.getBoundingClientRect();
      setMarks({ left: l.left - f.left, widths, top: l.top - f.top, height: l.height });
      onDriftRef.current(Math.max(...widths) - Math.min(...widths));
    };
    // Widths are only right once Inter has loaded.
    document.fonts.ready.then(measure);
    const ro = new ResizeObserver(measure);
    if (frameRef.current) ro.observe(frameRef.current);
    return () => {
      cancelled = true;
      ro.disconnect();
    };
  }, []);

  const rest = marks ? Math.min(...marks.widths) : 0;
  const over = marks ? marks.widths[count - COUNT_FROM] - rest : 0;

  return (
    <div ref={frameRef} className={cn("relative p-1", numeric)}>
      {marks && (
        <span
          aria-hidden
          className="pointer-events-none absolute inset-y-2 z-20 w-px bg-[#6B97FF]"
          style={{ left: marks.left + rest }}
        />
      )}
      {marks && over >= 0.5 && (
        <span
          aria-hidden
          className="pointer-events-none absolute z-20 bg-[#F2555A]/45"
          style={{ left: marks.left + rest, width: over, top: marks.top - 3, height: marks.height + 6 }}
        />
      )}
      <div className={cn("flex h-9 items-center px-2", typeClass("body"))}>
        <span ref={labelRef} className="whitespace-nowrap text-foreground">
          {countLabel(count)}
        </span>
      </div>
      <span
        ref={sizerRef}
        aria-hidden
        className={cn("invisible absolute left-0 top-0 whitespace-nowrap", typeClass("body"))}
      />
    </div>
  );
}

const drift = (px: number | null) =>
  px === null ? "" : px < 0.25 ? ": holds still" : `: drifts ${px.toFixed(1)}px`;

export function NumbersDemo() {
  const [proportional, setProportional] = useState<number | null>(null);
  const [tabular, setTabular] = useState<number | null>(null);
  // The count climbs in both rows at once while the demo is on screen, and
  // holds while a pointer is inside so a frame can be read. Reduced motion
  // shows the last count.
  const rootRef = useRef<HTMLDivElement>(null);
  const inView = useInView(rootRef, { amount: 0.5 });
  const reduceMotion = useReducedMotion();
  const [held, setHeld] = useState(false);
  const [tick, setTick] = useState(0);
  const playing = inView && !reduceMotion && !held;

  useEffect(() => {
    if (!playing) return;
    const id = setInterval(() => setTick((t) => (t + 1) % CYCLE_TICKS), TICK_MS);
    return () => clearInterval(id);
  }, [playing]);

  const count = reduceMotion ? COUNT_TO : Math.min(COUNT_FROM + tick, COUNT_TO);

  return (
    <ComponentPreview hideHeader>
      <div
        ref={rootRef}
        className="grid w-full max-w-xl gap-5 sm:grid-cols-2"
        onMouseEnter={() => setHeld(true)}
        onMouseLeave={() => setHeld(false)}
      >
        <Specimen good={false} caption={`Proportional digits${drift(proportional)}`}>
          <CountRow numeric="normal-nums" count={count} onDrift={setProportional} />
        </Specimen>
        <Specimen good caption={`Tabular digits${drift(tabular)}`}>
          <CountRow numeric="tabular-nums" count={count} onDrift={setTabular} />
        </Specimen>
      </div>
    </ComponentPreview>
  );
}

// ---------------------------------------------------------------------------
// Text-box trim
// ---------------------------------------------------------------------------

// Measured at 13px on a 20px line: the line box reaches 5.3px past the
// capitals and 5.3px past the baseline (Inter's two are equal), so 8px of
// padding reads as 13px. Trimmed, the box stops at the capitals and the
// baseline, and 8px reads as 8px.
const TRIM = "[text-box:trim-both_cap_alphabetic]";
const CHIP_LABEL = "Draft saved";
/** Inter's cap height in ems, from the font's OS/2 table (1490 / 2048). */
const INTER_CAP_HEIGHT = 1490 / 2048;

/** A chip with 8px of padding on every side. Blue lines mark its label's
 *  capitals and baseline; what the line box adds past them is tinted red. */
function TrimChip({ trimmed, onAbove }: { trimmed: boolean; onAbove: (px: number) => void }) {
  const shape = useShape();
  const chipRef = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLSpanElement>(null);
  // An empty inline block on the label's baseline: its bottom is the baseline.
  const baselineRef = useRef<HTMLSpanElement>(null);
  // In px from the chip: the label's box, its capitals' top, and its baseline.
  const [marks, setMarks] = useState<{
    left: number;
    width: number;
    top: number;
    bottom: number;
    cap: number;
    base: number;
  } | null>(null);
  const onAboveRef = useRef(onAbove);
  onAboveRef.current = onAbove;

  useLayoutEffect(() => {
    let cancelled = false;
    const measure = () => {
      const chip = chipRef.current;
      const label = labelRef.current;
      const baseline = baselineRef.current;
      if (cancelled || !chip || !label || !baseline) return;
      const c = chip.getBoundingClientRect();
      const l = label.getBoundingClientRect();
      const base = baseline.getBoundingClientRect().bottom - c.top;
      const cap = base - parseFloat(getComputedStyle(label).fontSize) * INTER_CAP_HEIGHT;
      setMarks({ left: l.left - c.left, width: l.width, top: l.top - c.top, bottom: l.bottom - c.top, cap, base });
      onAboveRef.current(cap);
    };
    // Metrics are only right once Inter has loaded.
    document.fonts.ready.then(measure);
    const ro = new ResizeObserver(measure);
    if (chipRef.current) ro.observe(chipRef.current);
    return () => {
      cancelled = true;
      ro.disconnect();
    };
  }, []);

  return (
    <div
      ref={chipRef}
      className={cn("relative inline-flex bg-[var(--tint)] p-2 text-foreground", shape.bg, typeClass("body"))}
    >
      {marks && marks.cap - marks.top >= 0.5 && (
        <span
          aria-hidden
          className="pointer-events-none absolute bg-[#F2555A]/45"
          style={{ left: marks.left, width: marks.width, top: marks.top, height: marks.cap - marks.top }}
        />
      )}
      {marks && marks.bottom - marks.base >= 0.5 && (
        <span
          aria-hidden
          className="pointer-events-none absolute bg-[#F2555A]/45"
          style={{ left: marks.left, width: marks.width, top: marks.base, height: marks.bottom - marks.base }}
        />
      )}
      {/* text-box needs a block container: the label is a flex item. */}
      <span ref={labelRef} className={cn("relative z-10 whitespace-nowrap", trimmed && TRIM)}>
        <span ref={baselineRef} aria-hidden className="inline-block h-0 w-0 align-baseline" />
        {CHIP_LABEL}
      </span>
      {marks &&
        [marks.cap, marks.base].map((y, i) => (
          <span
            key={i}
            aria-hidden
            className="pointer-events-none absolute inset-x-0 z-20 h-px -translate-y-1/2 bg-[#6B97FF]"
            style={{ top: y }}
          />
        ))}
    </div>
  );
}

const above = (px: number | null) =>
  px === null ? "" : `: ${Math.round(px)}px above the capitals`;

export function TrimDemo() {
  const [plain, setPlain] = useState<number | null>(null);
  const [trimmed, setTrimmed] = useState<number | null>(null);
  // A browser without text-box sets both chips the same.
  const [trims, setTrims] = useState(true);
  return (
    <ComponentPreview hideHeader>
      <div className="grid w-full max-w-xl gap-5 sm:grid-cols-2">
        <Specimen good={false} className="flex h-16 items-center justify-center" caption={`Untrimmed${above(plain)}`}>
          <TrimChip trimmed={false} onAbove={setPlain} />
        </Specimen>
        <Specimen
          good
          className="flex h-16 items-center justify-center"
          caption={`Trimmed${trims ? above(trimmed) : ": not in this browser yet"}`}
        >
          <TrimChip
            trimmed
            onAbove={(px) => {
              setTrimmed(px);
              setTrims(CSS.supports("text-box", "trim-both cap alphabetic"));
            }}
          />
        </Specimen>
      </div>
    </ComponentPreview>
  );
}

// ---------------------------------------------------------------------------
// Balance and pretty
// ---------------------------------------------------------------------------

// Measured at 214px: wrap sets the headline 4 words over 2 (199px, then
// 97px), balance 3 over 3 with the first line the longer (171px, 126px).
// Wrap leaves the paragraph's last word alone ("cursor."), and pretty
// brings "your" down to join it, with room either side to spare for font
// rendering.
const HEADLINE = "Give every component the same motion";
const PARAGRAPH =
  "Hover glides from item to item instead of blinking, so the highlight always sits under your cursor.";
const SAMPLE = "w-[214px] max-w-full";

const heading = (wrap: string) => (
  <p
    className={cn(typeClass("title"), SAMPLE, "text-foreground", wrap)}
    style={{ fontVariationSettings: fontWeights.semibold }}
  >
    {HEADLINE}
  </p>
);

const paragraph = (wrap: string) => (
  <p className={cn(typeClass("body"), SAMPLE, "text-muted-foreground", wrap)}>{PARAGRAPH}</p>
);

export function BalanceDemo() {
  return (
    <ComponentPreview hideHeader>
      <div className="grid w-full max-w-xl gap-5 sm:grid-cols-2">
        <Specimen good={false} className="px-4 py-5" caption={<><code>wrap</code> leaves a short last line</>}>
          {heading("[text-wrap:wrap]")}
        </Specimen>
        <Specimen good className="px-4 py-5" caption={<><code>balance</code> evens the lines</>}>
          {heading("[text-wrap:balance]")}
        </Specimen>
      </div>
    </ComponentPreview>
  );
}

export function PrettyDemo() {
  return (
    <ComponentPreview hideHeader>
      <div className="grid w-full max-w-xl gap-5 sm:grid-cols-2">
        <Specimen good={false} className="px-4 py-5" caption={<><code>wrap</code> leaves one word alone</>}>
          {paragraph("[text-wrap:wrap]")}
        </Specimen>
        <Specimen good className="px-4 py-5" caption={<><code>pretty</code> brings a word down to join it</>}>
          {paragraph("[text-wrap:pretty]")}
        </Specimen>
      </div>
    </ComponentPreview>
  );
}

/** The heading font switch: the same global setting as the right panel, so
 *  picking here also restyles every heading on the page. The third tab is
 *  the custom Google Fonts family: picked once through Browse, it stays,
 *  with its heading weight beside Browse. */
export function HeadingFontDemo() {
  const { font, custom, setFont, browse } = useHeadingFont();
  return (
    <ComponentPreview hideHeader inspectable={false}>
      <div className="flex w-full flex-col gap-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <TabsSubtle
            selectedIndex={HEADING_FONTS.indexOf(font)}
            onSelect={(i) => setFont(HEADING_FONTS[i])}
            idPrefix="heading-font-tabs"
            aria-label="Heading font"
          >
            {HEADING_FONTS.map((f, i) => (
              <TabsSubtleItem key={f} index={i} label={headingFontLabel(f, custom)} />
            ))}
          </TabsSubtle>
          <div className="flex items-center gap-1">
            <HeadingWeightSelect triggerClassName="min-w-0 w-auto" />
            <Button variant="secondary" size="sm" onClick={browse}>
              Browse Google Fonts
            </Button>
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <h3 className="text-site-display text-foreground" style={{ fontVariationSettings: fontWeights.bold }}>
            Getting started
          </h3>
          <h3 className="text-site-title text-foreground" style={{ fontVariationSettings: fontWeights.semibold }}>
            Install the components you need
          </h3>
          <p className="text-site-body text-muted-foreground">
            Body text stays in Inter, so only the hierarchy changes voice.
          </p>
        </div>
      </div>
    </ComponentPreview>
  );
}
