"use client";

import Link from "next/link";
import { fontWeights } from "@/registry/default/lib/font-weight";
import { Button } from "@/registry/default/button";
import { useIcon } from "@/lib/icon-context";
import { componentList } from "@/lib/docs/components";
import { InputCopy } from "@/registry/default/input-copy";

export default function DocsIndex() {
  const ArrowRight = useIcon("arrow-right");
  const firstComponent = componentList[0];

  return (
    <div className="flex flex-col gap-8 px-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1
            className="text-[22px] sm:text-[28px] text-foreground leading-none mb-2"
            style={{ fontVariationSettings: fontWeights.bold }}
          >
            Introduction
          </h1>
          <p className="text-[13px] text-muted-foreground">
            Why these components feel different.
          </p>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <Button variant="ghost" size="icon" disabled aria-label="No previous page">
            <ArrowRight className="rotate-180" />
          </Button>
          {firstComponent && (
            <Link href={`/docs/${firstComponent.slug}`} aria-label={`Next: ${firstComponent.name}`} className="outline-none" tabIndex={-1}>
              <Button variant="ghost" size="icon">
                <ArrowRight />
              </Button>
            </Link>
          )}
        </div>
      </div>

      <section className="flex flex-col gap-6 text-[14px] text-foreground/90 leading-relaxed">
        <div className="flex flex-col gap-2">
          <h3
            className="text-[16px] text-foreground leading-none"
            style={{ fontVariationSettings: fontWeights.semibold }}
          >
            Motion that communicates
          </h3>
          <p>
            Every transition in this library exists to make a state change legible. When a checkbox toggles, the background merge tells you which items are contiguous. When a dropdown opens, proximity hover shows you which item you're about to select before you click. Nothing moves for decoration — motion is information.
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <h3
            className="text-[16px] text-foreground leading-none"
            style={{ fontVariationSettings: fontWeights.semibold }}
          >
            Hover as preview
          </h3>
          <p>
            Most interactions start before the click. Proximity-based highlights reduce targeting errors by showing users where their action will land. Font weight shifts on hover give buttons a tactile quality. These micro-feedbacks build trust — the interface responds to intention, not just contact.
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <h3
            className="text-[16px] text-foreground leading-none"
            style={{ fontVariationSettings: fontWeights.semibold }}
          >
            Spring physics, not durations
          </h3>
          <p>
            Animations use spring configs instead of fixed durations. Springs respond naturally to interruption — if a user reverses mid-transition, the animation adapts instead of restarting. Three presets (fast, moderate, slow) cover every use case while keeping motion consistent across the system.
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <h3
            className="text-[16px] text-foreground leading-none"
            style={{ fontVariationSettings: fontWeights.semibold }}
          >
            Drop-in compatible
          </h3>
          <p>
            Built on shadcn/ui conventions with Radix primitives underneath. Your existing theme, radius tokens, and setup apply automatically. Install any component with a single CLI command — dependencies resolve themselves.
          </p>
        </div>
      </section>

      <div className="flex flex-col gap-3">
        <h2
          className="text-[16px] text-foreground leading-none"
          style={{ fontVariationSettings: fontWeights.semibold }}
        >
          Installation
        </h2>
        <p className="text-[13px] text-muted-foreground">
          Add any component directly using the shadcn CLI:
        </p>
        <InputCopy value="npx shadcn@latest add https://www.fluidfunctionalism.com/r/button.json" />
        <p className="text-[13px] text-muted-foreground">
          Or configure a registry namespace in your <code className="text-[12px] bg-muted/50 px-1.5 py-0.5 rounded">components.json</code> for shorter commands:
        </p>
        <pre className="overflow-x-auto rounded-xl border border-border/60 bg-muted/30 px-4 py-3 text-[13px] text-foreground">
          <code>{`"registries": {
  "@fluid": "https://www.fluidfunctionalism.com/r/{name}.json"
}`}</code>
        </pre>
        <p className="text-[13px] text-muted-foreground">
          Then install with:
        </p>
        <InputCopy value="npx shadcn@latest add @fluid/button" />
        <p className="text-[13px] text-muted-foreground">
          Dependencies and shared utilities are resolved automatically.
          Font weight animations require the Inter variable font.
        </p>
      </div>
    </div>
  );
}
