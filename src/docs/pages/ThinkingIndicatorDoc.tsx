import { ThinkingIndicator } from "../../components";
import { ComponentPreview } from "../ComponentPreview";
import { DocPage, DocSection } from "../DocPage";

const basicCode = `import { ThinkingIndicator } from "./components";

<ThinkingIndicator />`;

export function ThinkingIndicatorDoc() {
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
