"use client";

import Link from "next/link";
import { fontWeights } from "@/registry/default/lib/font-weight";
import { Button } from "@/registry/radix/button";
import { useIcon } from "@/lib/icon-context";
import { docOrder } from "@/lib/docs/components";
import { InputCopy } from "@/registry/default/input-copy";
import { Tooltip } from "@/registry/radix/tooltip";

export default function DocsIndex() {
  const ArrowRight = useIcon("arrow-right");
  const firstComponent = docOrder[0];

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
          <Tooltip content={<span>Showcase &ensp;<kbd className="font-mono opacity-50">&larr;</kbd></span>}>
            <Link href="/" aria-label="Previous: Showcase" className="outline-none" tabIndex={-1}>
              <Button variant="ghost" size="icon">
                <ArrowRight className="rotate-180" />
              </Button>
            </Link>
          </Tooltip>
          {firstComponent && (
            <Tooltip content={<span>{firstComponent.name} &ensp;<kbd className="font-mono opacity-50">&rarr;</kbd></span>}>
              <Link href={`/docs/${firstComponent.slug}`} aria-label={`Next: ${firstComponent.name}`} className="outline-none" tabIndex={-1}>
                <Button variant="ghost" size="icon">
                  <ArrowRight />
                </Button>
              </Link>
            </Tooltip>
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
            Every animation here points at something. When two list items
            merge their backgrounds, the component tells you they belong
            together. The hover highlight follows your cursor before you
            click, so the row you&apos;re about to land on confirms
            itself first. Motion has a job to create meaning.
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
            The interaction starts before you click. The closest
            interactive thing to your cursor gets a faint highlight;
            buttons gain a little weight as you approach. By the time
            your finger lands, you&apos;ve had a moment to reconsider,
            which is mostly the point.
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
            Animations use springs, not fixed-duration eases. Toggle a
            switch and immediately toggle it back: the spring picks up
            wherever it was and reverses, instead of finishing the first
            animation before starting the second. Three presets, named
            fast, moderate, and slow, cover most of the library.
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
            Built on shadcn/ui. Each component comes in two flavors,
            Radix or Base UI, so you can match whichever primitive
            library you&apos;ve already chosen. Your theme tokens
            (colors, radii, fonts) work as-is. One CLI command installs
            a component along with whatever it needs.
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <h3
            className="text-[16px] text-foreground leading-none"
            style={{ fontVariationSettings: fontWeights.semibold }}
          >
            Customize using the right panel
          </h3>
          <p>
            The panel on the right lets you change things on the fly.
            Switch between light and dark mode, toggle the corner radius
            from rounded to pill, cycle through different icon libraries,
            or pick whether the install command grabs the Radix flavor or
            the Base UI one. Press T, R, or I to flip the first three
            from the keyboard.
          </p>
        </div>
      </section>

      <hr className="border-border/60 my-8" />
      <div className="flex flex-col gap-3 mb-4">
        <h2
          className="text-[16px] text-foreground leading-none"
          style={{ fontVariationSettings: fontWeights.semibold }}
        >
          Installation
        </h2>
        <div className="flex flex-col gap-2 mt-2">
          <p className="text-[13px] text-muted-foreground flex items-center gap-2 ml-1">
            <span className="inline-flex items-center justify-center size-[18px] rounded-full bg-muted text-muted-foreground text-[11px] shrink-0" style={{ fontVariationSettings: fontWeights.medium }}>1</span>
            Add the registry to your project:
          </p>
          <InputCopy value="npx shadcn@latest registry add @fluid" align="left" className="w-fit" />
        </div>
        <div className="flex flex-col gap-2 mt-2">
          <p className="text-[13px] text-muted-foreground flex items-center gap-2 ml-1">
            <span className="inline-flex items-center justify-center size-[18px] rounded-full bg-muted text-muted-foreground text-[11px] shrink-0" style={{ fontVariationSettings: fontWeights.medium }}>2</span>
            Install any component:
          </p>
          <InputCopy value="npx shadcn@latest add @fluid/button" align="left" className="w-fit" />
        </div>
        <hr className="border-border/60 mt-4" />
        <p className="text-[13px] text-muted-foreground">
          Or install directly without adding the registry:
        </p>
        <InputCopy value="npx shadcn@latest add https://www.fluidfunctionalism.com/r/button.json" align="left" className="w-fit" />
        <p className="text-[13px] text-muted-foreground">
          Dependencies and shared utilities are resolved automatically.
          Font weight animations require the Inter variable font.
        </p>
      </div>
    </div>
  );
}
