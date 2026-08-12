"use client";

import { useState } from "react";
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
import { useIcon } from "@/lib/icon-context";
import { ComponentPreview } from "@/lib/docs/ComponentPreview";
import { PropsTable, type PropDef } from "@/lib/docs/PropsTable";
import { DocPage, DocSection } from "@/lib/docs/DocPage";
import { PlaygroundLayout } from "@/lib/docs/playground";
import { BANNER, CardPlayground, THUMB } from "@/lib/docs/playgrounds/card";

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
        className="text-body text-muted-foreground hover:text-foreground underline underline-offset-4 cursor-pointer"
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
// The state + controls live in the shared module (lib/docs/playgrounds) so
// the /demo slide can drive the same sandbox from its pen menu; this page
// wraps the live preview in ComponentPreview with the synced code snippet.

function CardPlaygroundSection() {
  return (
    <CardPlayground>
      {({ preview, controls, code }) => (
        <PlaygroundLayout
          controls={controls}
          preview={
            <ComponentPreview code={code} padding="compact" minHeightClass="min-h-[600px]">
              {preview}
            </ComponentPreview>
          }
        />
      )}
    </CardPlayground>
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
        <CardPlaygroundSection />
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
