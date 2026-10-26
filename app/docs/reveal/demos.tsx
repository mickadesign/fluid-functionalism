"use client";

import {
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useInView } from "motion/react";
import { ComponentPreview } from "@/lib/docs/ComponentPreview";
import { useIcon, type IconName } from "@/lib/icon-context";
import { fontWeights } from "@/registry/default/lib/font-weight";
import { cn } from "@/registry/default/lib/utils";
import { useShape } from "@/registry/default/lib/shape-context";
import { PRESET_SPECS } from "@/lib/docs/api/reveal";
import type { RevealPresetName } from "@/lib/reveal/presets";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { TabsSubtle, TabsSubtleItem } from "@/components/flavored/tabs-subtle";

// ---------------------------------------------------------------------------
// Tidepool, a made-up shared inbox: its landing page and the app itself
// ---------------------------------------------------------------------------

const THREADS = [
  {
    from: "Maya Chen",
    initials: "MC",
    subject: "Invoice 2041 is missing the VAT line",
    tag: "Billing",
    time: "9:41",
    unread: true,
  },
  {
    from: "Rafael Ortiz",
    initials: "RO",
    subject: "Can we move the onboarding call?",
    tag: "Sales",
    time: "9:12",
    unread: true,
  },
  {
    from: "Lena Park",
    initials: "LP",
    subject: "Card ending 4242 expires in May",
    tag: "Billing",
    time: "8:55",
    unread: false,
  },
  {
    from: "Ines Duarte",
    initials: "ID",
    subject: "Love the new export, one question",
    tag: "Support",
    time: "Mon",
    unread: false,
  },
  {
    from: "Tom Becker",
    initials: "TB",
    subject: "SSO for the second workspace?",
    tag: "Sales",
    time: "Mon",
    unread: false,
  },
];

const STATS = [
  { label: "Open", value: "38" },
  { label: "First reply", value: "42m" },
  { label: "Waiting", value: "5" },
];

const NAV: { icon: IconName; label: string; count?: string }[] = [
  { icon: "inbox", label: "Inbox", count: "38" },
  { icon: "user", label: "Assigned to me", count: "5" },
  { icon: "clock", label: "Snoozed", count: "2" },
  { icon: "check", label: "Done" },
];

const TEAMS = ["Support", "Billing", "Sales"];

const FEATURES = [
  {
    title: "1 inbox",
    body: "Support, sales, and billing in one list, sorted by who owes a reply.",
  },
  {
    title: "Claim, then type",
    body: "A name on the thread before the draft. Nobody answers twice.",
  },
  {
    title: "Quiet nudges",
    body: "A thread waiting 4 hours pings its owner once. Only its owner.",
  },
];

const LANDING_NUMBERS = [
  { value: "40m", label: "First reply" },
  { value: "3×", label: "Threads per agent" },
  { value: "0", label: "Double replies" },
];

const STEPS = [
  {
    title: "Forward your address",
    body: "Point support@ at Tidepool. Old threads come along.",
  },
  {
    title: "Invite the team",
    body: "Everyone sees the same inbox and who owns what.",
  },
  {
    title: "Set your nudges",
    body: "Pick how long a customer can wait before someone hears.",
  },
];

const PLANS = [
  {
    name: "Starter",
    note: "For a team of up to 3",
    price: "$0",
    perks: ["1 shared inbox", "Claims and nudges", "30 days of history"],
  },
  {
    name: "Team",
    note: "Per seat, per month",
    price: "$12",
    perks: ["Unlimited inboxes", "Shared drafts", "Reports and CSV export"],
  },
];

const semibold = { fontVariationSettings: fontWeights.semibold };
const bold = { fontVariationSettings: fontWeights.bold };

function NavIcon({ name }: { name: IconName }) {
  const Glyph = useIcon(name);
  return <Glyph size={16} strokeWidth={1.5} className="shrink-0" />;
}

/** 1 line of text as a skeleton: a box the line's height, so a block of
 *  these is exactly as tall as the text it stands in for. */
function Line({
  className,
  height = "h-4",
}: {
  className?: string;
  height?: string;
}) {
  return (
    <span className={cn("flex items-center", height)}>
      <Skeleton className={cn("h-2.5", className)} />
    </span>
  );
}

function SidebarItems() {
  return (
    <nav className="reveal-items flex flex-col gap-0.5">
      {NAV.map((item, i) => (
        <span
          key={item.label}
          className={cn(
            "flex items-center gap-2 rounded-md px-2 py-1.5 text-site-caption",
            i === 0 ? "bg-muted text-foreground" : "text-muted-foreground",
          )}
        >
          <NavIcon name={item.icon} />
          <span className="flex-1 truncate">{item.label}</span>
          {item.count && <span className="tabular-nums">{item.count}</span>}
        </span>
      ))}
      <span className="px-2 pt-4 pb-1.5 text-site-caption text-muted-foreground">
        Teams
      </span>
      {TEAMS.map((team) => (
        <span
          key={team}
          className="flex items-center gap-2 rounded-md px-2 py-1.5 text-site-caption text-muted-foreground"
        >
          <span className="flex size-4 items-center justify-center">
            <span className="size-1.5 rounded-full bg-muted-foreground" />
          </span>
          {team}
        </span>
      ))}
    </nav>
  );
}

function SidebarSkeleton() {
  const row = (key: string, width: string) => (
    <span key={key} className="flex items-center gap-2 px-2 py-1.5">
      <Skeleton className="size-4 rounded-sm" />
      <Line className={width} />
    </span>
  );
  return (
    <div aria-hidden className="reveal-items flex flex-col gap-0.5">
      {NAV.map((item, i) =>
        row(item.label, ["w-12", "w-24", "w-16", "w-10"][i]),
      )}
      <span className="px-2 pt-4 pb-1.5">
        <Line className="w-10" />
      </span>
      {TEAMS.map((team, i) => row(team, ["w-14", "w-12", "w-10"][i]))}
    </div>
  );
}

/** Each metric is its own request, so each card swaps from its skeleton on
 *  its own: a new element lands in the grid and plays its step. */
function Stats({ ready }: { ready?: boolean[] }) {
  const shape = useShape();
  const card = cn("flex flex-col gap-1 bg-muted p-4", shape.container);
  return (
    <div className="reveal-items grid grid-cols-3 gap-3">
      {STATS.map((s, i) => (
        <Swap
          key={s.label}
          ready={ready?.[i]}
          skeleton={
            <div className={card}>
              <Line className="w-14" />
              <Line className="h-5 w-10" height="h-7" />
            </div>
          }
        >
          <div className={card}>
            <span className="truncate text-site-caption text-muted-foreground">
              {s.label}
            </span>
            <span
              className="text-[24px] leading-[28px] text-foreground tabular-nums"
              style={semibold}
            >
              {s.value}
            </span>
          </div>
        </Swap>
      ))}
    </div>
  );
}

/** A skeleton and its real block in 1 `reveal-swap` cell: the skeleton
 *  stays mounted and fades out as the block fades in on top of it. With no
 *  `ready` (the landing page's product shot, not loading) the skeleton is
 *  skipped entirely. */
function Swap({
  ready,
  skeleton,
  children,
}: {
  ready?: boolean;
  skeleton: ReactNode;
  children: ReactNode;
}) {
  if (ready === undefined) return <>{children}</>;
  return (
    <div className="reveal-swap">
      {skeleton}
      {ready && children}
    </div>
  );
}

function Threads() {
  return (
    <div className="reveal-items flex flex-col divide-y divide-border">
      {THREADS.map((t) => (
        <div key={t.subject} className="flex items-center gap-3 py-2.5">
          <span
            className={cn(
              "size-1.5 shrink-0 rounded-full",
              t.unread ? "bg-foreground" : "bg-transparent",
            )}
          />
          <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-muted text-site-micro text-muted-foreground">
            {t.initials}
          </span>
          <span
            className="w-24 shrink-0 truncate text-site-caption text-foreground"
            style={t.unread ? semibold : undefined}
          >
            {t.from}
          </span>
          <span
            className={cn(
              "min-w-0 flex-1 truncate text-site-caption",
              t.unread ? "text-foreground" : "text-muted-foreground",
            )}
          >
            {t.subject}
          </span>
          <span className="hidden shrink-0 rounded-full border border-border px-2 text-[11px] leading-[18px] text-muted-foreground @xl:inline">
            {t.tag}
          </span>
          <span className="w-9 shrink-0 text-right text-site-caption text-muted-foreground tabular-nums">
            {t.time}
          </span>
        </div>
      ))}
    </div>
  );
}

function ThreadsSkeleton() {
  return (
    <div
      aria-hidden
      className="reveal-items flex flex-col divide-y divide-border"
    >
      {THREADS.map((t, i) => (
        <div key={t.subject} className="flex items-center gap-3 py-2.5">
          <span className="size-1.5 shrink-0" />
          <Skeleton className="size-7 shrink-0 rounded-full" />
          <Line className="w-20" />
          <span className="min-w-0 flex-1">
            <Line className="w-full" />
          </span>
          <Skeleton
            className="hidden h-[20px] w-14 shrink-0 rounded-full @xl:block"
            style={{ opacity: 1 - i * 0.05 }}
          />
          <Line className="ml-auto w-8" />
        </div>
      ))}
    </div>
  );
}

interface AppReady {
  sidebar: boolean;
  stats: boolean[];
  threads: boolean;
}

/** The app: a sidebar beside the preset, and a main column that takes it.
 *  With `ready`, each data block shows its skeleton until it is ready;
 *  without, the screen renders loaded. */
function AppScreen({
  mainClassName,
  ready,
}: {
  mainClassName?: string;
  ready?: AppReady;
}) {
  return (
    <div className="flex h-full min-h-[500px] text-left">
      <aside className="hidden w-48 shrink-0 flex-col gap-4 border-r border-border p-3 sm:flex">
        <span className="flex items-center gap-2 px-2 py-1">
          <span
            className="flex size-6 items-center justify-center rounded-md bg-foreground text-[12px] leading-4 text-background"
            style={bold}
          >
            T
          </span>
          <span className="text-site-body text-foreground" style={semibold}>
            Tidepool
          </span>
        </span>
        <Swap ready={ready?.sidebar} skeleton={<SidebarSkeleton />}>
          <SidebarItems />
        </Swap>
        <span className="mt-auto flex items-center gap-2 px-2 py-1 text-site-caption text-muted-foreground">
          <span className="flex size-6 items-center justify-center rounded-full bg-muted text-[10px] leading-3">
            AL
          </span>
          Ana Lima
        </span>
      </aside>
      <main
        className={cn(
          "@container flex min-w-0 flex-1 flex-col gap-6 p-6",
          mainClassName,
        )}
      >
        <div className="flex items-center justify-between gap-4">
          <div className="flex min-w-0 flex-col">
            <span
              className="text-[20px] leading-[26px] text-foreground"
              style={bold}
            >
              Inbox
            </span>
            <span className="truncate text-site-caption text-muted-foreground">
              38 open, 5 waiting on you
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="hidden h-7 w-40 items-center gap-2 rounded-full border border-border px-3 text-site-caption text-muted-foreground @lg:flex">
              <NavIcon name="search" />
              Search
            </span>
            <Button size="compact" tabIndex={-1}>
              New thread
            </Button>
          </div>
        </div>
        <Stats ready={ready?.stats} />
        <Swap ready={ready?.threads} skeleton={<ThreadsSkeleton />}>
          <Threads />
        </Swap>
      </main>
    </div>
  );
}

function between(min: number, max: number) {
  return min + Math.random() * (max - min);
}

/** The app with real-world data: every request takes its own time, drawn
 *  fresh on each replay, so blocks land in a different order each run. The
 *  sidebar is quick, each metric is its own request, and the threads are the
 *  slowest on average. */
function ProductApp({ mainClassName }: { mainClassName: string }) {
  const [ready, setReady] = useState<AppReady>({
    sidebar: false,
    stats: STATS.map(() => false),
    threads: false,
  });
  useEffect(() => {
    const land = (update: (r: AppReady) => AppReady, min: number, max: number) =>
      setTimeout(() => setReady(update), between(min, max));
    const timers = [
      land((r) => ({ ...r, sidebar: true }), 150, 450),
      ...STATS.map((_, i) =>
        land((r) => ({ ...r, stats: r.stats.map((on, j) => on || j === i) }), 400, 1300),
      ),
      land((r) => ({ ...r, threads: true }), 700, 1600),
    ];
    return () => timers.forEach(clearTimeout);
  }, []);
  return <AppScreen mainClassName={mainClassName} ready={ready} />;
}

/** The landing page. Nav and footer sit outside the preset, so they stay put. */
function LandingPage({ className }: { className: string }) {
  const shape = useShape();
  return (
    <div className="flex flex-col">
      <header className="flex items-center justify-between px-6 py-5 text-site-caption sm:px-10">
        <span className="text-site-body text-foreground" style={bold}>
          Tidepool
        </span>
        <span className="flex gap-5 text-muted-foreground">
          <span className="hidden sm:inline">Product</span>
          <span className="hidden sm:inline">Pricing</span>
          <span className="text-foreground">Sign in</span>
        </span>
      </header>

      <div
        className={cn("flex flex-col gap-28 px-6 pb-28 sm:px-10", className)}
      >
        <section className="flex flex-col items-center gap-3 pt-16 text-center">
          <span className="text-site-caption text-muted-foreground">
            The shared inbox for support teams
          </span>
          <h3
            className="max-w-lg text-[36px] leading-[40px] text-foreground sm:text-[48px] sm:leading-[52px]"
            style={bold}
          >
            Every email, answered once.
          </h3>
          <p className="max-w-sm text-balance text-site-subtitle text-muted-foreground">
            Claim a thread, reply together, and see who is waiting on you.
          </p>
          <div className="flex gap-2 pt-1">
            <Button tabIndex={-1}>Start free</Button>
            <Button variant="secondary" tabIndex={-1}>
              Book a demo
            </Button>
          </div>
          {/* The product shot is on screen at first paint, so it belongs to
              the hero: it plays on load with the copy instead of waiting
              half revealed for a scroll. */}
          <div
            className={cn("mt-9 w-full bg-muted p-3 sm:p-6", shape.container)}
          >
            <div
              aria-hidden
              className={cn(
                "pointer-events-none overflow-hidden border border-border bg-background select-none",
                shape.container,
              )}
            >
              <AppScreen />
            </div>
          </div>
        </section>

        <section className="grid gap-8 sm:grid-cols-3">
          {FEATURES.map((f) => (
            <div key={f.title} className="flex flex-col gap-1.5">
              <span className="text-site-body text-foreground" style={semibold}>
                {f.title}
              </span>
              <span className="text-site-body text-muted-foreground">
                {f.body}
              </span>
            </div>
          ))}
        </section>

        <section className="grid grid-cols-3 gap-6 border-y border-border py-10 text-center">
          {LANDING_NUMBERS.map((n) => (
            <div key={n.label} className="flex flex-col gap-1">
              <span
                className="text-[32px] leading-[38px] text-foreground tabular-nums"
                style={bold}
              >
                {n.value}
              </span>
              <span className="text-site-caption text-muted-foreground">
                {n.label}
              </span>
            </div>
          ))}
        </section>

        <section className="flex flex-col items-center gap-4 text-center">
          <p
            className="max-w-lg text-[24px] leading-[32px] text-foreground"
            style={semibold}
          >
            &ldquo;First reply went from 6 hours to 40 minutes. Nobody answers
            the same customer twice.&rdquo;
          </p>
          <span className="text-site-caption text-muted-foreground">
            Ana Lima, Head of Support, Northwind
          </span>
        </section>

        <section className="flex flex-col gap-6">
          <h4
            className="text-[22px] leading-[28px] text-foreground"
            style={bold}
          >
            Live in an afternoon
          </h4>
          <ol className="grid gap-6 sm:grid-cols-3">
            {STEPS.map((step, n) => (
              <li key={step.title} className="flex flex-col gap-1.5">
                <span className="text-site-caption text-muted-foreground tabular-nums">
                  {n + 1}
                </span>
                <span
                  className="text-site-body text-foreground"
                  style={semibold}
                >
                  {step.title}
                </span>
                <span className="text-site-body text-muted-foreground">
                  {step.body}
                </span>
              </li>
            ))}
          </ol>
        </section>

        <section className="flex flex-col items-center gap-6">
          <h4
            className="text-[22px] leading-[28px] text-foreground"
            style={bold}
          >
            Simple pricing
          </h4>
          <div className="grid w-full gap-3 sm:grid-cols-2">
            {PLANS.map((plan) => (
              <div
                key={plan.name}
                className={cn(
                  "flex flex-col gap-4 bg-muted p-6",
                  shape.container,
                )}
              >
                <div className="flex flex-col gap-1">
                  <span
                    className="text-site-body text-foreground"
                    style={semibold}
                  >
                    {plan.name}
                  </span>
                  <span className="text-site-caption text-muted-foreground">
                    {plan.note}
                  </span>
                </div>
                <span
                  className="text-[32px] leading-[38px] text-foreground tabular-nums"
                  style={bold}
                >
                  {plan.price}
                </span>
                <ul className="flex flex-col gap-1.5 text-site-caption text-muted-foreground">
                  {plan.perks.map((perk) => (
                    <li key={perk}>{perk}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        <section className="flex flex-col items-center gap-5 text-center">
          <h4
            className="text-[28px] leading-[34px] text-foreground"
            style={bold}
          >
            Answer once.
          </h4>
          <Button tabIndex={-1}>Start free</Button>
        </section>
      </div>

      <footer className="flex justify-between border-t border-border px-6 py-5 text-site-caption text-muted-foreground sm:px-10">
        <span>© Tidepool</span>
        <span className="flex gap-5">
          <span>Privacy</span>
          <span>Terms</span>
        </span>
      </footer>
    </div>
  );
}

// ---------------------------------------------------------------------------
// The demos: 1 window per preset, 2 intensities each
// ---------------------------------------------------------------------------

type Preset = "Landing" | "Product";
const INTENSITIES = ["Default", "Subtle"] as const;
type Intensity = (typeof INTENSITIES)[number];

/** The class in use and the values it sets, in 1 quiet row. */
function SpecRow({ className }: { className: RevealPresetName }) {
  return (
    <div className="flex flex-wrap gap-x-10 gap-y-3">
      <Spec label="Class" value={`.${className}`} />
      {PRESET_SPECS[className].map((s) => (
        <Spec key={s.label} {...s} />
      ))}
    </div>
  );
}

function Spec({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-site-caption text-muted-foreground">{label}</span>
      <span className="font-mono text-site-caption whitespace-nowrap text-foreground">
        {value}
      </span>
    </div>
  );
}

export function PresetDemo({ preset }: { preset: Preset }) {
  const [intensity, setIntensity] = useState<Intensity>("Default");
  const [run, setRun] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  // Plays only once half of it is on screen, so a visitor who scrolls to
  // it sees it run instead of its end state.
  const seen = useInView(scrollRef, { once: true, amount: 0.5 });
  const ReplayIcon = useIcon("rotate-ccw");

  const className =
    `reveal-${preset.toLowerCase()}${intensity === "Subtle" ? "-subtle" : ""}` as RevealPresetName;
  const restart = () => scrollRef.current?.scrollTo({ top: 0 });

  return (
    // The preview's own header (Preview / Code / Inspect) gives way to the
    // demo's controls: the intensity on the left, Replay on the right.
    <ComponentPreview hideHeader padding="none">
      <div className="flex w-full flex-col self-stretch">
        <div className="flex w-full items-center gap-3 border-b border-border/60 px-3 py-3">
          <TabsSubtle
            idPrefix={`reveal-${preset.toLowerCase()}`}
            selectedIndex={INTENSITIES.indexOf(intensity)}
            onSelect={(i) => {
              setIntensity(INTENSITIES[i]);
              restart();
            }}
          >
            {INTENSITIES.map((label, i) => (
              <TabsSubtleItem key={label} index={i} label={label} />
            ))}
          </TabsSubtle>
          <Button
            className="ml-auto"
            leadingIcon={ReplayIcon}
            onClick={() => {
              restart();
              setRun((r) => r + 1);
            }}
          >
            Replay
          </Button>
        </div>
        {/* The page itself, edge to edge in the preview. */}
        <div
          ref={scrollRef}
          tabIndex={0}
          className={cn(
            "w-full overflow-y-auto bg-background outline-none",
            preset === "Landing" ? "h-[560px]" : "h-[500px]",
          )}
        >
          {seen &&
            (preset === "Landing" ? (
              <LandingPage key={`${className}-${run}`} className={className} />
            ) : (
              <ProductApp
                key={`${className}-${run}`}
                mainClassName={className}
              />
            ))}
        </div>
        <div className="border-t border-border/60 px-4 py-4 sm:px-6">
          <SpecRow className={className} />
        </div>
      </div>
    </ComponentPreview>
  );
}
