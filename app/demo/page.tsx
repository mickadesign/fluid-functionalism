"use client";

import { Suspense, useState, useEffect, useLayoutEffect, useRef, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { componentList } from "@/lib/docs/components";
import { previewMap } from "@/app/components/bento-previews";
import { BentoCard } from "@/app/components/bento-card";
import { SettingsContent } from "@/app/components/right-panel";

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
  const searchParams = useSearchParams();
  const cardRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const slideOrder = [
    "dropdown",
    "checkbox-group",
    "accordion",
    "tabs",
    "radio-group",
    "slider",
    "input-group",
    "switch",
    "table",
    "tabs-subtle",
    "thinking-indicator",
    "thinking-steps",
    "__settings__",
    "input-copy",
  ];

  const componentMap = new Map(componentList.map((c) => [c.slug, c]));

  const slides = slideOrder.map((slug) => {
    if (slug === "__settings__") {
      return { slug: SETTINGS_SLUG, name: "Make them yours", type: "settings" as const };
    }
    const c = componentMap.get(slug);
    if (!c || !previewMap[c.slug]) return null;
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
        goTo(currentIndex + 1);
      } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
        e.preventDefault();
        goTo(currentIndex - 1);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentIndex, goTo]);

  const current = slides[currentIndex];

  return (
    <div className="h-screen w-screen flex flex-col items-center justify-center overflow-hidden px-6 md:px-12">
      <div
        ref={cardRef}
        className="w-full max-w-[1200px]"
        style={{
          aspectRatio: `${BASE_WIDTH} / ${BASE_HEIGHT}`,
          maxHeight: "calc(100vh - 96px)",
        }}
      >
        {current && (
          current.type === "settings" ? (
            <BentoCard key={current.slug} slug="" name={current.name} style={{ height: "100%" }}>
              <div className="w-full max-w-[420px] mx-auto" style={{ transform: `scale(${scale})`, transformOrigin: "center" }}>
                <SettingsContent tooltipSide="right" hideSocial />
              </div>
            </BentoCard>
          ) : (
            <BentoCard
              key={current.slug}
              slug={current.slug}
              name={current.name}
              isNew={"isNew" in current ? current.isNew : undefined}
              style={{ height: "100%" }}
            >
              <div className="w-full max-w-[420px] mx-auto" style={{ transform: `scale(${scale})`, transformOrigin: "center" }}>
                <SlidePreview slug={current.slug} />
              </div>
            </BentoCard>
          )
        )}
      </div>

      {/* Progress indicator */}
      <div className="fixed bottom-6 flex items-center gap-2.5">
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
