// ---------------------------------------------------------------------------
// Install-grade code generation for card presets. Emits ONE compilable
// component reproducing exactly what the playground preview renders for the
// encoded state — same sizing wrapper, same derived constraints (image
// forces separated tiles, inline forces a single column), same demo
// content. tests/preset-card.test.mjs compiles the output across the state
// space through a real ts.createProgram over the project tsconfig.
// ---------------------------------------------------------------------------

import type { PresetFile } from "./sidebar-install";
import type { PresetGenerator } from "./generators";
import {
  type CardPreset,
  CARD_ITEMS,
  CARD_BANNER,
  CARD_THUMB,
} from "./card-options";

/** The playground's derived layout facts, shared by every emitter below. */
function derive(p: CardPreset) {
  const isInline = p.orientation === "inline";
  // Inline cards are a full-width list — force a single column (playground
  // rule), and 3 columns fills two even rows (6 items); everything else 4.
  const cols = isInline ? 1 : p.columns;
  const count = cols === 3 ? 6 : 4;
  const isImage = p.media === "image";
  const isSmall = p.media === "icon" || p.media === "logo";
  // The prominent image needs per-card clipping — separated is forced on.
  const separated = isImage || p.separated;
  const anyButton = p.primaryBtn || p.secondaryBtn || p.ghostBtn;
  return { isInline, cols, count, isImage, isSmall, separated, anyButton };
}

function cardSectionFile(p: CardPreset): string {
  const d = derive(p);
  const l: string[] = [];

  l.push(`"use client";`);
  l.push(``);
  if (p.selected) l.push(`import { useState } from "react";`);
  const parts = [
    "Card",
    "CardGroup",
    "CardHeader",
    "CardTitle",
    ...(p.description ? ["CardDescription"] : []),
    ...(d.anyButton ? ["CardFooter"] : []),
    ...(d.isSmall ? ["CardMedia"] : []),
    ...(d.isImage ? ["CardImage"] : []),
    ...(d.anyButton ? ["CardButton"] : []),
  ];
  l.push(`import {`);
  l.push(`  ${parts.join(",\n  ")},`);
  l.push(`} from "@/components/ui/card";`);
  if (p.media === "icon") {
    l.push(`import { useIcons, type IconName } from "@/lib/icon-context";`);
  }
  l.push(``);

  // ── Demo content ──
  l.push(`// Seed content for the generated card group — replace with your own.`);
  const itemFields = (item: (typeof CARD_ITEMS)[number]) =>
    [
      ...(p.media === "icon" ? [`icon: ${JSON.stringify(item.icon)}`] : []),
      `title: ${JSON.stringify(item.title)}`,
      ...(p.description ? [`description: ${JSON.stringify(item.description)}`] : []),
    ].join(", ");
  const itemType = [
    ...(p.media === "icon" ? ["icon: IconName"] : []),
    "title: string",
    ...(p.description ? ["description: string"] : []),
  ].join("; ");
  l.push(`const ITEMS: { ${itemType} }[] = [`);
  for (const item of CARD_ITEMS.slice(0, d.count)) {
    l.push(`  { ${itemFields(item)} },`);
  }
  l.push(`];`);
  l.push(``);
  if (d.isImage) {
    l.push(`// Inline data-URI banner so the demo needs no asset files — swap for your artwork.`);
    l.push(`const BANNER =`);
    l.push(`  ${JSON.stringify(CARD_BANNER)};`);
    l.push(``);
  }
  if (p.media === "logo") {
    l.push(`// Inline data-URI brand tile so the demo needs no asset files — swap for your logo.`);
    l.push(`const THUMB =`);
    l.push(`  ${JSON.stringify(CARD_THUMB)};`);
    l.push(``);
  }

  // ── Component ──
  l.push(`export function CardSection() {`);
  if (p.selected) l.push(`  const [selected, setSelected] = useState(0);`);
  if (p.media === "icon") l.push(`  const icons = useIcons();`);
  l.push(`  return (`);
  l.push(`    <div className="w-full max-w-[560px]">`);

  const groupProps: string[] = [];
  if (p.orientation !== "card") groupProps.push(`orientation="${p.orientation}"`);
  if (d.cols !== 1) groupProps.push(`columns={${d.cols}}`);
  if (p.border !== "none") groupProps.push(`border="${p.border}"`);
  if (d.separated) groupProps.push(`separated`);
  if (!p.fluidHover) groupProps.push(`fluidHover={false}`);
  l.push(`      <CardGroup${groupProps.length ? " " + groupProps.join(" ") : ""}>`);

  l.push(`        {ITEMS.map((item${p.selected ? ", i" : ""}) => (`);
  if (p.selected) {
    l.push(`          <Card`);
    l.push(`            key={item.title}`);
    l.push(`            label={item.title}`);
    l.push(`            selected={i === selected}`);
    l.push(`            onClick={() => setSelected(i)}`);
    l.push(`          >`);
  } else {
    // Always a click target, as in the playground: without one the fluid
    // hover has nothing to light.
    l.push(`          <Card`);
    l.push(`            key={item.title}`);
    l.push(`            label={item.title}`);
    l.push(`            // Replace with what a click on the card does.`);
    l.push(`            onClick={() => {}}`);
    l.push(`          >`);
  }

  const mediaLine =
    p.media === "icon"
      ? `<CardMedia icon={icons[item.icon]} />`
      : p.media === "logo"
        ? `<CardMedia logo={THUMB} size={32} />`
        : null;
  if (d.isImage) l.push(`            <CardImage src={BANNER} />`);
  if (d.isInline && mediaLine) l.push(`            ${mediaLine}`);
  l.push(`            <CardHeader>`);
  if (!d.isInline && mediaLine) l.push(`              ${mediaLine}`);
  l.push(`              <CardTitle>{item.title}</CardTitle>`);
  if (p.description) {
    l.push(`              <CardDescription>{item.description}</CardDescription>`);
  }
  l.push(`            </CardHeader>`);
  if (d.anyButton) {
    // Stacked order: primary → secondary → ghost. A plain inline row reverses
    // it so the primary sits on the right; an inline image card keeps the
    // natural order (actions drop below the text).
    const btns: string[] = [];
    if (p.primaryBtn) btns.push(`<CardButton variant="primary">Get started</CardButton>`);
    if (p.secondaryBtn) btns.push(`<CardButton variant="secondary">Learn more</CardButton>`);
    if (p.ghostBtn) btns.push(`<CardButton>Connect</CardButton>`);
    const ordered = d.isInline && !d.isImage ? [...btns].reverse() : btns;
    l.push(`            <CardFooter>`);
    for (const b of ordered) l.push(`              ${b}`);
    l.push(`            </CardFooter>`);
  }
  l.push(`          </Card>`);
  l.push(`        ))}`);
  l.push(`      </CardGroup>`);
  l.push(`    </div>`);
  l.push(`  );`);
  l.push(`}`);
  return l.join("\n") + "\n";
}

export function generateCardPresetFiles(p: CardPreset): PresetFile[] {
  return [
    {
      path: "components/card-section.tsx",
      type: "registry:component",
      target: "components/card-section.tsx",
      content: cardSectionFile(p),
    },
  ];
}

/** Registry dependencies the generated file needs, as plain names — the
 *  route flavors them with the same helpers postbuild uses. */
export function cardPresetRegistryDeps(p: CardPreset): string[] {
  const deps = new Set<string>(["utils", "card"]);
  if (p.media === "icon") deps.add("icon-context");
  return [...deps];
}

/** npm dependencies beyond what registryDependencies pull transitively. */
export function cardPresetNpmDeps(_p: CardPreset): string[] {
  return ["lucide-react"];
}

export const CARD_PRESET_GENERATOR: PresetGenerator = {
  title: "Card (playground preset)",
  description:
    "A card group generated from a fluidfunctionalism.com playground configuration — the exact variant you built, installable.",
  files: (p) => generateCardPresetFiles(p as unknown as CardPreset),
  registryDeps: (p) => cardPresetRegistryDeps(p as unknown as CardPreset),
  npmDeps: (p) => cardPresetNpmDeps(p as unknown as CardPreset),
};
