"use client";

import { useEffect, useRef, useState } from "react";
import {
  animate,
  easeInOut,
  useInView,
  useMotionValue,
  useMotionValueEvent,
  useReducedMotion,
  useTransform,
  type AnimationPlaybackControls,
} from "motion/react";
import { useShape } from "@/registry/default/lib/shape-context";
import { fontWeights } from "@/registry/default/lib/font-weight";
import { ScrollArea } from "@/registry/base/scroll-area";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/registry/default/table";
import { ComponentPreview } from "@/lib/docs/ComponentPreview";
import { FakeCursor } from "@/lib/docs/fake-cursor";
import { PropsTable } from "@/lib/docs/PropsTable";
import { DocPage, DocSection } from "@/lib/docs/DocPage";
import { scrollAreaProps } from "@/lib/docs/api/scrollbars";

// ---------------------------------------------------------------------------
// Demo data
// ---------------------------------------------------------------------------

const RELEASES = Array.from(
  { length: 24 },
  (_, i) => `v1.${23 - i}.0 — maintenance release`
);

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const CITIES = [
  "Amsterdam", "Berlin", "Copenhagen", "Dublin", "Helsinki", "Lisbon",
  "London", "Madrid", "Oslo", "Paris", "Prague", "Stockholm",
  "Vienna", "Warsaw", "Zurich",
];

// Deterministic fake metric so the table renders identically on every pass.
function metric(row: number, col: number) {
  return (((row + 3) * (col + 7) * 37) % 900) + 100;
}

// ---------------------------------------------------------------------------
// Code snippets
// ---------------------------------------------------------------------------

const PROBLEM_CODE = `// ❌ Native overflow. On macOS the scrollbar is hidden until
// you happen to scroll, so the list looks like it just stops —
// and when it does show, it's the OS default.
<div className="h-56 w-64 overflow-y-auto border border-border">
  <div className="flex flex-col p-3">
    {releases.map((r) => (
      <div key={r} className="px-3 py-2 text-body text-foreground whitespace-nowrap">
        {r}
      </div>
    ))}
  </div>
</div>

// ✅ ScrollArea. A scrollbar that stays discoverable on hover,
// plus a shadcn scroll-fade on the viewport so the edge dissolves
// when there's more below.
<ScrollArea
  viewportClassName="scroll-fade"
  className="h-56 w-64 border border-border"
>
  <div className="flex flex-col p-3">
    {releases.map((r) => (
      <div key={r} className="px-3 py-2 text-body text-foreground whitespace-nowrap">
        {r}
      </div>
    ))}
  </div>
</ScrollArea>`;

const HORIZONTAL_CODE = `import { ScrollArea } from "./components";

// scroll-fade-x fades the left/right edges instead.
<ScrollArea
  orientation="horizontal"
  viewportClassName="scroll-fade-x"
  className="w-full"
>
  <div className="flex gap-2 p-3 w-max">
    {months.map((month) => (
      <div
        key={month}
        className="flex items-center justify-center h-20 w-28 shrink-0 border border-border text-body text-foreground"
      >
        {month}
      </div>
    ))}
  </div>
</ScrollArea>`;

const FADE_CODE = `/* globals.css — vendored from shadcn's scroll-fade utility.
   A mask dissolves the content toward the edges with more to
   scroll; a scroll-driven animation (elided here — see the full
   utility in globals.css) keeps the true start/end edge crisp. */
.scroll-fade {
  --scroll-fade-size: 48px;
  -webkit-mask-image: linear-gradient(
    to bottom,
    transparent 0,
    #000 var(--scroll-fade-size),
    #000 calc(100% - var(--scroll-fade-size)),
    transparent 100%
  );
  mask-image: linear-gradient(
    to bottom,
    transparent 0,
    #000 var(--scroll-fade-size),
    #000 calc(100% - var(--scroll-fade-size)),
    transparent 100%
  );
}

/* Apply it to any scroll container, or to a ScrollArea viewport. */
<ScrollArea
  viewportClassName="scroll-fade"
  className="h-64 w-72 border border-border"
>
  <div className="flex flex-col p-3">
    {releases.map((r) => (
      <div key={r} className="px-3 py-2 text-body text-foreground whitespace-nowrap">
        {r}
      </div>
    ))}
  </div>
</ScrollArea>`;

const TABLE_CODE = `import { ScrollArea } from "./components";
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from "./components";

// orientation="both" adds both scrollbars and the corner. w-max
// lets the table grow past the viewport instead of squeezing in.
<ScrollArea orientation="both" className="h-80 w-full">
  <Table className="w-max">
    <TableHeader>
      <TableRow>
        <TableHead className="whitespace-nowrap">City</TableHead>
        {months.map((m) => (
          <TableHead key={m} className="text-right whitespace-nowrap">
            {m}
          </TableHead>
        ))}
      </TableRow>
    </TableHeader>
    <TableBody>
      {cities.map((city, r) => (
        <TableRow key={city} index={r}>
          <TableCell className="text-foreground whitespace-nowrap">
            {city}
          </TableCell>
          {months.map((m, c) => (
            <TableCell
              key={m}
              className="text-right tabular-nums whitespace-nowrap"
            >
              {metric(r, c)}
            </TableCell>
          ))}
        </TableRow>
      ))}
    </TableBody>
  </Table>
</ScrollArea>`;

// ---------------------------------------------------------------------------
// Demos
// ---------------------------------------------------------------------------

function ReleaseRows() {
  return (
    <div className="flex flex-col p-3">
      {RELEASES.map((release) => (
        <div
          key={release}
          className="px-3 py-2 text-site-body text-foreground whitespace-nowrap"
        >
          {release}
        </div>
      ))}
    </div>
  );
}

function PanelLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-site-caption text-muted-foreground text-center">
      {children}
    </span>
  );
}

// ---------------------------------------------------------------------------
// The problem, with a scripted cursor
//
// One cursor per list rides the same clock: it slides in from the left,
// rests, scrolls down and back, and slides out. Over the plain list nothing
// shows, which is the problem. Over ScrollArea the real component reacts:
// the cursor's position is fed in as pointer events, so the scrollbar shows
// on hover and the fades follow the scroll. A real pointer inside the demo
// takes over; the script resumes when it leaves.
// ---------------------------------------------------------------------------

/* Geometry: each list is w-64 h-56 (256 × 224). The cursor rests left of
   the list, in the gap or the padding, and comes to a stop inside it. */
const LIST_W = 256;
const LIST_H = 224;
const OUT = { x: -22, y: 150 };
const IN = { x: 132, y: 112 };
const SCROLL_TO = 200;
/** Seconds per leg: in, rest, scroll down, rest, scroll up, rest, out, rest. */
const LEGS_S = [0.8, 0.7, 1.2, 0.6, 1.0, 0.5, 0.7, 1.3];
const LOOP_S = LEGS_S.reduce((a, b) => a + b, 0);
/** Where each leg ends, as offsets (0..1) into the loop. */
const TIMES = LEGS_S.reduce<number[]>((acc, leg) => [...acc, acc[acc.length - 1] + leg / LOOP_S], [0]);
const XS = [OUT.x, IN.x, IN.x, IN.x, IN.x, IN.x, IN.x, OUT.x, OUT.x];
const YS = [OUT.y, IN.y, IN.y, IN.y, IN.y, IN.y, IN.y, OUT.y, OUT.y];
const SCROLLS = [0, 0, 0, SCROLL_TO, SCROLL_TO, 0, 0, 0, 0];

function ProblemPreview() {
  const shape = useShape();
  const rootRef = useRef<HTMLDivElement>(null);
  const plainRef = useRef<HTMLDivElement>(null);
  const fluidRef = useRef<HTMLDivElement>(null);
  const inView = useInView(rootRef, { amount: 0.35 });
  const reduced = useReducedMotion();
  // A real pointer inside the demo owns both lists until it leaves.
  const [userInside, setUserInside] = useState(false);
  const scripted = inView && !reduced && !userInside;

  const progress = useMotionValue(0);
  const x = useTransform(progress, TIMES, XS, { ease: easeInOut });
  const y = useTransform(progress, TIMES, YS, { ease: easeInOut });
  const scroll = useTransform(progress, TIMES, SCROLLS, { ease: easeInOut });
  const controlsRef = useRef<AnimationPlaybackControls | null>(null);
  const hoveringRef = useRef(false);

  // The script is one animation, paused and resumed in place so a visiting
  // pointer holds the current frame.
  useEffect(() => {
    if (!scripted) {
      controlsRef.current?.pause();
      return;
    }
    if (controlsRef.current) {
      controlsRef.current.play();
      return;
    }
    controlsRef.current = animate(progress, [0, 1], {
      duration: LOOP_S,
      ease: "linear",
      repeat: Infinity,
    });
  }, [scripted, progress]);
  useEffect(() => () => controlsRef.current?.stop(), []);

  /** Tell ScrollArea the pointer is over it or has left, the way a mouse
   *  would: Base UI reads hover from pointermove and pointerleave. */
  const setFluidHover = (on: boolean) => {
    const root = fluidRef.current;
    if (!root || hoveringRef.current === on) return;
    hoveringRef.current = on;
    const init = { bubbles: true, pointerType: "mouse" } as const;
    if (on) root.dispatchEvent(new PointerEvent("pointermove", init));
    else root.dispatchEvent(new PointerEvent("pointerout", { ...init, relatedTarget: root.parentElement }));
  };

  // Every frame of the script: scroll both lists and hover the fluid one
  // while the cursor is inside it.
  useMotionValueEvent(progress, "change", () => {
    if (!scripted) return;
    const top = scroll.get();
    if (plainRef.current) plainRef.current.scrollTop = top;
    const viewport = fluidRef.current?.querySelector<HTMLElement>('[data-slot="scroll-area-viewport"]');
    if (viewport) viewport.scrollTop = top;
    const cx = x.get();
    const cy = y.get();
    setFluidHover(cx >= 0 && cx <= LIST_W && cy >= 0 && cy <= LIST_H);
  });

  // Handing over to a real pointer: drop the scripted hover first.
  useEffect(() => {
    if (!scripted) setFluidHover(false);
  });

  return (
    <div
      ref={rootRef}
      className="flex flex-col sm:flex-row gap-6 items-center sm:items-start"
      onMouseEnter={() => setUserInside(true)}
      onMouseMove={() => setUserInside(true)}
      onPointerDown={() => setUserInside(true)}
      onMouseLeave={() => setUserInside(false)}
    >
      <div className="flex flex-col gap-2">
        <div className="relative">
          <div
            ref={plainRef}
            className={`h-56 w-64 overflow-y-auto border border-border ${shape.container}`}
          >
            <ReleaseRows />
          </div>
          {scripted && <FakeCursor x={x} y={y} />}
        </div>
        <PanelLabel>
          <span aria-hidden="true">❌</span> The native scrollbar hides until you
          scroll, so the list looks cut off
        </PanelLabel>
      </div>
      <div className="flex flex-col gap-2">
        <div className="relative">
          <ScrollArea
            ref={fluidRef}
            viewportClassName="scroll-fade"
            className={`h-56 w-64 border border-border ${shape.container}`}
          >
            <ReleaseRows />
          </ScrollArea>
          {scripted && <FakeCursor x={x} y={y} />}
        </div>
        <PanelLabel>
          <span aria-hidden="true">✅</span> ScrollArea shows its scrollbar on
          hover and fades the edges
        </PanelLabel>
      </div>
    </div>
  );
}

function ProblemDemo() {
  return (
    <ComponentPreview code={PROBLEM_CODE} padding="responsive">
      <ProblemPreview />
    </ComponentPreview>
  );
}

function HorizontalDemo() {
  const shape = useShape();
  return (
    <ComponentPreview
      code={HORIZONTAL_CODE}
      padding="none"
      minHeightClass="min-h-0"
    >
      <ScrollArea
        orientation="horizontal"
        viewportClassName="scroll-fade-x"
        className="w-full"
      >
        <div className="flex gap-2 p-3 w-max">
          {MONTHS.map((month) => (
            <div
              key={month}
              className={`flex items-center justify-center h-20 w-28 shrink-0 border border-border text-site-body text-foreground ${shape.bg}`}
            >
              {month}
            </div>
          ))}
        </div>
      </ScrollArea>
    </ComponentPreview>
  );
}

function FadeDemo() {
  const shape = useShape();
  return (
    <ComponentPreview code={FADE_CODE} padding="responsive">
      <ScrollArea
        viewportClassName="scroll-fade"
        className={`h-64 w-72 border border-border ${shape.container}`}
      >
        <ReleaseRows />
      </ScrollArea>
    </ComponentPreview>
  );
}

function TableDemo() {
  return (
    <ComponentPreview code={TABLE_CODE} padding="none">
      <ScrollArea orientation="both" className="h-80 w-full">
        <Table className="w-max">
          <TableHeader>
            <TableRow>
              <TableHead className="whitespace-nowrap">City</TableHead>
              {MONTHS.map((m) => (
                <TableHead key={m} className="text-right whitespace-nowrap">
                  {m}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {CITIES.map((city, r) => (
              <TableRow key={city} index={r}>
                <TableCell className="text-foreground whitespace-nowrap">
                  {city}
                </TableCell>
                {MONTHS.map((m, c) => (
                  <TableCell
                    key={m}
                    className="text-right tabular-nums whitespace-nowrap"
                  >
                    {metric(r, c)}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </ScrollArea>
    </ComponentPreview>
  );
}

// ---------------------------------------------------------------------------
// Doc Page
// ---------------------------------------------------------------------------

function H3({ children }: { children: React.ReactNode }) {
  return (
    <h3
      className="text-site-subtitle text-foreground mt-2"
      style={{ fontVariationSettings: fontWeights.semibold }}
    >
      {children}
    </h3>
  );
}

function P({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-site-body text-muted-foreground">
      {children}
    </p>
  );
}

export default function ScrollbarsDoc() {
  return (
    <DocPage
      title="Scrollbars"
      slug="scrollbars"
      description="A scrollbar that stays out of the way but never disappears."
    >
      <DocSection title="The problem">
        <div className="flex flex-col gap-3 text-site-body text-muted-foreground">
          <p>
            macOS hides the scrollbar until you start scrolling, so a clipped
            list gives no sign it has more below. And the moment it does appear,
            it&apos;s the grey OS default sitting on top of your design. You
            either get no affordance or the wrong one.
          </p>
        </div>
        <ProblemDemo />
      </DocSection>

      <DocSection title="The scrollbar">
        <P>
          The thumb rests narrow and low-contrast, then widens and darkens on
          hover so it stays quiet until you reach for it. Press{" "}
          <kbd className="px-1 py-0.5 rounded bg-muted text-site-caption font-mono">
            R
          </kbd>{" "}
          to see the radius follow the shape system. On touch-primary devices
          the whole thing steps aside for native overflow scrolling, where
          platform physics beat any custom scrollbar.
        </P>
        <P>
          Ships in Radix and Base UI flavors with the same API — switch with
          the Primitive toggle. Scrollbar machinery adapted from{" "}
          <a
            href="https://lina.sameer.sh"
            target="_blank"
            rel="noreferrer"
            className="underline underline-offset-2"
          >
            Lina
          </a>
          .
        </P>
      </DocSection>

      <DocSection title="The fade">
        <P>
          The baseline edge treatment is shadcn&apos;s{" "}
          <a
            href="https://ui.shadcn.com/docs/utils/scroll-fade"
            target="_blank"
            rel="noreferrer"
            className="underline underline-offset-2"
          >
            scroll-fade
          </a>
          , vendored as a CSS utility in{" "}
          <code className="px-1 py-0.5 rounded bg-[light-dark(#EBEBED,#2C2C2C)] text-site-caption text-foreground">
            globals.css
          </code>
          . A mask dissolves the content toward the edges that have more to
          scroll, and a scroll-driven animation keeps the true start and end
          crisp. Drop{" "}
          <code className="px-1 py-0.5 rounded bg-[light-dark(#EBEBED,#2C2C2C)] text-site-caption text-foreground">
            scroll-fade
          </code>{" "}
          (or{" "}
          <code className="px-1 py-0.5 rounded bg-[light-dark(#EBEBED,#2C2C2C)] text-site-caption text-foreground">
            scroll-fade-x
          </code>
          ) on the viewport and it rides under the scrollbar — no JavaScript.
        </P>
        <FadeDemo />
      </DocSection>

      <DocSection title="Examples">
        <H3>Horizontal</H3>
        <P>A row wider than its container, faded with the x variant.</P>
        <HorizontalDemo />

        <H3>Double overflow</H3>
        <P>
          A table taller and wider than its box.{" "}
          <code className="px-1 py-0.5 rounded bg-[light-dark(#EBEBED,#2C2C2C)] text-site-caption text-foreground">
            orientation=&quot;both&quot;
          </code>{" "}
          adds both scrollbars and the corner.
        </P>
        <TableDemo />
      </DocSection>

      <DocSection title="API reference">
        <H3>ScrollArea</H3>
        <PropsTable props={scrollAreaProps} />
      </DocSection>
    </DocPage>
  );
}
