"use client";

import { useState } from "react";
import { CheckboxGroup, CheckboxItem } from "@/registry/radix/checkbox-group";
import { ComponentPreview } from "@/lib/docs/ComponentPreview";
import { PropsTable } from "@/lib/docs/PropsTable";
import { DocPage, DocSection } from "@/lib/docs/DocPage";
import { groupProps, itemProps } from "@/lib/docs/api/checkbox-group";

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

export default function CheckboxGroupDoc() {
  const items = ["Apples", "Bananas", "Cherries", "Dates"];
  const [checked, setChecked] = useState<Set<number>>(new Set([0]));

  return (
    <DocPage
      title="CheckboxGroup"
      slug="checkbox-group"
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
