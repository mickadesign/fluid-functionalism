"use client";

import { useState } from "react";
import { Card, CardGroup } from "@/registry/default/card";
import { useIcon } from "@/lib/icon-context";
import { ComponentPreview } from "@/lib/docs/ComponentPreview";
import { PropsTable, type PropDef } from "@/lib/docs/PropsTable";
import { DocPage, DocSection } from "@/lib/docs/DocPage";

// A purple radial-burst banner as an inline data URI so the demo needs no
// asset files (the `image` prop accepts any src).
const BANNER =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='320' height='180'%3E%3Cdefs%3E%3CradialGradient id='g' cx='50%25' cy='42%25' r='72%25'%3E%3Cstop offset='0%25' stop-color='%23a5b4fc'/%3E%3Cstop offset='100%25' stop-color='%233730a3'/%3E%3C/radialGradient%3E%3C/defs%3E%3Crect width='320' height='180' fill='url(%23g)'/%3E%3C/svg%3E";

const logoA =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24'%3E%3Crect width='24' height='24' rx='6' fill='%234A154B'/%3E%3C/svg%3E";
const logoB =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24'%3E%3Crect width='24' height='24' rx='6' fill='%230F9D58'/%3E%3C/svg%3E";

// ── Code snippets ────────────────────────────────────────

const basicCode = `import { Card, CardGroup } from "./components";

<CardGroup orientation="inline">
  <Card
    icon={Bell}
    title="Slack"
    description="Receive notifications in Slack"
    actions={[{ label: "Connect", href: "#", variant: "ghost", external: true }]}
  />
  <Card
    icon={Mail}
    title="Google Calendar"
    description="Sync your out-of-office status"
    actions={[{ label: "Connect", href: "#", variant: "ghost", external: true }]}
  />
  {/* …borderless by default, a subtle divider between each */}
</CardGroup>`;

const gridCode = `// columns > 1 turns on 2-D proximity: the highlight springs to the
// nearest card across BOTH rows and columns.
<CardGroup columns={2}>
  <Card icon={Search} title="Find critical bugs" description="…" />
  <Card icon={Shield} title="Scan for vulnerabilities" description="…" />
  <Card icon={Pencil} title="Generate docs" description="…" />
  <Card icon={Check} title="Add test coverage" description="…" />
</CardGroup>`;

const outlinedCode = `// One shared frame, rows split by dividers.
<CardGroup orientation="inline" border="outlined">
  <Card logo={slackLogo} title="Slack" description="…"
    actions={[{ label: "Connect", href: "#", variant: "ghost", external: true }]} />
  <Card logo={notionLogo} title="Notion" description="…"
    actions={[{ label: "Connect", href: "#", variant: "ghost", external: true }]} />
</CardGroup>`;

const separatedCode = `// Individually-bordered tiles with a gap between them.
<CardGroup columns={2} border="outlined" separated>
  <Card icon={Search} title="Find critical bugs" description="…"
    actions={[{ label: "Add", variant: "secondary" }]} />
  <Card icon={Shield} title="Scan for vulnerabilities" description="…"
    actions={[{ label: "Add", variant: "secondary" }]} />
</CardGroup>`;

const promoCode = `<Card
  image={banner}
  eyebrow="New Model"
  title="Cursor Grok 4.5"
  dismissible
  onDismiss={() => {}}
  features={[
    { icon: Brain, title: "Cursor's smartest model yet",
      description: "Trained jointly with SpaceXAI for long-running tasks" },
    { icon: Rocket, title: "50% off through July 21",
      description: "Double the usage for the first week" },
  ]}
  actions={[
    { label: "Learn more", href: "#", variant: "link", external: true },
    { label: "Try Grok 4.5", variant: "primary" },
  ]}
/>`;

const selectedCode = `const [selected, setSelected] = useState(1);

<CardGroup orientation="inline">
  {plans.map((plan, i) => (
    <Card
      key={plan.title}
      icon={plan.icon}
      title={plan.title}
      description={plan.description}
      selected={selected === i}
      onClick={() => setSelected(i)}
    />
  ))}
</CardGroup>`;

// ── Props ────────────────────────────────────────────────

const groupProps: PropDef[] = [
  { name: "orientation", type: '"card" | "inline"', default: '"card"', description: "Per-card layout: stacked (media on top) or a horizontal row." },
  { name: "columns", type: "number", default: "1", description: "Grid columns. Greater than 1 enables 2-D proximity across rows and columns." },
  { name: "border", type: '"none" | "outlined"', default: '"none"', description: "Borderless (dividers only) or a drawn border." },
  { name: "separated", type: "boolean", default: "false", description: "Split into individually-shaped tiles with a gap instead of one divided block." },
  { name: "proximityHover", type: "boolean", default: "true", description: "Enable the magnetic proximity-hover highlight." },
  { name: "children", type: "ReactNode", description: "Card children. Each is auto-assigned its proximity index." },
];

const cardProps: PropDef[] = [
  { name: "title", type: "string", description: "Card title (required)." },
  { name: "description", type: "string", description: "Supporting text under the title." },
  { name: "eyebrow", type: "string", description: "Small label above the title (e.g. \"New Model\")." },
  { name: "icon", type: "IconComponent", description: "Leading icon slot (ignored when logo is set)." },
  { name: "logo", type: "string | [string, string]", description: "Brand logo src, or a tuple for a connected logo pair." },
  { name: "image", type: "string", description: "Top banner image src (card orientation only)." },
  { name: "features", type: "CardFeature[]", description: "Inner icon + title + description rows." },
  { name: "actions", type: "CardAction[]", description: "Footer (card) or trailing (inline) actions." },
  { name: "onClick", type: "() => void", description: "Makes the whole card a clickable target (stretched button)." },
  { name: "href", type: "string", description: "Makes the whole card a link (stretched anchor)." },
  { name: "external", type: "boolean", default: "false", description: "Opens href in a new tab." },
  { name: "selected", type: "boolean", default: "false", description: "Persistent selected fill + emphasis, on top of proximity hover." },
  { name: "disabled", type: "boolean", default: "false", description: "Dims and disables the card." },
  { name: "dismissible", type: "boolean", default: "false", description: "Shows a dismiss (✕) button." },
  { name: "onDismiss", type: "() => void", description: "Called when the dismiss button is pressed." },
];

const actionProps: PropDef[] = [
  { name: "label", type: "string", description: "Button text (required)." },
  { name: "onClick", type: "() => void", description: "Click handler." },
  { name: "href", type: "string", description: "Renders the action as a link." },
  { name: "variant", type: '"primary" | "secondary" | "ghost" | "link"', default: '"ghost"', description: "Visual style." },
  { name: "icon", type: "IconComponent", description: "Leading (or trailing) icon." },
  { name: "iconPosition", type: '"start" | "end"', description: "Icon side. Defaults to end for external actions, else start." },
  { name: "external", type: "boolean", default: "false", description: "Appends an outward arrow and opens href in a new tab." },
];

// ── Demos ────────────────────────────────────────────────

function BasicDemo() {
  const Bell = useIcon("bell");
  const Mail = useIcon("mail");
  const Globe = useIcon("globe");
  const connect = [
    { label: "Connect", href: "#", variant: "ghost" as const, external: true },
  ];
  return (
    <div className="w-full max-w-[520px]">
      <CardGroup orientation="inline">
        <Card icon={Bell} title="Slack" description="Sync attribution and receive notifications in Slack" actions={connect} />
        <Card icon={Mail} title="Google Calendar" description="Sync your out-of-office status" actions={connect} />
        <Card icon={Globe} title="Notion" description="Preview issues, projects, and views within Notion" actions={connect} />
      </CardGroup>
    </div>
  );
}

function GridDemo() {
  const Search = useIcon("search");
  const Shield = useIcon("shield");
  const Pencil = useIcon("pencil");
  const Check = useIcon("check");
  return (
    <div className="w-full max-w-[560px]">
      <CardGroup columns={2}>
        <Card icon={Search} title="Find critical bugs" description="Analyze recent commits for high-severity correctness bugs and submit safe fixes" />
        <Card icon={Shield} title="Scan for vulnerabilities" description="Review the repository on a schedule and alert on validated security issues" />
        <Card icon={Pencil} title="Generate docs" description="Create and update developer documentation for recently changed code" />
        <Card icon={Check} title="Add test coverage" description="Add tests for high-risk logic that lacks adequate coverage" />
      </CardGroup>
    </div>
  );
}

function OutlinedDemo() {
  const connect = [
    { label: "Connect", href: "#", variant: "ghost" as const, external: true },
  ];
  return (
    <div className="w-full max-w-[520px]">
      <CardGroup orientation="inline" border="outlined">
        <Card logo={logoA} title="Slack" description="Sync your message attribution to Slack" actions={connect} />
        <Card logo={logoB} title="Google Calendar" description="Sync your calendar out-of-office status" actions={connect} />
        <Card logo={[logoA, logoB]} title="Linked workspace" description="A connected pair renders both logos" actions={connect} />
      </CardGroup>
    </div>
  );
}

function SeparatedDemo() {
  const Search = useIcon("search");
  const Shield = useIcon("shield");
  const Pencil = useIcon("pencil");
  const Check = useIcon("check");
  const add = [{ label: "Add", variant: "secondary" as const }];
  return (
    <div className="w-full max-w-[560px]">
      <CardGroup columns={2} border="outlined" separated>
        <Card icon={Search} title="Find critical bugs" description="Analyze recent commits for high-severity correctness bugs" actions={add} />
        <Card icon={Shield} title="Scan for vulnerabilities" description="Review the repository on a schedule and alert on issues" actions={add} />
        <Card icon={Pencil} title="Generate docs" description="Create developer documentation for changed code" actions={add} />
        <Card icon={Check} title="Add test coverage" description="Add tests for high-risk logic lacking coverage" actions={add} />
      </CardGroup>
    </div>
  );
}

function PromoDemo() {
  const Brain = useIcon("brain");
  const Rocket = useIcon("rocket");
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
        image={BANNER}
        eyebrow="New Model"
        title="Cursor Grok 4.5"
        dismissible
        onDismiss={() => setDismissed(true)}
        features={[
          { icon: Brain, title: "Cursor's smartest model yet", description: "Trained jointly with SpaceXAI to handle long-running tasks beyond coding" },
          { icon: Rocket, title: "50% off through July 21", description: "Get double the usage for the first week across every surface" },
        ]}
        actions={[
          { label: "Learn more", href: "#", variant: "link", external: true },
          { label: "Try Grok 4.5", variant: "primary" },
        ]}
        className="border border-border/60"
      />
    </div>
  );
}

function SelectedDemo() {
  const Star = useIcon("star");
  const Rocket = useIcon("rocket");
  const Shield = useIcon("shield");
  const [selected, setSelected] = useState(1);
  const plans = [
    { icon: Star, title: "Hobby", description: "For personal projects and prototypes" },
    { icon: Rocket, title: "Pro", description: "For professionals shipping every day" },
    { icon: Shield, title: "Enterprise", description: "Advanced controls and support" },
  ];
  return (
    <div className="w-full max-w-[520px]">
      <CardGroup orientation="inline">
        {plans.map((plan, i) => (
          <Card
            key={plan.title}
            icon={plan.icon}
            title={plan.title}
            description={plan.description}
            selected={selected === i}
            onClick={() => setSelected(i)}
          />
        ))}
      </CardGroup>
    </div>
  );
}

export default function CardDoc() {
  return (
    <DocPage
      title="Card"
      slug="card"
      description="One flexible, prop-driven card. Stacked, inline, or grid — borderless by default with proximity hover that previews where a click will land."
    >
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

      <DocSection title="Media & features">
        <ComponentPreview code={promoCode} padding="compact">
          <PromoDemo />
        </ComponentPreview>
      </DocSection>

      <DocSection title="Selected">
        <ComponentPreview code={selectedCode} padding="compact">
          <SelectedDemo />
        </ComponentPreview>
      </DocSection>

      <DocSection title="API Reference — CardGroup">
        <PropsTable props={groupProps} />
      </DocSection>

      <DocSection title="API Reference — Card">
        <PropsTable props={cardProps} />
      </DocSection>

      <DocSection title="API Reference — CardAction">
        <PropsTable props={actionProps} />
      </DocSection>
    </DocPage>
  );
}
