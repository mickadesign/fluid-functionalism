"use client";

import { useState, type ReactElement, type ReactNode } from "react";
import { DocPage, DocSection } from "@/lib/docs/DocPage";
import { Slider } from "@/registry/default/slider";
import { fontWeights } from "@/registry/default/lib/font-weight";
import { useShape } from "@/registry/default/lib/shape-context";
import { SurfaceProvider } from "@/registry/default/lib/surface-context";
import { Dropdown } from "@/registry/default/dropdown";
import { MenuItem } from "@/registry/default/menu-item";
import { ColorPickerPopover } from "@/registry/default/color-picker";
import { useIcon } from "@/registry/default/lib/icon-context";
import { useThemeContext } from "@/registry/default/lib/theme-context";
import { BentoCard } from "@/app/components/bento-card";

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
      className={`w-48 h-48 ${shape.container} ${surfaceClass(level)}`}
      style={{ transition: "background-color 220ms ease, box-shadow 220ms ease" }}
    />
  );
}

function SimplePlayground() {
  const [level, setLevel] = useState<number>(3);
  const shape = useShape();
  return (
    <div className={`flex flex-col w-full border border-border/60 overflow-hidden ${shape.container}`}>
      <div
        className="flex items-center justify-center px-8 py-16 min-h-[280px]"
        style={{ backgroundColor: "var(--surface-1)" }}
      >
        <PlaygroundCard level={level} />
      </div>
      <div className="flex flex-col gap-3 px-8 py-6 border-t border-border/60 bg-muted/30">
        <span
          className="text-[13px] text-foreground"
          style={{ fontVariationSettings: fontWeights.semibold }}
        >
          Surface {level}
        </span>
        <Slider
          value={level}
          onChange={(v) => setLevel(Array.isArray(v) ? v[0] : v)}
          min={1}
          max={8}
          step={1}
          showValue={false}
          aria-label="Surface elevation level"
        />
      </div>
    </div>
  );
}

function NestedSurfaces({ substrate, layers }: { substrate: number; layers: number }) {
  const shape = useShape();
  const stack = Array.from({ length: layers + 1 }, (_, i) => substrate + i);
  return stack.reduceRight<ReactElement | null>((child, level) => {
    return (
      <div
        key={level}
        className={`${shape.container} ${surfaceClass(level)} p-5`}
        style={{ transition: "background-color 220ms ease, box-shadow 220ms ease" }}
      >
        {child}
      </div>
    );
  }, null);
}

function Playground() {
  const [range, setRange] = useState<[number, number]>([1, 3]);
  const [from, to] = range;
  const layers = to - from;
  const shape = useShape();

  const handleRange = (v: number | [number, number]) => {
    if (Array.isArray(v)) setRange(v);
  };

  return (
    <div className={`flex flex-col w-full border border-border/60 overflow-hidden ${shape.container}`}>
      <div
        className="flex items-center justify-center px-8 py-16 min-h-[480px]"
        style={{ backgroundColor: "var(--surface-1)" }}
      >
        <NestedSurfaces substrate={from} layers={layers} />
      </div>
      <div className="flex flex-col gap-3 px-8 py-6 border-t border-border/60 bg-muted/30">
        <span
          className="text-[13px] text-foreground"
          style={{ fontVariationSettings: fontWeights.semibold }}
        >
          Stack {from} - {to}
        </span>
        <Slider
          value={range}
          onChange={handleRange}
          min={1}
          max={8}
          step={1}
          showValue={false}
          aria-label="Bottom and top of the surface stack"
        />
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
        className={`shrink-0 w-24 h-24 ${shape.container} ${surfaceClass(level)}`}
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
      description={
        <>
          Eight-level surface and shadow ladder for elevation.
          <br />
          Light mode: two color steps then flat white, differentiated by shadow.
          <br />
          <UseDarkLink>Dark mode</UseDarkLink>: additive white-opacity ladder with layered inset highlights and drops.
        </>
      }
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ThemedColumn theme="dark">
            <SimplePlayground />
            <Playground />
          </ThemedColumn>
          <ThemedColumn theme="light">
            <SimplePlayground />
            <Playground />
          </ThemedColumn>
        </div>
      </DocSection>

      <DocSection title="The ladder">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ThemedColumn theme="dark">
            <div className="flex flex-col divide-y divide-border/60">
              {LEVELS.map((l) => (
                <LadderRow key={l} level={l} />
              ))}
            </div>
          </ThemedColumn>
          <ThemedColumn theme="light">
            <div className="flex flex-col divide-y divide-border/60">
              {LEVELS.map((l) => (
                <LadderRow key={l} level={l} />
              ))}
            </div>
          </ThemedColumn>
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
            the shadow alone communicates elevation. <UseDarkLink>In dark mode</UseDarkLink>, each level adds a small amount of white opacity over <code className="px-1 py-0.5 rounded bg-muted text-[12px]">#171717</code>,
            and the shadow recipe layers an inset top-edge highlight, an inset border ring, an outer hairline, and stacked drop shadows.
          </p>
          <p>
            Shadows compose additively — surface N + 1&apos;s recipe is surface N&apos;s recipe with one additional drop layer at the next halving offset.
            This makes the elevation walk smoothly across the full ladder.
          </p>
        </div>
      </DocSection>

      <DocSection title="Relative elevation">
        <div className="flex flex-col gap-3 text-[13px] text-muted-foreground leading-relaxed">
          <p>
            Elevated components don&apos;t pick a fixed surface level — their <em>background</em> elevates relative to whatever they sit on.
            A Dropdown opened on the page background renders with a darker bg; the same Dropdown opened inside a Dialog renders with a lighter bg.
            Without this, nesting collapses (a popover inside a popover renders the same color as its parent and disappears).
          </p>
          <p>
            The mechanism: <code className="px-1 py-0.5 rounded bg-muted text-[12px]">SurfaceProvider</code> declares the current substrate level
            via React context. <code className="px-1 py-0.5 rounded bg-muted text-[12px]">useSurface()</code> reads it (default <code className="px-1 py-0.5 rounded bg-muted text-[12px]">1</code>, the page background).
            Each elevated component computes its level as <code className="px-1 py-0.5 rounded bg-muted text-[12px]">substrate + offset</code> and re-provides the
            new substrate to its children, so further nesting walks up the ladder.
          </p>
          <p>
            <strong className="text-foreground">Shadow stays fixed per component type.</strong> A popover always reads as a popover (same shadow weight) even when its background lifts to match a deeper context. This way a popover-inside-a-dialog doesn&apos;t suddenly look like a higher-tier component just because of where it&apos;s rendered — only its bg adapts; its shadow signature is intrinsic.
          </p>
        </div>
        <RelativeElevationDemo />
      </DocSection>

      <DocSection title="In a real component">
        <div className="flex flex-col gap-3 text-[13px] text-muted-foreground leading-relaxed">
          <p>
            Open the format dropdown inside this color picker. The dropdown&apos;s background lifts above the picker panel because it nests one level deeper, but its shadow is the same shadow you&apos;d see on any dropdown.
          </p>
        </div>
        <ColorPickerDemo />
      </DocSection>

      <DocSection title="Used by">
        <div className="flex flex-col gap-2 text-[13px] text-muted-foreground">
          <UsedByRow label="Tabs (selected pill)" detail="bg-surface-4 · shadow-surface-4" />
          <UsedByRow label="Dropdown" detail="bg-surface-{substrate+2} · shadow-surface-3" />
          <UsedByRow label="Select" detail="bg-surface-{substrate+2} · shadow-surface-3" />
          <UsedByRow label="ColorPicker (popover)" detail="bg-surface-{substrate+2} · shadow-surface-3" />
          <UsedByRow label="MobileDrawer" detail="bg-surface-{substrate+2} · shadow-surface-3" />
          <UsedByRow label="Dialog" detail="bg-surface-5 · shadow-surface-5" />
          <UsedByRow label="Tooltip" detail="inverted (foreground/background)" />
        </div>
      </DocSection>
    </DocPage>
  );
}

function ThemedColumn({ theme, children }: { theme: "dark" | "light"; children: ReactNode }) {
  return (
    <div className={`${theme} bento-card-border border bg-background rounded-2xl p-6 flex flex-col gap-6`}>
      <span
        className="text-[11px] text-muted-foreground uppercase tracking-wider"
        style={{ fontVariationSettings: fontWeights.semibold }}
      >
        {theme === "dark" ? "Dark mode" : "Light mode"}
      </span>
      {children}
    </div>
  );
}

function ColorPickerDemo() {
  return (
    <div className="dark bento-card-border border bg-background rounded-2xl p-12 flex items-center justify-center min-h-[160px]">
      <ColorPickerPopover triggerLabel="Fill" defaultValue="#FF6B35" />
    </div>
  );
}

function UseDarkLink({ children }: { children: ReactNode }) {
  const { setTheme } = useThemeContext();
  return (
    <button
      type="button"
      onClick={() => setTheme("dark")}
      className="underline decoration-dotted underline-offset-2 hover:text-foreground transition-colors cursor-pointer"
    >
      {children}
    </button>
  );
}

function RelativeElevationDemo() {
  const Star = useIcon("star");
  const Clock = useIcon("clock");
  const Lock = useIcon("lock");

  const items = [
    { icon: Star, label: "Favorites" },
    { icon: Clock, label: "Recents" },
    { icon: Lock, label: "Private" },
  ];

  const renderDropdown = (key: string) => (
    <Dropdown key={key} className="w-full" checkedIndex={0}>
      {items.map((item, i) => (
        <MenuItem
          key={item.label}
          index={i}
          icon={item.icon}
          label={item.label}
          checked={i === 0}
        />
      ))}
    </Dropdown>
  );

  const scenarios: { substrate: number; label: string; rendered: number }[] = [
    { substrate: 1, label: "On the page", rendered: 3 },
    { substrate: 3, label: "Inside a popover", rendered: 5 },
    { substrate: 5, label: "Inside a Dialog", rendered: 7 },
  ];

  return (
    <div className="dark grid grid-cols-1 md:grid-cols-3 gap-4">
      {scenarios.map(({ substrate, label, rendered }) => (
        <BentoCard
          key={substrate}
          slug=""
          name={`${label} — substrate ${substrate} → surface ${rendered}`}
          style={{ backgroundColor: `var(--surface-${substrate})` }}
        >
          <SurfaceProvider value={substrate}>
            {renderDropdown(`d-${substrate}`)}
          </SurfaceProvider>
        </BentoCard>
      ))}
    </div>
  );
}

function UsedByRow({ label, detail }: { label: string; detail: string }) {
  return (
    <div className="flex items-baseline gap-3">
      <span
        className="text-[13px] text-foreground shrink-0 w-44"
        style={{ fontVariationSettings: fontWeights.semibold }}
      >
        {label}
      </span>
      <span className="font-mono text-[12px]">{detail}</span>
    </div>
  );
}
