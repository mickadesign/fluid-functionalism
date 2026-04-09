"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  ThinkingSteps,
  ThinkingStepsHeader,
  ThinkingStepsContent,
  ThinkingStep,
  ThinkingStepSources,
  ThinkingStepSource,
  type StepStatus,
} from "@/registry/default/thinking-steps";
import { ComponentPreview } from "@/lib/docs/ComponentPreview";
import { PropsTable, type PropDef } from "@/lib/docs/PropsTable";
import { DocPage, DocSection } from "@/lib/docs/DocPage";

// ─── Code Snippets ──────────────────────────────────────────────────────────

const basicCode = `import {
  ThinkingSteps, ThinkingStepsHeader, ThinkingStepsContent,
  ThinkingStep, ThinkingStepSources, ThinkingStepSource,
} from "./components";

<ThinkingSteps>
  <ThinkingStepsHeader />
  <ThinkingStepsContent>
    <ThinkingStep index={0} icon="search" label="Searched the web" />
    <ThinkingStep index={1} icon="globe" label="Read 3 sources">
      <ThinkingStepSources>
        <ThinkingStepSource>github.com</ThinkingStepSource>
        <ThinkingStepSource>google.com</ThinkingStepSource>
      </ThinkingStepSources>
    </ThinkingStep>
    <ThinkingStep index={2} icon="check" label="Done" isLast />
  </ThinkingStepsContent>
</ThinkingSteps>`;

const streamingCode = `const TOTAL = 4;
const [visibleSteps, setVisibleSteps] = useState(0);
const [open, setOpen] = useState(true);

useEffect(() => {
  const timers = [
    setTimeout(() => setVisibleSteps(1), 400),
    setTimeout(() => setVisibleSteps(2), 1800),
    setTimeout(() => setVisibleSteps(3), 3200),
    setTimeout(() => setVisibleSteps(4), 4200),
    // Mark all complete, then auto-collapse
    setTimeout(() => setVisibleSteps(TOTAL + 1), 5200),
    setTimeout(() => setOpen(false), 6000),
  ];
  return () => timers.forEach(clearTimeout);
}, []);

const getStatus = (i: number): StepStatus => {
  if (visibleSteps > TOTAL) return "complete";
  return i < visibleSteps - 1 ? "complete"
    : i === visibleSteps - 1 ? "active" : "pending";
};

<ThinkingSteps open={open} onOpenChange={setOpen}>
  <ThinkingStepsHeader />
  <ThinkingStepsContent>
    <ThinkingStep index={0} icon="search"
      label="Searching for micka.design"
      status={getStatus(0)} isLast={visibleSteps <= 1}>
      {visibleSteps > 1 && (
        <ThinkingStepSources>
          <ThinkingStepSource delay={0.05}>x.com</ThinkingStepSource>
          <ThinkingStepSource delay={0.1}>google.com</ThinkingStepSource>
          <ThinkingStepSource delay={0.15}>github.com</ThinkingStepSource>
        </ThinkingStepSources>
      )}
    </ThinkingStep>
    <ThinkingStep index={1} icon="globe"
      label="Reading sources"
      status={getStatus(1)} isLast={visibleSteps <= 2} />
    <ThinkingStep index={2} icon="brain"
      label="Analyzing portfolio"
      status={getStatus(2)} isLast={visibleSteps <= 3} />
    <ThinkingStep index={3} icon="check"
      label="Complete" status={getStatus(3)} isLast />
  </ThinkingStepsContent>
</ThinkingSteps>`;

const longCode = `// A longer chain with images, descriptions, and many sources.
<ThinkingSteps>
  <ThinkingStepsHeader>Research Agent</ThinkingStepsHeader>
  <ThinkingStepsContent>
    <ThinkingStep index={0} icon="search" label="Searching profiles">
      <ThinkingStepSources>
        <ThinkingStepSource>x.com</ThinkingStepSource>
        <ThinkingStepSource>instagram.com</ThinkingStepSource>
        <ThinkingStepSource>github.com</ThinkingStepSource>
      </ThinkingStepSources>
    </ThinkingStep>
    <ThinkingStep index={1} icon="image" label="Found profile photo">
      <ThinkingStepImage src="/avatar.jpg" caption="Profile photo" />
    </ThinkingStep>
    <ThinkingStep index={2} icon="globe" label="Reading portfolio"
      description="Found 12 projects across design and engineering." />
    <ThinkingStep index={3} icon="search" label="Searching recent work">
      <ThinkingStepSources>
        <ThinkingStepSource>figma.com</ThinkingStepSource>
        <ThinkingStepSource>behance.net</ThinkingStepSource>
      </ThinkingStepSources>
    </ThinkingStep>
    <ThinkingStep index={4} icon="brain" label="Analyzing results"
      description="Compiling findings into a summary." />
    <ThinkingStep index={5} icon="check" label="Research complete" isLast />
  </ThinkingStepsContent>
</ThinkingSteps>`;

const dotsCode = `// With showIcon={false}, icons are replaced by small dots.
// Use open + onOpenChange for auto-collapse on completion.
<ThinkingSteps open={open} onOpenChange={setOpen}>
  <ThinkingStepsHeader />
  <ThinkingStepsContent>
    <ThinkingStep index={0} showIcon={false} label="Parsed the query" status={getStatus(0)} />
    <ThinkingStep index={1} showIcon={false} label="Retrieved context" status={getStatus(1)} />
    <ThinkingStep index={2} showIcon={false} label="Searching for references" status={getStatus(2)}>
      {visibleSteps > 3 && (
        <ThinkingStepSources>
          <ThinkingStepSource>docs.python.org</ThinkingStepSource>
          <ThinkingStepSource>stackoverflow.com</ThinkingStepSource>
        </ThinkingStepSources>
      )}
    </ThinkingStep>
    <ThinkingStep index={3} showIcon={false} label="Drafting response" status={getStatus(3)} />
    <ThinkingStep index={4} showIcon={false} label="Done" status={getStatus(4)} isLast />
  </ThinkingStepsContent>
</ThinkingSteps>`;

// ─── Props Tables ───────────────────────────────────────────────────────────

const rootProps: PropDef[] = [
  { name: "defaultOpen", type: "boolean", default: "true", description: "Whether the accordion starts expanded (uncontrolled)." },
  { name: "open", type: "boolean", description: "Controlled open state. Use with onOpenChange." },
  { name: "onOpenChange", type: "(open: boolean) => void", description: "Callback when the open state changes." },
  { name: "className", type: "string", description: "Additional CSS classes for the root container." },
];

const headerProps: PropDef[] = [
  { name: "children", type: "ReactNode", default: '"Thinking"', description: "Header label text." },
];

const stepProps: PropDef[] = [
  { name: "icon", type: "IconName", default: '"dot"', description: "Icon name from the icon library." },
  { name: "showIcon", type: "boolean", default: "true", description: "Show the icon. When false, displays a small dot instead." },
  { name: "label", type: "string", description: "Step label text." },
  { name: "description", type: "string", description: "Optional secondary text below the label." },
  { name: "status", type: '"complete" | "active" | "pending"', default: '"complete"', description: "Step state. Pending steps are hidden; active steps show shimmer text." },
  { name: "index", type: "number", description: "Position index for proximity hover registration." },
  { name: "delay", type: "number", default: "0", description: "Entrance animation delay in seconds." },
  { name: "isLast", type: "boolean", default: "false", description: "Hides the connector line below this step." },
];

const sourceProps: PropDef[] = [
  { name: "color", type: "BadgeColor", default: '"gray"', description: "Badge color from the Tailwind palette." },
  { name: "delay", type: "number", default: "0", description: "Entrance animation delay in seconds." },
  { name: "children", type: "ReactNode", description: "Source label text." },
];

const imageProps: PropDef[] = [
  { name: "src", type: "string", description: "Image URL." },
  { name: "alt", type: "string", default: '""', description: "Alt text for accessibility." },
  { name: "caption", type: "string", description: "Optional caption below the image." },
  { name: "delay", type: "number", default: "0", description: "Entrance animation delay in seconds." },
];

// ─── Interactive Demos ──────────────────────────────────────────────────────

function StreamingDemo({ replayRef }: { replayRef: React.MutableRefObject<(() => void) | null> }) {
  const TOTAL = 4;
  const [visibleSteps, setVisibleSteps] = useState(0);
  const [open, setOpen] = useState(true);
  const [key, setKey] = useState(0);

  const run = useCallback(() => {
    setVisibleSteps(0);
    setOpen(true);
    setKey((k) => k + 1);
  }, []);

  replayRef.current = run;

  useEffect(() => {
    const timers = [
      setTimeout(() => setVisibleSteps(1), 400),
      setTimeout(() => setVisibleSteps(2), 1800),
      setTimeout(() => setVisibleSteps(3), 3200),
      setTimeout(() => setVisibleSteps(4), 4200),
      // All complete, then auto-collapse
      setTimeout(() => setVisibleSteps(TOTAL + 1), 5200),
      setTimeout(() => setOpen(false), 6000),
    ];
    return () => timers.forEach(clearTimeout);
  }, [key]);

  const getStatus = (i: number): StepStatus => {
    if (visibleSteps > TOTAL) return "complete";
    return i < visibleSteps - 1 ? "complete" : i === visibleSteps - 1 ? "active" : "pending";
  };

  return (
    <ThinkingSteps key={key} open={open} onOpenChange={setOpen}>
      <ThinkingStepsHeader />
      <ThinkingStepsContent>
        <ThinkingStep
          index={0}
          icon="search"
          label="Searching for micka.design"
          status={getStatus(0)}
          isLast={visibleSteps <= 1}
        >
          {visibleSteps > 1 && (
            <ThinkingStepSources>
              <ThinkingStepSource delay={0.05}>x.com</ThinkingStepSource>
              <ThinkingStepSource delay={0.1}>google.com</ThinkingStepSource>
              <ThinkingStepSource delay={0.15}>github.com</ThinkingStepSource>
            </ThinkingStepSources>
          )}
        </ThinkingStep>
        <ThinkingStep
          index={1}
          icon="globe"
          label="Reading sources"
          status={getStatus(1)}
          isLast={visibleSteps <= 2}
        />
        <ThinkingStep
          index={2}
          icon="brain"
          label="Analyzing portfolio"
          status={getStatus(2)}
          isLast={visibleSteps <= 3}
        />
        <ThinkingStep
          index={3}
          icon="check"
          label="Complete"
          status={getStatus(3)}
          isLast
        />
      </ThinkingStepsContent>
    </ThinkingSteps>
  );
}

function LongDemo({ replayRef }: { replayRef: React.MutableRefObject<(() => void) | null> }) {
  const TOTAL = 6;
  const [visibleSteps, setVisibleSteps] = useState(0);
  const [open, setOpen] = useState(true);
  const [key, setKey] = useState(0);

  const run = useCallback(() => {
    setVisibleSteps(0);
    setOpen(true);
    setKey((k) => k + 1);
  }, []);

  replayRef.current = run;

  useEffect(() => {
    const timers = [
      setTimeout(() => setVisibleSteps(1), 400),
      setTimeout(() => setVisibleSteps(2), 1600),
      setTimeout(() => setVisibleSteps(3), 2800),
      setTimeout(() => setVisibleSteps(4), 3800),
      setTimeout(() => setVisibleSteps(5), 5000),
      setTimeout(() => setVisibleSteps(6), 6200),
      setTimeout(() => setVisibleSteps(TOTAL + 1), 7200),
      setTimeout(() => setOpen(false), 8000),
    ];
    return () => timers.forEach(clearTimeout);
  }, [key]);

  const getStatus = (i: number): StepStatus => {
    if (visibleSteps > TOTAL) return "complete";
    return i < visibleSteps - 1 ? "complete" : i === visibleSteps - 1 ? "active" : "pending";
  };

  return (
    <ThinkingSteps key={key} open={open} onOpenChange={setOpen}>
      <ThinkingStepsHeader>Research Agent</ThinkingStepsHeader>
      <ThinkingStepsContent>
        <ThinkingStep
          index={0}
          icon="search"
          label="Searching for profiles"
          status={getStatus(0)}
          isLast={visibleSteps <= 1}
        >
          {visibleSteps > 1 && (
            <ThinkingStepSources>
              <ThinkingStepSource delay={0.05}>x.com</ThinkingStepSource>
              <ThinkingStepSource delay={0.1}>instagram.com</ThinkingStepSource>
              <ThinkingStepSource delay={0.15}>github.com</ThinkingStepSource>
            </ThinkingStepSources>
          )}
        </ThinkingStep>
        <ThinkingStep
          index={1}
          icon="image"
          label="Found profile photo"
          description="micka.design profile from x.com"
          status={getStatus(1)}
          isLast={visibleSteps <= 2}
        />
        <ThinkingStep
          index={2}
          icon="globe"
          label="Reading portfolio"
          description="Found 12 projects across design and engineering."
          status={getStatus(2)}
          isLast={visibleSteps <= 3}
        />
        <ThinkingStep
          index={3}
          icon="search"
          label="Searching for recent work"
          status={getStatus(3)}
          isLast={visibleSteps <= 4}
        >
          {visibleSteps > 4 && (
            <ThinkingStepSources>
              <ThinkingStepSource delay={0.05}>figma.com</ThinkingStepSource>
              <ThinkingStepSource delay={0.1}>behance.net</ThinkingStepSource>
              <ThinkingStepSource delay={0.15}>google.com</ThinkingStepSource>
            </ThinkingStepSources>
          )}
        </ThinkingStep>
        <ThinkingStep
          index={4}
          icon="brain"
          label="Analyzing results"
          description="Compiling findings into a summary."
          status={getStatus(4)}
          isLast={visibleSteps <= 5}
        />
        <ThinkingStep
          index={5}
          icon="check"
          label="Research complete"
          status={getStatus(5)}
          isLast
        />
      </ThinkingStepsContent>
    </ThinkingSteps>
  );
}

function DotDemo({ replayRef }: { replayRef: React.MutableRefObject<(() => void) | null> }) {
  const TOTAL = 5;
  const [visibleSteps, setVisibleSteps] = useState(0);
  const [open, setOpen] = useState(true);
  const [key, setKey] = useState(0);

  const run = useCallback(() => {
    setVisibleSteps(0);
    setOpen(true);
    setKey((k) => k + 1);
  }, []);

  replayRef.current = run;

  useEffect(() => {
    const timers = [
      setTimeout(() => setVisibleSteps(1), 400),
      setTimeout(() => setVisibleSteps(2), 1400),
      setTimeout(() => setVisibleSteps(3), 2400),
      setTimeout(() => setVisibleSteps(4), 3400),
      setTimeout(() => setVisibleSteps(5), 4400),
      setTimeout(() => setVisibleSteps(TOTAL + 1), 5400),
      setTimeout(() => setOpen(false), 6200),
    ];
    return () => timers.forEach(clearTimeout);
  }, [key]);

  const getStatus = (i: number): StepStatus => {
    if (visibleSteps > TOTAL) return "complete";
    return i < visibleSteps - 1 ? "complete" : i === visibleSteps - 1 ? "active" : "pending";
  };

  return (
    <ThinkingSteps key={key} open={open} onOpenChange={setOpen}>
      <ThinkingStepsHeader />
      <ThinkingStepsContent>
        <ThinkingStep index={0} showIcon={false} label="Parsed the query" status={getStatus(0)} isLast={visibleSteps <= 1} />
        <ThinkingStep index={1} showIcon={false} label="Retrieved context" status={getStatus(1)} isLast={visibleSteps <= 2} />
        <ThinkingStep index={2} showIcon={false} label="Searching for references" status={getStatus(2)} isLast={visibleSteps <= 3}>
          {visibleSteps > 3 && (
            <ThinkingStepSources>
              <ThinkingStepSource delay={0.05}>docs.python.org</ThinkingStepSource>
              <ThinkingStepSource delay={0.1}>stackoverflow.com</ThinkingStepSource>
            </ThinkingStepSources>
          )}
        </ThinkingStep>
        <ThinkingStep index={3} showIcon={false} label="Drafting response" status={getStatus(3)} isLast={visibleSteps <= 4} />
        <ThinkingStep index={4} showIcon={false} label="Done" status={getStatus(4)} isLast />
      </ThinkingStepsContent>
    </ThinkingSteps>
  );
}

// ─── Page ───────────────────────────────────────────────────────────────────

export default function ThinkingStepsDoc() {
  const streamingReplay = useRef<(() => void) | null>(null);
  const dotReplay = useRef<(() => void) | null>(null);
  const longReplay = useRef<(() => void) | null>(null);

  return (
    <DocPage
      title="ThinkingSteps"
      slug="thinking-steps"
      description="Chain-of-thought reasoning display with collapsible steps, sequential animation, source badges, and image support."
    >
      <DocSection title="Basic">
        <ComponentPreview code={basicCode}>
          <ThinkingSteps>
            <ThinkingStepsHeader />
            <ThinkingStepsContent>
              <ThinkingStep index={0} icon="search" label="Searched the web" />
              <ThinkingStep index={1} icon="globe" label="Read 3 sources">
                <ThinkingStepSources>
                  <ThinkingStepSource>github.com</ThinkingStepSource>
                  <ThinkingStepSource>google.com</ThinkingStepSource>
                </ThinkingStepSources>
              </ThinkingStep>
              <ThinkingStep index={2} icon="check" label="Done" isLast />
            </ThinkingStepsContent>
          </ThinkingSteps>
        </ComponentPreview>
      </DocSection>

      <DocSection title="Streaming">
        <p className="text-[13px] text-muted-foreground mb-3">
          Steps appear sequentially as they stream in. Active steps show a shimmer effect.
        </p>
        <ComponentPreview code={streamingCode} onReplay={() => streamingReplay.current?.()}>
          <StreamingDemo replayRef={streamingReplay} />
        </ComponentPreview>
      </DocSection>

      <DocSection title="Dot Mode">
        <p className="text-[13px] text-muted-foreground mb-3">
          Set showIcon to false to replace icons with minimal dots.
        </p>
        <ComponentPreview code={dotsCode} onReplay={() => dotReplay.current?.()}>
          <DotDemo replayRef={dotReplay} />
        </ComponentPreview>
      </DocSection>

      <DocSection title="Long Example">
        <p className="text-[13px] text-muted-foreground mb-3">
          A 6-step research agent with sources, descriptions, and sequential animation.
        </p>
        <ComponentPreview code={longCode} onReplay={() => longReplay.current?.()}>
          <LongDemo replayRef={longReplay} />
        </ComponentPreview>
      </DocSection>

      <DocSection title="API Reference">
        <h3 className="text-[14px] font-semibold text-foreground mb-2 mt-4">ThinkingSteps</h3>
        <PropsTable props={rootProps} />

        <h3 className="text-[14px] font-semibold text-foreground mb-2 mt-6">ThinkingStepsHeader</h3>
        <PropsTable props={headerProps} />

        <h3 className="text-[14px] font-semibold text-foreground mb-2 mt-6">ThinkingStep</h3>
        <PropsTable props={stepProps} />

        <h3 className="text-[14px] font-semibold text-foreground mb-2 mt-6">ThinkingStepSource</h3>
        <PropsTable props={sourceProps} />

        <h3 className="text-[14px] font-semibold text-foreground mb-2 mt-6">ThinkingStepImage</h3>
        <PropsTable props={imageProps} />
      </DocSection>
    </DocPage>
  );
}
