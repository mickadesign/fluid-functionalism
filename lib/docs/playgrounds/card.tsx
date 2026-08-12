"use client";

import { useState } from "react";
import {
  Card,
  CardGroup,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
  CardMedia,
  CardImage,
  CardButton,
} from "@/registry/default/card";
import { useIcon, type IconComponent } from "@/lib/icon-context";
import { Switch } from "@/registry/radix/switch";
import {
  PLAY_SWITCH,
  PlayField,
  PlaySelect,
  PlaySection,
  PlayDivider,
  PlaygroundPanel,
} from "@/lib/docs/playground";
import type { PlaygroundProps } from "./types";

// ── Card playground ──────────────────────────────────────
// A live sandbox: the controls drive a real CardGroup so every combination of
// the key props can be previewed, with the matching code kept in sync in the
// doc page's Code tab.

// An inline data-URI banner so the demo needs no asset files (CardImage
// accepts any src).
// Image → a monochrome mesh built from the clarity-blue accent (#6B97FF) alone,
// at different opacities over white, so it reads as one calm brand-blue wash.
export const BANNER =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='320' height='180'%3E%3Cdefs%3E%3CradialGradient id='a' cx='12%25' cy='16%25' r='70%25'%3E%3Cstop offset='0%25' stop-color='%236B97FF' stop-opacity='0.9'/%3E%3Cstop offset='100%25' stop-color='%236B97FF' stop-opacity='0'/%3E%3C/radialGradient%3E%3CradialGradient id='b' cx='90%25' cy='12%25' r='65%25'%3E%3Cstop offset='0%25' stop-color='%236B97FF' stop-opacity='0.45'/%3E%3Cstop offset='100%25' stop-color='%236B97FF' stop-opacity='0'/%3E%3C/radialGradient%3E%3CradialGradient id='c' cx='82%25' cy='94%25' r='75%25'%3E%3Cstop offset='0%25' stop-color='%236B97FF' stop-opacity='0.8'/%3E%3Cstop offset='100%25' stop-color='%236B97FF' stop-opacity='0'/%3E%3C/radialGradient%3E%3CradialGradient id='d' cx='24%25' cy='90%25' r='68%25'%3E%3Cstop offset='0%25' stop-color='%236B97FF' stop-opacity='0.55'/%3E%3Cstop offset='100%25' stop-color='%236B97FF' stop-opacity='0'/%3E%3C/radialGradient%3E%3C/defs%3E%3Crect width='320' height='180' fill='%23ffffff'/%3E%3Crect width='320' height='180' fill='%236B97FF' fill-opacity='0.2'/%3E%3Crect width='320' height='180' fill='url(%23a)'/%3E%3Crect width='320' height='180' fill='url(%23b)'/%3E%3Crect width='320' height='180' fill='url(%23c)'/%3E%3Crect width='320' height='180' fill='url(%23d)'/%3E%3C/svg%3E";

// Logo → the same clarity-blue (#6B97FF) monochrome mesh as the image, at
// different opacities over white; a denser base tint reads as a solid brand tile.
export const THUMB =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40'%3E%3Cdefs%3E%3CradialGradient id='a' cx='20%25' cy='18%25' r='80%25'%3E%3Cstop offset='0%25' stop-color='%236B97FF' stop-opacity='0.95'/%3E%3Cstop offset='100%25' stop-color='%236B97FF' stop-opacity='0'/%3E%3C/radialGradient%3E%3CradialGradient id='b' cx='86%25' cy='14%25' r='75%25'%3E%3Cstop offset='0%25' stop-color='%236B97FF' stop-opacity='0.5'/%3E%3Cstop offset='100%25' stop-color='%236B97FF' stop-opacity='0'/%3E%3C/radialGradient%3E%3CradialGradient id='c' cx='72%25' cy='94%25' r='85%25'%3E%3Cstop offset='0%25' stop-color='%236B97FF' stop-opacity='0.85'/%3E%3Cstop offset='100%25' stop-color='%236B97FF' stop-opacity='0'/%3E%3C/radialGradient%3E%3C/defs%3E%3Crect width='40' height='40' fill='%23ffffff'/%3E%3Crect width='40' height='40' fill='%236B97FF' fill-opacity='0.35'/%3E%3Crect width='40' height='40' fill='url(%23a)'/%3E%3Crect width='40' height='40' fill='url(%23b)'/%3E%3Crect width='40' height='40' fill='url(%23c)'/%3E%3C/svg%3E";

type PlayOrientation = "card" | "inline";
type PlayBorder = "none" | "outlined";
type PlayMedia = "icon" | "logo" | "image" | "none";

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

export function CardPlayground({ children }: PlaygroundProps) {
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
    <PlaygroundPanel onShuffle={randomize}>
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

      <PlayDivider />

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
    </PlaygroundPanel>
  );

  const group = (
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
  );

  return children({
    preview: <div className="w-full max-w-[560px]">{group}</div>,
    // The demo card's slide wrapper already clamps to its own max width — let
    // the group fill it.
    demoPreview: <div className="w-full">{group}</div>,
    controls,
    code,
  });
}
