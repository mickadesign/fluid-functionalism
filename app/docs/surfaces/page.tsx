"use client";

import { useState } from "react";
import { DocPage, DocSection } from "@/lib/docs/DocPage";
import { Slider } from "@/registry/default/slider";
import { fontWeights } from "@/registry/default/lib/font-weight";
import { useShape } from "@/registry/default/lib/shape-context";

const LEVELS = [1, 2, 3, 4, 5, 6, 7, 8] as const;

const ROLES: Record<number, string> = {
  1: "App background",
  2: "Sunken / muted",
  3: "Card",
  4: "Raised card",
  5: "Floating panel",
  6: "Dropdown / menu",
  7: "Popover",
  8: "Modal / dialog",
};

const ALIASES: Record<number, string | null> = {
  1: "--background",
  2: "--muted",
  3: "--card",
  4: null,
  5: null,
  6: null,
  7: null,
  8: null,
};

const SURFACE_CLASSES: Record<number, string> = {
  1: "bg-surface-1 shadow-surface-1",
  2: "bg-surface-2 shadow-surface-2",
  3: "bg-surface-3 shadow-surface-3",
  4: "bg-surface-4 shadow-surface-4",
  5: "bg-surface-5 shadow-surface-5",
  6: "bg-surface-6 shadow-surface-6",
  7: "bg-surface-7 shadow-surface-7",
  8: "bg-surface-8 shadow-surface-8",
};

function surfaceClass(level: number) {
  return SURFACE_CLASSES[level];
}

function PlaygroundCard({ level }: { level: number }) {
  const shape = useShape();
  return (
    <div
      className={`flex flex-col items-center justify-center w-48 h-48 ${shape.container} ${surfaceClass(level)}`}
      style={{ transition: "background-color 220ms ease, box-shadow 220ms ease" }}
    >
      <span
        className="text-[28px] text-foreground leading-none tabular-nums"
        style={{ fontVariationSettings: fontWeights.bold }}
      >
        {level}
      </span>
      <span className="text-[11px] text-muted-foreground mt-1.5 uppercase tracking-wider">
        Surface
      </span>
    </div>
  );
}

function Playground() {
  const [level, setLevel] = useState<number>(3);
  const shape = useShape();
  return (
    <div className={`flex flex-col w-full border border-border/60 overflow-hidden ${shape.container}`}>
      <div className="flex items-center justify-center px-8 py-16 min-h-[280px] bg-background">
        <PlaygroundCard level={level} />
      </div>
      <div className="flex flex-col gap-4 px-8 py-6 border-t border-border/60 bg-muted/30">
        <div className="flex items-baseline justify-between gap-4">
          <span
            className="text-[13px] text-foreground"
            style={{ fontVariationSettings: fontWeights.semibold }}
          >
            Level {level}
          </span>
          <span className="text-[12px] text-muted-foreground font-mono">
            bg-surface-{level} shadow-surface-{level}
          </span>
        </div>
        <Slider
          value={level}
          onChange={(v) => setLevel(Array.isArray(v) ? v[0] : v)}
          min={1}
          max={8}
          step={1}
          aria-label="Surface elevation level"
        />
        <div className="flex justify-between text-[10px] text-muted-foreground/60 font-mono px-0.5">
          {LEVELS.map((l) => (
            <span key={l}>{l}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

function LadderRow({ level }: { level: number }) {
  const shape = useShape();
  const alias = ALIASES[level];
  return (
    <div className="flex items-center gap-6 py-4">
      <div
        className={`shrink-0 w-32 h-24 ${shape.container} ${surfaceClass(level)}`}
        aria-hidden
      />
      <div className="flex flex-col gap-1 min-w-0">
        <div className="flex items-baseline gap-2">
          <span
            className="text-[14px] text-foreground"
            style={{ fontVariationSettings: fontWeights.semibold }}
          >
            Surface {level}
          </span>
          <span className="text-[12px] text-muted-foreground">— {ROLES[level]}</span>
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-[11px] text-muted-foreground/80 font-mono">
          <span>bg-surface-{level}</span>
          <span>shadow-surface-{level}</span>
          {alias && <span className="text-muted-foreground/60">aliased by {alias}</span>}
        </div>
      </div>
    </div>
  );
}

export default function SurfacesDoc() {
  return (
    <DocPage
      title="Surfaces"
      description="Eight-level surface and shadow ladder for elevation. Light mode: two color steps then flat white, differentiated by shadow. Dark mode: additive white-opacity ladder with layered inset highlights and drops."
    >
      <DocSection title="Installation">
        <div className="text-[13px] text-muted-foreground">
          Tokens ship in <code className="px-1 py-0.5 rounded bg-muted text-[12px]">app/globals.css</code>.
          Once added, every <code className="px-1 py-0.5 rounded bg-muted text-[12px]">bg-surface-N</code> and{" "}
          <code className="px-1 py-0.5 rounded bg-muted text-[12px]">shadow-surface-N</code> utility
          (where N is 1–8) becomes available. The existing{" "}
          <code className="px-1 py-0.5 rounded bg-muted text-[12px]">--background</code>,{" "}
          <code className="px-1 py-0.5 rounded bg-muted text-[12px]">--muted</code>, and{" "}
          <code className="px-1 py-0.5 rounded bg-muted text-[12px]">--card</code> tokens are
          re-derived as aliases of <code className="px-1 py-0.5 rounded bg-muted text-[12px]">--surface-1</code>,{" "}
          <code className="px-1 py-0.5 rounded bg-muted text-[12px]">--surface-2</code>, and{" "}
          <code className="px-1 py-0.5 rounded bg-muted text-[12px]">--surface-3</code>.
        </div>
      </DocSection>

      <DocSection title="Playground">
        <Playground />
      </DocSection>

      <DocSection title="The ladder">
        <div className="flex flex-col divide-y divide-border/60">
          {LEVELS.map((l) => (
            <LadderRow key={l} level={l} />
          ))}
        </div>
      </DocSection>

      <DocSection title="Usage">
        <div className="flex flex-col gap-3 text-[13px] text-muted-foreground leading-relaxed">
          <p>
            Each surface level pairs a background color with a shadow recipe of matching elevation.
            Apply them together: <code className="px-1 py-0.5 rounded bg-muted text-[12px]">className=&quot;bg-surface-3 shadow-surface-3&quot;</code>.
          </p>
          <p>
            In light mode, surfaces 3–8 share the same <code className="px-1 py-0.5 rounded bg-muted text-[12px]">#FFFFFF</code> background;
            the shadow alone communicates elevation. In dark mode, each level adds a small amount of white opacity over <code className="px-1 py-0.5 rounded bg-muted text-[12px]">#171717</code>,
            and the shadow recipe layers an inset top-edge highlight, an inset border ring, an outer hairline, and stacked drop shadows.
          </p>
          <p>
            Shadows compose additively — surface N + 1&apos;s recipe is surface N&apos;s recipe with one additional drop layer at the next halving offset.
            This makes the elevation walk smoothly across the full ladder.
          </p>
        </div>
      </DocSection>
    </DocPage>
  );
}
