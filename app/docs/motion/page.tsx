"use client";

import { useState, type ReactNode } from "react";
import { motion } from "framer-motion";
import { DocPage, DocSection } from "@/lib/docs/DocPage";
import { ComponentPreview } from "@/lib/docs/ComponentPreview";
import { PropsTable, type PropDef } from "@/lib/docs/PropsTable";
import { springs } from "@/registry/default/lib/springs";
import { fontWeights } from "@/registry/default/lib/font-weight";
import { Button } from "@/registry/radix/button";
import { Tooltip } from "@/registry/radix/tooltip";
import { Tabs, TabsList, TabItem, TabPanel } from "@/registry/radix/tabs";
import { Dropdown } from "@/registry/default/dropdown";
import { MenuItem } from "@/registry/default/menu-item";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "@/registry/radix/dialog";
import { cn } from "@/registry/default/lib/utils";

// ---------------------------------------------------------------------------
// Code snippets (shown in the Code tab of each ComponentPreview)
// ---------------------------------------------------------------------------

const SPRING_TOKENS_CODE = `import { motion } from "framer-motion";
import { springs } from "@/lib/springs";

// fast     — 0.08s, bounce 0.    Hover, fades, micro-interactions.
// moderate — 0.16s, bounce 0.08. Dropdowns, tooltips, short travel.
// slow     — 0.24s, bounce 0.12. Dialogs, drawers, large surfaces.

<motion.div layout transition={springs.fast} />
<motion.div layout transition={springs.moderate} />
<motion.div layout transition={springs.slow} />`;

const SPEED_EXAMPLES_CODE = `import { Tabs, TabsList, TabItem, TabPanel } from "./components";

// The tabs themselves are the selector. Each panel holds a real
// component, and the spring is baked into that component.

<Tabs defaultValue="fast">
  <TabsList>
    <TabItem value="fast" label="fast" />
    <TabItem value="moderate" label="moderate" />
    <TabItem value="slow" label="slow" />
  </TabsList>

  {/* fast — tooltip enters on springs.fast (0.08s), leaves in 0.10s */}
  <TabPanel value="fast">
    <Tooltip content="Saved to your library"><Button>Hover me</Button></Tooltip>
  </TabPanel>

  {/* moderate — selection highlight slides on springs.moderate (0.16s),
      clears in 0.12s */}
  <TabPanel value="moderate">
    <Dropdown checkedIndex={selected}>{/* MenuItems */}</Dropdown>
  </TabPanel>

  {/* slow — dialog scales in on springs.slow (0.24s),
      dismisses on springs.moderate (0.16s) */}
  <TabPanel value="slow">
    <Dialog>{/* DialogTrigger + DialogContent */}</Dialog>
  </TabPanel>
</Tabs>`;

const WEIGHT_CODE = `import { fontWeights } from "@/lib/font-weight";

<span className="inline-grid">
  {/* Ghost: reserves width at the heaviest weight, hidden from AT */}
  <span
    className="col-start-1 row-start-1 invisible"
    style={{ fontVariationSettings: fontWeights.semibold }}
    aria-hidden="true"
  >
    {label}
  </span>
  {/* Visible: animates between weights in the same cell */}
  <span
    className="col-start-1 row-start-1 transition-[color,font-variation-settings] duration-80"
    style={{
      fontVariationSettings: isSelected
        ? fontWeights.semibold
        : fontWeights.normal,
    }}
  >
    {label}
  </span>
</span>`;

// ---------------------------------------------------------------------------
// Reference tables
// ---------------------------------------------------------------------------

const springTokens: PropDef[] = [
  {
    name: "springs.fast",
    type: "{ duration: 0.08, bounce: 0 }",
    description:
      "Micro-interactions: hover backgrounds, focus rings, fades, selection indicators.",
  },
  {
    name: "springs.moderate",
    type: "{ duration: 0.16, bounce: 0.08 }",
    description:
      "Small expansion and short travel: dropdowns, tooltips, toasts, sliding tab indicators.",
  },
  {
    name: "springs.slow",
    type: "{ duration: 0.24, bounce: 0.12 }",
    description:
      "Large surfaces and important notifications: dialogs, drawers, side panels.",
  },
];

const weightTokens: PropDef[] = [
  {
    name: "fontWeights.normal",
    type: "\"'wght' 400, 'opsz' 14\"",
    description: "Resting weight for body and label text.",
  },
  {
    name: "fontWeights.medium",
    type: "\"'wght' 450, 'opsz' 15\"",
    description:
      "Resting weight when a component's default text is already medium (smaller jump to semibold).",
  },
  {
    name: "fontWeights.semibold",
    type: "\"'wght' 550, 'opsz' 20\"",
    description:
      "Active weight for selected, checked, and open states; also section headings.",
  },
  {
    name: "fontWeights.bold",
    type: "\"'wght' 700, 'opsz' 25\"",
    description: "Page titles. Not used in state transitions.",
  },
];

// ---------------------------------------------------------------------------
// Spring tokens demo
// ---------------------------------------------------------------------------

const SPRING_TIERS = [
  {
    key: "fast",
    token: springs.fast,
    meta: "0.08s · bounce 0",
    usage: "hover, fades",
  },
  {
    key: "moderate",
    token: springs.moderate,
    meta: "0.16s · bounce 0.08",
    usage: "dropdowns, tooltips",
  },
  {
    key: "slow",
    token: springs.slow,
    meta: "0.24s · bounce 0.12",
    usage: "dialogs, drawers",
  },
] as const;

function SpringTokensDemo() {
  const [atEnd, setAtEnd] = useState(false);

  return (
    <ComponentPreview
      code={SPRING_TOKENS_CODE}
      onReplay={() => setAtEnd((v) => !v)}
    >
      <div className="flex w-full max-w-md flex-col gap-5">
        {SPRING_TIERS.map(({ key, token, meta, usage }) => (
          <div key={key} className="flex flex-col gap-1.5">
            <div className="flex items-baseline gap-2 text-[13px]">
              <span
                className="text-foreground"
                style={{ fontVariationSettings: fontWeights.semibold }}
              >
                {key}
              </span>
              <span className="font-mono text-[11px] text-muted-foreground/70">
                {meta}
              </span>
              <span className="ml-auto hidden text-[12px] text-muted-foreground sm:inline">
                {usage}
              </span>
            </div>
            <button
              onClick={() => setAtEnd((v) => !v)}
              aria-label={`Run the ${key} spring`}
              className={cn(
                "flex h-10 w-full cursor-pointer items-center rounded-full bg-muted px-1 outline-none focus-visible:ring-1 focus-visible:ring-[#6B97FF]",
                atEnd ? "justify-end" : "justify-start"
              )}
            >
              <motion.div
                layout
                transition={token}
                className="h-8 w-8 rounded-full bg-foreground"
              />
            </button>
          </div>
        ))}
        <p className="text-center text-[12px] text-muted-foreground/70">
          Click a track (or replay) to fire all three springs.
        </p>
      </div>
    </ComponentPreview>
  );
}

// ---------------------------------------------------------------------------
// Speed examples — three real components, one per spring tier
// ---------------------------------------------------------------------------

function TooltipExample() {
  return (
    <Tooltip content="Saved to your library" side="top">
      <Button variant="secondary" size="sm">
        Hover me
      </Button>
    </Tooltip>
  );
}

function DropdownExample() {
  const [selected, setSelected] = useState(0);
  const items = ["Library", "Recents", "Favorites", "Private"];
  return (
    <Dropdown checkedIndex={selected ?? undefined} className="w-56">
      {items.map((label, i) => (
        <MenuItem
          key={label}
          index={i}
          label={label}
          checked={selected === i}
          onSelect={() => setSelected(i)}
        />
      ))}
    </Dropdown>
  );
}

function DialogExample() {
  // The dialog is scoped to this stage (relative + overflow-hidden) and runs
  // non-modal, so opening it dims only the preview — not the page or sidebars.
  const [stage, setStage] = useState<HTMLDivElement | null>(null);
  return (
    <div
      ref={setStage}
      className="relative flex min-h-[220px] w-[320px] max-w-full items-center justify-center overflow-hidden rounded-xl border border-border bg-background"
    >
      <Dialog modal={false}>
        <DialogTrigger asChild>
          <Button variant="secondary" size="sm">
            Open dialog
          </Button>
        </DialogTrigger>
        <DialogContent container={stage} size="sm">
          <DialogHeader>
            <DialogTitle>Create teamspace</DialogTitle>
            <DialogDescription>
              Teamspaces group related projects and the people working on them.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="secondary" size="sm">
                Cancel
              </Button>
            </DialogClose>
            <DialogClose asChild>
              <Button size="sm">Create</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/** A live example plus the exact enter/exit durations of the spring it uses. */
function ExampleStage({
  enter,
  exit,
  what,
  children,
}: {
  enter: string;
  exit: string;
  what: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-4 pt-6">
      <div className="flex min-h-[84px] items-center justify-center">
        {children}
      </div>
      {/* Exact entry/exit duration, inline below the example */}
      <div className="flex flex-col items-center gap-1">
        <div className="flex items-center gap-2 font-mono text-[12px]">
          <span className="text-foreground">Enter {enter}</span>
          <span className="text-muted-foreground/40">·</span>
          <span className="text-foreground">Exit {exit}</span>
        </div>
        <p className="text-[11px] text-muted-foreground/70">{what}</p>
      </div>
    </div>
  );
}

function SpeedExamplesDemo() {
  return (
    <ComponentPreview code={SPEED_EXAMPLES_CODE} minHeightClass="min-h-[260px]">
      <div className="flex w-full max-w-md flex-col items-center">
        {/* items-center keeps the tab bar centered; w-full panels stop the bar
            from shifting when the panel content width changes between tabs. */}
        <Tabs defaultValue="fast" className="flex w-full flex-col items-center">
          <TabsList>
            <TabItem value="fast" label="fast" />
            <TabItem value="moderate" label="moderate" />
            <TabItem value="slow" label="slow" />
          </TabsList>

          <TabPanel value="fast" className="w-full">
            <ExampleStage
              enter="0.08s"
              exit="0.10s"
              what="The tooltip itself · springs.fast"
            >
              <TooltipExample />
            </ExampleStage>
          </TabPanel>

          <TabPanel value="moderate" className="w-full">
            <ExampleStage
              enter="0.16s"
              exit="0.12s"
              what="The selection highlight · springs.moderate"
            >
              <DropdownExample />
            </ExampleStage>
          </TabPanel>

          <TabPanel value="slow" className="w-full">
            <ExampleStage
              enter="0.24s"
              exit="0.16s"
              what="The dialog and its backdrop · springs.slow → moderate"
            >
              <DialogExample />
            </ExampleStage>
          </TabPanel>
        </Tabs>
      </div>
    </ComponentPreview>
  );
}

// ---------------------------------------------------------------------------
// High-level map of which components lead with which spring
// ---------------------------------------------------------------------------

const SPEED_USAGE = [
  {
    key: "fast",
    duration: "0.08s",
    components: [
      "Hover & focus rings",
      "Checkbox",
      "Radio",
      "Table rows",
      "Tooltip",
      "Input copy",
      "Select / Color picker open",
    ],
  },
  {
    key: "moderate",
    duration: "0.16s",
    components: [
      "Dropdown / Select highlight",
      "Tabs indicator",
      "Switch thumb",
      "Accordion",
      "Chat & message bubbles",
      "Mobile drawer",
    ],
  },
  {
    key: "slow",
    duration: "0.24s",
    components: ["Dialog", "Ask-user questions", "Thinking steps"],
  },
] as const;

function SpeedUsageList() {
  return (
    <div className="flex flex-col">
      {SPEED_USAGE.map((tier, i) => (
        <div
          key={tier.key}
          className={cn(
            "grid grid-cols-[84px_1fr] items-baseline gap-4 py-3",
            i > 0 && "border-t border-border"
          )}
        >
          <div className="flex flex-col">
            <span
              className="text-[13px] text-foreground"
              style={{ fontVariationSettings: fontWeights.semibold }}
            >
              {tier.key}
            </span>
            <span className="font-mono text-[11px] text-muted-foreground/70">
              {tier.duration}
            </span>
          </div>
          <p className="text-[13px] leading-relaxed text-muted-foreground">
            {tier.components.join(" · ")}
          </p>
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Animated font weight demo
// ---------------------------------------------------------------------------

function WeightDemo() {
  const [active, setActive] = useState(false);
  const toggle = () => setActive((v) => !v);

  const cellClass =
    "flex flex-col gap-3 rounded-xl border border-border bg-card p-4 text-left cursor-pointer outline-none focus-visible:ring-1 focus-visible:ring-[#6B97FF]";
  const labelClass = "flex items-center gap-2 text-[12px] text-muted-foreground";

  return (
    <ComponentPreview code={WEIGHT_CODE} onReplay={toggle}>
      <div className="flex w-full max-w-xl flex-col gap-4">
        <div className="grid gap-4 sm:grid-cols-2">
          {/* Naive: weight animates on a bare text node, trailing text shifts */}
          <button onClick={toggle} className={cellClass}>
            <span className={labelClass}>
              <span aria-hidden="true">❌</span> Native — neighbors shift
            </span>
            <span className="text-[13px] text-foreground">
              Open{" "}
              <span
                className="transition-[font-variation-settings] duration-80"
                style={{
                  fontVariationSettings: active ? "'wght' 550" : "'wght' 400",
                }}
              >
                Notifications
              </span>{" "}
              to see more.
            </span>
          </button>

          {/* System: ghost span reserves width, opsz compensates */}
          <button onClick={toggle} className={cellClass}>
            <span className={labelClass}>
              <span aria-hidden="true">✅</span> Treated — width reserved
            </span>
            <span className="text-[13px] text-foreground">
              Open{" "}
              <span className="inline-grid">
                <span
                  className="invisible col-start-1 row-start-1"
                  style={{ fontVariationSettings: fontWeights.semibold }}
                  aria-hidden="true"
                >
                  Notifications
                </span>
                <span
                  className="col-start-1 row-start-1 transition-[color,font-variation-settings] duration-80"
                  style={{
                    fontVariationSettings: active
                      ? fontWeights.semibold
                      : fontWeights.normal,
                  }}
                >
                  Notifications
                </span>
              </span>{" "}
              to see more.
            </span>
          </button>
        </div>
        <p className="text-center text-[12px] text-muted-foreground/70">
          Click either card to toggle the active state.
        </p>
      </div>
    </ComponentPreview>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function MotionDoc() {
  return (
    <DocPage
      title="Motion"
      slug="motion"
      installSlug="springs"
      description="Three spring speeds, exits that run a little quicker than entrances, and text that changes weight without nudging its neighbors. Every component follows the same handful of rules."
    >
      <DocSection title="Spring tokens">
        <p className="text-[13px] leading-relaxed text-muted-foreground">
          Every animation pulls one of three springs from{" "}
          <code className="mx-1 rounded bg-muted px-1 py-0.5 text-[12px]">
            lib/springs
          </code>
          . The bigger the thing that moves, the slower the spring: a hover state
          uses{" "}
          <code className="mx-1 rounded bg-muted px-1 py-0.5 text-[12px]">
            fast
          </code>
          , a dropdown uses{" "}
          <code className="mx-1 rounded bg-muted px-1 py-0.5 text-[12px]">
            moderate
          </code>
          , a dialog uses{" "}
          <code className="mx-1 rounded bg-muted px-1 py-0.5 text-[12px]">
            slow
          </code>
          . Nothing picks its own duration, so two unrelated parts of the screen
          still move at the same pace.
        </p>
        <SpringTokensDemo />
      </DocSection>

      <DocSection title="Exits are faster">
        <p className="text-[13px] leading-relaxed text-muted-foreground">
          Things arrive on their full spring and leave one tier quicker. Closing
          something is a decision you have already made, so dragging the entrance
          out in reverse just makes the interface feel like it is second-guessing
          you. A dialog comes in on{" "}
          <code className="mx-1 rounded bg-muted px-1 py-0.5 text-[12px]">
            slow
          </code>{" "}
          and leaves on{" "}
          <code className="mx-1 rounded bg-muted px-1 py-0.5 text-[12px]">
            moderate
          </code>
          ; a hover background is gone in about 60ms. Pick a speed to see it
          inside the component it belongs to.
        </p>
        <SpeedExamplesDemo />

        <h3
          className="mt-4 text-[15px] text-foreground"
          style={{ fontVariationSettings: fontWeights.semibold }}
        >
          Where each speed shows up
        </h3>
        <p className="text-[13px] leading-relaxed text-muted-foreground">
          A high-level map of which component leads with which spring. Most
          components also use{" "}
          <code className="mx-1 rounded bg-muted px-1 py-0.5 text-[12px]">
            fast
          </code>{" "}
          for their hover and focus states on top of this.
        </p>
        <SpeedUsageList />
      </DocSection>

      <DocSection title="Weight without reflow">
        <p className="text-[13px] leading-relaxed text-muted-foreground">
          Selected, checked, and open states bump the text heavier, and heavier
          text is wider. Animate that on a plain span and everything after it
          lurches sideways. Two things hold the line. An invisible copy of the
          label, set at the bold weight, reserves the space up front. And each
          weight token carries a slightly tighter optical size to cancel most of
          the width the extra weight would have added. The usual jump is normal
          to semibold, 400 to 550.
        </p>
        <WeightDemo />
      </DocSection>

      <DocSection title="Reference">
        <h3
          className="text-[15px] text-foreground"
          style={{ fontVariationSettings: fontWeights.semibold }}
        >
          Spring tokens
        </h3>
        <PropsTable props={springTokens} />

        <h3
          className="mt-6 text-[15px] text-foreground"
          style={{ fontVariationSettings: fontWeights.semibold }}
        >
          Weight tokens
        </h3>
        <p className="text-[13px] leading-relaxed text-muted-foreground">
          Pull weights from{" "}
          <code className="mx-1 rounded bg-muted px-1 py-0.5 text-[12px]">
            lib/font-weight
          </code>{" "}
          rather than writing a raw{" "}
          <code className="mx-1 rounded bg-muted px-1 py-0.5 text-[12px]">
            &apos;wght&apos; N
          </code>{" "}
          string, and skip{" "}
          <code className="mx-1 rounded bg-muted px-1 py-0.5 text-[12px]">
            font-weight
          </code>{" "}
          entirely. Your transition also has to name{" "}
          <code className="mx-1 rounded bg-muted px-1 py-0.5 text-[12px]">
            font-variation-settings
          </code>
          ; leave it out and the weight jumps instead of sliding.
        </p>
        <PropsTable props={weightTokens} />
      </DocSection>
    </DocPage>
  );
}
