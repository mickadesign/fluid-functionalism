"use client";

import { useState } from "react";
import { ColorPicker, ColorPickerPopover } from "@/registry/default/color-picker";
import { ComponentPreview } from "@/lib/docs/ComponentPreview";
import { PropsTable } from "@/lib/docs/PropsTable";
import { DocPage, DocSection } from "@/lib/docs/DocPage";
import { colorPickerProps, popoverProps } from "@/lib/docs/api/color-picker";

const basicCode = `import { ColorPicker } from "./components";

<ColorPicker defaultValue="#6B97FF" />`;

const popoverCode = `import { ColorPickerPopover } from "./components";

<ColorPickerPopover
  triggerLabel="Fill"
  defaultValue="#6B97FF"
/>`;

const swatchesCode = `import { ColorPicker } from "./components";

<ColorPicker
  defaultValue="#6B97FF"
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

<ColorPicker defaultFormat="oklch" defaultValue="#6B97FF" />`;

const controlledCode = `import { useState } from "react";
import { ColorPicker } from "./components";

const [color, setColor] = useState("#6B97FF");

<ColorPicker
  value={color}
  onValueChange={(v) => setColor(v)}
/>
<p>Current: {color}</p>`;

const removeCode = `import { useState } from "react";
import { ColorPickerPopover } from "./components";

const [color, setColor] = useState<string | null>("#6B97FF");

color
  ? <ColorPickerPopover
      triggerLabel="Fill"
      triggerShowRemove
      onTriggerRemove={() => setColor(null)}
      value={color}
      onValueChange={(v) => setColor(v)}
    />
  : <button onClick={() => setColor("#6B97FF")}>+ Add fill</button>`;

export default function ColorPickerDoc() {
  const [color, setColor] = useState("#6B97FF");
  const [removableColor, setRemovableColor] = useState<string | null>("#6B97FF");

  return (
    <DocPage
      title="Color Picker"
      slug="color-picker"
      description="Color picker with HEX, RGB, HSL, and OKLCH formats, alpha channel, optional swatches, and an eyedropper. Available as an inline panel or popover."
    >
      <DocSection title="Default">
        <ComponentPreview code={basicCode}>
          <ColorPicker defaultValue="#6B97FF" />
        </ComponentPreview>
      </DocSection>

      <DocSection title="Popover">
        <ComponentPreview code={popoverCode}>
          <ColorPickerPopover triggerLabel="Fill" defaultValue="#6B97FF" />
        </ComponentPreview>
      </DocSection>

      <DocSection title="With Swatches">
        <ComponentPreview code={swatchesCode}>
          <ColorPicker
            defaultValue="#6B97FF"
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
          <ColorPicker defaultFormat="oklch" defaultValue="#6B97FF" />
        </ComponentPreview>
      </DocSection>

      <DocSection title="Controlled">
        <ComponentPreview code={controlledCode}>
          <div className="flex flex-col gap-3 items-start">
            <ColorPicker value={color} onValueChange={(v) => setColor(v)} />
            <p className="text-site-body text-muted-foreground">
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
              onClick={() => setRemovableColor("#6B97FF")}
              className="text-site-body text-muted-foreground hover:text-foreground border border-dashed border-border px-3 h-9 rounded-lg cursor-pointer"
            >
              + Add fill
            </button>
          )}
        </ComponentPreview>
      </DocSection>

      <DocSection title="Eyedropper Support">
        <p className="text-site-body text-muted-foreground">
          The eyedropper uses the native{" "}
          <code className="font-mono text-site-caption">window.EyeDropper</code> API
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
