"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { fontWeights } from "@/registry/default/lib/font-weight";
import { Button } from "@/registry/radix/button";
import { useIcon } from "@/lib/icon-context";
import { useSizeVariant } from "@/lib/size-context";
import { InputCopy } from "@/registry/default/input-copy";
import { Tooltip, TooltipGroup } from "@/registry/radix/tooltip";
import { StarterPromptButton } from "@/app/components/starter-install";

export default function DocsIndex() {
  const ArrowRight = useIcon("arrow-right");
  // Square icon buttons follow the site-wide size step (see /docs/sizes).
  const iconSize =
    useSizeVariant() === "compact" ? ("icon-compact" as const) : ("icon" as const);

  return (
    <div className="flex flex-col gap-8 px-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1
            className="text-site-display text-foreground leading-none mb-2"
            style={{ fontVariationSettings: fontWeights.bold }}
          >
            Introduction
          </h1>
          <p className="text-site-body text-muted-foreground">
            Fluid motion, functional form.
          </p>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {/* Prev and next share one gliding tooltip. */}
          <TooltipGroup>
            <Tooltip content="Showcase" shortcut="←">
              <Link href="/" aria-label="Previous: Showcase" className="outline-none" tabIndex={-1}>
                <Button variant="ghost" size={iconSize}>
                  <ArrowRight className="rotate-180" />
                </Button>
              </Link>
            </Tooltip>
            <Tooltip content="Changelog" shortcut="→">
              <Link href="/changelog" aria-label="Next: Changelog" className="outline-none" tabIndex={-1}>
                <Button variant="ghost" size={iconSize}>
                  <ArrowRight />
                </Button>
              </Link>
            </Tooltip>
          </TooltipGroup>
        </div>
      </div>

      <section className="flex flex-col gap-6 text-site-body text-muted-foreground">
        <IntroSection
          title="Fluid"
          lead={
            <>
              Components move with continuity and predictability, so you never lose your place.
              <br />
              Interfaces feel fast and reactive. You never wait.
            </>
          }
        />
        <IntroSection
          title="Functionalism"
          lead="Components are stripped down to their essence and their function. Interfaces stay simple and accessible."
        />
        <IntroSection
          title="Built with"
          lead={
            <ul className="flex list-disc flex-col gap-1 pl-5 marker:text-border">
              <li>shadcn/ui</li>
              <li>Radix UI or Base UI</li>
              <li>Motion</li>
              <li>Tailwind CSS v4</li>
              <li>React 19</li>
            </ul>
          }
        />
        <IntroSection
          title="Open source"
          lead={
            <>
              Make them yours with the right panel, then copy the install prompt. MIT licensed, on{" "}
              <a
                href="https://github.com/mickadesign/fluid-functionalism"
                className="text-foreground underline decoration-border underline-offset-4 hover:decoration-foreground transition-[text-decoration-color] duration-80"
              >
                GitHub
              </a>
              .
            </>
          }
        />
      </section>

      <hr className="border-border/60 my-8" />
      <div className="flex flex-col gap-3 mb-4">
        {/* The prompt leads, as on every component page: title and note on
            the left, the copy button on the right. The CLI steps follow. */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex min-w-0 flex-col gap-2">
            <h2
              className="text-site-title text-foreground leading-none"
              style={{ fontVariationSettings: fontWeights.semibold }}
            >
              Installation
            </h2>
            <p className="text-site-body text-muted-foreground">
              Paste it in your coding agent.
            </p>
          </div>
          <StarterPromptButton />
        </div>
        <p className="mt-4 text-site-body text-muted-foreground">Or add the registry, then any component:</p>
        <InputCopy value="npx shadcn@latest registry add @fluid" align="left" className="w-fit" />
        <InputCopy value="npx shadcn@latest add @fluid/button" align="left" className="w-fit" />
      </div>
    </div>
  );
}

/** One intro block: a title over its content. */
function IntroSection({ title, lead }: { title: string; lead: ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <h3
        className="text-site-title text-foreground leading-none"
        style={{ fontVariationSettings: fontWeights.semibold }}
      >
        {title}
      </h3>
      {typeof lead === "string" ? <p>{lead}</p> : <div>{lead}</div>}
    </div>
  );
}
