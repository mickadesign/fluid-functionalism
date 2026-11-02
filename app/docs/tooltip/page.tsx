"use client";

import { Tooltip } from "@/registry/radix/tooltip";
import { fontWeights } from "@/registry/default/lib/font-weight";
import { Button } from "@/components/ui/button";
import { ComponentPreview } from "@/lib/docs/ComponentPreview";
import { PropsTable } from "@/lib/docs/PropsTable";
import { DocPage, DocSection } from "@/lib/docs/DocPage";
import { tooltipProps } from "@/lib/docs/api/tooltip";

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
import { fontWeights } from "@/lib/font-weight";

<Tooltip
  content={
    <div className="flex flex-col gap-1">
      <span style={{ fontVariationSettings: fontWeights.semibold }}>Keyboard shortcut</span>
      <span className="text-muted-foreground">⌘ + S</span>
    </div>
  }
>
  <button>Save</button>
</Tooltip>`;

const delayCode = `import { Tooltip } from "./components";

<Tooltip content="Instant" delayDuration={0}>...</Tooltip>
<Tooltip content="Slow" delayDuration={500}>...</Tooltip>`;

const followCursorCode = `// For tall or wide triggers, a centered tooltip sits far from the
// pointer — followCursor tracks it along one axis while the other stays
// anchored by \`side\`. The Sidebar's rail handle uses followCursor="y".

<Tooltip content="Following x" side="top" followCursor="x">
  <div className="h-12 w-64 …" />
</Tooltip>

<Tooltip content="Following y" side="right" followCursor="y">
  <div className="h-40 w-12 …" />
</Tooltip>`;

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
                <span style={{ fontVariationSettings: fontWeights.semibold }}>
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

      <DocSection title="Follow cursor">
        <ComponentPreview code={followCursorCode} minHeightClass="min-h-[220px]">
          <div className="flex flex-wrap items-center justify-center gap-6">
            <Tooltip content="Following x" side="top" followCursor="x">
              <div className="flex h-12 w-64 cursor-default items-center justify-center rounded-lg border border-border text-[12px] text-muted-foreground">
                Move along me
              </div>
            </Tooltip>
            <Tooltip content="Following y" side="right" followCursor="y">
              <div className="flex h-40 w-12 cursor-default items-center justify-center rounded-lg border border-border text-[12px] text-muted-foreground">
                <span className="rotate-90 whitespace-nowrap">Move along me</span>
              </div>
            </Tooltip>
          </div>
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
