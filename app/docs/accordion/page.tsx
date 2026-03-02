"use client";

import {
  Accordion,
  AccordionGroup,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/registry/default/accordion";
import { ComponentPreview } from "@/lib/docs/ComponentPreview";
import { PropsTable, type PropDef } from "@/lib/docs/PropsTable";
import { DocPage, DocSection } from "@/lib/docs/DocPage";

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
      Built on Radix UI Accordion with WAI-ARIA attributes, keyboard
      navigation, and focus management.
    </AccordionContent>
  </AccordionItem>
  <AccordionItem value="item-4" index={3}>
    <AccordionTrigger>Animation</AccordionTrigger>
    <AccordionContent>
      Smooth height transitions and spring-animated chevron rotation.
      The proximity hover background tracks your cursor.
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

const rootProps: PropDef[] = [
  { name: "type", type: '"single" | "multiple"', default: '"single"', description: "Whether one or multiple items can be expanded." },
  { name: "collapsible", type: "boolean", default: "true", description: "Allow collapsing all items when type is single." },
  { name: "defaultValue", type: "string | string[]", description: "Initially expanded item value(s)." },
  { name: "value", type: "string | string[]", description: "Controlled expanded value(s)." },
  { name: "onValueChange", type: "(value) => void", description: "Callback when expanded state changes." },
];

const itemProps: PropDef[] = [
  { name: "value", type: "string", description: "Unique identifier for this item." },
  { name: "index", type: "number", description: "Position index for proximity hover. Required inside AccordionGroup, omit for standalone." },
  { name: "disabled", type: "boolean", default: "false", description: "Whether this item is disabled." },
];

const triggerProps: PropDef[] = [
  { name: "children", type: "ReactNode", description: "Trigger label content." },
];

const contentProps: PropDef[] = [
  { name: "children", type: "ReactNode", description: "Collapsible content." },
];

export default function AccordionDoc() {
  return (
    <DocPage
      title="Accordion"
      slug="accordion"
      description="Collapsible sections with animated expand/collapse and proximity hover in grouped mode."
    >
      <DocSection title="Standalone">
        <p className="text-[13px] text-muted-foreground">A single collapsible item with its own hover state.</p>
        <ComponentPreview code={standaloneCode}>
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
        <p className="text-[13px] text-muted-foreground">Multiple items with proximity hover — only one can be expanded at a time.</p>
        <ComponentPreview code={groupedCode}>
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
                Built on Radix UI Accordion with WAI-ARIA attributes, keyboard
                navigation, and focus management.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-4" index={3}>
              <AccordionTrigger>Animation</AccordionTrigger>
              <AccordionContent>
                Smooth height transitions and spring-animated chevron rotation.
                The proximity hover background tracks your cursor.
              </AccordionContent>
            </AccordionItem>
          </AccordionGroup>
        </ComponentPreview>
      </DocSection>

      <DocSection title="Multi Expand">
        <p className="text-[13px] text-muted-foreground">Multiple items with proximity hover — several can be expanded at once.</p>
        <ComponentPreview code={multipleCode}>
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
