"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  ThinkingSteps,
  ThinkingStepsHeader,
  ThinkingStepsContent,
  ThinkingStep,
  ThinkingStepDetails,
  ThinkingStepSources,
  ThinkingStepSource,
  ThinkingStepImage,
  type StepStatus,
} from "@/registry/default/thinking-steps";
import { ComponentPreview } from "@/lib/docs/ComponentPreview";
import { PropsTable, type PropDef } from "@/lib/docs/PropsTable";
import { DocPage, DocSection } from "@/lib/docs/DocPage";
import { useIcon } from "@/registry/default/lib/icon-context";

// ─── Code Snippets ──────────────────────────────────────────────────────────

const basicCode = `import {
  ThinkingSteps, ThinkingStepsHeader, ThinkingStepsContent,
  ThinkingStep, ThinkingStepDetails, ThinkingStepSources, ThinkingStepSource,
} from "./components";

<ThinkingSteps>
  <ThinkingStepsHeader />
  <ThinkingStepsContent>
    <ThinkingStep index={0} icon="search" label="Searched the web" />
    <ThinkingStep index={1} icon="globe" label="Read 3 sources">
      <ThinkingStepDetails
        summary="Explored 6 files"
        details={[
          "Read accordion.tsx",
          "Read icon-map.tsx",
          "Read badge.tsx",
          "Read use-proximity-hover.ts",
          "Read components.ts",
          "Read postbuild-registry.mjs",
        ]}
      />
    </ThinkingStep>
    <ThinkingStep index={2} icon="check" label="Done" isLast />
  </ThinkingStepsContent>
</ThinkingSteps>`;

const minimalCode = `// Two dots — the simplest possible usage.
<ThinkingSteps>
  <ThinkingStepsHeader />
  <ThinkingStepsContent>
    <ThinkingStep index={0} showIcon={false} label="Ran a command" />
    <ThinkingStep index={1} showIcon={false} label="Done" isLast />
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
    setTimeout(() => setVisibleSteps(TOTAL + 1), 5200),
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

const streamingTextCode = `// Dot mode with long descriptions — text-only, no sources or details.
<ThinkingSteps open={open} onOpenChange={setOpen}>
  <ThinkingStepsHeader />
  <ThinkingStepsContent>
    <ThinkingStep index={0} showIcon={false}
      label="Loading dataset"
      description="Establishing a connection to the data warehouse and streaming
        2.4 million rows across 47 columns into a memory-mapped buffer.
        The source table spans three partitions dated from January
        through March, each containing roughly 800K records with nested
        JSON fields that need to be flattened before downstream
        processing can begin."
      status={getStatus(0)} />
    <ThinkingStep index={1} showIcon={false}
      label="Validating schema"
      description="Running a full schema validation pass against the canonical
        type definitions. Checking that all 47 columns match their
        expected types, verifying nullability constraints on the 12
        required fields, confirming foreign key references resolve
        correctly against the dimension tables, and flagging any new
        columns that appeared since the last successful run."
      status={getStatus(1)} />
    <ThinkingStep index={2} showIcon={false}
      label="Transforming records"
      description="Applying the full normalization pipeline: flattening nested
        address objects into discrete columns, deduplicating records
        that share the same composite key across partitions, converting
        all timestamps from mixed UTC and local offsets into canonical
        ISO 8601 format, and running the currency conversion step for
        the 14 non-USD transaction currencies."
      status={getStatus(2)} />
    <ThinkingStep index={3} showIcon={false}
      label="Running quality checks"
      description="Executing 23 data quality assertions: verifying output row
        counts fall within the expected 2% tolerance, checking revenue
        distribution skew against the trailing 30-day average,
        confirming referential integrity against all five dimension
        tables, and ensuring no single partition exceeds 40% of total
        volume."
      status={getStatus(3)} />
    <ThinkingStep index={4} showIcon={false}
      label="Writing output"
      description="Compressing the validated dataset into 847 Snappy-encoded
        Parquet files partitioned by region and date, uploading each
        file to the staging bucket with server-side encryption,
        registering partition metadata in the Hive metastore, and
        triggering the downstream Airflow DAG for incremental merges
        into the production fact table."
      status={getStatus(4)} />
    <ThinkingStep index={5} showIcon={false}
      label="Pipeline complete"
      status={getStatus(5)} isLast />
  </ThinkingStepsContent>
</ThinkingSteps>`;

const withImagesCode = `// Steps with inline images using ThinkingStepImage.
<ThinkingSteps open={open} onOpenChange={setOpen}>
  <ThinkingStepsHeader>Vision Agent</ThinkingStepsHeader>
  <ThinkingStepsContent>
    <ThinkingStep index={0} icon="search"
      label="Searching for reference"
      status={getStatus(0)} isLast={visibleSteps <= 1} />
    <ThinkingStep index={1} icon="image"
      label="Found screenshot"
      status={getStatus(1)} isLast={visibleSteps <= 2}>
      <ThinkingStepImage src="/og.png" caption="Homepage screenshot" />
    </ThinkingStep>
    <ThinkingStep index={2} icon="brain"
      label="Analyzing layout"
      description="Inspecting spacing, typography scale, and color usage."
      status={getStatus(2)} isLast={visibleSteps <= 3} />
    <ThinkingStep index={3} icon="check"
      label="Analysis complete"
      status={getStatus(3)} isLast />
  </ThinkingStepsContent>
</ThinkingSteps>`;

const fullCode = `// Kitchen sink: sources, details, descriptions, images, custom header.
<ThinkingSteps open={open} onOpenChange={setOpen}>
  <ThinkingStepsHeader>Research Agent</ThinkingStepsHeader>
  <ThinkingStepsContent>
    <ThinkingStep index={0} icon="search" label="Searching profiles"
      status={getStatus(0)} isLast={visibleSteps <= 1}>
      <ThinkingStepSources>
        <ThinkingStepSource>x.com</ThinkingStepSource>
        <ThinkingStepSource>instagram.com</ThinkingStepSource>
        <ThinkingStepSource>github.com</ThinkingStepSource>
      </ThinkingStepSources>
    </ThinkingStep>
    <ThinkingStep index={1} icon="image" label="Found profile photo"
      description="micka.design profile from x.com"
      status={getStatus(1)} isLast={visibleSteps <= 2}>
      <ThinkingStepImage src="/og.png" caption="Profile card" />
    </ThinkingStep>
    <ThinkingStep index={2} icon="globe" label="Reading portfolio"
      status={getStatus(2)} isLast={visibleSteps <= 3}>
      <ThinkingStepDetails
        summary="Explored 4 pages"
        details={[
          "Read about.html",
          "Read projects.html",
          "Read resume.pdf",
          "Read contact.html",
        ]}
      />
    </ThinkingStep>
    <ThinkingStep index={3} icon="search" label="Searching recent work"
      status={getStatus(3)} isLast={visibleSteps <= 4}>
      <ThinkingStepSources>
        <ThinkingStepSource>figma.com</ThinkingStepSource>
        <ThinkingStepSource>behance.net</ThinkingStepSource>
        <ThinkingStepSource>google.com</ThinkingStepSource>
      </ThinkingStepSources>
    </ThinkingStep>
    <ThinkingStep index={4} icon="brain" label="Analyzing results"
      description="Compiling findings into a summary."
      status={getStatus(4)} isLast={visibleSteps <= 5} />
    <ThinkingStep index={5} icon="check" label="Research complete"
      status={getStatus(5)} isLast />
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

const detailsProps: PropDef[] = [
  { name: "summary", type: "string", description: "Collapsed label text (e.g. \"Explored 6 files\")." },
  { name: "details", type: "string[]", description: "Shorthand list of detail lines rendered automatically." },
  { name: "defaultOpen", type: "boolean", default: "false", description: "Whether the nested accordion starts expanded." },
  { name: "children", type: "ReactNode", description: "Custom content inside the expanded area." },
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

// ─── Sequenced timer hook with pause/resume ─────────────────────────────────

/**
 * Fires callbacks at scheduled times, with pause/resume support.
 * `delays` is an array of absolute ms from start (e.g. [400, 1800, 3200]).
 * Returns the current "step" index (how many have fired).
 */
function useSequencedSteps(
  delays: number[],
  playing: boolean,
  onFinished?: () => void,
) {
  const [fired, setFired] = useState(0);
  const elapsedRef = useRef(0); // total elapsed ms when paused
  const startRef = useRef(0);   // Date.now() when last resumed
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  const total = delays.length;

  // Detect completion in a separate effect to avoid setState-during-render
  useEffect(() => {
    if (fired >= total && total > 0) {
      onFinished?.();
    }
  }, [fired, total, onFinished]);

  // Schedule next unfired step
  useEffect(() => {
    if (!playing || fired >= total) return;

    const now = Date.now();
    startRef.current = now;
    const target = delays[fired];
    const wait = Math.max(0, target - elapsedRef.current);

    timerRef.current = setTimeout(() => {
      elapsedRef.current = target;
      setFired((f) => f + 1);
    }, wait);

    return () => {
      // On pause or unmount: accumulate elapsed time
      clearTimeout(timerRef.current);
      elapsedRef.current += Date.now() - startRef.current;
    };
  }, [playing, fired, delays, total, onFinished]);

  // Reset function
  const reset = useCallback(() => {
    clearTimeout(timerRef.current);
    elapsedRef.current = 0;
    setFired(0);
  }, []);

  return { fired, reset };
}

// ─── Interactive Demos ──────────────────────────────────────────────────────

interface DemoProps {
  playing: boolean;
  onFinished: () => void;
  onResetRef: React.MutableRefObject<(() => void) | null>;
}

function StreamingDemo({ playing, onFinished, onResetRef }: DemoProps) {
  const TOTAL = 5; // 4 steps + 1 completion marker
  const delays = [400, 1800, 3200, 4200, 5200];
  const { fired, reset } = useSequencedSteps(delays, playing, onFinished);
  const [open, setOpen] = useState(true);
  const [key, setKey] = useState(0);

  useEffect(() => {
    onResetRef.current = () => {
      reset();
      setOpen(true);
      setKey((k) => k + 1);
    };
  }, [reset, onResetRef]);

  const visibleSteps = fired;
  const allComplete = fired >= TOTAL;

  const getStatus = (i: number): StepStatus => {
    if (allComplete) return "complete";
    return i < fired - 1 ? "complete" : i === fired - 1 ? "active" : "pending";
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
          {fired > 1 && (
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

const STREAMING_TEXT_DESCRIPTIONS = [
  "Establishing a connection to the data warehouse and streaming 2.4 million rows across 47 columns into a memory-mapped buffer. The source table spans three partitions dated from January through March, each containing roughly 800K records with nested JSON fields that need to be flattened before downstream processing can begin.",
  "Running a full schema validation pass against the canonical type definitions. Checking that all 47 columns match their expected types, verifying nullability constraints on the 12 required fields, confirming foreign key references resolve correctly against the dimension tables, and flagging any new columns that appeared since the last successful run on March 15th.",
  "Applying the full normalization pipeline: flattening nested address objects into discrete columns, deduplicating records that share the same composite key across partitions, converting all timestamps from mixed UTC and local offsets into a canonical ISO 8601 format, and running the currency conversion step for the 14 non-USD transaction currencies using the daily exchange rate snapshot.",
  "Executing 23 data quality assertions: verifying that output row counts fall within the expected 2% tolerance of the source, checking that the revenue distribution skew hasn't shifted beyond 1.5 standard deviations from the trailing 30-day average, confirming referential integrity against all five dimension tables, and ensuring that no single partition exceeds 40% of total volume which would indicate an upstream ingestion anomaly.",
  "Compressing the validated dataset into 847 Snappy-encoded Parquet files partitioned by region and date, uploading each file to the staging bucket with server-side encryption enabled, registering the new partition metadata in the Hive metastore, and triggering the downstream Airflow DAG that handles incremental merges into the production fact table.",
];

function useStreamingText(text: string, active: boolean, charsPerTick = 3, tickMs = 16) {
  const [count, setCount] = useState(0);
  const len = text.length;

  useEffect(() => {
    if (!active) {
      setCount(0);
      return;
    }
    if (count >= len) return;
    const id = setTimeout(() => setCount((c) => Math.min(c + charsPerTick, len)), tickMs);
    return () => clearTimeout(id);
  }, [active, count, len, charsPerTick, tickMs]);

  if (!active && count > 0) return text;
  if (!active) return text;
  return text.slice(0, count);
}

function StreamingDescription({ text, active, done }: { text: string; active: boolean; done: boolean }) {
  const displayed = useStreamingText(text, active);
  const show = done ? text : displayed;
  if (!show) return null;
  return (
    <span className="text-[13px] text-muted-foreground leading-snug">
      {show}
    </span>
  );
}

function StreamingTextDemo({ playing, onFinished, onResetRef }: DemoProps) {
  const TOTAL = 7; // 6 step appearances + 1 completion
  const delays = [400, 6000, 12000, 18000, 24000, 30000, 32000];
  const { fired, reset } = useSequencedSteps(delays, playing, onFinished);
  const [open, setOpen] = useState(true);
  const [key, setKey] = useState(0);

  onResetRef.current = () => {
    reset();
    setOpen(true);
    setKey((k) => k + 1);
  };

  const visibleSteps = fired;
  const allComplete = fired >= TOTAL;

  const getStatus = (i: number): StepStatus => {
    if (allComplete) return "complete";
    return i < fired - 1 ? "complete" : i === fired - 1 ? "active" : "pending";
  };

  const labels = ["Loading dataset", "Validating schema", "Transforming records", "Running quality checks", "Writing output"];

  return (
    <ThinkingSteps key={key} open={open} onOpenChange={setOpen} className="w-full px-8">
      <ThinkingStepsHeader />
      <ThinkingStepsContent>
        {labels.map((label, i) => (
          <ThinkingStep key={i} index={i} showIcon={false} label={label} status={getStatus(i)} isLast={visibleSteps <= i + 1}>
            <StreamingDescription
              text={STREAMING_TEXT_DESCRIPTIONS[i]}
              active={getStatus(i) === "active"}
              done={getStatus(i) === "complete"}
            />
          </ThinkingStep>
        ))}
        <ThinkingStep index={5} showIcon={false} label="Pipeline complete" status={getStatus(5)} isLast />
      </ThinkingStepsContent>
    </ThinkingSteps>
  );
}

function WithImagesDemo({ playing, onFinished, onResetRef }: DemoProps) {
  const TOTAL = 5;
  const delays = [400, 1800, 3400, 5000, 6000];
  const { fired, reset } = useSequencedSteps(delays, playing, onFinished);
  const [open, setOpen] = useState(true);
  const [key, setKey] = useState(0);

  onResetRef.current = () => {
    reset();
    setOpen(true);
    setKey((k) => k + 1);
  };

  const visibleSteps = fired;
  const allComplete = fired >= TOTAL;

  const getStatus = (i: number): StepStatus => {
    if (allComplete) return "complete";
    return i < fired - 1 ? "complete" : i === fired - 1 ? "active" : "pending";
  };

  return (
    <ThinkingSteps key={key} open={open} onOpenChange={setOpen}>
      <ThinkingStepsHeader>Vision Agent</ThinkingStepsHeader>
      <ThinkingStepsContent>
        <ThinkingStep
          index={0}
          icon="search"
          label="Searching for reference"
          status={getStatus(0)}
          isLast={visibleSteps <= 1}
        />
        <ThinkingStep
          index={1}
          icon="image"
          label="Found screenshot"
          status={getStatus(1)}
          isLast={visibleSteps <= 2}
        >
          {fired > 2 && (
            <ThinkingStepImage src="/og.png" caption="Homepage screenshot" />
          )}
        </ThinkingStep>
        <ThinkingStep
          index={2}
          icon="brain"
          label="Analyzing layout"
          description="Inspecting spacing, typography scale, and color usage."
          status={getStatus(2)}
          isLast={visibleSteps <= 3}
        />
        <ThinkingStep
          index={3}
          icon="check"
          label="Analysis complete"
          status={getStatus(3)}
          isLast
        />
      </ThinkingStepsContent>
    </ThinkingSteps>
  );
}

function FullDemo({ playing, onFinished, onResetRef }: DemoProps) {
  const TOTAL = 7;
  const delays = [400, 1600, 2800, 3800, 5000, 6200, 7200];
  const { fired, reset } = useSequencedSteps(delays, playing, onFinished);
  const [open, setOpen] = useState(true);
  const [key, setKey] = useState(0);

  onResetRef.current = () => {
    reset();
    setOpen(true);
    setKey((k) => k + 1);
  };

  const visibleSteps = fired;
  const allComplete = fired >= TOTAL;

  const getStatus = (i: number): StepStatus => {
    if (allComplete) return "complete";
    return i < fired - 1 ? "complete" : i === fired - 1 ? "active" : "pending";
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
          {fired > 1 && (
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
        >
          {fired > 2 && (
            <ThinkingStepImage src="/og.png" caption="Profile card" />
          )}
        </ThinkingStep>
        <ThinkingStep
          index={2}
          icon="globe"
          label="Reading portfolio"
          status={getStatus(2)}
          isLast={visibleSteps <= 3}
        >
          {fired > 3 && (
            <ThinkingStepDetails
              summary="Explored 4 pages"
              details={[
                "Read about.html",
                "Read projects.html",
                "Read resume.pdf",
                "Read contact.html",
              ]}
            />
          )}
        </ThinkingStep>
        <ThinkingStep
          index={3}
          icon="search"
          label="Searching for recent work"
          status={getStatus(3)}
          isLast={visibleSteps <= 4}
        >
          {fired > 4 && (
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

// ─── Animated preview wrapper ───────────────────────────────────────────────

type PlaybackState = "playing" | "paused" | "finished";

function AnimatedPreview({
  code,
  children,
}: {
  code: string;
  children: (props: DemoProps) => ReactNode;
}) {
  const [playback, setPlayback] = useState<PlaybackState>("paused");
  const wrapperRef = useRef<HTMLDivElement>(null);
  const manualPauseRef = useRef(false);
  const resetRef = useRef<(() => void) | null>(null);

  // IntersectionObserver for viewport-driven playback
  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.intersectionRatio >= 0.5) {
          if (!manualPauseRef.current) {
            setPlayback((prev) => (prev === "finished" ? "finished" : "playing"));
          }
        } else if (entry.intersectionRatio < 0.1) {
          manualPauseRef.current = false;
          setPlayback((prev) => (prev === "finished" ? "finished" : "paused"));
        }
      },
      { threshold: [0.1, 0.5] }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const handleFinished = useCallback(() => {
    setPlayback("finished");
  }, []);

  const handleButtonClick = useCallback(() => {
    setPlayback((prev) => {
      if (prev === "playing") {
        manualPauseRef.current = true;
        return "paused";
      }
      if (prev === "paused") {
        manualPauseRef.current = false;
        return "playing";
      }
      // finished → replay
      manualPauseRef.current = false;
      resetRef.current?.();
      return "playing";
    });
  }, []);

  const playing = playback === "playing";

  // Resolve icons via the icon system so they follow the selected library
  const PauseIcon = useIcon("pause");
  const PlayIcon = useIcon("play");
  const RotateIcon = useIcon("rotate-ccw");

  // Button icon/tooltip based on state
  let buttonIcon: ReactNode;
  let buttonTooltip: string;
  if (playback === "playing") {
    buttonIcon = <PauseIcon size={16} strokeWidth={1.5} />;
    buttonTooltip = "Pause";
  } else if (playback === "paused") {
    buttonIcon = <PlayIcon size={16} strokeWidth={1.5} />;
    buttonTooltip = "Play";
  } else {
    buttonIcon = <RotateIcon size={16} strokeWidth={1.5} />;
    buttonTooltip = "Replay";
  }

  return (
    <div ref={wrapperRef}>
      <ComponentPreview
        code={code}
        playbackButton={{
          icon: buttonIcon,
          tooltip: buttonTooltip,
          onClick: handleButtonClick,
        }}
      >
        {children({ playing, onFinished: handleFinished, onResetRef: resetRef })}
      </ComponentPreview>
    </div>
  );
}

// ─── Page ───────────────────────────────────────────────────────────────────

export default function ThinkingStepsDoc() {
  return (
    <DocPage
      title="ThinkingSteps"
      slug="thinking-steps"
      description="Chain-of-thought reasoning display with collapsible steps, sequential animation, source badges, and image support."
    >
      {/* 1. Basic — static, icons, details */}
      <DocSection title="Basic">
        <ComponentPreview code={basicCode}>
          <ThinkingSteps>
            <ThinkingStepsHeader />
            <ThinkingStepsContent>
              <ThinkingStep index={0} icon="search" label="Searched the web" />
              <ThinkingStep index={1} icon="globe" label="Read 3 sources">
                <ThinkingStepDetails
                  summary="Explored 6 files"
                  details={[
                    "Read accordion.tsx",
                    "Read icon-map.tsx",
                    "Read badge.tsx",
                    "Read use-proximity-hover.ts",
                    "Read components.ts",
                    "Read postbuild-registry.mjs",
                  ]}
                />
              </ThinkingStep>
              <ThinkingStep index={2} icon="check" label="Done" isLast />
            </ThinkingStepsContent>
          </ThinkingSteps>
        </ComponentPreview>
      </DocSection>

      {/* 2. Minimal — two dots, nothing else */}
      <DocSection title="Minimal">
        <p className="text-[13px] text-muted-foreground mb-3">
          The simplest usage — two dots with no children or extras.
        </p>
        <ComponentPreview code={minimalCode}>
          <ThinkingSteps>
            <ThinkingStepsHeader />
            <ThinkingStepsContent>
              <ThinkingStep index={0} showIcon={false} label="Ran a command" />
              <ThinkingStep index={1} showIcon={false} label="Done" isLast />
            </ThinkingStepsContent>
          </ThinkingSteps>
        </ComponentPreview>
      </DocSection>

      {/* 3. Streaming — icons, sources, sequential animation */}
      <DocSection title="Streaming">
        <p className="text-[13px] text-muted-foreground mb-3">
          Steps appear sequentially as they stream in. Active steps show a shimmer effect.
        </p>
        <AnimatedPreview code={streamingCode}>
          {(props) => <StreamingDemo {...props} />}
        </AnimatedPreview>
      </DocSection>

      {/* 4. Streaming Text — dots, long streaming descriptions */}
      <DocSection title="Streaming Text">
        <p className="text-[13px] text-muted-foreground mb-3">
          Dots with long descriptions that stream in character by character, simulating LLM output.
        </p>
        <AnimatedPreview code={streamingTextCode}>
          {(props) => <StreamingTextDemo {...props} />}
        </AnimatedPreview>
      </DocSection>

      {/* 5. With Images — ThinkingStepImage in action */}
      <DocSection title="With Images">
        <p className="text-[13px] text-muted-foreground mb-3">
          Steps can include inline images with optional captions using ThinkingStepImage.
        </p>
        <AnimatedPreview code={withImagesCode}>
          {(props) => <WithImagesDemo {...props} />}
        </AnimatedPreview>
      </DocSection>

      {/* 6. Full Example — kitchen sink */}
      <DocSection title="Full Example">
        <p className="text-[13px] text-muted-foreground mb-3">
          A 6-step research agent combining sources, details, descriptions, images, and a custom header.
        </p>
        <AnimatedPreview code={fullCode}>
          {(props) => <FullDemo {...props} />}
        </AnimatedPreview>
      </DocSection>

      <DocSection title="API Reference">
        <h3 className="text-[14px] font-semibold text-foreground mb-2 mt-4">ThinkingSteps</h3>
        <PropsTable props={rootProps} />

        <h3 className="text-[14px] font-semibold text-foreground mb-2 mt-6">ThinkingStepsHeader</h3>
        <PropsTable props={headerProps} />

        <h3 className="text-[14px] font-semibold text-foreground mb-2 mt-6">ThinkingStep</h3>
        <PropsTable props={stepProps} />

        <h3 className="text-[14px] font-semibold text-foreground mb-2 mt-6">ThinkingStepDetails</h3>
        <PropsTable props={detailsProps} />

        <h3 className="text-[14px] font-semibold text-foreground mb-2 mt-6">ThinkingStepSource</h3>
        <PropsTable props={sourceProps} />

        <h3 className="text-[14px] font-semibold text-foreground mb-2 mt-6">ThinkingStepImage</h3>
        <PropsTable props={imageProps} />
      </DocSection>
    </DocPage>
  );
}
