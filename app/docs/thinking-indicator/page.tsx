"use client";

import { ThinkingIndicator } from "@/registry/default/thinking-indicator";
import { ComponentPreview } from "@/lib/docs/ComponentPreview";
import { PropsTable, type PropDef } from "@/lib/docs/PropsTable";
import { DocPage, DocSection } from "@/lib/docs/DocPage";

const basicCode = `import { ThinkingIndicator } from "./components";

<ThinkingIndicator />`;

const indicatorProps: PropDef[] = [
  { name: "size", type: '"default" | "compact"', default: "from SizeProvider", description: "Step on the size ladder (see /docs/sizes). Wins over the surrounding SizeProvider." },
  { name: "showIcon", type: "boolean", default: "true", description: "Show the morphing circle⇄infinity glyph before the label. Set to false for a text-only indicator." },
];

export default function ThinkingIndicatorDoc() {
  return (
    <DocPage
      title="ThinkingIndicator"
      slug="thinking-indicator"
      description="Animated status indicator with morphing SVG and cycling text."
    >
      <DocSection title="Basic">
        <ComponentPreview code={basicCode}>
          <ThinkingIndicator />
        </ComponentPreview>
      </DocSection>

      <DocSection title="API Reference">
        <PropsTable props={indicatorProps} />
      </DocSection>
    </DocPage>
  );
}
