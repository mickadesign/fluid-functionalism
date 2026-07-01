"use client";

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
import { PropsTable, type PropDef } from "@/lib/docs/PropsTable";
import { DocPage, DocSection } from "@/lib/docs/DocPage";

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
<div className="h-56 overflow-y-auto">
  {releases.map((r) => <Row key={r} label={r} />)}
</div>

// ✅ ScrollArea. A scrollbar that stays discoverable on hover,
// plus a shadcn scroll-fade on the viewport so the edge dissolves
// when there's more below.
<ScrollArea viewportClassName="scroll-fade" className="h-56">
  {releases.map((r) => <Row key={r} label={r} />)}
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
      <Card key={month} label={month} />
    ))}
  </div>
</ScrollArea>`;

const FADE_CODE = `/* globals.css — vendored from shadcn's scroll-fade utility.
   A mask dissolves the content toward the edges with more to
   scroll; a scroll-driven animation keeps the true start/end
   edge crisp. */
.scroll-fade {
  --scroll-fade-size: 48px;
  mask-image: linear-gradient(
    to bottom,
    transparent 0,
    #000 var(--scroll-fade-size),
    #000 calc(100% - var(--scroll-fade-size)),
    transparent 100%
  );
}

/* Apply it to any scroll container, or to a ScrollArea viewport. */
<ScrollArea viewportClassName="scroll-fade" className="h-56">
  ...
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
        <TableHead>City</TableHead>
        {months.map((m) => (
          <TableHead key={m} className="text-right">{m}</TableHead>
        ))}
      </TableRow>
    </TableHeader>
    <TableBody>
      {cities.map((city, r) => (
        <TableRow key={city} index={r}>
          <TableCell>{city}</TableCell>
          {months.map((m, c) => (
            <TableCell key={m} className="text-right tabular-nums">
              {metric(r, c)}
            </TableCell>
          ))}
        </TableRow>
      ))}
    </TableBody>
  </Table>
</ScrollArea>`;

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

const scrollAreaProps: PropDef[] = [
  {
    name: "orientation",
    type: '"vertical" | "horizontal" | "both"',
    default: '"vertical"',
    description: "Which axes get scrollbars.",
  },
  {
    name: "viewportClassName",
    type: "string",
    description:
      "Classes for the inner scrolling viewport — where the scroll-fade utility goes.",
  },
  {
    name: "className",
    type: "string",
    description:
      "Classes for the outer container — set the height/width constraint here.",
  },
];

// ---------------------------------------------------------------------------
// Demos
// ---------------------------------------------------------------------------

function ReleaseRows() {
  return (
    <div className="flex flex-col p-3">
      {RELEASES.map((release) => (
        <div
          key={release}
          className="px-3 py-2 text-[13px] text-foreground whitespace-nowrap"
        >
          {release}
        </div>
      ))}
    </div>
  );
}

function PanelLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-[12px] text-muted-foreground text-center">
      {children}
    </span>
  );
}

function ProblemDemo() {
  const shape = useShape();
  return (
    <ComponentPreview code={PROBLEM_CODE} padding="responsive">
      <div className="flex flex-col sm:flex-row gap-6 items-center sm:items-start">
        <div className="flex flex-col gap-2">
          <div
            className={`h-56 w-64 overflow-y-auto border border-border ${shape.container}`}
          >
            <ReleaseRows />
          </div>
          <PanelLabel>Native — default OS scrollbar</PanelLabel>
        </div>
        <div className="flex flex-col gap-2">
          <ScrollArea
            viewportClassName="scroll-fade"
            className={`h-56 w-64 border border-border ${shape.container}`}
          >
            <ReleaseRows />
          </ScrollArea>
          <PanelLabel>ScrollArea — fade + scrollbar on hover</PanelLabel>
        </div>
      </div>
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
              className={`flex items-center justify-center h-20 w-28 shrink-0 border border-border text-[13px] text-foreground ${shape.bg}`}
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
      className="text-[15px] text-foreground mt-2"
      style={{ fontVariationSettings: fontWeights.semibold }}
    >
      {children}
    </h3>
  );
}

function P({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[13px] text-muted-foreground leading-relaxed">
      {children}
    </p>
  );
}

export default function ScrollbarsDoc() {
  return (
    <DocPage
      title="Scrollbars"
      slug="scrollbars"
      installSlug="scroll-area"
      description={
        <>
          A scrollbar that stays out of the way but never disappears, over
          shadcn&apos;s scroll-fade as the baseline edge treatment — restyled to
          the shape system, with native scroll physics on touch.
        </>
      }
    >
      <DocSection title="The problem">
        <div className="flex flex-col gap-3 text-[13px] text-muted-foreground leading-relaxed">
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
          <kbd className="px-1 py-0.5 rounded bg-muted text-[12px] font-mono">
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
          <code className="px-1 py-0.5 rounded bg-muted text-[12px]">
            globals.css
          </code>
          . A mask dissolves the content toward the edges that have more to
          scroll, and a scroll-driven animation keeps the true start and end
          crisp. Drop{" "}
          <code className="px-1 py-0.5 rounded bg-muted text-[12px]">
            scroll-fade
          </code>{" "}
          (or{" "}
          <code className="px-1 py-0.5 rounded bg-muted text-[12px]">
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
          <code className="px-1 py-0.5 rounded bg-muted text-[12px]">
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
