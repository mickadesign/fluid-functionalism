"use client";

import { useEffect, type CSSProperties, type ReactNode } from "react";
import { previewMap } from "@/app/components/bento-previews";
import { BentoTileContext } from "@/app/components/bento-card";
import { Elevated } from "@/lib/elevated";
import { cn } from "@/lib/utils";
import { fontWeights } from "@/lib/font-weight";
import { Badge } from "@/registry/default/badge";
import { CheckboxGroup, CheckboxItem } from "@/registry/radix/checkbox-group";
import {
  Combobox,
  ComboboxChips,
  ComboboxContent,
  ComboboxList,
  ComboboxItem,
} from "@/components/flavored/combobox";
import { systemList } from "@/lib/docs/components";
import { Slider } from "@/registry/radix/slider";
import { useIcon } from "@/lib/icon-context";
import { iconLibraryLabels } from "@/lib/docs/icon-map";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
} from "@/components/flavored/select";

// 1200×630 is the 1.91:1 frame X (summary_large_image), LinkedIn and Slack
// all show uncropped. X lays its domain chip over the bottom-left corner, so
// nothing there carries meaning. `npm run og` exports the stage at 2x.
const OG_W = 1200;
const OG_H = 630;

// The "Make them yours" knobs, set to their less default values so the
// tile reads as a choice made, not a factory setting.
function PersonalizePreview() {
  const PillIcon = useIcon("circle");
  const rows = [
    { label: "Radius", value: "Pill", icon: PillIcon },
    { label: "Icons", value: iconLibraryLabels.phosphor },
    { label: "Size", value: "Compact" },
  ];
  return (
    <div className="flex w-full flex-col gap-1.5">
      <span
        className="mb-1 text-site-body text-foreground"
        style={{ fontVariationSettings: fontWeights.semibold }}
      >
        Make them yours
      </span>
      {rows.map((row) => (
        <div key={row.label} className="flex items-center justify-between">
          <span className="text-site-body text-muted-foreground">{row.label}</span>
          <Select value={row.value}>
            <SelectTrigger
              variant="borderless"
              className="min-w-0 w-auto h-7 px-2 text-site-body"
              icon={row.icon}
            />
            <SelectContent>
              <SelectItem value={row.value} index={0}>
                {row.value}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      ))}
    </div>
  );
}

// What sets the library apart, in badge form.
// Dots in the focus-ring blue, the site's one accent. Badge only takes
// palette colors, so the dot's inline color is overridden here.
const DIFFERENTIATORS = ["Open source", "Shadcn registry"];

function DifferentiatorsPreview() {
  return (
    <div className="flex items-center gap-1.5">
      {DIFFERENTIATORS.map((label) => (
        <Badge
          key={label}
          variant="dot"
          className="bg-card [&>span:first-child]:!bg-[var(--focus-ring,#6B97FF)]"
        >
          {label}
        </Badge>
      ))}
    </div>
  );
}

// What FF ships, ticked, and the one thing it refuses, left unticked.
const PRINCIPLES = [
  { label: "Spring physics", checked: true },
  { label: "Fluid hover", checked: true },
  { label: "Janky animations", checked: false },
  { label: "Smooth bold on hover", checked: true },
  { label: "Accessible by default", checked: true },
];

function PrinciplesPreview() {
  const checked = new Set(PRINCIPLES.flatMap((p, i) => (p.checked ? [i] : [])));
  return (
    <div className="w-full">
      <CheckboxGroup checkedIndices={checked}>
        {PRINCIPLES.map((p, i) => (
          <CheckboxItem key={p.label} index={i} label={p.label} checked={p.checked} onToggle={() => {}} />
        ))}
      </CheckboxGroup>
    </div>
  );
}

// Three system pages as picked chips: the rules every component shares.
const SYSTEM_ITEMS = systemList.map((s) => ({ value: s.slug, label: s.name }));
const SYSTEM_VALUES = ["motion", "typography", "surfaces"];

function SystemComboboxPreview() {
  return (
    <Combobox multiple items={SYSTEM_ITEMS} value={SYSTEM_VALUES}>
      <ComboboxChips placeholder="Add a system…" className="w-full bg-card" />
      <ComboboxContent>
        <ComboboxList>
          {(item) => {
            const v = typeof item === "string" ? item : item.value;
            const label = typeof item === "string" ? item : item.label;
            return (
              <ComboboxItem key={v} value={v}>
                {label}
              </ComboboxItem>
            );
          }}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  );
}

// The slider tile, with knobs nobody asked for.
function SliderPreview() {
  return (
    <div className="flex w-full flex-col gap-8">
      <div className="flex w-full flex-col gap-1.5">
        <div className="flex items-center justify-between text-site-body">
          <span className="text-muted-foreground">Hover satisfaction</span>
          <span className="text-muted-foreground tabular-nums">80</span>
        </div>
        <Slider value={80} onChange={() => {}} showValue={false} />
      </div>
      <Slider
        variant="scrubber"
        label="Coffee needed"
        onChange={() => {}}
        value={68}
        min={0}
        max={100}
        formatValue={(v) => `${v}%`}
      />
    </div>
  );
}

const PREVIEWS: Record<string, React.FC> = {
  ...previewMap,
  personalize: PersonalizePreview,
  principles: PrinciplesPreview,
  system: SystemComboboxPreview,
  sliders: SliderPreview,
};

type Tile = {
  slug: keyof typeof previewMap | string;
  x: number;
  y: number;
  rotate: number;
  width?: number;
  padding?: string;
  /** X shows the card about 500px wide, so components are blown up to
   *  stay legible at that size. */
  scale?: number;
  /** No card behind it: for components that bring their own surface. */
  bare?: boolean;
};

// The checkbox row shown mid-hover, so the fluid highlight is in the shot.
const HOVER_ROW = "Janky animations";

// Tossed around the title like cards on a desk, each one a live component.
// Tiles bleed off the edges on purpose: the frame reads as a crop of a
// bigger table, not a layout.
const TILES: Tile[] = [
  { slug: "personalize", x: 90, y: 20, rotate: -7, width: 220, padding: "px-5 py-4" },
  { slug: "principles", x: 940, y: 22, rotate: 6, width: 220, padding: "p-3" },
  { slug: "sliders", x: 40, y: 425, rotate: 5, width: 250 },
  { slug: "system", x: 432, y: 470, rotate: -3, width: 352, bare: true },
  { slug: "radio-group", x: 972, y: 392, rotate: -5, width: 220, padding: "p-3" },
];

function TileCard({ tile, children }: { tile: Tile; children: ReactNode }) {
  const style: CSSProperties = {
    left: tile.x,
    top: tile.y,
    width: tile.width,
    transform: `rotate(${tile.rotate}deg) scale(${tile.scale ?? 1.3})`,
  };
  if (tile.bare) {
    return (
      <div className="absolute" style={style}>
        {children}
      </div>
    );
  }
  return (
    <Elevated
      offset={2}
      shadowLevel={3}
      style={style}
      className={cn(
        "absolute flex items-center justify-center rounded-2xl",
        tile.padding ?? "p-5"
      )}
    >
      {children}
    </Elevated>
  );
}

// Parks a synthetic cursor on HOVER_ROW: the hook picks the row nearest the
// pointer, so a mousemove at the row's center lights it up. The stage ignores
// the real pointer, so the state holds while you look at it.
function useParkedHover() {
  useEffect(() => {
    const id = window.setTimeout(() => {
      const row = document.querySelector<HTMLElement>(
        `[data-og-stage] [role="checkbox"][aria-label="${HOVER_ROW}"]`
      );
      if (!row) return;
      const r = row.getBoundingClientRect();
      const init = { bubbles: true, clientX: r.left + r.width / 2, clientY: r.top + r.height / 2 };
      row.dispatchEvent(new MouseEvent("mouseover", init));
      row.dispatchEvent(new MouseEvent("mousemove", init));
    }, 400);
    return () => window.clearTimeout(id);
  }, []);
}

export default function OgPage() {
  useParkedHover();
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted p-8">
      <div
        data-og-stage
        className="light pointer-events-none relative shrink-0 overflow-hidden bg-background text-foreground"
        style={{ width: OG_W, height: OG_H }}
      >
        <BentoTileContext.Provider value={true}>
          {TILES.map((tile) => {
            const Preview = PREVIEWS[tile.slug];
            return Preview ? (
              <TileCard key={tile.slug} tile={tile}>
                <Preview />
              </TileCard>
            ) : null;
          })}
        </BentoTileContext.Provider>

        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center pb-10 text-center">
          <div className="mb-12 scale-[1.3]">
            <DifferentiatorsPreview />
          </div>
          <h1
            className="text-[72px] leading-none"
            style={{ fontVariationSettings: fontWeights.bold }}
          >
            Fluid Functionalism
          </h1>
          <p className="mt-4 text-[24px] leading-tight text-muted-foreground">
            Refined UI components with satisfying hover.
          </p>
        </div>
      </div>
    </div>
  );
}
