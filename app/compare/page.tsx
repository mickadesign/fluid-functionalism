"use client";

import { Suspense, useState, useEffect, useRef, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { componentList } from "@/lib/docs/components";
import { previewMap } from "@/app/components/bento-previews";
import { shadcnPreviewMap } from "@/app/components/shadcn-previews";
import { compareFluidPreviewMap } from "@/app/components/compare-fluid-previews";
import { BentoCard } from "@/app/components/bento-card";
import { Button } from "@/registry/default/button";
import { fontWeights } from "@/registry/default/lib/font-weight";
import { useIcon } from "@/lib/icon-context";
import { Tooltip } from "@/registry/default/tooltip";
import "./shadcn-theme.css";

// Mirrors the slide order on /demo. Components without a shadcn equivalent
// (or without a Fluid Functionalism preview) are skipped at runtime.
const SLIDE_ORDER = [
  "dropdown",
  "checkbox-group",
  "accordion",
  "tabs",
  "radio-group",
  "slider",
  "color-picker",
  "input-group",
  "switch",
  "table",
  "tabs-subtle",
  "thinking-indicator",
  "thinking-steps",
  "input-copy",
];

function ShadcnPreview({ slug }: { slug: string }) {
  const Preview = shadcnPreviewMap[slug];
  if (!Preview) return null;
  return <Preview />;
}

function FluidPreview({ slug }: { slug: string }) {
  // Prefer compare-specific overrides (matched sizes, extra variants); fall
  // back to the standard /demo preview otherwise.
  const Preview = compareFluidPreviewMap[slug] ?? previewMap[slug];
  if (!Preview) return null;
  return <Preview />;
}

export default function ComparePage() {
  return (
    <Suspense fallback={null}>
      <ComparePageInner />
    </Suspense>
  );
}

function ComparePageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const componentMap = new Map(componentList.map((c) => [c.slug, c]));

  const slides = SLIDE_ORDER
    .map((slug) => {
      const c = componentMap.get(slug);
      if (!c) return null;
      if (!previewMap[slug] || !shadcnPreviewMap[slug]) return null;
      return { slug, name: c.name, isNew: c.isNew };
    })
    .filter((s): s is NonNullable<typeof s> => s != null);

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
      router.replace(`/compare?c=${slug}`, { scroll: false });
    },
    [slides, router]
  );

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
  const ArrowRight = useIcon("arrow-right");
  const prevSlide = currentIndex > 0 ? slides[currentIndex - 1] : null;
  const nextSlide = currentIndex < slides.length - 1 ? slides[currentIndex + 1] : null;

  return (
    <div className="w-screen flex flex-col items-center px-6 md:px-12">
      <div className="w-full max-w-[1200px] pt-16 sm:pt-24 pb-8">
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-col gap-2">
            <h1
              className="text-[22px] sm:text-[28px] text-foreground leading-none"
              style={{ fontVariationSettings: fontWeights.bold }}
            >
              Shadcn VS Fluid Functionalism
            </h1>
            <p className="text-[14px] text-muted-foreground">
              Hover the difference, side by side
            </p>
            <div className="flex items-center gap-2 mt-2">
              <Link href="/docs">
                <Button variant="primary" size="sm">Learn more</Button>
              </Link>
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <Tooltip content={prevSlide ? <span>{prevSlide.name} &ensp;<kbd className="font-mono opacity-50">&larr;</kbd></span> : "No previous"}>
              <Button
                variant="ghost"
                size="icon"
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
                size="icon"
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

      {current && (
        <div className="w-full max-w-[1200px] grid grid-cols-1 md:grid-cols-2 gap-4">
          <BentoCard
            key={`${current.slug}-shadcn`}
            slug=""
            name="shadcn/ui"
            style={{ minHeight: 420 }}
          >
            <div className="shadcn-theme flex flex-col items-center justify-center w-full max-w-[420px] mx-auto">
              <ShadcnPreview slug={current.slug} />
            </div>
          </BentoCard>
          <BentoCard
            key={`${current.slug}-fluid`}
            slug={current.slug}
            name={current.name}
            isNew={current.isNew}
            style={{ minHeight: 420 }}
          >
            <div className="flex flex-col items-center justify-center w-full max-w-[420px] mx-auto">
              <FluidPreview slug={current.slug} />
            </div>
          </BentoCard>
        </div>
      )}

      {/* Progress indicator */}
      <div className="flex items-center gap-2.5 mt-10 mb-12 flex-wrap justify-center">
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
