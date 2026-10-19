"use client";

import Link from "next/link";
import { createPortal } from "react-dom";
import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useInView, useReducedMotion } from "motion/react";
import { fontWeights } from "@/registry/default/lib/font-weight";
import { useShape } from "@/registry/default/lib/shape-context";
import { spring } from "@/registry/default/lib/springs";
import {
  useFluidHover,
  useRegisterFluidHoverItem,
} from "@/registry/default/hooks/use-fluid-hover";
import { FluidHoverHighlight } from "@/components/ui/fluid-hover-highlight";
import { Button } from "@/registry/radix/button";
import { Tooltip } from "@/registry/radix/tooltip";
import { useIcon } from "@/lib/icon-context";
import { useSizeVariant } from "@/lib/size-context";
import { useBase } from "@/lib/base-context";
import { useRightRailNode } from "@/lib/right-rail";
import { docOrder } from "@/lib/docs/components";
import { CopyPromptButton } from "@/lib/docs/copy-prompt-button";
import { cn } from "@/lib/utils";
import {
  KIND_LABEL,
  type ChangeEntry,
  type ChangeKind,
  type ChangeRef,
  type Inline,
  type Release,
} from "@/lib/changelog/parse";
import { KIND_DOT } from "@/lib/changelog/kind-style";
import { BentoTileContext } from "@/app/components/bento-card";
import { PreviewPlaybackContext } from "@/lib/docs/preview-playback";
import { ANIMATED_PREVIEWS, ChangelogPreview, hasPreview, STAGE_PADDING } from "@/app/changelog/previews";
import { buildMigrationPrompt, monthLabel } from "@/lib/changelog/migration-prompt";
import type { EntryInstall } from "@/lib/changelog/install";
import { buildUpgradePrompt } from "@/lib/changelog/upgrade-prompt";

export type EntryView = ChangeEntry & {
  id: string;
  /** The Breaking diff, highlighted at build time. */
  diffHtml: string | null;
  /** What the entry installs, for the Copy migration prompt. */
  install: EntryInstall;
};

export type ReleaseView = Omit<Release, "groups"> & {
  groups: Array<{ kind: ChangeKind; entries: EntryView[] }>;
};

const REPO = "https://github.com/mickadesign/fluid-functionalism";

function releasedLabel(day: string) {
  const [year, month, date] = day.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, date)).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

/** One pause for the whole page: previews play as they scroll into view
 *  until the visitor pauses any of them, which pauses them all; Play on any
 *  one resumes them all. Reduced motion starts the page paused. */
const PagePlaybackContext = createContext<{ paused: boolean; setPaused: (paused: boolean) => void }>({
  paused: false,
  setPaused: () => {},
});

export function ChangelogView({ releases }: { releases: ReleaseView[] }) {
  const reduceMotion = useReducedMotion() ?? false;
  const [userPaused, setUserPaused] = useState<boolean | null>(null);
  const paused = userPaused ?? reduceMotion;
  // Memoized: the scroll-spy re-renders this view on scroll, and a fresh
  // object would re-render every preview with it.
  const playback = useMemo(() => ({ paused, setPaused: setUserPaused }), [paused]);
  const ArrowRight = useIcon("arrow-right");
  const iconSize =
    useSizeVariant() === "compact" ? ("icon-compact" as const) : ("icon" as const);
  const next = docOrder[0];

  const sectionsRef = useRef(new Map<string, HTMLElement>());
  const activeMonth = useScrollSpy(releases, sectionsRef);

  return (
    <PagePlaybackContext.Provider value={playback}>
      <div className="flex flex-col gap-8 px-6">
        <div>
          <div className="flex items-center justify-between gap-4">
            <h1
              className="text-site-display text-foreground leading-none"
              style={{ fontVariationSettings: fontWeights.bold }}
            >
              Changelog
            </h1>
            <div className="flex items-center gap-1 shrink-0 -my-2">
              <Tooltip content={<span>Introduction &ensp;<kbd className="font-mono opacity-50">&larr;</kbd></span>}>
                <Button asChild variant="ghost" size={iconSize}>
                  <Link href="/docs" aria-label="Previous: Introduction">
                    <ArrowRight className="rotate-180" />
                  </Link>
                </Button>
              </Tooltip>
              {next && (
                <Tooltip content={<span>{next.name} &ensp;<kbd className="font-mono opacity-50">&rarr;</kbd></span>}>
                  <Button asChild variant="ghost" size={iconSize}>
                    <Link href={`/docs/${next.slug}`} aria-label={`Next: ${next.name}`}>
                      <ArrowRight />
                    </Link>
                  </Button>
                </Tooltip>
              )}
            </div>
          </div>
          {/* /changelog.md is the same page as one Markdown file, for an
              agent; agents also find it from the page's <head>. */}
          <p className="mt-2 text-site-body text-muted-foreground">
            Every change, month by month. A release lands on the first Friday.{" "}
            <a
              href="/changelog.md"
              className="rounded-sm text-foreground underline decoration-border underline-offset-4 outline-none transition-[text-decoration-color] duration-80 hover:decoration-foreground focus-visible:ring-1 focus-visible:ring-[color:var(--focus-ring,#6B97FF)]"
            >
              View as Markdown
            </a>
            .
          </p>
          {/* For an agent doing the upgrade: the skill first, then the same
              job by hand (lib/changelog/upgrade-prompt.ts). */}
          <CopyPromptButton
            label="Copy upgrade prompt"
            variant="secondary"
            prompt={buildUpgradePrompt()}
            className="mt-4"
          />
        </div>

        <div className="flex flex-col">
          {releases.map((release, i) => (
            <div key={release.month} className="relative pl-6">
              <TimelineMark first={i === 0} active={release.month === activeMonth} />
              {/* A hairline between months, 64px on each side. Space only goes
                  above a block (see /docs/typography): pt-16 above the line,
                  and the section's own pt-16 below it. */}
              {i > 0 && (
                <div aria-hidden className="pt-16">
                  {/* -ml-[22px]: back across the 24px gutter to the timeline's
                      line at 2px, so the hairline branches off it. */}
                  <div className="-ml-[22px] border-t border-border" />
                </div>
              )}
              <ReleaseSection
                divided={i > 0}
                release={release}
                sectionRef={(el) => {
                  if (el) sectionsRef.current.set(release.month, el);
                  else sectionsRef.current.delete(release.month);
                }}
              />
            </div>
          ))}
        </div>

        <ReleaseIndex releases={releases} activeMonth={activeMonth} />
      </div>
    </PagePlaybackContext.Provider>
  );
}

// ---------------------------------------------------------------------------
// The timeline: a dot on each month's heading, joined by one line down the
// 24px gutter. Each month draws its own stretch of the line: the first
// starts at its dot, and the last runs on to the end of the page.
// ---------------------------------------------------------------------------

/** Where a month's dot sits, from the top of its block: the middle of the
 *  title line, below the divider's 64px + 1px + 64px when there is one. */
const DOT_Y = "calc(var(--lh-site-title, 22px) / 2)";
const DOT_Y_DIVIDED = "calc(8rem + 1px + var(--lh-site-title, 22px) / 2)";

function TimelineMark({ first, active }: { first: boolean; active: boolean }) {
  const reduceMotion = useReducedMotion() ?? false;
  const dotY = first ? DOT_Y : DOT_Y_DIVIDED;
  return (
    <>
      <span
        aria-hidden
        className="absolute bottom-0 left-[2px] w-px bg-border"
        style={{ top: first ? dotY : 0 }}
      />
      {/* A filled dot for the month in the foreground color, the strongest
          on the page, so it reads over the faint line and apart from the
          entries' colored dots. 5px at 0 centers it on the line, with the
          same 3px gap the entry dots keep. The month in view grows a step,
          on the same spring as the Releases pill in the rail. */}
      <motion.span
        aria-hidden
        className="absolute left-0 size-[5px] -translate-y-1/2 rounded-full bg-foreground ring-[3px] ring-background"
        style={{ top: dotY }}
        initial={false}
        animate={{ scale: active ? 1.3 : 1 }}
        transition={reduceMotion ? { duration: 0 } : spring.moderate}
      />
    </>
  );
}

// ---------------------------------------------------------------------------
// One month
// ---------------------------------------------------------------------------

function ReleaseSection({
  release,
  divided,
  sectionRef,
}: {
  release: ReleaseView;
  divided: boolean;
  sectionRef: (el: HTMLElement | null) => void;
}) {
  return (
    <section
      ref={sectionRef}
      id={release.month}
      aria-labelledby={`${release.month}-title`}
      // Below xl the sidebar trigger floats at the top-left, so an anchor
      // jump lands under it instead of behind it.
      className={cn("scroll-mt-16 xl:scroll-mt-8", divided && "pt-16")}
    >
      <MonthHeading release={release} />
      <h3
        className="mt-2 text-site-subtitle text-foreground"
        style={{ fontVariationSettings: fontWeights.semibold }}
      >
        {release.title}
      </h3>
      {release.intro && (
        <p className="mt-2 text-site-body text-muted-foreground">
          <InlineText inline={release.intro} />
        </p>
      )}
      {release.groups.map((group) => (
        <KindGroup key={group.kind} kind={group.kind} entries={group.entries} month={release.month} />
      ))}
    </section>
  );
}

/** The month as the section title, a link beside it that copies the
 *  month's URL, and the release date on the right. */
function MonthHeading({ release }: { release: ReleaseView }) {
  const LinkIcon = useIcon("link");
  const Check = useIcon("check");
  const [copied, setCopied] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>(null);
  useEffect(() => () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
  }, []);

  const copy = async () => {
    const url = `${window.location.origin}/changelog#${release.month}`;
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      return;
    }
    setCopied(true);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="group/month flex items-center gap-2">
      <h2
        id={`${release.month}-title`}
        className="text-site-title text-foreground"
        style={{ fontVariationSettings: fontWeights.semibold }}
      >
        <time dateTime={release.month}>{monthLabel(release.month)}</time>
      </h2>
      <a
        href={`#${release.month}`}
        onClick={(e) => {
          e.preventDefault();
          window.history.replaceState(window.history.state, "", `${window.location.search}#${release.month}`);
          void copy();
        }}
        aria-label={`Copy link to ${monthLabel(release.month)}`}
        className="relative grid size-5 place-items-center rounded-md text-muted-foreground opacity-0 outline-none transition-opacity duration-80 hover:text-foreground focus-visible:opacity-100 focus-visible:ring-1 focus-visible:ring-[color:var(--focus-ring,#6B97FF)] group-hover/month:opacity-100 max-sm:opacity-100"
      >
        <AnimatePresence initial={false} mode="popLayout">
          <motion.span
            key={copied ? "check" : "link"}
            className="grid place-items-center"
            initial={{ opacity: 0, scale: 0.6, filter: "blur(4px)" }}
            animate={{ opacity: 1, scale: 1, filter: "blur(0px)", transition: spring.fast }}
            exit={{ opacity: 0, scale: 0.6, filter: "blur(4px)", transition: spring.fast.exit }}
          >
            {copied ? <Check className="size-3.5" /> : <LinkIcon className="size-3.5" />}
          </motion.span>
        </AnimatePresence>
        <span className="sr-only" aria-live="polite">
          {copied ? "Link copied" : ""}
        </span>
      </a>
      {release.released && (
        <span className="ml-auto text-site-caption text-muted-foreground tabular-nums">
          Released <time dateTime={release.released}>{releasedLabel(release.released)}</time>
        </span>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// A kind group: a hairline, the kind's name, then its entries
// ---------------------------------------------------------------------------

function KindGroup({ kind, entries, month }: { kind: ChangeKind; entries: EntryView[]; month: string }) {
  return (
    // A hairline above every group, the first one included, so it also
    // closes the month's header: 40px on each side, inside the content
    // column so it stays clear of the timeline. Space only goes above a
    // block.
    <div className="pt-10">
      <div aria-hidden className="border-t border-border" />
      <h4
        className="flex items-baseline gap-2 pt-10 text-site-subtitle text-foreground"
        style={{ fontVariationSettings: fontWeights.semibold }}
      >
        {KIND_LABEL[kind]}
        <span
          className="text-site-caption text-muted-foreground tabular-nums"
          style={{ fontVariationSettings: fontWeights.normal }}
        >
          {entries.length}
        </span>
      </h4>
      <div className="mt-2 flex flex-col">
        {entries.map((entry, i) => (
          <Entry key={entry.id} entry={entry} month={month} first={i === 0} />
        ))}
      </div>
    </div>
  );
}

/** The kind's color on the timeline, level with an entry's name. The name
 *  line starts 24px right of the line, so -24px puts this 5px dot's center
 *  on it; the 3px ring of page color keeps the line from touching it. Sits
 *  in a `relative` name line. */
function KindDot({ kind }: { kind: ChangeKind }) {
  return (
    // The outer span is the page color, so Updated's translucent gray reads
    // as the line's own color instead of letting the line show through.
    <span
      aria-hidden
      className="absolute -left-6 top-1/2 size-[5px] -translate-y-1/2 rounded-full bg-background ring-[3px] ring-background"
    >
      <span className={cn("block size-full rounded-full", KIND_DOT[kind])} />
    </span>
  );
}

// ---------------------------------------------------------------------------
// An entry: the name links to its page (the arrow nudges on hover), the refs
// on the right, the sentence under them. New entries add the live preview
// their Showcase tile has; Breaking entries add the diff and a migration
// prompt.
// ---------------------------------------------------------------------------

function Entry({ entry, month, first }: { entry: EntryView; month: string; first: boolean }) {
  const shape = useShape();
  const { base } = useBase();
  // A preview that animates by itself plays once its stage scrolls into
  // view, unless the visitor paused the page.
  const { paused, setPaused } = useContext(PagePlaybackContext);
  const stageRef = useRef<HTMLDivElement>(null);
  const inView = useInView(stageRef, { amount: 0.35 });
  const playing = inView && !paused;
  // The preview's code loads once its stage is within 600px of the
  // viewport, so it is ready by the time it scrolls in.
  const near = useInView(stageRef, { once: true, margin: "600px 0px" });
  const PlayIcon = useIcon("play");
  const PauseIcon = useIcon("pause");
  const ArrowRight = useIcon("arrow-right");
  const iconSize =
    useSizeVariant() === "compact" ? ("icon-compact" as const) : ("icon" as const);
  const slug = entry.href ? /^\/docs\/([^/#]+)$/.exec(entry.href)?.[1] : undefined;
  const staged = entry.kind === "new" && slug !== undefined && hasPreview(slug);
  const animated = slug ? ANIMATED_PREVIEWS.has(slug) : false;

  return (
    // Space only goes above a block: 24px between entries, 4px under the
    // name, 12px above a diff or a stage.
    <article className={cn(!first && "pt-6")}>
      <div className="flex items-center justify-between gap-4 pt-2">
        <h5 className="relative text-site-body text-foreground">
          <KindDot kind={entry.kind} />
          {entry.href ? (
            <Link
              href={entry.href}
              className="group/name inline-flex items-center gap-1.5 rounded-md outline-none focus-visible:ring-1 focus-visible:ring-[color:var(--focus-ring,#6B97FF)]"
            >
              {entry.name}
              <ArrowRight className="size-3.5 text-muted-foreground transition-[color,translate] duration-80 group-hover/name:translate-x-0.5 group-hover/name:text-foreground" />
            </Link>
          ) : (
            entry.name
          )}
        </h5>
        <div className="-mr-1.5 flex items-center">
          {entry.refs.map((ref) => (
            <RefChip key={ref.type === "pr" ? ref.number : ref.sha} gitRef={ref} />
          ))}
        </div>
      </div>
      <p className="mt-1 text-site-body text-muted-foreground">
        <InlineText inline={entry.text} />
      </p>
      {entry.diffHtml && (
        <div className="mt-3 flex flex-col items-start gap-3">
          <div
            className="changelog-diff w-full overflow-x-auto rounded-lg border border-border text-site-caption"
            dangerouslySetInnerHTML={{ __html: entry.diffHtml }}
          />
          <CopyPromptButton
            label="Copy migration prompt"
            variant="ghost"
            prompt={buildMigrationPrompt({ entry, month, install: entry.install, base })}
          />
        </div>
      )}
      {staged && (
        <div ref={stageRef} className={cn("bento-card-border relative mt-3 overflow-hidden border", shape.container)}>
          {animated && (
            <Tooltip content={paused ? "Play all previews" : "Pause all previews"} side="top">
              <Button
                variant="ghost"
                size={iconSize}
                className="absolute right-2 top-2 z-10"
                aria-label={paused ? "Play all previews" : "Pause all previews"}
                onClick={() => setPaused(!paused)}
              >
                {paused ? <PlayIcon /> : <PauseIcon />}
              </Button>
            </Tooltip>
          )}
          {/* The tile context trims previews built for the Showcase to its
              300px rows. */}
          <BentoTileContext.Provider value>
            <PreviewPlaybackContext.Provider value={playing}>
              <div className={cn("flex min-h-[260px] items-center justify-center", STAGE_PADDING[slug!] ?? "px-6 py-12")}>
                {near && <ChangelogPreview slug={slug!} />}
              </div>
            </PreviewPlaybackContext.Provider>
          </BentoTileContext.Provider>
        </div>
      )}
    </article>
  );
}

function RefChip({ gitRef }: { gitRef: ChangeRef }) {
  const pr = gitRef.type === "pr";
  return (
    <a
      href={pr ? `${REPO}/pull/${gitRef.number}` : `${REPO}/commit/${gitRef.sha}`}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={pr ? `Pull request ${gitRef.number} on GitHub` : `Commit ${gitRef.sha} on GitHub`}
      className="flex h-5 items-center rounded-md px-1.5 font-mono text-site-caption tabular-nums text-muted-foreground outline-none transition-colors duration-80 hover:bg-active hover:text-foreground focus-visible:ring-1 focus-visible:ring-[color:var(--focus-ring,#6B97FF)]"
    >
      <span className="[text-box:trim-both_cap_alphabetic]">
        {pr ? `#${gitRef.number}` : gitRef.sha.slice(0, 7)}
      </span>
    </a>
  );
}

function InlineText({ inline }: { inline: Inline[] }) {
  return (
    <>
      {inline.map((part, i) =>
        part.type === "code" ? <code key={i}>{part.value}</code> : <span key={i}>{part.value}</span>
      )}
    </>
  );
}

// ---------------------------------------------------------------------------
// Scroll-spy: the month whose section crosses the top quarter of the window
// ---------------------------------------------------------------------------

function useScrollSpy(
  releases: ReleaseView[],
  sectionsRef: React.RefObject<Map<string, HTMLElement>>
) {
  const [active, setActive] = useState<string | null>(releases[0]?.month ?? null);

  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      const months = releases.map((r) => r.month);
      if (months.length === 0) return setActive(null);
      const atBottom =
        window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2;
      if (atBottom) return setActive(months[months.length - 1]);
      const line = window.innerHeight * 0.25;
      let current = months[0];
      for (const month of months) {
        const el = sectionsRef.current.get(month);
        if (el && el.getBoundingClientRect().top <= line) current = month;
      }
      setActive(current);
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, [releases, sectionsRef]);

  return active;
}

// ---------------------------------------------------------------------------
// The Releases index: the right rail's only card on this page
// ---------------------------------------------------------------------------

function ReleaseIndex({
  releases,
  activeMonth,
}: {
  releases: ReleaseView[];
  activeMonth: string | null;
}) {
  const node = useRightRailNode();
  // Below xl the rail is display:none; the page scrolls on its own there.
  if (!node) return null;
  return createPortal(
    <ReleaseIndexCard releases={releases} activeMonth={activeMonth} />,
    node
  );
}

function ReleaseIndexCard({
  releases,
  activeMonth,
}: {
  releases: ReleaseView[];
  activeMonth: string | null;
}) {
  const shape = useShape();
  const reduceMotion = useReducedMotion() ?? false;
  const containerRef = useRef<HTMLDivElement>(null);
  const hover = useFluidHover(containerRef);

  const activeIndex = releases.findIndex((r) => r.month === activeMonth);
  const activeRect = activeIndex >= 0 && hover.isMeasured ? hover.itemRects[activeIndex] : null;

  return (
    // The shape's container radius, like the settings card it replaces, so
    // the card rounds with the pill and rounded settings.
    <aside aria-label="Releases" className={cn("p-4 bg-muted", shape.container)}>
      {/* The same header as "Make them yours": 8px above and below a 28px
          row (the height of its star button), the title centered in it. */}
      <div className="py-2">
        <h2
          className="flex h-7 items-center text-site-title text-foreground"
          style={{ fontVariationSettings: fontWeights.semibold }}
        >
          Releases
        </h2>
      </div>
      {/* mt-2.5: "Make them yours" starts its 28px rows 12px under the
          header; these rows are 32px, so 10px puts the first month's text as
          far under the title as "Theme" sits. */}
      <div ref={containerRef} className="relative -mx-2 mt-2.5 flex flex-col" {...hover.handlers}>
        {/* The month in view: a filled pill that glides as the page scrolls,
            under the hover highlight's lighter fill. */}
        {activeRect && (
          <motion.div
            aria-hidden
            className={cn("absolute left-0 top-0 bg-active pointer-events-none", shape.bg)}
            initial={false}
            animate={{ x: activeRect.left, y: activeRect.top, width: activeRect.width, height: activeRect.height }}
            transition={reduceMotion ? { duration: 0 } : spring.moderate}
          />
        )}
        <FluidHoverHighlight hover={hover} className={shape.bg} />
        {releases.map((release, i) => (
          <IndexRow
            key={release.month}
            release={release}
            index={i}
            active={release.month === activeMonth}
            registerItem={hover.registerItem}
          />
        ))}
      </div>
    </aside>
  );
}

function IndexRow({
  release,
  index,
  active,
  registerItem,
}: {
  release: ReleaseView;
  index: number;
  active: boolean;
  registerItem: (index: number, element: HTMLElement | null) => void;
}) {
  const ref = useRef<HTMLAnchorElement>(null);
  useRegisterFluidHoverItem(registerItem, index, ref);
  const reduceMotion = useReducedMotion() ?? false;
  // The ring takes the highlight's radius, so it follows the shape setting.
  const shape = useShape();

  return (
    <a
      ref={ref}
      href={`#${release.month}`}
      aria-current={active ? "location" : undefined}
      onClick={(e) => {
        e.preventDefault();
        document.getElementById(release.month)?.scrollIntoView({
          behavior: reduceMotion ? "auto" : "smooth",
          block: "start",
        });
        window.history.replaceState(window.history.state, "", `${window.location.search}#${release.month}`);
      }}
      className={cn(
        "relative z-10 flex h-8 items-center px-2 text-site-body outline-none transition-[color,opacity] duration-80",
        "focus-visible:ring-1 focus-visible:ring-[color:var(--focus-ring,#6B97FF)]",
        shape.item,
        active ? "text-foreground" : "text-muted-foreground"
      )}
    >
      <span className="inline-grid">
        <span
          aria-hidden
          className="invisible col-start-1 row-start-1 [text-box:trim-both_cap_alphabetic]"
          style={{ fontVariationSettings: fontWeights.semibold }}
        >
          {monthLabel(release.month)}
        </span>
        <span
          className="col-start-1 row-start-1 transition-[font-variation-settings] duration-80 [text-box:trim-both_cap_alphabetic]"
          style={{ fontVariationSettings: active ? fontWeights.semibold : fontWeights.normal }}
        >
          {monthLabel(release.month)}
        </span>
      </span>
    </a>
  );
}
