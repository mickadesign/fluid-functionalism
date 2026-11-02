"use client";

import { useState } from "react";
import { RadioGroup, RadioItem } from "@/registry/radix/radio-group";
import { ComponentPreview } from "@/lib/docs/ComponentPreview";
import { PropsTable } from "@/lib/docs/PropsTable";
import { DocPage, DocSection } from "@/lib/docs/DocPage";
import { groupProps, itemProps } from "@/lib/docs/api/radio-group";

const basicCode = `import { RadioGroup, RadioItem } from "./components";
import { useState } from "react";

const options = ["Option A", "Option B", "Option C"];
const [selected, setSelected] = useState(0);

<RadioGroup selectedIndex={selected}>
  {options.map((label, i) => (
    <RadioItem
      key={label}
      index={i}
      label={label}
      selected={selected === i}
      onSelect={() => setSelected(i)}
    />
  ))}
</RadioGroup>`;

export default function RadioGroupDoc() {
  const options = ["Option A", "Option B", "Option C"];
  const [selected, setSelected] = useState(0);

  return (
    <DocPage
      title="RadioGroup"
      slug="radio-group"
      description="Radio button group with fluid hover and animated selection."
    >
      <DocSection title="Basic">
        <ComponentPreview code={basicCode}>
          <RadioGroup selectedIndex={selected}>
            {options.map((label, i) => (
              <RadioItem
                key={label}
                index={i}
                label={label}
                selected={selected === i}
                onSelect={() => setSelected(i)}
              />
            ))}
          </RadioGroup>
        </ComponentPreview>
      </DocSection>

      <DocSection title="API Reference — RadioGroup">
        <PropsTable props={groupProps} />
      </DocSection>

      <DocSection title="API Reference — RadioItem">
        <PropsTable props={itemProps} />
      </DocSection>
    </DocPage>
  );
}
