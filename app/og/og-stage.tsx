"use client";

import { useEffect, type CSSProperties, type ReactNode, type Ref } from "react";
import { previewMap } from "@/app/components/bento-previews";
import { BentoTileContext } from "@/app/components/bento-card";
import { RADIO_ITEMS } from "@/app/components/demo-data";
import { Elevated } from "@/lib/elevated";
import { cn } from "@/lib/utils";
import { fontWeights } from "@/lib/font-weight";
import { Badge } from "@/registry/default/badge";
import { CheckboxGroup, CheckboxItem } from "@/registry/radix/checkbox-group";
import { RadioGroup, RadioItem } from "@/registry/radix/radio-group";
import {
  ShapeProvider,
  useShapeContext,
  type ShapeVariant,
} from "@/registry/default/lib/shape-context";
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

// The OG card, shared by the still (/og) and the loop (/og/video). Every
// tile is a live component driven by `state`, so the video is the image in
// motion and the two cannot drift apart.

// 1200×630 is the 1.91:1 frame X (summary_large_image), LinkedIn and Slack
// all show uncropped. X lays its domain chip over the bottom-left corner, so
// nothing there carries meaning.
export const OG_W = 1200;
export const OG_H = 630;

// What FF ships, ticked, and the one thing it refuses, left unticked.
export const PRINCIPLES = [
  "Spring physics",
  "Fluid hover",
  "Janky animations",
  "Smooth bold on hover",
  "Accessible by default",
] as const;

export type OgState = {
  /** Indices into PRINCIPLES. */
  checked: number[];
  /** "Hover satisfaction", 0–100. */
  satisfaction: number;
  /** "Coffee needed", 0–100. */
  coffee: number;
  /** Picked system slugs, in chip order. */
  systems: string[];
  /** One of RADIO_ITEMS' values. */
  spring: string;
  /** Drives every tile's corners and the Radius row's label. */
  shape: ShapeVariant;
};

// The still frame. Knobs sit on their less default values so the tiles read
// as choices made, not factory settings.
export const OG_STILL: OgState = {
  checked: [0, 1, 3, 4],
  satisfaction: 80,
  coffee: 68,
  systems: ["motion", "typography", "surfaces"],
  spring: "moderate",
  shape: "pill",
};

function PersonalizePreview({ shape }: { shape: ShapeVariant }) {
  const PillIcon = useIcon("circle");
  const RoundedIcon = useIcon("rectangle-horizontal");
  const radius = shape === "pill" ? "Pill" : "Rounded";
  const rows = [
    { label: "Radius", value: radius, icon: shape === "pill" ? PillIcon : RoundedIcon },
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
              data-og-target={row.label === "Radius" ? "radius" : undefined}
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

function PrinciplesPreview({ checked }: { checked: number[] }) {
  const set = new Set(checked);
  return (
    <div className="w-full">
      <CheckboxGroup checkedIndices={set}>
        {PRINCIPLES.map((label, i) => (
          <CheckboxItem key={label} index={i} label={label} checked={set.has(i)} onToggle={() => {}} />
        ))}
      </CheckboxGroup>
    </div>
  );
}

// Three system pages as picked chips: the rules every component shares.
const SYSTEM_ITEMS = systemList.map((s) => ({ value: s.slug, label: s.name }));

function SystemComboboxPreview({ systems }: { systems: string[] }) {
  return (
    <Combobox multiple items={SYSTEM_ITEMS} value={systems}>
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
function SliderPreview({ satisfaction, coffee }: { satisfaction: number; coffee: number }) {
  return (
    <div className="flex w-full flex-col gap-8">
      <div className="flex w-full flex-col gap-1.5">
        <div className="flex items-center justify-between text-site-body">
          <span className="text-muted-foreground">Hover satisfaction</span>
          <span className="text-muted-foreground tabular-nums">{Math.round(satisfaction)}</span>
        </div>
        <Slider value={satisfaction} onChange={() => {}} showValue={false} />
      </div>
      <Slider
        variant="scrubber"
        label="Coffee needed"
        onChange={() => {}}
        value={coffee}
        min={0}
        max={100}
        formatValue={(v) => `${Math.round(v)}%`}
      />
    </div>
  );
}

function SpringPreview({ spring }: { spring: string }) {
  return (
    <div className="w-full max-w-[220px]">
      <RadioGroup value={spring}>
        {RADIO_ITEMS.map((item, i) => (
          <RadioItem key={item.value} value={item.value} index={i} label={item.label} />
        ))}
      </RadioGroup>
    </div>
  );
}

type Tile = {
  slug: string;
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

// Tossed around the title like cards on a desk, each one a live component.
// Tiles bleed off the edges on purpose: the frame reads as a crop of a
// bigger table, not a layout.
/** The sliders tile's tilt, which /og/video's cursor follows along the track. */
export const SLIDER_TILE_ROTATE = 5;

const TILES: Tile[] = [
  { slug: "personalize", x: 90, y: 20, rotate: -7, width: 220, padding: "px-5 py-4" },
  { slug: "principles", x: 940, y: 22, rotate: 6, width: 220, padding: "p-3" },
  { slug: "sliders", x: 40, y: 425, rotate: SLIDER_TILE_ROTATE, width: 250 },
  { slug: "system", x: 432, y: 470, rotate: -3, width: 352, bare: true },
  { slug: "radio-group", x: 972, y: 392, rotate: -5, width: 220, padding: "p-3" },
];

function renderTile(slug: string, state: OgState) {
  switch (slug) {
    case "personalize":
      return <PersonalizePreview shape={state.shape} />;
    case "principles":
      return <PrinciplesPreview checked={state.checked} />;
    case "sliders":
      return <SliderPreview satisfaction={state.satisfaction} coffee={state.coffee} />;
    case "system":
      return <SystemComboboxPreview systems={state.systems} />;
    case "radio-group":
      return <SpringPreview spring={state.spring} />;
    default: {
      const Preview = previewMap[slug as keyof typeof previewMap];
      return Preview ? <Preview /> : null;
    }
  }
}

function TileCard({ tile, children }: { tile: Tile; children: ReactNode }) {
  const style: CSSProperties = {
    left: tile.x,
    top: tile.y,
    width: tile.width,
    transform: `rotate(${tile.rotate}deg) scale(${tile.scale ?? 1.3})`,
  };
  if (tile.bare) {
    return (
      <div className="absolute" style={style} data-og-tile={tile.slug}>
        {children}
      </div>
    );
  }
  return (
    <Elevated
      offset={2}
      shadowLevel={3}
      style={style}
      data-og-tile={tile.slug}
      className={cn(
        "absolute flex items-center justify-center rounded-2xl",
        tile.padding ?? "p-5"
      )}
    >
      {children}
    </Elevated>
  );
}

// The stage owns its corners: the Radius row is part of the picture, so the
// card cannot follow the visitor's own shape setting.
function ShapeSync({ shape }: { shape: ShapeVariant }) {
  const { shape: current, setShape } = useShapeContext();
  useEffect(() => {
    if (current !== shape) setShape(shape);
  }, [current, shape, setShape]);
  return null;
}

export function OgStage({
  state,
  overlay,
  stageRef,
}: {
  state: OgState;
  /** Drawn above the tiles and the title (the video's cursor). */
  overlay?: ReactNode;
  stageRef?: Ref<HTMLDivElement>;
}) {
  return (
    <ShapeProvider defaultShape={state.shape}>
      <ShapeSync shape={state.shape} />
      <div
        ref={stageRef}
        data-og-stage
        className="light pointer-events-none relative shrink-0 overflow-hidden bg-background text-foreground"
        style={{ width: OG_W, height: OG_H }}
      >
        <BentoTileContext.Provider value={true}>
          {TILES.map((tile) => (
            <TileCard key={tile.slug} tile={tile}>
              {renderTile(tile.slug, state)}
            </TileCard>
          ))}
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
        {overlay}
      </div>
    </ShapeProvider>
  );
}
