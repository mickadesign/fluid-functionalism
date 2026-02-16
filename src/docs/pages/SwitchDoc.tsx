import { useState } from "react";
import { Switch } from "../../components";
import { ComponentPreview } from "../ComponentPreview";
import { PropsTable, type PropDef } from "../PropsTable";
import { DocPage, DocSection } from "../DocPage";

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

const switchProps: PropDef[] = [
  { name: "label", type: "string", description: "Text label displayed next to the switch." },
  { name: "checked", type: "boolean", description: "Whether the switch is on." },
  { name: "onToggle", type: "() => void", description: "Called when the switch is toggled." },
  { name: "disabled", type: "boolean", default: "false", description: "Disables the switch." },
];

export function SwitchDoc() {
  const [checked, setChecked] = useState(false);

  return (
    <DocPage
      title="Switch"
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
