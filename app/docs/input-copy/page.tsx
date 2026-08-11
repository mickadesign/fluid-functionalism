"use client";

import { useState } from "react";
import { InputCopy } from "@/registry/default/input-copy";
import { ComponentPreview } from "@/lib/docs/ComponentPreview";
import { PropsTable, type PropDef } from "@/lib/docs/PropsTable";
import { DocPage, DocSection } from "@/lib/docs/DocPage";

const basicCode = `import { InputCopy } from "./components";

<InputCopy value="npx shadcn@latest add https://www.fluidfunctionalism.com/r/input-copy.json" />`;

const labelCode = `import { InputCopy } from "./components";

<InputCopy
  label="Install command"
  value="npx shadcn@latest add https://www.fluidfunctionalism.com/r/input-copy.json"
/>`;

const buttonVariantCode = `import { InputCopy } from "./components";

<InputCopy
  variant="button"
  value="npx shadcn@latest add https://www.fluidfunctionalism.com/r/input-copy.json"
/>`;

const alignLeftCode = `import { InputCopy } from "./components";

<InputCopy
  align="left"
  value="npx shadcn@latest add https://www.fluidfunctionalism.com/r/input-copy.json"
/>
<InputCopy
  variant="button"
  align="left"
  value="npx shadcn@latest add https://www.fluidfunctionalism.com/r/input-copy.json"
/>`;

const disabledCode = `import { InputCopy } from "./components";

<InputCopy
  label="Invite code"
  value="ABCD-1234-EFGH"
  disabled
/>`;

const callbackCode = `import { useState } from "react";
import { InputCopy } from "./components";

const [copyCount, setCopyCount] = useState(0);

<InputCopy
  label="Share link"
  value="https://fluidfunctionalism.com/r/input-copy"
  onCopy={() => setCopyCount((count) => count + 1)}
/>

<p>Copied {copyCount} times</p>`;

const inputCopyProps: PropDef[] = [
  { name: "value", type: "string", description: "The text value to display and copy to clipboard." },
  { name: "label", type: "string", description: "Optional label displayed above the input." },
  { name: "variant", type: '"icon" | "button"', default: '"icon"', description: "Icon-only with tooltip, or button with visible label." },
  { name: "align", type: '"right" | "left"', default: '"right"', description: "Position of the copy action relative to the value." },
  { name: "onCopy", type: "() => void", description: "Callback fired after the value is successfully copied." },
  { name: "disabled", type: "boolean", default: "false", description: "Disables the input and copy button." },
];

export default function InputCopyDoc() {
  const [copyCount, setCopyCount] = useState(0);

  return (
    <DocPage
      title="InputCopy"
      slug="input-copy"
      description="Read-only input with a copy-to-clipboard button and animated check feedback."
    >
      <DocSection title="Basic">
        <ComponentPreview code={basicCode}>
          <div className="w-72">
            <InputCopy value="npx shadcn@latest add https://www.fluidfunctionalism.com/r/input-copy.json" />
          </div>
        </ComponentPreview>
      </DocSection>

      <DocSection title="With Label">
        <ComponentPreview code={labelCode}>
          <div className="w-72">
            <InputCopy
              label="Install command"
              value="npx shadcn@latest add https://www.fluidfunctionalism.com/r/input-copy.json"
            />
          </div>
        </ComponentPreview>
      </DocSection>

      <DocSection title="Button Variant">
        <ComponentPreview code={buttonVariantCode}>
          <div className="w-72">
            <InputCopy
              variant="button"
              value="npx shadcn@latest add https://www.fluidfunctionalism.com/r/input-copy.json"
            />
          </div>
        </ComponentPreview>
      </DocSection>

      <DocSection title="Left Aligned">
        <ComponentPreview code={alignLeftCode}>
          <div className="flex flex-col gap-4 w-72">
            <InputCopy
              align="left"
              value="npx shadcn@latest add https://www.fluidfunctionalism.com/r/input-copy.json"
            />
            <InputCopy
              variant="button"
              align="left"
              value="npx shadcn@latest add https://www.fluidfunctionalism.com/r/input-copy.json"
            />
          </div>
        </ComponentPreview>
      </DocSection>

      <DocSection title="Disabled">
        <ComponentPreview code={disabledCode}>
          <div className="w-72">
            <InputCopy
              label="Invite code"
              value="ABCD-1234-EFGH"
              disabled
            />
          </div>
        </ComponentPreview>
      </DocSection>

      <DocSection title="Copy Callback">
        <ComponentPreview code={callbackCode}>
          <div className="w-72 flex flex-col gap-2">
            <InputCopy
              label="Share link"
              value="https://fluidfunctionalism.com/r/input-copy"
              onCopy={() => setCopyCount((count) => count + 1)}
            />
            <p className="text-caption text-muted-foreground px-1">
              Copied {copyCount} {copyCount === 1 ? "time" : "times"}
            </p>
          </div>
        </ComponentPreview>
      </DocSection>

      <DocSection title="API Reference">
        <PropsTable props={inputCopyProps} />
      </DocSection>
    </DocPage>
  );
}
