"use client";

import { useState } from "react";
import { Switch } from "@/registry/radix/switch";
import { ComponentPreview } from "@/lib/docs/ComponentPreview";
import { PropsTable } from "@/lib/docs/PropsTable";
import { DocPage, DocSection } from "@/lib/docs/DocPage";
import { switchProps } from "@/lib/docs/api/switch";

const basicCode = `import { Switch } from "./components";
import { useState } from "react";

const [checked, setChecked] = useState(false);

<Switch
  label="Notifications"
  checked={checked}
  onToggle={() => setChecked((prev) => !prev)}
/>`;

const disabledCode = `<Switch
  label="Disabled option"
  checked={false}
  onToggle={() => {}}
  disabled
/>`;

export default function SwitchDoc() {
  const [checked, setChecked] = useState(false);

  return (
    <DocPage
      title="Switch"
      slug="switch"
      description="Toggle switch with animated thumb and label."
    >
      <DocSection title="Basic">
        <ComponentPreview code={basicCode}>
          <Switch
            label="Notifications"
            checked={checked}
            onToggle={() => setChecked((prev) => !prev)}
          />
        </ComponentPreview>
      </DocSection>

      <DocSection title="Disabled">
        <ComponentPreview code={disabledCode}>
          <Switch
            label="Disabled option"
            checked={false}
            onToggle={() => {}}
            disabled
          />
        </ComponentPreview>
      </DocSection>

      <DocSection title="API Reference">
        <PropsTable props={switchProps} />
      </DocSection>
    </DocPage>
  );
}
