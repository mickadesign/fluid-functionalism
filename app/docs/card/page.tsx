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
import { PropsTable } from "@/lib/docs/PropsTable";
import { DocPage, DocSection } from "@/lib/docs/DocPage";
import { PlaygroundLayout } from "@/lib/docs/playground";
import { CardPlayground, useCardArt } from "@/lib/docs/playgrounds/card";
import { groupProps, cardProps, partProps, buttonProps } from "@/lib/docs/api/card";

// ── Code snippets ────────────────────────────────────────

// Every example composes the same four feature cards a different way.
const basicCode = `import {
  Card, CardGroup, CardHeader, CardMedia,
  CardTitle, CardDescription, CardFooter, CardButton,
} from "./components";

// Borderless inline list: icon + a ghost action, divided by hairlines.
<div className="w-full max-w-[520px]">
  <CardGroup orientation="inline">
    <Card onClick={() => open(item)}>
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
  </CardGroup>
</div>`;

const gridCode = `// Two-column grid of image tiles — columns > 1 turns on 2-D
// fluid hover: the highlight springs from card to card across rows AND columns.
<div className="w-full max-w-[560px]">
  <CardGroup columns={2} border="outlined" separated>
    <Card onClick={() => open(item)}>
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
  </CardGroup>
</div>`;

const outlinedCode = `// One shared outlined frame, rows split by dividers: logo + primary.
<div className="w-full max-w-[520px]">
  <CardGroup orientation="inline" border="outlined">
    <Card onClick={() => open(item)}>
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
  </CardGroup>
</div>`;

const separatedCode = `// Separated inline tiles with a full-height image; the action
// row drops below the text (primary, secondary, ghost).
<div className="w-full max-w-[560px]">
  <CardGroup orientation="inline" separated>
    <Card onClick={() => open(item)}>
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
  </CardGroup>
</div>`;

const promoCode = `// The composition is tuned to a narrow 300px column.
<div className="w-full max-w-[300px]">
  <Card dismissible onDismiss={() => {}}
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
  </Card>
</div>`;

const selectedCode = `// Clickable selection — one active card carries the fill, its
// title bolds, and the group drops the dividers around it.
const [selected, setSelected] = useState(1);

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
</div>`;

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
          <Card key={f.title} onClick={() => {}}>
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
// highlight follows the card under the pointer across rows and columns.
function GridDemo() {
  const art = useCardArt();
  const features = useFeatures();
  return (
    <div className="w-full max-w-[560px]">
      <CardGroup columns={2} border="outlined" separated>
        {features.map((f) => (
          <Card key={f.title} onClick={() => {}}>
            <CardImage src={art.banner} />
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
  const art = useCardArt();
  const features = useFeatures();
  return (
    <div className="w-full max-w-[520px]">
      <CardGroup orientation="inline" border="outlined">
        {features.map((f) => (
          <Card key={f.title} onClick={() => {}}>
            <CardMedia logo={art.thumb} />
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
  const art = useCardArt();
  const features = useFeatures();
  return (
    <div className="w-full max-w-[560px]">
      <CardGroup orientation="inline" separated>
        {features.map((f) => (
          <Card key={f.title} onClick={() => {}}>
            <CardImage src={art.banner} />
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
  const art = useCardArt();
  const Paintbrush = useIcon("paintbrush");
  const SquareLibrary = useIcon("square-library");
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) {
    return (
      <button
        type="button"
        onClick={() => setDismissed(false)}
        className="text-site-body text-muted-foreground hover:text-foreground underline underline-offset-4 cursor-pointer"
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
        <CardImage src={art.banner} />
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
      description="shadcn's compositional card, dressed in Fluid Functionalism. Stacked, inline, or grid — borderless by default with fluid hover that previews where a click will land."
    >
      <DocSection title="Playground">
        <CardPlaygroundSection />
      </DocSection>

      <DocSection title="Basic">
        <ComponentPreview code={basicCode} padding="compact">
          <BasicDemo />
        </ComponentPreview>
      </DocSection>

      <DocSection title="Grid: 2-D fluid hover">
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
