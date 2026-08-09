"use client";

import { useState } from "react";
import { Slider } from "@/registry/radix/slider";
import { ComponentPreview } from "@/lib/docs/ComponentPreview";
import { PropsTable, type PropDef } from "@/lib/docs/PropsTable";
import { DocPage, DocSection } from "@/lib/docs/DocPage";

// ---------------------------------------------------------------------------
// Code snippets — compact step
// ---------------------------------------------------------------------------

const basicCode = `import { Slider } from "./components";

const [value, setValue] = useState(25);

<Slider size="compact" value={value} onChange={setValue} />`;

const rangeCode = `import { Slider } from "./components";

const [range, setRange] = useState<[number, number]>([25, 75]);

<Slider value={range} onChange={setRange} />`;

const stepsCode = `import { Slider } from "./components";

const [stepped, setStepped] = useState(50);
const [stepped10, setStepped10] = useState(50);

<Slider value={stepped} onChange={setStepped} step={25} showSteps />
<Slider value={stepped10} onChange={setStepped10} step={10} showSteps />`;

const nonUniformCode = `import { Slider } from "./components";

const AMPERE_RATINGS = [0.1, 0.5, 0.7, 1.1, 1.3];
const [rating, setRating] = useState(0.7);

<Slider
  value={rating}
  onChange={setRating}
  steps={AMPERE_RATINGS}
  showSteps
  label="Rating"
  formatValue={(v) => \`\${v} A\`}
/>`;

const valueDisplayCode = `import { Slider } from "./components";

<Slider value={value} onChange={setValue} valuePosition="left" label="Volume" />
<Slider value={value} onChange={setValue} valuePosition="right" label="Volume" />
<Slider value={value} onChange={setValue} valuePosition="tooltip" />`;

const disabledCode = `import { Slider } from "./components";

<Slider size="compact" value={50} onChange={() => {}} disabled />`;

const formatCode = `import { Slider } from "./components";

<Slider
  value={value}
  onChange={setValue}
  formatValue={(v) => \`\${v}%\`}
  label="Opacity"
/>`;


// ---------------------------------------------------------------------------
// Code snippets — default step
// ---------------------------------------------------------------------------

const comfortableBasicCode = `import { Slider } from "./components";

const [roundness, setRoundness] = useState(2);

<Slider
  label="Roundness"
  value={roundness}
  onChange={(v) => setRoundness(v as number)}
  min={0}
  max={4}
/>`;

const comfortableScrubberCode = `import { Slider } from "./components";

const [volume, setVolume] = useState(50);

<Slider
  variant="scrubber"
  label="Volume"
  value={volume}
  onChange={(v) => setVolume(v as number)}
  min={0}
  max={100}
  formatValue={(v) => \`\${v}%\`}
/>`;

const comfortableFormatCode = `import { Slider } from "./components";

const qualityLabels = ["Off", "Low", "Medium", "High", "Ultra"];

<Slider
  label="Quality"
  value={quality}
  onChange={(v) => setQuality(v as number)}
  min={0}
  max={4}
  formatValue={(v) => qualityLabels[v]}
/>`;

const comfortableDisabledCode = `import { Slider } from "./components";

<Slider
  label="Roundness"
  value={2}
  onChange={() => {}}
  min={0}
  max={4}
  disabled
/>`;

// ---------------------------------------------------------------------------
// Props tables
// ---------------------------------------------------------------------------

const sliderProps: PropDef[] = [
  {
    name: "size",
    type: '"default" | "compact"',
    default: "from SizeProvider",
    description:
      "Step on the size ladder (see /docs/sizes). Default renders the pip/scrubber design; compact renders the dense design.",
  },
  {
    name: "variant",
    type: '"pips" | "scrubber"',
    default: '"pips"',
    description:
      'Default-step layout. "pips" shows discrete dot indicators; "scrubber" drags anywhere in the row for a continuous value. Ignored when the compact design renders.',
  },
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
    name: "steps",
    type: "number[]",
    description:
      "Discrete list of allowed values, e.g. [0.1, 0.5, 0.7, 1.1, 1.3]. The thumb snaps only to these values and arrow keys walk the list. min/max derive from the list's extremes and step is ignored.",
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
    default: '"left"',
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

const qualityLabels = ["Off", "Low", "Medium", "High", "Ultra"];

export default function SliderDoc() {
  const [basic, setBasic] = useState(25);
  const [range, setRange] = useState<[number, number]>([25, 75]);
  const [stepped, setStepped] = useState(50);
  const [stepped10, setStepped10] = useState(50);
  const [rating, setRating] = useState(0.7);
  const [left, setLeft] = useState(40);
  const [right, setRight] = useState(60);
  const [tooltip, setTooltip] = useState(50);
  const [formatted, setFormatted] = useState(75);

  const [roundness, setRoundness] = useState(2);
  const [volume, setVolume] = useState(50);
  const [quality, setQuality] = useState(2);

  return (
    <DocPage
      title="Slider"
      slug="slider"
      description="One slider, two ladder steps: the default step's pip/scrubber design, and the compact step's dense design with track fill, range mode, and value display."
    >
      {/* ------------------------------------------------------------------ */}
      {/* Compact                                                              */}
      {/* ------------------------------------------------------------------ */}

      <DocSection title="Compact">
        <ComponentPreview code={basicCode}>
          <div className="w-72">
            <Slider
              size="compact"
              value={basic}
              onChange={(v) => setBasic(v as number)}
            />
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

      <DocSection title="Non-uniform Steps">
        <ComponentPreview code={nonUniformCode}>
          <div className="w-72">
            <Slider
              value={rating}
              onChange={(v) => setRating(v as number)}
              steps={[0.1, 0.5, 0.7, 1.1, 1.3]}
              showSteps
              label="Rating"
              formatValue={(v) => `${v} A`}
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

      <DocSection title="Format">
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
            <Slider size="compact" value={50} onChange={() => {}} disabled />
          </div>
        </ComponentPreview>
      </DocSection>

      {/* ------------------------------------------------------------------ */}
      {/* Comfortable                                                          */}
      {/* ------------------------------------------------------------------ */}

      <DocSection title="Default">
        <ComponentPreview code={comfortableBasicCode}>
          <div className="w-72">
            <Slider
              label="Roundness"
              value={roundness}
              onChange={(v) => setRoundness(v as number)}
              min={0}
              max={4}
            />
          </div>
        </ComponentPreview>
      </DocSection>

      <DocSection title="Default — Scrubber">
        <ComponentPreview code={comfortableScrubberCode}>
          <div className="w-72">
            <Slider
              variant="scrubber"
              label="Volume"
              value={volume}
              onChange={(v) => setVolume(v as number)}
              min={0}
              max={100}
              formatValue={(v) => `${v}%`}
            />
          </div>
        </ComponentPreview>
      </DocSection>

      <DocSection title="Default — Format">
        <ComponentPreview code={comfortableFormatCode}>
          <div className="w-72">
            <Slider
              label="Quality"
              value={quality}
              onChange={(v) => setQuality(v as number)}
              min={0}
              max={4}
              formatValue={(v) => qualityLabels[v]}
            />
          </div>
        </ComponentPreview>
      </DocSection>

      <DocSection title="Default — Disabled">
        <ComponentPreview code={comfortableDisabledCode}>
          <div className="w-72">
            <Slider
              label="Roundness"
              value={2}
              onChange={() => {}}
              min={0}
              max={4}
              disabled
            />
          </div>
        </ComponentPreview>
      </DocSection>

      {/* ------------------------------------------------------------------ */}
      {/* API Reference                                                        */}
      {/* ------------------------------------------------------------------ */}

      <DocSection title="API Reference">
        <p className="text-body text-muted-foreground mb-3">
          One component: the default step renders the pip/scrubber design, the
          compact step the dense one. Compact-only props (an array value,
          steps, showSteps, showValue, valuePosition, track styling) always
          render the compact design so no capability is lost.
        </p>
        <PropsTable props={sliderProps} />
      </DocSection>
    </DocPage>
  );
}
