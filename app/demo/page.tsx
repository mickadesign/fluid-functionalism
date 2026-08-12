"use client";

import { Suspense, useState, useEffect, useLayoutEffect, useRef, useCallback, type ReactNode } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { componentList } from "@/lib/docs/components";
import { previewMap } from "@/app/components/bento-previews";
import { playgroundMap } from "@/lib/docs/playgrounds";
import { BentoCard } from "@/app/components/bento-card";
import { PlaygroundMenu } from "@/app/components/playground-menu";
import { SettingsContent } from "@/app/components/right-panel";
import { Button } from "@/registry/radix/button";
import { fontWeights } from "@/registry/default/lib/font-weight";
import { spring } from "@/lib/springs";
import { useIcon } from "@/lib/icon-context";
import { useSizeVariant } from "@/lib/size-context";
import { Tooltip, TooltipPortalContainer } from "@/registry/radix/tooltip";
import { ColorPickerPortalContainer } from "@/registry/default/color-picker";

const SETTINGS_SLUG = "settings";
const BASE_WIDTH = 680;
const BASE_HEIGHT = 420;

function SlidePreview({ slug }: { slug: string }) {
  const Preview = previewMap[slug];
  if (!Preview) return null;
  return <Preview />;
}

export default function DemoPage() {
  return (
    <Suspense fallback={null}>
      <DemoPageInner />
    </Suspense>
  );
}

function DemoPageInner() {
  const router = useRouter();
  // Square icon buttons follow the site-wide size step (see /docs/sizes).
  const iconSize =
    useSizeVariant() === "compact" ? ("icon-compact" as const) : ("icon" as const);
  const searchParams = useSearchParams();
  const cardRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  // Slides render at 1:1 by default — the size the component actually ships
  // at. Toggling this on scales the slide up to fill the card.
  const [scaleOn, setScaleOn] = useState(false);
  const [scaleEl, setScaleEl] = useState<HTMLDivElement | null>(null);
  const slideOrder = [
    "dropdown",
    "checkbox-group",
    "accordion",
    "tabs",
    "radio-group",
    "slider",
    "ask-user-questions",
    "input-message",
    "button",
    "color-picker",
    "input-group",
    "switch",
    "table",
    "card",
    "tabs-subtle",
    "thinking-indicator",
    "thinking-steps",
    "__settings__",
    "input-copy",
    // Any component with a registered playground gets a slide automatically
    // (see lib/docs/playgrounds) — a playground on the doc page always shows
    // up here too, under the pen menu. Curate the position by naming the slug
    // above; anything unnamed lands at the end.
    ...Object.keys(playgroundMap),
  ].filter((slug, i, all) => all.indexOf(slug) === i);

  const componentMap = new Map(componentList.map((c) => [c.slug, c]));

  const slides = slideOrder.map((slug) => {
    if (slug === "__settings__") {
      return { slug: SETTINGS_SLUG, name: "Make them yours", type: "settings" as const };
    }
    const c = componentMap.get(slug);
    // A slide needs either a static bento preview or a registered playground
    // (which brings its own state-driven preview + pen menu).
    if (!c || (!previewMap[c.slug] && !playgroundMap[c.slug])) return null;
    return { slug: c.slug, name: c.name, isNew: c.isNew, type: "component" as const };
  }).filter((s): s is NonNullable<typeof s> => s != null);

  const paramSlug = searchParams.get("c");
  const paramIndex = slides.findIndex((s) => s.slug === paramSlug);
  const [currentIndex, setCurrentIndex] = useState(paramIndex >= 0 ? paramIndex : 0);

  useEffect(() => {
    if (paramIndex >= 0 && paramIndex !== currentIndex) {
      setCurrentIndex(paramIndex);
    }
  }, [paramIndex, currentIndex]);

  const goTo = useCallback(
    (index: number) => {
      if (index < 0 || index >= slides.length) return;
      setCurrentIndex(index);
      const slug = slides[index].slug;
      router.replace(`/demo?c=${slug}`, { scroll: false });
    },
    [slides, router]
  );

  useLayoutEffect(() => {
    const el = cardRef.current;
    if (!el) return;
    const update = () => setScale(el.getBoundingClientRect().width / BASE_WIDTH);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Ref-based handler so held arrow keys keep advancing (closures over
  // currentIndex/goTo would re-bind every nav and lose key-repeat events).
  const goToRef = useRef(goTo);
  const currentIndexRef = useRef(currentIndex);
  useEffect(() => {
    goToRef.current = goTo;
    currentIndexRef.current = currentIndex;
  }, [goTo, currentIndex]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.metaKey || e.ctrlKey || e.altKey || e.shiftKey) return;

      const tag = (e.target as HTMLElement).tagName;
      const role = (e.target as HTMLElement).getAttribute("role");
      if (
        tag === "INPUT" ||
        tag === "TEXTAREA" ||
        tag === "SELECT" ||
        (e.target as HTMLElement).isContentEditable ||
        role === "slider" ||
        role === "tablist" ||
        role === "radiogroup" ||
        role === "listbox" ||
        role === "menu"
      ) return;

      const closest = (e.target as HTMLElement).closest(
        "[role=slider],[role=tablist],[role=radiogroup],[role=listbox],[role=menu],[role=menubar]"
      );
      if (closest) return;

      if (e.key === "ArrowRight" || e.key === "ArrowDown") {
        e.preventDefault();
        goToRef.current(currentIndexRef.current + 1);
      } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
        e.preventDefault();
        goToRef.current(currentIndexRef.current - 1);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const current = slides[currentIndex];
  // Slides with a registered playground swap the static bento preview for the
  // playground-driven one and gain the pen menu (see lib/docs/playgrounds).
  const Playground =
    current && current.type === "component"
      ? playgroundMap[current.slug]
      : undefined;
  const ArrowRight = useIcon("arrow-right");
  const ScalingIcon = useIcon("scaling");
  const prevSlide = currentIndex > 0 ? slides[currentIndex - 1] : null;
  const nextSlide = currentIndex < slides.length - 1 ? slides[currentIndex + 1] : null;

  // The scaling stage, shared by every slide type. A plain helper (not a
  // component) so it inlines into the same tree on each render — a nested
  // component would be a new type every render and remount the slide.
  const stage = (children: ReactNode) => (
    <motion.div
      ref={setScaleEl}
      className="w-full max-w-[420px] mx-auto flex justify-center relative"
      // Springs between the two scales on toggle instead of snapping, and
      // chases the resize-driven scale closely enough to feel immediate.
      // initial={false} — a slide arrives already at its scale; without this
      // every mount plays a zoom-in from 1.
      initial={false}
      animate={{ scale: scaleOn ? scale : 1 }}
      transition={spring.moderate}
      style={{ transformOrigin: "center" }}
    >
      <TooltipPortalContainer value={scaleEl}>
        <ColorPickerPortalContainer value={scaleEl}>
          {children}
        </ColorPickerPortalContainer>
      </TooltipPortalContainer>
    </motion.div>
  );

  // Card footer controls: scaling toggle first, then the playground pen when
  // the slide has one.
  const cardActions = (playgroundMenu?: ReactNode) => (
    <div className="flex items-center gap-1">
      <Tooltip content={scaleOn ? "Actual size" : "Scale to fit"} side="top">
        <Button
          variant="ghost"
          size="icon-compact"
          aria-label={scaleOn ? "Show preview at actual size" : "Scale preview to fit the card"}
          aria-pressed={scaleOn}
          active={scaleOn}
          onClick={() => setScaleOn((v) => !v)}
        >
          <ScalingIcon />
        </Button>
      </Tooltip>
      {playgroundMenu}
    </div>
  );

  return (
    <div className="w-screen flex flex-col items-center px-6 md:px-12">
      <div className="w-full max-w-[1200px] pt-16 sm:pt-24 pb-8">
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-col gap-2">
            <h1
              className="text-display text-foreground leading-none"
              style={{ fontVariationSettings: fontWeights.bold }}
            >
              Fluid Functionalism
            </h1>
            <p className="text-subtitle text-muted-foreground">
              Refined UI components with satisfying hover.
            </p>
            <div className="flex items-center gap-2 mt-2">
              <Link href="/docs">
                <Button variant="primary" size="sm">Learn more</Button>
              </Link>
              <Link href="/compare">
                <Button variant="tertiary" size="sm">Compare</Button>
              </Link>
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <Tooltip content={prevSlide ? <span>{prevSlide.name} &ensp;<kbd className="font-mono opacity-50">&larr;</kbd></span> : "No previous"}>
              <Button
                variant="ghost"
                size={iconSize}
                onClick={() => goTo(currentIndex - 1)}
                disabled={!prevSlide}
                aria-label="Previous slide"
              >
                <ArrowRight className="rotate-180" />
              </Button>
            </Tooltip>
            <Tooltip content={nextSlide ? <span>{nextSlide.name} &ensp;<kbd className="font-mono opacity-50">&rarr;</kbd></span> : "No next"}>
              <Button
                variant="ghost"
                size={iconSize}
                onClick={() => goTo(currentIndex + 1)}
                disabled={!nextSlide}
                aria-label="Next slide"
              >
                <ArrowRight />
              </Button>
            </Tooltip>
          </div>
        </div>
      </div>
      <div
        ref={cardRef}
        className="w-full max-w-[1200px]"
        style={{
          aspectRatio: `${BASE_WIDTH} / ${BASE_HEIGHT}`,
        }}
      >
        {current && (
          current.type === "settings" ? (
            <BentoCard
              key={current.slug}
              slug=""
              name={current.name}
              style={{ height: "100%" }}
              action={cardActions()}
            >
              {stage(<SettingsContent tooltipSide="right" />)}
            </BentoCard>
          ) : Playground ? (
            <Playground key={current.slug}>
              {({ demoPreview, controls }) => (
                <BentoCard
                  slug={current.slug}
                  name={current.name}
                  isNew={"isNew" in current ? current.isNew : undefined}
                  style={{ height: "100%" }}
                  action={cardActions(
                    <PlaygroundMenu label={`Customize ${current.name}`}>
                      {controls}
                    </PlaygroundMenu>
                  )}
                >
                  {stage(demoPreview)}
                </BentoCard>
              )}
            </Playground>
          ) : (
            <BentoCard
              key={current.slug}
              slug={current.slug}
              name={current.name}
              isNew={"isNew" in current ? current.isNew : undefined}
              style={{ height: "100%" }}
              action={cardActions()}
            >
              {stage(<SlidePreview slug={current.slug} />)}
            </BentoCard>
          )
        )}
      </div>

      {/* Progress indicator */}
      <div className="flex items-center gap-2.5 mt-10 mb-12">
        {slides.map((s, i) => (
          <button
            key={s.slug}
            onClick={() => goTo(i)}
            className="h-1.5 rounded-full transition-all duration-150"
            style={{
              width: i === currentIndex ? 24 : 6,
              backgroundColor: "color-mix(in oklab, var(--foreground), transparent 60%)",
            }}
            aria-label={`Go to ${s.name}`}
          />
        ))}
      </div>
    </div>
  );
}
