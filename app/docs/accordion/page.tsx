"use client";

import {
  Accordion,
  AccordionGroup,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/registry/radix/accordion";
import { ComponentPreview } from "@/lib/docs/ComponentPreview";
import { PropsTable } from "@/lib/docs/PropsTable";
import { DocPage, DocSection } from "@/lib/docs/DocPage";
import { PlaygroundLayout } from "@/lib/docs/playground";
import { AccordionPlayground } from "@/lib/docs/playgrounds/accordion";
import { rootProps, itemProps, triggerProps, contentProps } from "@/lib/docs/api/accordion";

const standaloneCode = `import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "./components";

<Accordion type="single" collapsible defaultValue="item-1">
  <AccordionItem value="item-1">
    <AccordionTrigger>What is this component?</AccordionTrigger>
    <AccordionContent>
      A collapsible accordion with animated expand/collapse and spring-animated chevron.
    </AccordionContent>
  </AccordionItem>
</Accordion>`;

const groupedCode = `import { AccordionGroup, AccordionItem, AccordionTrigger, AccordionContent } from "./components";

<AccordionGroup type="single" collapsible defaultValue="item-1">
  <AccordionItem value="item-1" index={0}>
    <AccordionTrigger>Getting Started</AccordionTrigger>
    <AccordionContent>
      Install the component and import it into your project. The accordion
      supports both single and multiple expand modes.
    </AccordionContent>
  </AccordionItem>
  <AccordionItem value="item-2" index={1}>
    <AccordionTrigger>Styling</AccordionTrigger>
    <AccordionContent>
      The component integrates with the shape system for pill or rounded
      border-radius variants. All animations use spring physics.
    </AccordionContent>
  </AccordionItem>
  <AccordionItem value="item-3" index={2}>
    <AccordionTrigger>Accessibility</AccordionTrigger>
    <AccordionContent>
      Built on Radix UI or Base UI Accordion (your pick) with WAI-ARIA
      attributes, keyboard navigation, and focus management.
    </AccordionContent>
  </AccordionItem>
  <AccordionItem value="item-4" index={3}>
    <AccordionTrigger>Animation</AccordionTrigger>
    <AccordionContent>
      Smooth height transitions and spring-animated chevron rotation.
      The fluid hover background tracks your cursor.
    </AccordionContent>
  </AccordionItem>
</AccordionGroup>`;

const multipleCode = `import { AccordionGroup, AccordionItem, AccordionTrigger, AccordionContent } from "./components";

<AccordionGroup type="multiple" defaultValue={["item-1", "item-3"]}>
  <AccordionItem value="item-1" index={0}>
    <AccordionTrigger>First Section</AccordionTrigger>
    <AccordionContent>
      Multiple items can be expanded at the same time.
    </AccordionContent>
  </AccordionItem>
  <AccordionItem value="item-2" index={1}>
    <AccordionTrigger>Second Section</AccordionTrigger>
    <AccordionContent>
      Click any trigger to expand or collapse independently.
    </AccordionContent>
  </AccordionItem>
  <AccordionItem value="item-3" index={2}>
    <AccordionTrigger>Third Section</AccordionTrigger>
    <AccordionContent>
      Each item operates independently in multiple mode.
    </AccordionContent>
  </AccordionItem>
</AccordionGroup>`;

const rowHighlightCode = `import { AccordionGroup, AccordionItem, AccordionTrigger, AccordionContent } from "./components";

{/* highlight="trigger": an expanded item stops holding a tint. The fill
    scopes to the row and waits for hover, so the open panel sits on the
    page's own surface — the way a sidebar row highlights without
    colouring its sub-tree. */}
<AccordionGroup type="single" collapsible defaultValue="item-1" highlight="trigger">
  <AccordionItem value="item-1" index={0}>
    <AccordionTrigger>Expanded, but not tinted</AccordionTrigger>
    <AccordionContent>
      The panel reads as part of the page rather than a filled block.
    </AccordionContent>
  </AccordionItem>
  <AccordionItem value="item-2" index={1}>
    <AccordionTrigger>Hover any row</AccordionTrigger>
    <AccordionContent>
      The fill follows your cursor instead of marking a state.
    </AccordionContent>
  </AccordionItem>
</AccordionGroup>`;

// ── Playground ───────────────────────────────────────────

function AccordionPlaygroundSection() {
  return (
    <AccordionPlayground>
      {({ preview, controls, code }) => (
        <PlaygroundLayout
          controls={controls}
          preview={
            <ComponentPreview code={code} padding="none" minHeightClass="h-[420px]" align="top">
              {preview}
            </ComponentPreview>
          }
        />
      )}
    </AccordionPlayground>
  );
}

export default function AccordionDoc() {
  return (
    <DocPage
      title="Accordion"
      slug="accordion"
      description="Collapsible sections with animated expand/collapse and fluid hover in grouped mode."
    >
      <DocSection title="Playground">
        <AccordionPlaygroundSection />
      </DocSection>

      <DocSection title="Standalone">
        <p className="text-site-body text-muted-foreground">A single collapsible item with its own hover state.</p>
        <ComponentPreview code={standaloneCode} align="top">
          <div className="min-h-[120px] flex items-center">
            <Accordion type="single" collapsible defaultValue="item-1">
              <AccordionItem value="item-1">
                <AccordionTrigger>What is this component?</AccordionTrigger>
                <AccordionContent>
                  A collapsible accordion with animated expand/collapse and spring-animated chevron.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </ComponentPreview>
      </DocSection>

      <DocSection title="Single Expand">
        <p className="text-site-body text-muted-foreground">Multiple items with fluid hover — only one can be expanded at a time.</p>
        <ComponentPreview code={groupedCode} align="top">
          <AccordionGroup type="single" collapsible defaultValue="item-1">
            <AccordionItem value="item-1" index={0}>
              <AccordionTrigger>Getting Started</AccordionTrigger>
              <AccordionContent>
                Install the component and import it into your project. The
                accordion supports both single and multiple expand modes.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-2" index={1}>
              <AccordionTrigger>Styling</AccordionTrigger>
              <AccordionContent>
                The component integrates with the shape system for pill or
                rounded border-radius variants. All animations use spring
                physics.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-3" index={2}>
              <AccordionTrigger>Accessibility</AccordionTrigger>
              <AccordionContent>
                Built on Radix UI or Base UI Accordion (your pick) with
                WAI-ARIA attributes, keyboard navigation, and focus
                management.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-4" index={3}>
              <AccordionTrigger>Animation</AccordionTrigger>
              <AccordionContent>
                Smooth height transitions and spring-animated chevron rotation.
                The fluid hover background tracks your cursor.
              </AccordionContent>
            </AccordionItem>
          </AccordionGroup>
        </ComponentPreview>
      </DocSection>

      <DocSection title="Multi Expand">
        <p className="text-site-body text-muted-foreground">Multiple items with fluid hover — several can be expanded at once.</p>
        <ComponentPreview code={multipleCode} align="top">
          <AccordionGroup type="multiple" defaultValue={["item-1", "item-3"]}>
            <AccordionItem value="item-1" index={0}>
              <AccordionTrigger>First Section</AccordionTrigger>
              <AccordionContent>
                Multiple items can be expanded at the same time.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-2" index={1}>
              <AccordionTrigger>Second Section</AccordionTrigger>
              <AccordionContent>
                Click any trigger to expand or collapse independently.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-3" index={2}>
              <AccordionTrigger>Third Section</AccordionTrigger>
              <AccordionContent>
                Each item operates independently in multiple mode.
              </AccordionContent>
            </AccordionItem>
          </AccordionGroup>
        </ComponentPreview>
      </DocSection>

      <DocSection title="Row highlight">
        <p className="text-site-body text-muted-foreground">
          With <code>highlight=&quot;trigger&quot;</code> an expanded item holds
          no tint — the fill scopes to the row and waits for hover. Suits dense
          panels, where a block per open item reads as a second layer.
        </p>
        <ComponentPreview code={rowHighlightCode} align="top">
          <AccordionGroup
            type="single"
            collapsible
            defaultValue="item-1"
            highlight="trigger"
          >
            <AccordionItem value="item-1" index={0}>
              <AccordionTrigger>Expanded, but not tinted</AccordionTrigger>
              <AccordionContent>
                The panel reads as part of the page rather than a filled block.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-2" index={1}>
              <AccordionTrigger>Hover any row</AccordionTrigger>
              <AccordionContent>
                The fill follows your cursor instead of marking a state.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-3" index={2}>
              <AccordionTrigger>Compare with the sections above</AccordionTrigger>
              <AccordionContent>
                Those hold a block across the row and its panel while open.
              </AccordionContent>
            </AccordionItem>
          </AccordionGroup>
        </ComponentPreview>
      </DocSection>

      <DocSection title="API Reference — Accordion / AccordionGroup">
        <PropsTable props={rootProps} />
      </DocSection>

      <DocSection title="API Reference — AccordionItem">
        <PropsTable props={itemProps} />
      </DocSection>

      <DocSection title="API Reference — AccordionTrigger">
        <PropsTable props={triggerProps} />
      </DocSection>

      <DocSection title="API Reference — AccordionContent">
        <PropsTable props={contentProps} />
      </DocSection>
    </DocPage>
  );
}
