"use client";

import { useState } from "react";
import { ColorPicker, ColorPickerPopover } from "@/registry/default/color-picker";
import { ComponentPreview } from "@/lib/docs/ComponentPreview";
import { PropsTable, type PropDef } from "@/lib/docs/PropsTable";
import { DocPage, DocSection } from "@/lib/docs/DocPage";

const basicCode = `import { ColorPicker } from "./components";

<ColorPicker defaultValue="#ff0000" />`;

const popoverCode = `import { ColorPickerPopover } from "./components";

<ColorPickerPopover
  triggerLabel="Fill"
  defaultValue="#FFFFFF"
/>`;

const swatchesCode = `import { ColorPicker } from "./components";

<ColorPicker
  defaultValue="#ff3b30"
  swatches={[
    "#000000",
    "#FFFFFF",
    "#FF3B30",
    "#F0F0F0",
    "#E5E5E5",
    "#D0D0D0",
    "rgba(0,0,0,0.5)",
  ]}
/>`;

const oklchCode = `import { ColorPicker } from "./components";

<ColorPicker defaultFormat="oklch" defaultValue="oklch(70% 0.18 25)" />`;

const controlledCode = `import { useState } from "react";
import { ColorPicker } from "./components";

const [color, setColor] = useState("#3b82f6");

<ColorPicker
  value={color}
  onValueChange={(v) => setColor(v)}
/>
<p>Current: {color}</p>`;

const removeCode = `import { useState } from "react";
import { ColorPickerPopover } from "./components";

const [color, setColor] = useState<string | null>("#10b981");

color
  ? <ColorPickerPopover
      triggerLabel="Fill"
      triggerShowRemove
      onTriggerRemove={() => setColor(null)}
      value={color}
      onValueChange={(v) => setColor(v)}
    />
  : <button onClick={() => setColor("#10b981")}>+ Add fill</button>`;

const colorPickerProps: PropDef[] = [
  { name: "value", type: "string", description: "Controlled color value (any of the supported formats)." },
  { name: "defaultValue", type: "string", default: '"#ff0000"', description: "Initial color when uncontrolled." },
  { name: "onValueChange", type: "(value, parsed) => void", description: "Fired on every change. Receives the formatted string and a parsed color object with all formats." },
  { name: "format", type: '"hex" | "rgb" | "hsl" | "oklch"', description: "Controlled format selection." },
  { name: "defaultFormat", type: '"hex" | "rgb" | "hsl" | "oklch"', default: '"hex"', description: "Initial format when uncontrolled." },
  { name: "onFormatChange", type: "(format) => void", description: "Fired when the user switches format." },
  { name: "swatches", type: "string[]", description: "Optional preset swatches. When omitted, the strip is hidden." },
  { name: "hideEyedropper", type: "boolean", default: "false", description: "Force-hide the eyedropper button (it is automatically hidden in unsupported browsers)." },
];

const popoverProps: PropDef[] = [
  { name: "triggerLabel", type: "string", description: "Optional label rendered alongside the color tile." },
  { name: "triggerLabelPosition", type: '"left" | "right"', default: '"left"', description: "Position of the label relative to the color tile." },
  { name: "triggerShowValue", type: "boolean", default: "true", description: "Show the hex value (without alpha) next to the tile." },
  { name: "triggerShowRemove", type: "boolean", default: "false", description: "Render an X button on the trigger." },
  { name: "onTriggerRemove", type: "() => void", description: "Fired when the X button is clicked." },
  { name: "triggerClassName", type: "string", description: "Custom classes on the trigger button." },
  { name: "...ColorPickerProps", type: "ColorPickerProps", description: "All ColorPicker props are forwarded to the panel." },
];

export default function ColorPickerDoc() {
  const [color, setColor] = useState("#3b82f6");
  const [removableColor, setRemovableColor] = useState<string | null>("#10b981");

  return (
    <DocPage
      title="Color Picker"
      slug="color-picker"
      description="Color picker with HEX, RGB, HSL, and OKLCH formats, alpha channel, optional swatches, and an eyedropper. Available as an inline panel or popover."
    >
      <DocSection title="Default">
        <ComponentPreview code={basicCode}>
          <ColorPicker defaultValue="#ff0000" />
        </ComponentPreview>
      </DocSection>

      <DocSection title="Popover">
        <ComponentPreview code={popoverCode}>
          <ColorPickerPopover triggerLabel="Fill" defaultValue="#FFFFFF" />
        </ComponentPreview>
      </DocSection>

      <DocSection title="With Swatches">
        <ComponentPreview code={swatchesCode}>
          <ColorPicker
            defaultValue="#ff3b30"
            swatches={[
              "#000000",
              "#FFFFFF",
              "#FF3B30",
              "#F0F0F0",
              "#E5E5E5",
              "#D0D0D0",
              "rgba(0,0,0,0.5)",
            ]}
          />
        </ComponentPreview>
      </DocSection>

      <DocSection title="OKLCH Format">
        <ComponentPreview code={oklchCode}>
          <ColorPicker defaultFormat="oklch" defaultValue="oklch(70% 0.18 25)" />
        </ComponentPreview>
      </DocSection>

      <DocSection title="Controlled">
        <ComponentPreview code={controlledCode}>
          <div className="flex flex-col gap-3 items-start">
            <ColorPicker value={color} onValueChange={(v) => setColor(v)} />
            <p className="text-[13px] text-muted-foreground">
              Current: <span className="font-mono">{color}</span>
            </p>
          </div>
        </ComponentPreview>
      </DocSection>

      <DocSection title="Removable Trigger">
        <ComponentPreview code={removeCode}>
          {removableColor ? (
            <ColorPickerPopover
              triggerLabel="Fill"
              triggerShowRemove
              onTriggerRemove={() => setRemovableColor(null)}
              value={removableColor}
              onValueChange={(v) => setRemovableColor(v)}
            />
          ) : (
            <button
              type="button"
              onClick={() => setRemovableColor("#10b981")}
              className="text-[13px] text-muted-foreground hover:text-foreground border border-dashed border-border px-3 h-9 rounded-lg cursor-pointer"
            >
              + Add fill
            </button>
          )}
        </ComponentPreview>
      </DocSection>

      <DocSection title="Eyedropper Support">
        <p className="text-[13px] text-muted-foreground">
          The eyedropper uses the native{" "}
          <code className="font-mono text-[12px]">window.EyeDropper</code> API
          (Chromium-based browsers). It is automatically hidden in browsers
          that do not support it.
        </p>
      </DocSection>

      <DocSection title="ColorPicker Props">
        <PropsTable props={colorPickerProps} />
      </DocSection>

      <DocSection title="ColorPickerPopover Props">
        <PropsTable props={popoverProps} />
      </DocSection>
    </DocPage>
  );
}
