"use client";

// The Reveal page is the source the rest follows. When its content, values,
// or classes change, update in the same change:
//  - skills/fluid-functionalism/references/custom-motion.md, "Page reveals"
//  - skills/fluid-functionalism/SKILL.md, the "Page reveals are 1 class" rule
//  - lib/docs/prompt-entries.ts `reveal` (then `node scripts/build-skill-craft.mjs`)
//  - lib/docs/api/reveal.ts (reference tables; values derive from the presets)
//  - motion-guidelines.md, "Page reveals"
//  - values: lib/reveal/presets.ts, then `npm run reveal-css` regenerates
//    app/globals.css and the `reveal` registry item (tests/reveal.test.ts)
//  - the Showcase (app/page.tsx + app/components/bento-grid.tsx) runs on
//    reveal-landing-subtle and reveal-scroll: check it still reads right

import { Fragment, type ReactNode } from "react";
import { DocPage, DocSection } from "@/lib/docs/DocPage";
import { PropsTable } from "@/lib/docs/PropsTable";
import { fontWeights } from "@/registry/default/lib/font-weight";
import { PresetDemo } from "./demos";
import { apiReference } from "@/lib/docs/api/reveal";

/** Inline code chip used throughout the prose. */
function Code({ children }: { children: ReactNode }) {
  return (
    <code className="mx-1 rounded bg-[light-dark(#EBEBED,#2C2C2C)] px-1 py-0.5 text-site-caption text-foreground">
      {children}
    </code>
  );
}

function Subtitle({ children }: { children: ReactNode }) {
  return (
    <h3
      className="mt-2 text-site-subtitle text-foreground"
      style={{ fontVariationSettings: fontWeights.semibold }}
    >
      {children}
    </h3>
  );
}

function List({ title, items }: { title: string; items: ReactNode[] }) {
  return (
    <div className="flex flex-col gap-2">
      <h2
        className="text-site-title leading-none text-foreground"
        style={{ fontVariationSettings: fontWeights.semibold }}
      >
        {title}
      </h2>
      <ul className="flex list-disc flex-col gap-1.5 pl-5 marker:text-muted-foreground">
        {items.map((item, i) => (
          <li key={i} className="pl-1 text-site-body text-muted-foreground">
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function RevealDoc() {
  return (
    <DocPage
      title="Reveal"
      slug="reveal"
      description="1 class reveals a whole page, on load and on scroll."
    >
      <DocSection title="Landing">
        <p className="text-site-body text-muted-foreground">
          2 modes, default and subtle, for a page read once: each section
          arrives as the reader reaches it, so the page tells its story in
          order. Add <Code>reveal-landing</Code> or{" "}
          <Code>reveal-landing-subtle</Code> to its container.
        </p>
        <PresetDemo preset="Landing" />
      </DocSection>

      <DocSection title="Product">
        <p className="text-site-body text-muted-foreground">
          2 modes, default and subtle, for the app people come back to: the
          screen settles in once and nothing moves on scroll, so the 10th visit
          stays as calm as the first. Add <Code>reveal-product</Code> or{" "}
          <Code>reveal-product-subtle</Code> to its main column.
        </p>
        <PresetDemo preset="Product" />
        <p className="text-site-body text-muted-foreground">
          Slow data shows shadcn&apos;s <Code>Skeleton</Code>. Wrap it and the
          real block in <Code>reveal-swap</Code>, and add{" "}
          <Code>reveal-items</Code> to both for rows one by one.
        </p>
      </DocSection>

      {/* Two columns, no section title: the column headings carry it, as on
          the Fluid Hover page. */}
      <div className="grid gap-6 pt-6 sm:grid-cols-2">
        <List
          title="Set it up"
          items={[
            <>
              Put everything on screen at first paint in the hero, product shot
              included.
            </>,
            <>Keep the header, sidebar, and footer outside the container.</>,
            <>
              In a grid, add <Code>reveal-scroll</Code> to each card, and again
              inside it so its content follows, like the Showcase.
            </>,
            <>
              Clip with <Code>overflow: clip</Code>, not <Code>hidden</Code>,
              around anything that reveals on scroll.
            </>,
          ]}
        />
        <List
          title="Built in"
          items={[
            <>
              Just CSS: nothing to load, nothing to hydrate. Landing steps ride{" "}
              <Code>spring.slow</Code>, product steps{" "}
              <Code>spring.moderate</Code>, and scroll steps follow the scroll.
            </>,
            <>Cards already on screen at load play right after the hero.</>,
            <>Browsers without scroll timelines show every section in place.</>,
            <>
              Reduced motion keeps the fades and stops the rise, scale, scroll
              motion, and pulse.
            </>,
          ]}
        />
      </div>

      <DocSection title="Reference">
        {apiReference.map((table) => (
          <Fragment key={table.title}>
            <Subtitle>{table.title}</Subtitle>
            <PropsTable props={table.props} />
          </Fragment>
        ))}
      </DocSection>
    </DocPage>
  );
}
