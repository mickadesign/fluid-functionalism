"use client";

import dynamic from "next/dynamic";
import type { ComponentType } from "react";
import { usePreviewPlayback } from "@/lib/docs/preview-playback";

// ---------------------------------------------------------------------------
// What a New entry shows under its sentence: the live component, the same
// preview its Showcase tile renders, or the system page's own demo. A slug
// with neither (a page-less change) shows its text alone.
//
// Every preview loads lazily, in its own client-only chunk, once its stage
// nears the viewport: the page's first load carries none of them.
// ---------------------------------------------------------------------------

/** The slugs `previewMap` in app/components/bento-previews.tsx covers,
 *  listed here so the page knows which entries get a stage without loading
 *  the previews. tests/changelog.test.ts holds the two lists equal. */
export const SHOWCASE_PREVIEW_SLUGS = new Set([
  "accordion",
  "ask-user-questions",
  "badge",
  "banner",
  "button",
  "calendar",
  "card",
  "carousel-dots",
  "chat-message",
  "checkbox-group",
  "color-picker",
  "combobox",
  "command-menu",
  "date-picker",
  "dialog",
  "dropdown",
  "input-copy",
  "input-group",
  "input-message",
  "radio-group",
  "select",
  "sidebar",
  "slider",
  "switch",
  "table",
  "tabs",
  "thinking-indicator",
  "thinking-steps",
  "tooltip",
]);

const ShowcasePreview = dynamic(
  () =>
    import("@/app/components/bento-previews").then(({ previewMap }) => {
      function ShowcasePreview({ slug }: { slug: string }) {
        const Preview = previewMap[slug];
        return Preview ? <Preview /> : null;
      }
      return ShowcasePreview;
    }),
  { ssr: false }
);

const FluidHoverPreview = dynamic(
  () =>
    import("@/app/docs/fluid-hover/demos").then(({ PlainVsFluidPreview }) => {
      function FluidHoverPreview() {
        return <PlainVsFluidPreview paused={!usePreviewPlayback()} />;
      }
      return FluidHoverPreview;
    }),
  { ssr: false }
);

const SizesPreview = dynamic(() => import("@/app/docs/sizes/toolbar-demo").then((m) => m.ToolbarDemo), {
  ssr: false,
});

const SkillPreview = dynamic(() => import("@/app/docs/skill/examples").then((m) => m.TabsExample), {
  ssr: false,
});

/** System pages have no Showcase tile: their own page's demo stands in. */
const SYSTEM_PREVIEWS: Record<string, ComponentType> = {
  "fluid-hover": FluidHoverPreview,
  sizes: SizesPreview,
  skill: SkillPreview,
};

export function hasPreview(slug: string): boolean {
  return SHOWCASE_PREVIEW_SLUGS.has(slug) || slug in SYSTEM_PREVIEWS;
}

/** The preview for a slug, fetched the first time it renders. */
export function ChangelogPreview({ slug }: { slug: string }) {
  const System = SYSTEM_PREVIEWS[slug];
  return System ? <System /> : <ShowcasePreview slug={slug} />;
}

/** Stage padding by slug, where a preview needs more room than the default
 *  px-6 py-12 leaves (the Showcase grid's overrides, same reasons). */
export const STAGE_PADDING: Record<string, string> = {
  sidebar: "px-4 py-8",
  card: "px-6 py-5",
  "command-menu": "px-6 py-8",
  "fluid-hover": "px-6 py-8",
  sizes: "px-6 py-8",
  skill: "px-4 py-6",
};

/** The previews that animate by themselves, and so read
 *  usePreviewPlayback(): the changelog gives these a Play / Pause button. */
export const ANIMATED_PREVIEWS = new Set(["carousel-dots", "fluid-hover", "skill"]);
