"use client";

import { Tooltip } from "@/registry/default/tooltip";
import { Button } from "@/components/ui/button";
import { ComponentPreview } from "@/lib/docs/ComponentPreview";
import { PropsTable, type PropDef } from "@/lib/docs/PropsTable";
import { DocPage, DocSection } from "@/lib/docs/DocPage";

// ---------------------------------------------------------------------------
// Code snippets
// ---------------------------------------------------------------------------

const basicCode = `import { Tooltip } from "./components";

<Tooltip content="Save your changes">
  <button>Hover me</button>
</Tooltip>`;

const placementCode = `import { Tooltip } from "./components";

<Tooltip content="Top" side="top">...</Tooltip>
<Tooltip content="Right" side="right">...</Tooltip>
<Tooltip content="Bottom" side="bottom">...</Tooltip>
<Tooltip content="Left" side="left">...</Tooltip>`;

const richCode = `import { Tooltip } from "./components";

<Tooltip
  content={
    <div className="flex flex-col gap-1">
      <span className="font-medium">Keyboard shortcut</span>
      <span className="text-muted-foreground">⌘ + S</span>
    </div>
  }
>
  <button>Save</button>
</Tooltip>`;

const delayCode = `import { Tooltip } from "./components";

<Tooltip content="Instant" delayDuration={0}>...</Tooltip>
<Tooltip content="Slow" delayDuration={500}>...</Tooltip>`;

// ---------------------------------------------------------------------------
// Props table
// ---------------------------------------------------------------------------

const tooltipProps: PropDef[] = [
  {
    name: "content",
    type: "ReactNode",
    description: "The content displayed inside the tooltip.",
  },
  {
    name: "children",
    type: "ReactElement",
    description: "The trigger element. Must accept a ref.",
  },
  {
    name: "side",
    type: '"top" | "right" | "bottom" | "left"',
    default: '"top"',
    description: "Preferred side of the trigger to render the tooltip.",
  },
  {
    name: "sideOffset",
    type: "number",
    default: "8",
    description: "Distance in pixels between the tooltip and the trigger.",
  },
  {
    name: "delayDuration",
    type: "number",
    default: "200",
    description: "Milliseconds to wait before showing the tooltip on hover.",
  },
  {
    name: "className",
    type: "string",
    description: "Additional classes applied to the tooltip content container.",
  },
];

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function TooltipDoc() {
  return (
    <DocPage
      title="Tooltip"
      slug="tooltip"
      description="Floating tooltip with spring-based animations, configurable placement, and rich content support."
    >
      <DocSection title="Basic">
        <ComponentPreview code={basicCode}>
          <Tooltip content="Save your changes">
            <Button>Hover me</Button>
          </Tooltip>
        </ComponentPreview>
      </DocSection>

      <DocSection title="Placement">
        <ComponentPreview code={placementCode}>
          <div className="flex gap-3">
            <Tooltip content="Top" side="top">
              <Button variant="secondary">Top</Button>
            </Tooltip>
            <Tooltip content="Right" side="right">
              <Button variant="secondary">Right</Button>
            </Tooltip>
            <Tooltip content="Bottom" side="bottom">
              <Button variant="secondary">Bottom</Button>
            </Tooltip>
            <Tooltip content="Left" side="left">
              <Button variant="secondary">Left</Button>
            </Tooltip>
          </div>
        </ComponentPreview>
      </DocSection>

      <DocSection title="Rich Content">
        <ComponentPreview code={richCode}>
          <Tooltip
            content={
              <div className="flex flex-col gap-1">
                <span style={{ fontVariationSettings: "'wght' 550" }}>
                  Keyboard shortcut
                </span>
                <span className="text-muted-foreground">⌘ + S</span>
              </div>
            }
          >
            <Button>Save</Button>
          </Tooltip>
        </ComponentPreview>
      </DocSection>

      <DocSection title="Delay">
        <ComponentPreview code={delayCode}>
          <div className="flex gap-3">
            <Tooltip content="Instant" delayDuration={0}>
              <Button variant="secondary">No delay</Button>
            </Tooltip>
            <Tooltip content="Slow" delayDuration={500}>
              <Button variant="secondary">500ms delay</Button>
            </Tooltip>
          </div>
        </ComponentPreview>
      </DocSection>

      <DocSection title="API Reference">
        <PropsTable props={tooltipProps} />
      </DocSection>
    </DocPage>
  );
}
