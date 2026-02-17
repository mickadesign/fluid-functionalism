"use client";

import { ThinkingIndicator } from "@/registry/default/thinking-indicator";
import { ComponentPreview } from "@/lib/docs/ComponentPreview";
import { DocPage, DocSection } from "@/lib/docs/DocPage";

const basicCode = `import { ThinkingIndicator } from "./components";

<ThinkingIndicator />`;

export default function ThinkingIndicatorDoc() {
  return (
    <DocPage
      title="ThinkingIndicator"
      description="Animated status indicator with morphing SVG and cycling text."
    >
      <DocSection title="Basic">
        <ComponentPreview code={basicCode}>
          <ThinkingIndicator />
        </ComponentPreview>
      </DocSection>
    </DocPage>
  );
}
