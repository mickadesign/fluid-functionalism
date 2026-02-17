"use client";

import { useState } from "react";
import { CheckboxGroup, CheckboxItem } from "@/registry/default/checkbox-group";
import { ComponentPreview } from "@/lib/docs/ComponentPreview";
import { PropsTable, type PropDef } from "@/lib/docs/PropsTable";
import { DocPage, DocSection } from "@/lib/docs/DocPage";

const basicCode = `import { CheckboxGroup, CheckboxItem } from "./components";
import { useState } from "react";

const items = ["Apples", "Bananas", "Cherries", "Dates"];
const [checked, setChecked] = useState<Set<number>>(new Set([0]));

<CheckboxGroup checkedIndices={checked}>
  {items.map((label, i) => (
    <CheckboxItem
      key={label}
      index={i}
      label={label}
      checked={checked.has(i)}
      onToggle={() => {
        setChecked((prev) => {
          const next = new Set(prev);
          if (next.has(i)) next.delete(i);
          else next.add(i);
          return next;
        });
      }}
    />
  ))}
</CheckboxGroup>`;

const groupProps: PropDef[] = [
  { name: "checkedIndices", type: "Set<number>", description: "Set of checked item indices. Used for merged background rendering." },
  { name: "children", type: "ReactNode", description: "CheckboxItem children." },
];

const itemProps: PropDef[] = [
  { name: "label", type: "string", description: "Text label for the checkbox." },
  { name: "index", type: "number", description: "Position index within the group." },
  { name: "checked", type: "boolean", description: "Whether this item is checked." },
  { name: "onToggle", type: "() => void", description: "Called when this item is toggled." },
];

export default function CheckboxGroupDoc() {
  const items = ["Apples", "Bananas", "Cherries", "Dates"];
  const [checked, setChecked] = useState<Set<number>>(new Set([0]));

  return (
    <DocPage
      title="CheckboxGroup"
      description="Checkbox group with merged backgrounds for contiguous selections."
    >
      <DocSection title="Basic">
        <ComponentPreview code={basicCode}>
          <CheckboxGroup checkedIndices={checked}>
            {items.map((label, i) => (
              <CheckboxItem
                key={label}
                index={i}
                label={label}
                checked={checked.has(i)}
                onToggle={() => {
                  setChecked((prev) => {
                    const next = new Set(prev);
                    if (next.has(i)) next.delete(i);
                    else next.add(i);
                    return next;
                  });
                }}
              />
            ))}
          </CheckboxGroup>
        </ComponentPreview>
      </DocSection>

      <DocSection title="API Reference — CheckboxGroup">
        <PropsTable props={groupProps} />
      </DocSection>

      <DocSection title="API Reference — CheckboxItem">
        <PropsTable props={itemProps} />
      </DocSection>
    </DocPage>
  );
}
