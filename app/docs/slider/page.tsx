"use client";

import { useState } from "react";
import { Slider } from "@/registry/default/slider";
import { ComponentPreview } from "@/lib/docs/ComponentPreview";
import { PropsTable, type PropDef } from "@/lib/docs/PropsTable";
import { DocPage, DocSection } from "@/lib/docs/DocPage";

// ---------------------------------------------------------------------------
// Code snippets
// ---------------------------------------------------------------------------

const basicCode = `import { Slider } from "./components";

const [value, setValue] = useState(25);

<Slider value={value} onChange={setValue} />`;

const rangeCode = `import { Slider } from "./components";

const [range, setRange] = useState<[number, number]>([25, 75]);

<Slider value={range} onChange={setRange} />`;

const stepsCode = `import { Slider } from "./components";

const [value, setValue] = useState(50);

<Slider
  value={value}
  onChange={setValue}
  step={25}
  showSteps
/>`;

const valueDisplayCode = `import { Slider } from "./components";

<Slider value={value} onChange={setValue} valuePosition="left" label="Volume" />
<Slider value={value} onChange={setValue} valuePosition="right" label="Volume" />
<Slider value={value} onChange={setValue} valuePosition="tooltip" />`;

const disabledCode = `import { Slider } from "./components";

<Slider value={50} onChange={() => {}} disabled />`;

const formatCode = `import { Slider } from "./components";

<Slider
  value={value}
  onChange={setValue}
  formatValue={(v) => \`\${v}%\`}
  label="Opacity"
/>`;

// ---------------------------------------------------------------------------
// Props table
// ---------------------------------------------------------------------------

const sliderProps: PropDef[] = [
  {
    name: "value",
    type: "number | [number, number]",
    description:
      "Current value. Pass an array to enable range mode with two thumbs.",
  },
  {
    name: "onChange",
    type: "(value: SliderValue) => void",
    description: "Called when the value changes via drag, click, or keyboard.",
  },
  {
    name: "min",
    type: "number",
    default: "0",
    description: "Minimum value.",
  },
  {
    name: "max",
    type: "number",
    default: "100",
    description: "Maximum value.",
  },
  {
    name: "step",
    type: "number",
    default: "1",
    description: "Step increment. Thumb snaps to the nearest step during drag.",
  },
  {
    name: "showSteps",
    type: "boolean",
    default: "false",
    description: "Render dot indicators at each step position on the track.",
  },
  {
    name: "showValue",
    type: "boolean",
    default: "true",
    description: "Whether to display the current value label.",
  },
  {
    name: "valuePosition",
    type: '"left" | "right" | "top" | "bottom" | "tooltip"',
    default: '"bottom"',
    description:
      'Position of the value label. "tooltip" shows above the thumb during interaction.',
  },
  {
    name: "formatValue",
    type: "(v: number) => string",
    default: "String",
    description: "Custom formatter for the value label.",
  },
  {
    name: "label",
    type: "string",
    description:
      "Accessible label for the slider, also shown as prefix in the value display.",
  },
  {
    name: "disabled",
    type: "boolean",
    default: "false",
    description: "Disables all interaction.",
  },
];

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function SliderDoc() {
  const [basic, setBasic] = useState(25);
  const [range, setRange] = useState<[number, number]>([25, 75]);
  const [stepped, setStepped] = useState(50);
  const [stepped10, setStepped10] = useState(50);
  const [left, setLeft] = useState(40);
  const [right, setRight] = useState(60);
  const [tooltip, setTooltip] = useState(50);
  const [formatted, setFormatted] = useState(75);

  return (
    <DocPage
      title="Slider"
      slug="slider"
      description="Animated slider with spring-snapped thumb, step dots, range mode, and click-to-edit value display."
    >
      <DocSection title="Basic">
        <ComponentPreview code={basicCode}>
          <div className="w-72">
            <Slider value={basic} onChange={(v) => setBasic(v as number)} />
          </div>
        </ComponentPreview>
      </DocSection>

      <DocSection title="Range">
        <ComponentPreview code={rangeCode}>
          <div className="w-72">
            <Slider
              value={range}
              onChange={(v) => setRange(v as [number, number])}
            />
          </div>
        </ComponentPreview>
      </DocSection>

      <DocSection title="Steps">
        <ComponentPreview code={stepsCode}>
          <div className="w-72">
            <Slider
              value={stepped}
              onChange={(v) => setStepped(v as number)}
              step={25}
              showSteps
            />
            <Slider
              value={stepped10}
              onChange={(v) => setStepped10(v as number)}
              step={10}
              showSteps
            />
          </div>
        </ComponentPreview>
      </DocSection>

      <DocSection title="Value Display">
        <ComponentPreview code={valueDisplayCode}>
          <div className="flex flex-col gap-6 w-72">
            <Slider
              value={left}
              onChange={(v) => setLeft(v as number)}
              valuePosition="left"
              label="Volume"
            />
            <Slider
              value={right}
              onChange={(v) => setRight(v as number)}
              valuePosition="right"
              label="Volume"
            />
            <Slider
              value={tooltip}
              onChange={(v) => setTooltip(v as number)}
              valuePosition="tooltip"
            />
          </div>
        </ComponentPreview>
      </DocSection>

      <DocSection title="Custom Format">
        <ComponentPreview code={formatCode}>
          <div className="w-72">
            <Slider
              value={formatted}
              onChange={(v) => setFormatted(v as number)}
              formatValue={(v) => `${v}%`}
              label="Opacity"
            />
          </div>
        </ComponentPreview>
      </DocSection>

      <DocSection title="Disabled">
        <ComponentPreview code={disabledCode}>
          <div className="w-72">
            <Slider value={50} onChange={() => {}} disabled />
          </div>
        </ComponentPreview>
      </DocSection>

      <DocSection title="API Reference">
        <PropsTable props={sliderProps} />
      </DocSection>
    </DocPage>
  );
}
