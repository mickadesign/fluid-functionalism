"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { motion, AnimatePresence, type Transition } from "framer-motion";
import { DocPage, DocSection } from "@/lib/docs/DocPage";
import { ComponentPreview } from "@/lib/docs/ComponentPreview";
import { spring } from "@/registry/default/lib/springs";
import { fontWeights } from "@/registry/default/lib/font-weight";
import { Button } from "@/registry/radix/button";
import { cn } from "@/registry/default/lib/utils";

/** Inline code chip used throughout the prose. */
function Code({ children }: { children: ReactNode }) {
  return (
    <code className="mx-1 rounded bg-muted px-1 py-0.5 text-[12px]">
      {children}
    </code>
  );
}

// ---------------------------------------------------------------------------
// Code snippets (shown in the Code tab of each ComponentPreview)
// ---------------------------------------------------------------------------

const SPRING_TOKENS_CODE = `import { motion } from "framer-motion";
import { spring } from "@/lib/springs";

// fast     — 0.08s, bounce 0.    Hover, fades, tooltips, focus rings.
// moderate — 0.16s, bounce 0.    Critically damped: dropdowns, tabs, short
//                                travel, and panels that must land exactly
//                                (drawers, merged selection).
// slow     — 0.24s, bounce 0.12. Dialogs, drawers, large surfaces.

// spring.<tier> is the enter; spring.<tier>.exit is the matching exit tween.
<motion.div
  transition={spring.fast}                       // enter
  exit={{ opacity: 0, transition: spring.fast.exit }}  // leave
/>`;

// ---------------------------------------------------------------------------
// Animated reference — one block per tier, enter + exit tracks + chips
// ---------------------------------------------------------------------------

const REFERENCE_TIERS = [
  {
    key: "fast",
    trackWidth: "w-1/3",
    enterToken: "spring.fast",
    exitToken: "spring.fast.exit",
    enterMeta: "0.08s",
    exitMeta: "0.06s",
    enterTransition: spring.fast,
    exitTransition: spring.fast.exit,
    components: [
      { label: "Hover & focus rings", slug: null },
      { label: "Checkbox",            slug: "/docs/checkbox-group" },
      { label: "Radio",               slug: "/docs/radio-group" },
      { label: "Tooltip",             slug: "/docs/tooltip" },
      { label: "Table rows",          slug: "/docs/table" },
      { label: "Card proximity",      slug: "/docs/card" },
      { label: "Input copy",          slug: "/docs/input-copy" },
      { label: "Slider",              slug: "/docs/slider" },
      { label: "Select",              slug: "/docs/select" },
      { label: "Color picker",        slug: "/docs/color-picker" },
    ],
  },
  {
    key: "moderate",
    trackWidth: "w-2/3",
    enterToken: "spring.moderate",
    exitToken: "spring.moderate.exit",
    enterMeta: "0.16s bounce 0",
    exitMeta: "0.12s",
    enterTransition: spring.moderate,
    exitTransition: spring.moderate.exit,
    components: [
      { label: "Dropdown",                slug: "/docs/dropdown" },
      { label: "Tabs indicator",          slug: "/docs/tabs" },
      { label: "Switch thumb",            slug: "/docs/switch" },
      { label: "Accordion",               slug: "/docs/accordion" },
      { label: "Chat bubbles",            slug: "/docs/chat-message" },
      { label: "Mobile drawer",           slug: null },
      { label: "Selection merge / split", slug: "/docs/checkbox-group" },
    ],
  },
  {
    key: "slow",
    trackWidth: "w-full",
    enterToken: "spring.slow",
    exitToken: "spring.slow.exit",
    enterMeta: "0.24s bounce 0.12",
    exitMeta: "0.16s",
    enterTransition: spring.slow,
    exitTransition: spring.slow.exit,
    components: [
      { label: "Dialog",              slug: "/docs/dialog" },
      { label: "Ask-user questions",  slug: "/docs/ask-user-questions" },
      { label: "Thinking steps",      slug: "/docs/thinking-steps" },
    ],
  },
];

// ms to wait before reversing (covers spring settle + tiny pause)
const ENTER_SETTLE = { fast: 220, moderate: 400, slow: 560 } as const;
// ms the exit takes (blocks re-clicks until done)
const EXIT_SETTLE  = { fast: 150, moderate: 200, slow: 250 } as const;

function SpringReferenceSection() {
  const [atEnds, setAtEnds] = useState([false, false, false]);
  const [transitions, setTransitions] = useState<Transition[]>([
    spring.fast, spring.moderate, spring.slow,
  ]);
  const [busy, setBusy] = useState([false, false, false]);

  const fire = (i: number) => {
    if (busy[i]) return;
    const tier = REFERENCE_TIERS[i];
    const k = tier.key as keyof typeof ENTER_SETTLE;

    // Enter: L → R
    setBusy(b      => b.map((v, j) => j === i ? true  : v));
    setTransitions(t => t.map((v, j) => j === i ? (tier.enterTransition as Transition) : v));
    setAtEnds(a    => a.map((v, j) => j === i ? true  : v));

    // Exit: R → L (after spring settles)
    setTimeout(() => {
      setTransitions(t => t.map((v, j) => j === i ? (tier.exitTransition as Transition) : v));
      setAtEnds(a      => a.map((v, j) => j === i ? false : v));
      setTimeout(() => {
        setBusy(b => b.map((v, j) => j === i ? false : v));
      }, EXIT_SETTLE[k]);
    }, ENTER_SETTLE[k]);
  };

  return (
    <div className="flex flex-col">
      {REFERENCE_TIERS.map(({ key, trackWidth, enterToken, exitToken, enterMeta, exitMeta, components }, i) => (
        <div
          key={key}
          className={cn("flex flex-col gap-4 py-6", i > 0 && "border-t border-border")}
        >
          <div className="flex flex-col gap-0.5">
            <span
              className="text-[13px] text-foreground"
              style={{ fontVariationSettings: fontWeights.semibold }}
            >
              {key}
            </span>
            <span className="text-[12px] text-muted-foreground">
              → <code className="font-mono">{enterToken}</code> {enterMeta}
            </span>
            <span className="text-[12px] text-muted-foreground">
              ← <code className="font-mono">{exitToken}</code> {exitMeta}
            </span>
          </div>

          {/* Track constrained to tier width */}
          <button
            onClick={() => fire(i)}
            aria-label={`Play ${key} enter then exit`}
            className={cn(
              "flex h-7 cursor-pointer items-center rounded-full bg-muted px-0.5 outline-none",
              "focus-visible:ring-1 focus-visible:ring-[color:var(--focus-ring,#6B97FF)]",
              trackWidth,
              atEnds[i] ? "justify-end" : "justify-start"
            )}
          >
            <motion.div
              layout
              transition={transitions[i]}
              className="h-6 w-6 rounded-full bg-foreground"
            />
          </button>

          {/* Component chips — links where a page exists */}
          <div className="flex flex-wrap gap-x-3 gap-y-1">
            {components.map(({ label, slug }) =>
              slug ? (
                <Link
                  key={label}
                  href={slug}
                  className="text-[13px] text-muted-foreground/50 transition-colors hover:text-foreground"
                >
                  {label}
                </Link>
              ) : (
                <span key={label} className="text-[13px] text-muted-foreground/30">
                  {label}
                </span>
              )
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Spring tokens demo
// ---------------------------------------------------------------------------

const SPRING_TIERS = [
  {
    key: "fast",
    token: spring.fast,
    meta: "0.08s · bounce 0",
    usage: "hover, fades",
  },
  {
    key: "moderate",
    token: spring.moderate,
    meta: "0.16s · bounce 0",
    usage: "dropdowns, tabs",
  },
  {
    key: "slow",
    token: spring.slow,
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
                "flex h-10 w-full cursor-pointer items-center rounded-full bg-muted px-1 outline-none focus-visible:ring-1 focus-visible:ring-[color:var(--focus-ring,#6B97FF)]",
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
// Modal exit comparison — same enter, two exit speeds
// ---------------------------------------------------------------------------

const MODAL_CODE = `// Both modals open on spring.slow. Only the exit differs.

// ❌ Slow exit — same 0.4s as the enter, drags on the way out
<motion.div
  initial={{ opacity: 0, scale: 0.95 }}
  animate={{ opacity: 1, scale: 1 }}
  exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.4 } }}
  transition={spring.slow}
/>

// ✅ Faster exit — leaves on spring.slow.exit (0.16s tween)
<motion.div
  initial={{ opacity: 0, scale: 0.95 }}
  animate={{ opacity: 1, scale: 1 }}
  exit={{ opacity: 0, scale: 0.95, transition: spring.slow.exit }}
  transition={spring.slow}
/>`;

function ModalFrame({
  open,
  exitTransition,
}: {
  open: boolean;
  exitTransition: Transition;
}) {
  return (
    <div
      aria-hidden="true"
      className="relative flex h-[200px] w-full items-center justify-center overflow-hidden rounded-xl border border-border bg-background"
    >
      <AnimatePresence>
        {open && (
          <>
            {/* subtle backdrop */}
            <motion.div
              className="absolute inset-0 bg-foreground/5"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, transition: exitTransition }}
              transition={spring.slow}
            />
            {/* modal card */}
            <motion.div
              className="relative z-10 flex w-4/5 flex-col gap-2.5 rounded-xl border border-border bg-card p-4 shadow-xl"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95, transition: exitTransition }}
              transition={spring.slow}
            >
              {/* close affordance */}
              <div className="absolute right-3 top-3 h-4 w-4 rounded-full bg-foreground/10" />
              {/* title */}
              <div className="h-3 w-1/2 rounded-full bg-foreground/10" />
              {/* body */}
              <div className="mt-1 h-2 w-full rounded-full bg-foreground/6" />
              <div className="h-2 w-full rounded-full bg-foreground/6" />
              <div className="h-2 w-2/5 rounded-full bg-foreground/6" />
              {/* footer actions */}
              <div className="mt-3 flex justify-end gap-2">
                <div className="h-6 w-16 rounded-md bg-foreground/10" />
                <div className="h-6 w-16 rounded-md bg-foreground/10" />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

function ModalExitDemo() {
  // Independent state per side, so you can toggle one, then the other, and feel
  // the difference back to back rather than all at once.
  const [openSame, setOpenSame] = useState(false);
  const [openFaster, setOpenFaster] = useState(false);
  const labelClass =
    "flex items-center justify-center gap-2 text-[12px] text-muted-foreground";
  return (
    <ComponentPreview code={MODAL_CODE} minHeightClass="min-h-[320px]">
      <div className="flex w-full max-w-2xl flex-col items-center gap-4">
        <div className="grid w-full gap-5 sm:grid-cols-2">
          {/* Same exit time */}
          <div className="flex flex-col items-center gap-3">
            <ModalFrame open={openSame} exitTransition={{ duration: 0.4 }} />
            <Button
              variant="secondary"
              size="sm"
              aria-label="Toggle the modal with the same exit speed"
              onClick={() => setOpenSame((v) => !v)}
            >
              Toggle modal
            </Button>
            <span className={labelClass}>
              <span aria-hidden="true">❌</span> Same exit time — drags on the way
              out
            </span>
          </div>
          {/* Faster exit */}
          <div className="flex flex-col items-center gap-3">
            <ModalFrame open={openFaster} exitTransition={spring.slow.exit} />
            <Button
              variant="secondary"
              size="sm"
              aria-label="Toggle the modal with the faster exit speed"
              onClick={() => setOpenFaster((v) => !v)}
            >
              Toggle modal
            </Button>
            <span className={labelClass}>
              <span aria-hidden="true">✅</span> Faster exit — gone a tier quicker
            </span>
          </div>
        </div>
        <p className="text-center text-[12px] text-muted-foreground/70">
          Toggle one, then the other — both open on{" "}
          <span className="font-mono">spring.slow</span>; only the close differs.
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
      description="Three spring speeds, and exits always move a little faster than entrances. Pick a speed, wire it in — every component follows the same pattern."
    >
      <DocSection title="Three speeds">
        <p className="text-[13px] leading-relaxed text-muted-foreground">
          All animations come from one of three springs in{" "}
          <Code>lib/springs</Code>. Hover states and small toggles use{" "}
          <Code>fast</Code>. Dropdowns and tabs use <Code>moderate</Code>.
          Dialogs and drawers use <Code>slow</Code>. No component invents its
          own timing, so things you've never thought about together will move
          at the same pace. <Code>moderate</Code> is critically damped — it
          lands exactly with no overshoot, so it also carries panels and sheets
          that must settle precisely (the mobile drawer, the merged selection
          backgrounds).
        </p>
        <SpringTokensDemo />
      </DocSection>

      <DocSection title="Slow in, faster out">
        <p className="text-[13px] leading-relaxed text-muted-foreground">
          Both modals open on <Code>spring.slow</Code>. The only difference is
          the close: the left exits on the same <Code>spring.slow</Code>, the
          right on <Code>spring.slow.exit</Code> — one tier faster. Toggle the
          left one first. That slight drag on the way out is exactly what
          you're trying to avoid.
        </p>
        <ModalExitDemo />
      </DocSection>

      <DocSection title="All tokens">
        <p className="text-[13px] leading-relaxed text-muted-foreground">
          Click a track to see it. The ball enters right on the spring, then
          returns left on the exit tween. Everything lives in{" "}
          <Code>lib/springs</Code> — duration values belong there, not
          scattered through component code.
        </p>
        <SpringReferenceSection />

        <h3
          className="mt-8 text-[15px] text-foreground"
          style={{ fontVariationSettings: fontWeights.semibold }}
        >
          Reduced motion
        </h3>
        <p className="text-[13px] leading-relaxed text-muted-foreground">
          All springs respect the OS setting. Wrap the app tree in{" "}
          <Code>{`<MotionConfig reducedMotion="user">`}</Code> and when the
          user turns on reduced motion, the position changes drop out and only
          the opacity fades remain.
        </p>
      </DocSection>
    </DocPage>
  );
}
