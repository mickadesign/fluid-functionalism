"use client";

import { useMemo, useState } from "react";
import { useAccent } from "@/lib/docs/accent";
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
import { useIcons, type IconComponent } from "@/lib/icon-context";
import { Switch } from "@/registry/radix/switch";
import {
  PLAY_SWITCH,
  PlayField,
  PlaySelect,
  PlaySection,
  PlayDivider,
  PlaygroundPanel,
} from "@/lib/docs/playground";
import {
  CARD_PRESET_DEF,
  CARD_DEFAULT_CODE,
  CARD_ITEMS,
  CARD_BANNER,
  CARD_THUMB,
  tintCardArt,
  encodeCardPreset,
  decodeCardPreset,
  type CardPreset,
} from "@/lib/preset/card-options";
import {
  usePresetGlobals,
  usePresetUrlSync,
  GetCodeDialog,
} from "@/lib/docs/preset-ui";
import type { PlaygroundProps } from "./types";

// ── Card playground ──────────────────────────────────────
// A live sandbox: the controls drive a real CardGroup so every combination of
// the key props can be previewed, with the matching code kept in sync in the
// doc page's Code tab.

// The inline data-URI banner/logo and the feature-tile content now live in
// lib/preset/card-options.ts (pure data, shared with the install generator);
// re-exported here so doc pages keep their import site.
export const BANNER = CARD_BANNER;
export const THUMB = CARD_THUMB;

/** The banner and logo in the visitor's accent, on the theme showing. */
export function useCardArt() {
  const { hex } = useAccent();
  return useMemo(
    () => ({ banner: tintCardArt(CARD_BANNER, hex), thumb: tintCardArt(CARD_THUMB, hex) }),
    [hex]
  );
}

type PlayOrientation = "card" | "inline";
type PlayBorder = "none" | "outlined";
type PlayMedia = "icon" | "logo" | "image" | "none";

function buildPlaygroundCode(o: {
  orientation: PlayOrientation;
  cols: number;
  border: PlayBorder;
  separated: boolean;
  fluidHover: boolean;
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
  if (!o.fluidHover) groupProps.push("fluidHover={false}");
  const attr = groupProps.length ? " " + groupProps.join(" ") : "";
  const isInline = o.orientation === "inline";

  const smallMedia =
    o.media === "icon"
      ? "<CardMedia icon={Search} />"
      : o.media === "logo"
        ? "<CardMedia logo={logo} size={32} />"
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
  <Card${o.selected ? ' label="Find critical bugs" selected onClick={() => setSelected(0)}' : ""}>
${inner.filter(Boolean).join("\n")}
  </Card>
  {/* …three more */}
</CardGroup>`;
}

export function CardPlayground({ children }: PlaygroundProps) {
  const art = useCardArt();
  const icons = useIcons();

  const [orientation, setOrientation] = useState<PlayOrientation>("card");
  const [columns, setColumns] = useState("2");
  const [border, setBorder] = useState<PlayBorder>("none");
  const [separated, setSeparated] = useState(false);
  const [fluidHover, setFluidHover] = useState(true);
  const [media, setMedia] = useState<PlayMedia>("icon");
  const [primaryBtn, setPrimaryBtn] = useState(false);
  const [secondaryBtn, setSecondaryBtn] = useState(false);
  const [ghostBtn, setGhostBtn] = useState(false);
  const [description, setDescription] = useState(true);
  const [selectedOn, setSelectedOn] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Content is shared with the preset install generator (card-options.ts) so
  // an installed block renders exactly what the preview shows.
  const allItems = CARD_ITEMS.map((item) => ({ ...item, icon: icons[item.icon] }));

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

  const code = buildPlaygroundCode({ orientation, cols, border, separated: effectiveSeparated, fluidHover, media, description, primaryBtn, secondaryBtn, ghostBtn, selected: selectedOn });

  // ── Get code (presets) ─────────────────────────────────
  // The rail's configuration bit-packs into a stateless code (shadcn's
  // preset principle) that the /r/preset route turns into an installable
  // registry item; the site's flavor/shape/size ride along. The RAW rail
  // values are encoded — the derived constraints (image forces Separated,
  // inline forces one column) re-apply on decode and in the generator.
  const globals = usePresetGlobals();
  const presetCode = encodeCardPreset({
    media,
    description,
    primaryBtn,
    secondaryBtn,
    ghostBtn,
    orientation,
    columns: Number(columns) as CardPreset["columns"],
    border,
    separated,
    fluidHover,
    selected: selectedOn,
    ...globals,
  });
  usePresetUrlSync(presetCode, CARD_DEFAULT_CODE, (raw) => {
    const res = decodeCardPreset(raw);
    if (res.ok) {
      const p = res.preset;
      setMedia(p.media);
      setDescription(p.description);
      setPrimaryBtn(p.primaryBtn);
      setSecondaryBtn(p.secondaryBtn);
      setGhostBtn(p.ghostBtn);
      setOrientation(p.orientation);
      setColumns(String(p.columns));
      setBorder(p.border);
      setSeparated(p.separated);
      setFluidHover(p.fluidHover);
      setSelectedOn(p.selected);
    }
  });

  // Small media (icon / logo) — sits in the header when stacked, leading when
  // inline. The prominent "image" is handled separately with CardImage.
  const renderSmall = (icon: IconComponent) =>
    media === "icon" ? (
      <CardMedia icon={icon} />
    ) : media === "logo" ? (
      <CardMedia logo={art.thumb} size={32} />
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
    setFluidHover(Math.random() > 0.2);
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


      {/* Card group (layout props) */}
      <PlayDivider />
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
          label="Fluid hover"
          checked={fluidHover}
          onToggle={() => setFluidHover((v) => !v)}
          className={PLAY_SWITCH}
        />
        <Switch
          label="Selected"
          checked={selectedOn}
          onToggle={() => setSelectedOn((v) => !v)}
          className={PLAY_SWITCH}
        />
      </div>

      <PlayDivider />
      {/* shadcn's preset principle: the exact configuration above, as a
          stateless code the registry can turn into an installable block. */}
      <GetCodeDialog def={CARD_PRESET_DEF} code={presetCode} />
    </PlaygroundPanel>
  );

  const group = (
    <CardGroup
      orientation={orientation}
      columns={cols}
      border={border}
      separated={effectiveSeparated}
      fluidHover={fluidHover}
    >
      {items.map((item, i) => (
        <Card
          key={item.title}
          label={item.title}
          selected={selectedOn && i === activeSelected}
          // Always a click target, so the fluid hover toggle has something to
          // light; selection only listens when it is on.
          onClick={() => {
            if (selectedOn) setSelectedIndex(i);
          }}
        >
          {isImage && <CardImage src={art.banner} />}
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
