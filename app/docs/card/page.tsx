"use client";

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import {
  Card,
  CardGroup,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  CardMedia,
  CardImage,
  CardFeature,
  CardButton,
} from "@/registry/default/card";
import { cn } from "@/lib/utils";
import { fontWeights } from "@/registry/default/lib/font-weight";
import { useRightRailNode } from "@/lib/right-rail";
import { useIcon, type IconComponent } from "@/lib/icon-context";
import { Shuffle } from "lucide-react";
import { ComponentPreview } from "@/lib/docs/ComponentPreview";
import { PropsTable, type PropDef } from "@/lib/docs/PropsTable";
import { DocPage, DocSection } from "@/lib/docs/DocPage";
import { Switch } from "@/registry/radix/switch";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
} from "@/components/flavored/select";
import { SurfaceProvider } from "@/lib/surface-context";

// An inline data-URI banner so the demo needs no asset files (CardImage
// accepts any src).
// Image → a monochrome mesh built from the clarity-blue accent (#6B97FF) alone,
// at different opacities over white, so it reads as one calm brand-blue wash.
const BANNER =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='320' height='180'%3E%3Cdefs%3E%3CradialGradient id='a' cx='12%25' cy='16%25' r='70%25'%3E%3Cstop offset='0%25' stop-color='%236B97FF' stop-opacity='0.9'/%3E%3Cstop offset='100%25' stop-color='%236B97FF' stop-opacity='0'/%3E%3C/radialGradient%3E%3CradialGradient id='b' cx='90%25' cy='12%25' r='65%25'%3E%3Cstop offset='0%25' stop-color='%236B97FF' stop-opacity='0.45'/%3E%3Cstop offset='100%25' stop-color='%236B97FF' stop-opacity='0'/%3E%3C/radialGradient%3E%3CradialGradient id='c' cx='82%25' cy='94%25' r='75%25'%3E%3Cstop offset='0%25' stop-color='%236B97FF' stop-opacity='0.8'/%3E%3Cstop offset='100%25' stop-color='%236B97FF' stop-opacity='0'/%3E%3C/radialGradient%3E%3CradialGradient id='d' cx='24%25' cy='90%25' r='68%25'%3E%3Cstop offset='0%25' stop-color='%236B97FF' stop-opacity='0.55'/%3E%3Cstop offset='100%25' stop-color='%236B97FF' stop-opacity='0'/%3E%3C/radialGradient%3E%3C/defs%3E%3Crect width='320' height='180' fill='%23ffffff'/%3E%3Crect width='320' height='180' fill='%236B97FF' fill-opacity='0.2'/%3E%3Crect width='320' height='180' fill='url(%23a)'/%3E%3Crect width='320' height='180' fill='url(%23b)'/%3E%3Crect width='320' height='180' fill='url(%23c)'/%3E%3Crect width='320' height='180' fill='url(%23d)'/%3E%3C/svg%3E";


// Logo → the same clarity-blue (#6B97FF) monochrome mesh as the image, at
// different opacities over white; a denser base tint reads as a solid brand tile.
const THUMB =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40'%3E%3Cdefs%3E%3CradialGradient id='a' cx='20%25' cy='18%25' r='80%25'%3E%3Cstop offset='0%25' stop-color='%236B97FF' stop-opacity='0.95'/%3E%3Cstop offset='100%25' stop-color='%236B97FF' stop-opacity='0'/%3E%3C/radialGradient%3E%3CradialGradient id='b' cx='86%25' cy='14%25' r='75%25'%3E%3Cstop offset='0%25' stop-color='%236B97FF' stop-opacity='0.5'/%3E%3Cstop offset='100%25' stop-color='%236B97FF' stop-opacity='0'/%3E%3C/radialGradient%3E%3CradialGradient id='c' cx='72%25' cy='94%25' r='85%25'%3E%3Cstop offset='0%25' stop-color='%236B97FF' stop-opacity='0.85'/%3E%3Cstop offset='100%25' stop-color='%236B97FF' stop-opacity='0'/%3E%3C/radialGradient%3E%3C/defs%3E%3Crect width='40' height='40' fill='%23ffffff'/%3E%3Crect width='40' height='40' fill='%236B97FF' fill-opacity='0.35'/%3E%3Crect width='40' height='40' fill='url(%23a)'/%3E%3Crect width='40' height='40' fill='url(%23b)'/%3E%3Crect width='40' height='40' fill='url(%23c)'/%3E%3C/svg%3E";

// ── Code snippets ────────────────────────────────────────

// Every example composes the same four feature cards a different way.
const basicCode = `import {
  Card, CardGroup, CardHeader, CardMedia,
  CardTitle, CardDescription, CardFooter, CardButton,
} from "./components";

// Borderless inline list: icon + a ghost action, divided by hairlines.
<CardGroup orientation="inline">
  <Card>
    <CardMedia icon={Circle} />
    <CardHeader>
      <CardTitle>Fluid motion</CardTitle>
      <CardDescription>Spring-tuned transitions across three tiers</CardDescription>
    </CardHeader>
    <CardFooter>
      <CardButton>Connect</CardButton>
    </CardFooter>
  </Card>
  {/* …three more */}
</CardGroup>`;

const gridCode = `// Two-column grid of image tiles — columns > 1 turns on 2-D
// proximity: the highlight springs to the nearest card across rows AND columns.
<CardGroup columns={2} border="outlined" separated>
  <Card>
    <CardImage src={banner} />
    <CardHeader>
      <CardTitle>Fluid motion</CardTitle>
      <CardDescription>Spring-tuned transitions…</CardDescription>
    </CardHeader>
    <CardFooter>
      <CardButton variant="primary">Get started</CardButton>
      <CardButton variant="secondary">Learn more</CardButton>
    </CardFooter>
  </Card>
  {/* …three more */}
</CardGroup>`;

const outlinedCode = `// One shared outlined frame, rows split by dividers: logo + primary.
<CardGroup orientation="inline" border="outlined">
  <Card>
    <CardMedia logo={logo} />
    <CardHeader>
      <CardTitle>Fluid motion</CardTitle>
      <CardDescription>Spring-tuned transitions across three tiers</CardDescription>
    </CardHeader>
    <CardFooter>
      <CardButton variant="primary">Get started</CardButton>
    </CardFooter>
  </Card>
  {/* CardMedia also accepts a [logoA, logoB] tuple for a connected pair */}
</CardGroup>`;

const separatedCode = `// Separated inline tiles with a full-height image; the action
// row drops below the text (primary, secondary, ghost).
<CardGroup orientation="inline" separated>
  <Card>
    <CardImage src={banner} />
    <CardHeader>
      <CardTitle>Fluid motion</CardTitle>
      <CardDescription>Spring-tuned transitions…</CardDescription>
    </CardHeader>
    <CardFooter>
      <CardButton variant="primary">Get started</CardButton>
      <CardButton variant="secondary">Learn more</CardButton>
      <CardButton>Connect</CardButton>
    </CardFooter>
  </Card>
  {/* …three more */}
</CardGroup>`;

const promoCode = `<Card dismissible onDismiss={() => {}}
  className="border border-border/60 overflow-hidden rounded-xl">
  <CardImage src={banner} />
  <CardHeader>
    <CardTitle>Meet the new Card component</CardTitle>
  </CardHeader>
  <CardContent className="flex flex-col gap-3">
    <CardFeature icon={Paintbrush} title="Always pixel-perfect"
      description="Token-driven, crisp in light and dark at any radius" />
    <CardFeature icon={SquareLibrary} title="Stacked, inline, or grid"
      description="One compositional API, borderless by default" />
  </CardContent>
  <CardFooter>
    <CardButton variant="primary">Get started</CardButton>
    <CardButton variant="ghost">Learn more</CardButton>
  </CardFooter>
</Card>`;

const selectedCode = `// Clickable selection — one active card carries the fill, its
// title bolds, and the group drops the dividers around it.
const [selected, setSelected] = useState(1);

<CardGroup orientation="inline">
  {features.map((f, i) => (
    <Card
      key={f.title}
      label={f.title}
      selected={selected === i}
      onClick={() => setSelected(i)}
    >
      <CardMedia icon={f.icon} />
      <CardHeader>
        <CardTitle>{f.title}</CardTitle>
        <CardDescription>{f.description}</CardDescription>
      </CardHeader>
    </Card>
  ))}
</CardGroup>`;

// ── Props ────────────────────────────────────────────────

const groupProps: PropDef[] = [
  { name: "orientation", type: '"card" | "inline"', default: '"card"', description: "Per-card layout: stacked (media/header on top) or a horizontal row." },
  { name: "columns", type: "number", default: "1", description: "Grid columns. Greater than 1 enables 2-D proximity across rows and columns." },
  { name: "border", type: '"none" | "outlined"', default: '"none"', description: "Borderless (dividers only) or a drawn border." },
  { name: "separated", type: "boolean", default: "false", description: "Split into individually-shaped tiles with a gap instead of one divided block." },
  { name: "proximityHover", type: "boolean", default: "true", description: "Enable the magnetic proximity-hover highlight." },
  { name: "children", type: "ReactNode", description: "Card children. Each is auto-assigned its proximity index." },
];

const cardProps: PropDef[] = [
  { name: "children", type: "ReactNode", description: "Compositional parts: CardImage, CardMedia, CardHeader, CardContent, CardFooter." },
  { name: "onClick", type: "() => void", description: "Makes the whole card a clickable target (stretched button)." },
  { name: "href", type: "string", description: "Makes the whole card a link (stretched anchor)." },
  { name: "external", type: "boolean", default: "false", description: "Opens href in a new tab." },
  { name: "label", type: "string", description: "Accessible name for the stretched link/button when the whole card is clickable." },
  { name: "selected", type: "boolean", default: "false", description: "Persistent selected fill + title emphasis, on top of proximity hover. The group drops the hairline dividers around the selected card so the fill reads clean." },
  { name: "disabled", type: "boolean", default: "false", description: "Dims and disables the card." },
  { name: "dismissible", type: "boolean", default: "false", description: "Shows a dismiss (✕) button." },
  { name: "onDismiss", type: "() => void", description: "Called when the dismiss button is pressed." },
];

const partProps: PropDef[] = [
  { name: "CardHeader", type: "part", description: "Title + description grid; pins CardAction to the top-right." },
  { name: "CardTitle", type: "part", description: "Weight-animates normal → semibold when the card is selected (proximity hover previews via the highlight, not the weight)." },
  { name: "CardDescription", type: "part", description: "Muted supporting text." },
  { name: "CardAction", type: "part", description: "Top-right slot in the header (e.g. a menu button); stays clickable above the card overlay." },
  { name: "CardContent", type: "part", description: "Body region below the header." },
  { name: "CardFooter", type: "part", description: "Actions row. Trailing-right in inline cards, but drops below the text (natural order) in an inline card with a CardImage; wraps under the content when stacked." },
  { name: "CardMedia", type: "IconComponent | logo", description: "Leading icon in a tinted 32×32 tile, or a brand logo / [logoA, logoB] tuple." },
  { name: "CardImage", type: "{ src }", description: "Full-bleed image — a top banner when stacked, a square leading image when inline. Corners round only inside a framed tile (outlined, or a caller's overflow-hidden wrapper); a borderless card reads as a plain rectangle." },
  { name: "CardEyebrow", type: "part", description: "Small uppercase label above the title." },
  { name: "CardFeature", type: "{ icon, title, description }", description: "Icon + title + description row for feature lists." },
];

const buttonProps: PropDef[] = [
  { name: "children", type: "ReactNode", description: "Button label." },
  { name: "onClick", type: "() => void", description: "Click handler." },
  { name: "href", type: "string", description: "Renders the action as a link." },
  { name: "variant", type: '"primary" | "secondary" | "ghost" | "link"', default: '"ghost"', description: "Visual style." },
  { name: "icon", type: "IconComponent", description: "Leading (or trailing) icon." },
  { name: "iconPosition", type: '"start" | "end"', description: "Icon side. Defaults to end for external actions, else start." },
  { name: "external", type: "boolean", default: "false", description: "Appends an outward arrow and opens href in a new tab." },
];

// ── Demos ────────────────────────────────────────────────

// Every example below composes the *same four feature cards* a different way —
// swap the media, borders, columns, and actions to see how far one API stretches.
function useFeatures() {
  const Circle = useIcon("circle");
  const Shield = useIcon("shield");
  const Palette = useIcon("palette");
  const Moon = useIcon("moon");
  return [
    { icon: Circle, title: "Fluid motion", description: "Spring-tuned transitions calibrated across three tiers" },
    { icon: Shield, title: "Accessible by default", description: "Focus-visible rings and ARIA roles in every part" },
    { icon: Palette, title: "Yours to theme", description: "Swap radius, icons, and primitive at runtime" },
    { icon: Moon, title: "Dark mode ready", description: "Tokens adapt to light and dark automatically" },
  ];
}

// Borderless inline list: leading icon, a subtle divider between rows, one ghost
// action trailing on the right.
function BasicDemo() {
  const features = useFeatures();
  return (
    <div className="w-full max-w-[520px]">
      <CardGroup orientation="inline">
        {features.map((f) => (
          <Card key={f.title}>
            <CardMedia icon={f.icon} />
            <CardHeader>
              <CardTitle>{f.title}</CardTitle>
              <CardDescription>{f.description}</CardDescription>
            </CardHeader>
            <CardFooter>
              <CardButton>Connect</CardButton>
            </CardFooter>
          </Card>
        ))}
      </CardGroup>
    </div>
  );
}

// Two-column grid of image tiles with primary + secondary actions; the magnetic
// highlight resolves the nearest card across both rows and columns.
function GridDemo() {
  const features = useFeatures();
  return (
    <div className="w-full max-w-[560px]">
      <CardGroup columns={2} border="outlined" separated>
        {features.map((f) => (
          <Card key={f.title}>
            <CardImage src={BANNER} />
            <CardHeader>
              <CardTitle>{f.title}</CardTitle>
              <CardDescription>{f.description}</CardDescription>
            </CardHeader>
            <CardFooter>
              <CardButton variant="primary">Get started</CardButton>
              <CardButton variant="secondary">Learn more</CardButton>
            </CardFooter>
          </Card>
        ))}
      </CardGroup>
    </div>
  );
}

// One shared outlined frame, rows split by dividers: leading logo, primary action.
function OutlinedDemo() {
  const features = useFeatures();
  return (
    <div className="w-full max-w-[520px]">
      <CardGroup orientation="inline" border="outlined">
        {features.map((f) => (
          <Card key={f.title}>
            <CardMedia logo={THUMB} />
            <CardHeader>
              <CardTitle>{f.title}</CardTitle>
              <CardDescription>{f.description}</CardDescription>
            </CardHeader>
            <CardFooter>
              <CardButton variant="primary">Get started</CardButton>
            </CardFooter>
          </Card>
        ))}
      </CardGroup>
    </div>
  );
}

// Separated inline tiles with a full-height image and a full action row that
// drops below the text (primary, secondary, ghost).
function SeparatedDemo() {
  const features = useFeatures();
  return (
    <div className="w-full max-w-[560px]">
      <CardGroup orientation="inline" separated>
        {features.map((f) => (
          <Card key={f.title}>
            <CardImage src={BANNER} />
            <CardHeader>
              <CardTitle>{f.title}</CardTitle>
              <CardDescription>{f.description}</CardDescription>
            </CardHeader>
            <CardFooter>
              <CardButton variant="primary">Get started</CardButton>
              <CardButton variant="secondary">Learn more</CardButton>
              <CardButton>Connect</CardButton>
            </CardFooter>
          </Card>
        ))}
      </CardGroup>
    </div>
  );
}

function PromoDemo() {
  const Paintbrush = useIcon("paintbrush");
  const SquareLibrary = useIcon("square-library");
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) {
    return (
      <button
        type="button"
        onClick={() => setDismissed(false)}
        className="text-[13px] text-muted-foreground hover:text-foreground underline underline-offset-4 cursor-pointer"
      >
        Restore card
      </button>
    );
  }
  return (
    <div className="w-full max-w-[300px]">
      <Card
        dismissible
        onDismiss={() => setDismissed(true)}
        className="border border-border/60 overflow-hidden rounded-xl"
      >
        <CardImage src={BANNER} />
        <CardHeader>
          <CardTitle>Meet the new Card component</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <CardFeature
            icon={Paintbrush}
            title="Always pixel-perfect"
            description="Renders your design exactly — token-driven and crisp in light and dark, at any radius"
          />
          <CardFeature
            icon={SquareLibrary}
            title="Stacked, inline, or grid"
            description="One compositional API — borderless by default, with separated tiles or a shared frame"
          />
        </CardContent>
        <CardFooter>
          <CardButton variant="primary">Get started</CardButton>
          <CardButton variant="ghost">Learn more</CardButton>
        </CardFooter>
      </Card>
    </div>
  );
}

// Clickable selection: one card carries the persistent fill, its title bolds,
// and the group drops the dividers around it so the fill reads clean.
function SelectedDemo() {
  const features = useFeatures();
  const [selected, setSelected] = useState(1);
  return (
    <div className="w-full max-w-[520px]">
      <CardGroup orientation="inline">
        {features.map((f, i) => (
          <Card
            key={f.title}
            label={f.title}
            selected={selected === i}
            onClick={() => setSelected(i)}
          >
            <CardMedia icon={f.icon} />
            <CardHeader>
              <CardTitle>{f.title}</CardTitle>
              <CardDescription>{f.description}</CardDescription>
            </CardHeader>
          </Card>
        ))}
      </CardGroup>
    </div>
  );
}

// ── Playground ───────────────────────────────────────────
// A live sandbox: the controls on the right drive a real CardGroup so every
// combination of the key props can be previewed, with the matching code kept
// in sync in the Code tab.

type PlayOrientation = "card" | "inline";
type PlayBorder = "none" | "outlined";
type PlayMedia = "icon" | "logo" | "image" | "none";

// Reversed layout turns the library Switch (toggle → label) into a settings
// row (label ← left, toggle → right) that matches the borderless-select rows.
const PLAY_SWITCH = "w-full flex-row-reverse justify-between h-9 px-1 py-0";

function PlayField({
  label,
  children,
  disabled = false,
}: {
  label: string;
  children: React.ReactNode;
  disabled?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex h-9 items-center justify-between px-1",
        disabled && "opacity-40 pointer-events-none"
      )}
    >
      <span className="text-[13px] text-muted-foreground">{label}</span>
      {children}
    </div>
  );
}

function PlaySelect({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger
        variant="borderless"
        className="min-w-0 w-auto h-7 px-2 text-[13px]"
      />
      <SelectContent>
        {options.map((o, i) => (
          <SelectItem key={o.value} value={o.value} index={i}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function PlaySection({ label }: { label: string }) {
  return (
    <div
      className="px-1 pb-1 pt-1 text-[12px] text-muted-foreground"
      style={{ fontVariationSettings: fontWeights.semibold }}
    >
      {label}
    </div>
  );
}

function buildPlaygroundCode(o: {
  orientation: PlayOrientation;
  cols: number;
  border: PlayBorder;
  separated: boolean;
  proximity: boolean;
  media: PlayMedia;
  description: boolean;
  primaryBtn: boolean;
  secondaryBtn: boolean;
  ghostBtn: boolean;
  selected: boolean;
}) {
  const groupProps: string[] = [];
  if (o.orientation !== "card") groupProps.push(`orientation="${o.orientation}"`);
  if (o.cols !== 1) groupProps.push(`columns={${o.cols}}`);
  if (o.border !== "none") groupProps.push(`border="${o.border}"`);
  if (o.separated) groupProps.push("separated");
  if (!o.proximity) groupProps.push("proximityHover={false}");
  const attr = groupProps.length ? " " + groupProps.join(" ") : "";
  const isInline = o.orientation === "inline";

  const smallMedia =
    o.media === "icon"
      ? "<CardMedia icon={Search} />"
      : o.media === "logo"
        ? "<CardMedia logo={logo} />"
        : null;
  const imageLine = o.media === "image" ? "<CardImage src={image} />" : null;
  const btns: string[] = [];
  if (o.primaryBtn) btns.push("<CardButton variant=\"primary\">Get started</CardButton>");
  if (o.secondaryBtn) btns.push("<CardButton variant=\"secondary\">Learn more</CardButton>");
  if (o.ghostBtn) btns.push("<CardButton>Connect</CardButton>");
  const ordered = isInline && o.media !== "image" ? [...btns].reverse() : btns;
  const footer = ordered.length
    ? ["<CardFooter>", ...ordered.map((b) => "  " + b), "</CardFooter>"]
    : null;
  const descLine = o.description
    ? "<CardDescription>Analyze recent commits…</CardDescription>"
    : null;

  const lead = (s: string) => `    ${s}`;
  const inner = isInline
    ? [
        imageLine && lead(imageLine),
        smallMedia && lead(smallMedia),
        lead("<CardHeader>"),
        lead("  <CardTitle>Find critical bugs</CardTitle>"),
        descLine && lead(`  ${descLine}`),
        lead("</CardHeader>"),
        ...(footer ? footer.map(lead) : []),
      ]
    : [
        imageLine && lead(imageLine),
        lead("<CardHeader>"),
        smallMedia && lead(`  ${smallMedia}`),
        lead("  <CardTitle>Find critical bugs</CardTitle>"),
        descLine && lead(`  ${descLine}`),
        lead("</CardHeader>"),
        ...(footer ? footer.map(lead) : []),
      ];

  return `<CardGroup${attr}>
  <Card${o.selected ? " selected onClick={() => setSelected(0)}" : ""}>
${inner.filter(Boolean).join("\n")}
  </Card>
  {/* …three more */}
</CardGroup>`;
}

// True at ≥1280px, where the right rail is visible (below that it's
// display:none, so controls fall back to rendering inline under the preview).
function useIsXl() {
  const [isXl, setIsXl] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1280px)");
    const sync = () => setIsXl(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);
  return isXl;
}

function CardPlayground() {
  const Circle = useIcon("circle");
  const Shield = useIcon("shield");
  const Palette = useIcon("palette");
  const Moon = useIcon("moon");
  const Search = useIcon("search");
  const Lightbulb = useIcon("lightbulb");

  const [orientation, setOrientation] = useState<PlayOrientation>("card");
  const [columns, setColumns] = useState("2");
  const [border, setBorder] = useState<PlayBorder>("none");
  const [separated, setSeparated] = useState(false);
  const [proximity, setProximity] = useState(true);
  const [media, setMedia] = useState<PlayMedia>("icon");
  const [primaryBtn, setPrimaryBtn] = useState(false);
  const [secondaryBtn, setSecondaryBtn] = useState(false);
  const [ghostBtn, setGhostBtn] = useState(false);
  const [description, setDescription] = useState(true);
  const [selectedOn, setSelectedOn] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Park the controls in the right rail on wide screens; inline below the
  // preview otherwise. `mounted` gates the first paint so desktop doesn't flash
  // the controls inline before the portal target resolves.
  const railNode = useRightRailNode();
  const isXl = useIsXl();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const inRail = isXl && !!railNode;

  // Show the rail controls only while the center playground is on screen —
  // once it scrolls out of view, the controls in the rail disappear.
  const playgroundRef = useRef<HTMLDivElement>(null);
  const [playgroundInView, setPlaygroundInView] = useState(true);
  useEffect(() => {
    const el = playgroundRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => setPlaygroundInView(entry.isIntersecting),
      { rootMargin: "0px 0px -20% 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const allItems = [
    { icon: Circle, title: "Fluid motion", description: "Spring-tuned transitions calibrated across three tiers" },
    { icon: Shield, title: "Accessible by default", description: "Focus-visible rings and ARIA roles in every part" },
    { icon: Palette, title: "Yours to theme", description: "Swap radius, icons, and primitive at runtime" },
    { icon: Moon, title: "Dark mode ready", description: "Tokens adapt to light and dark automatically" },
    { icon: Search, title: "Proximity hover", description: "A magnetic highlight previews where a click lands" },
    { icon: Lightbulb, title: "Drop-in registry", description: "Install any component with one shadcn command" },
  ];

  const isInline = orientation === "inline";
  // Inline cards are a full-width list — a multi-column grid crams them until
  // the media, wrapped title, and footer collide. Force a single column there.
  const cols = isInline ? 1 : Number(columns);
  // 3 columns fills two even rows (6); every other layout stays at 4.
  const items = allItems.slice(0, cols === 3 ? 6 : 4);
  // A selection made while more items were shown (cols 3 → 6) would otherwise
  // point past a now-shorter list; clamp so the selection stays visible.
  const activeSelected = Math.min(selectedIndex, items.length - 1);
  const isImage = media === "image";
  const isSmall = media === "icon" || media === "logo";
  // The prominent image needs each card to clip it to its own rounded corners,
  // so it only reads right on separated tiles — force (and lock) Separated on.
  const effectiveSeparated = isImage || separated;

  const code = buildPlaygroundCode({ orientation, cols, border, separated: effectiveSeparated, proximity, media, description, primaryBtn, secondaryBtn, ghostBtn, selected: selectedOn });

  // Small media (icon / logo) — sits in the header when stacked, leading when
  // inline. The prominent "image" is handled separately with CardImage.
  const renderSmall = (icon: IconComponent) =>
    media === "icon" ? (
      <CardMedia icon={icon} />
    ) : media === "logo" ? (
      <CardMedia logo={THUMB} size={32} />
    ) : null;

  const renderFooter = () => {
    // Stacked order: primary → secondary → ghost (primary on the left). A plain
    // inline row reverses it so the primary sits on the right; but an inline
    // image card drops the actions below the text, where they keep the natural
    // left-to-right order.
    const btns: React.ReactNode[] = [];
    if (primaryBtn) btns.push(<CardButton key="p" variant="primary">Get started</CardButton>);
    if (secondaryBtn) btns.push(<CardButton key="s" variant="secondary">Learn more</CardButton>);
    if (ghostBtn) btns.push(<CardButton key="g">Connect</CardButton>);
    if (!btns.length) return null;
    const reverse = isInline && !isImage;
    return <CardFooter>{reverse ? [...btns].reverse() : btns}</CardFooter>;
  };

  // Roll the whole panel to random values — the derived constraints (image
  // forces Separated, inline forces one column) still apply on top.
  const randomize = () => {
    const pick = <T,>(arr: readonly T[]) =>
      arr[Math.floor(Math.random() * arr.length)];
    setMedia(pick(["icon", "logo", "image", "none"] as const));
    setDescription(Math.random() > 0.25);
    setPrimaryBtn(Math.random() > 0.4);
    setSecondaryBtn(Math.random() > 0.6);
    setGhostBtn(Math.random() > 0.6);
    setSelectedOn(Math.random() > 0.6);
    setSelectedIndex(Math.floor(Math.random() * 4));
    setOrientation(pick(["card", "inline"] as const));
    setColumns(pick(["1", "2", "3"] as const));
    setBorder(pick(["none", "outlined"] as const));
    setSeparated(Math.random() > 0.5);
    setProximity(Math.random() > 0.2);
  };

  const controls = (
    <SurfaceProvider value={2}>
      <div className="w-full rounded-lg bg-muted p-3">
        <div className="flex items-center justify-between px-1 pt-1 pb-2">
          <h2
            className="text-[16px] text-foreground leading-none"
            style={{ fontVariationSettings: fontWeights.semibold }}
          >
            Playground variant
          </h2>
          <button
            type="button"
            onClick={randomize}
            aria-label="Randomize properties"
            title="Randomize"
            className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground/70 hover:text-foreground hover:bg-hover transition-colors duration-80 cursor-pointer outline-none focus-visible:ring-1 focus-visible:ring-[color:var(--focus-ring,#6B97FF)]"
          >
            <Shuffle size={15} strokeWidth={1.5} />
          </button>
        </div>

        {/* Card (per-card props) */}
        <PlaySection label="Card" />
        <div>
          <PlayField label="Media">
            <PlaySelect
              value={media}
              onChange={(v) => setMedia(v as PlayMedia)}
              options={[
                { value: "icon", label: "Icon" },
                { value: "logo", label: "Logo" },
                { value: "image", label: "Image" },
                { value: "none", label: "None" },
              ]}
            />
          </PlayField>
          <Switch
            label="Description"
            checked={description}
            onToggle={() => setDescription((v) => !v)}
            className={PLAY_SWITCH}
          />
          <Switch
            label="Primary button"
            checked={primaryBtn}
            onToggle={() => setPrimaryBtn((v) => !v)}
            className={PLAY_SWITCH}
          />
          <Switch
            label="Secondary button"
            checked={secondaryBtn}
            onToggle={() => setSecondaryBtn((v) => !v)}
            className={PLAY_SWITCH}
          />
          <Switch
            label="Ghost button"
            checked={ghostBtn}
            onToggle={() => setGhostBtn((v) => !v)}
            className={PLAY_SWITCH}
          />
        </div>

        {/* Single separator between the two groups */}
        <div className="my-2 border-t border-border/60" />

        {/* Card group (layout props) */}
        <PlaySection label="Card group" />
        <div>
          <PlayField label="Orientation">
            <PlaySelect
              value={orientation}
              onChange={(v) => setOrientation(v as PlayOrientation)}
              options={[
                { value: "card", label: "Card" },
                { value: "inline", label: "Inline" },
              ]}
            />
          </PlayField>
          <PlayField label="Columns" disabled={isInline}>
            <PlaySelect
              value={isInline ? "1" : columns}
              onChange={setColumns}
              options={[
                { value: "1", label: "1" },
                { value: "2", label: "2" },
                { value: "3", label: "3" },
              ]}
            />
          </PlayField>
          <PlayField label="Border">
            <PlaySelect
              value={border}
              onChange={(v) => setBorder(v as PlayBorder)}
              options={[
                { value: "none", label: "None" },
                { value: "outlined", label: "Outlined" },
              ]}
            />
          </PlayField>
          <Switch
            label="Separated"
            checked={effectiveSeparated}
            onToggle={() => setSeparated((v) => !v)}
            disabled={isImage}
            className={PLAY_SWITCH}
          />
          <Switch
            label="Proximity hover"
            checked={proximity}
            onToggle={() => setProximity((v) => !v)}
            className={PLAY_SWITCH}
          />
          <Switch
            label="Selected"
            checked={selectedOn}
            onToggle={() => setSelectedOn((v) => !v)}
            className={PLAY_SWITCH}
          />
        </div>
      </div>
    </SurfaceProvider>
  );

  return (
    <div ref={playgroundRef}>
      <ComponentPreview code={code} padding="compact" minHeightClass="min-h-[600px]">
        <div className="w-full max-w-[560px]">
          <CardGroup
            orientation={orientation}
            columns={cols}
            border={border}
            separated={effectiveSeparated}
            proximityHover={proximity}
          >
            {items.map((item, i) => (
              <Card
                key={item.title}
                label={item.title}
                selected={selectedOn && i === activeSelected}
                onClick={selectedOn ? () => setSelectedIndex(i) : undefined}
              >
                {isImage && <CardImage src={BANNER} />}
                {isSmall && isInline && renderSmall(item.icon)}
                <CardHeader>
                  {isSmall && !isInline && renderSmall(item.icon)}
                  <CardTitle>{item.title}</CardTitle>
                  {description && <CardDescription>{item.description}</CardDescription>}
                </CardHeader>
                {renderFooter()}
              </Card>
            ))}
          </CardGroup>
        </div>
      </ComponentPreview>

      {mounted && inRail && (
        // Kept mounted so it can cross-fade (the same fade the side panels use)
        // as the playground scrolls in and out of view, rather than snapping.
        createPortal(
          <div className="inview-fade-block" data-shown={playgroundInView}>
            {controls}
          </div>,
          railNode
        )
      )}
      {mounted && !inRail && <div className="mt-3">{controls}</div>}
    </div>
  );
}

export default function CardDoc() {
  return (
    <DocPage
      title="Card"
      slug="card"
      description="shadcn's compositional card, dressed in Fluid Functionalism. Stacked, inline, or grid — borderless by default with proximity hover that previews where a click will land."
    >
      <DocSection title="Playground">
        <CardPlayground />
      </DocSection>

      <DocSection title="Basic">
        <ComponentPreview code={basicCode} padding="compact">
          <BasicDemo />
        </ComponentPreview>
      </DocSection>

      <DocSection title="Grid — 2-D proximity">
        <ComponentPreview code={gridCode} padding="compact">
          <GridDemo />
        </ComponentPreview>
      </DocSection>

      <DocSection title="Outlined group">
        <ComponentPreview code={outlinedCode} padding="compact">
          <OutlinedDemo />
        </ComponentPreview>
      </DocSection>

      <DocSection title="Separated tiles">
        <ComponentPreview code={separatedCode} padding="compact">
          <SeparatedDemo />
        </ComponentPreview>
      </DocSection>

      <DocSection title="Fully yours — compose anything">
        <ComponentPreview code={promoCode} padding="compact">
          <PromoDemo />
        </ComponentPreview>
      </DocSection>

      <DocSection title="Selected">
        <ComponentPreview code={selectedCode} padding="compact">
          <SelectedDemo />
        </ComponentPreview>
      </DocSection>

      <DocSection title="API Reference — Card">
        <PropsTable props={cardProps} />
      </DocSection>

      <DocSection title="API Reference — CardGroup">
        <PropsTable props={groupProps} />
      </DocSection>

      <DocSection title="API Reference — Parts">
        <PropsTable props={partProps} />
      </DocSection>

      <DocSection title="API Reference — CardButton">
        <PropsTable props={buttonProps} />
      </DocSection>
    </DocPage>
  );
}
