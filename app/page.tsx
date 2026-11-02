"use client";

import Link from "next/link";
import { componentList } from "@/lib/docs/components";
import { BentoGrid } from "@/app/components/bento-grid";
import { Button } from "@/registry/radix/button";
import { fontWeights } from "@/registry/default/lib/font-weight";
import { useIcon } from "@/lib/icon-context";
import { useSizeVariant } from "@/lib/size-context";
import { Tooltip } from "@/registry/radix/tooltip";
import { StarterPromptButton } from "@/app/components/starter-install";

export default function Page() {
  const ArrowRight = useIcon("arrow-right");
  // Square icon buttons follow the site-wide size step (see /docs/sizes).
  const iconSize =
    useSizeVariant() === "compact" ? ("icon-compact" as const) : ("icon" as const);

  return (
    // reveal-landing-subtle, a preset the Reveal page documents: the hero
    // plays on load, and each tile rises on scroll (reveal-scroll, set in
    // BentoGrid). A value changed on /docs/reveal changes here too.
    <div className="reveal-landing-subtle mt-12 lg:mt-0">
      <div className="w-full max-w-[680px] mx-auto py-20 sm:py-28 px-6">
        {/* The title and the arrows share a row, as on every docs page; the
            description and the buttons run full width under them, so a
            phone keeps each button on one line. */}
        <div className="flex items-center justify-between gap-4">
          <h1
            className="text-site-display text-foreground leading-none"
            style={{ fontVariationSettings: fontWeights.bold }}
          >
            Fluid Functionalism
          </h1>
          {/* -my-2: the buttons overhang the title's line box instead of
              stretching the row. */}
          <div className="flex items-center gap-1 shrink-0 -my-2">
            <Button variant="ghost" size={iconSize} disabled aria-label="No previous page">
              <ArrowRight className="rotate-180" />
            </Button>
            <Tooltip content={<span>Introduction &ensp;<kbd className="font-mono opacity-50">&rarr;</kbd></span>}>
              <Link href="/docs" aria-label="Next: Introduction" className="outline-none" tabIndex={-1}>
                <Button variant="ghost" size={iconSize}>
                  <ArrowRight />
                </Button>
              </Link>
            </Tooltip>
          </div>
        </div>
        <p className="mt-2 text-site-body text-muted-foreground">
          Refined UI components with satisfying hover.
        </p>
        {/* flex-wrap: a narrow screen moves a whole button down; a label
            never breaks (Button is whitespace-nowrap). */}
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <StarterPromptButton size="sm" />
          <Link href="/docs" className="outline-none" tabIndex={-1}>
            <Button variant="secondary" size="sm">Learn more</Button>
          </Link>
          {/* The demo is a desktop stage: phones skip the button. */}
          <Link href="/demo" className="outline-none max-sm:hidden" tabIndex={-1}>
            <Button variant="ghost" size="sm">See demo</Button>
          </Link>
        </div>
      </div>
      <div className="w-full max-w-[1200px] mx-auto px-6 pb-16">
        <BentoGrid components={componentList} />
      </div>
    </div>
  );
}
