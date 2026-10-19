"use client";

import { ThinkingIndicator } from "@/registry/default/thinking-indicator";
import { ComponentPreview } from "@/lib/docs/ComponentPreview";
import { PropsTable } from "@/lib/docs/PropsTable";
import { DocPage, DocSection } from "@/lib/docs/DocPage";
import { indicatorProps } from "@/lib/docs/api/thinking-indicator";

const basicCode = `import { ThinkingIndicator } from "./components";

<ThinkingIndicator />`;

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
