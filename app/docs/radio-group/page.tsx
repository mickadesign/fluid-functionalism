"use client";

import { useState } from "react";
import { RadioGroup, RadioItem } from "@/registry/default/radio-group";
import { ComponentPreview } from "@/lib/docs/ComponentPreview";
import { PropsTable, type PropDef } from "@/lib/docs/PropsTable";
import { DocPage, DocSection } from "@/lib/docs/DocPage";

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

const groupProps: PropDef[] = [
  { name: "selectedIndex", type: "number", description: "Index of the currently selected item." },
  { name: "children", type: "ReactNode", description: "RadioItem children." },
];

const itemProps: PropDef[] = [
  { name: "label", type: "string", description: "Text label for the radio item." },
  { name: "index", type: "number", description: "Position index within the group." },
  { name: "selected", type: "boolean", description: "Whether this item is selected." },
  { name: "onSelect", type: "() => void", description: "Called when this item is selected." },
  { name: "value", type: "string", description: "Optional Radix value for form integration." },
];

export default function RadioGroupDoc() {
  const options = ["Option A", "Option B", "Option C"];
  const [selected, setSelected] = useState(0);

  return (
    <DocPage
      title="RadioGroup"
      description="Radio button group with proximity hover and animated selection."
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
