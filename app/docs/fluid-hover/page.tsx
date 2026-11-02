"use client";

import { type ReactNode } from "react";
import { DocPage, DocSection } from "@/lib/docs/DocPage";
import { PropsTable } from "@/lib/docs/PropsTable";
import { fontWeights } from "@/registry/default/lib/font-weight";
import {
  PlainVsFluidDemo,
  ShowTheMathDemo,
  AxesDemo,
  ListsDemo,
  CostDemo,
} from "./demos";
import { hookOptions, hookReturn, highlightProps } from "@/lib/docs/api/fluid-hover";

/** Inline code chip used throughout the prose. */
function Code({ children }: { children: ReactNode }) {
  return (
    <code className="mx-1 rounded bg-[light-dark(#EBEBED,#2C2C2C)] px-1 py-0.5 text-site-caption text-foreground">
      {children}
    </code>
  );
}

function UseList({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="flex flex-col gap-2">
      <h2
        className="text-site-title leading-none text-foreground"
        style={{ fontVariationSettings: fontWeights.semibold }}
      >
        {title}
      </h2>
      <ul className="flex list-disc flex-col gap-1.5 pl-5 marker:text-muted-foreground">
        {items.map((item) => (
          <li key={item} className="pl-1 text-site-body text-muted-foreground">
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function FluidHoverDoc() {
  return (
    <DocPage
      title="Fluid Hover"
      slug="fluid-hover"
      description="Hover that glides from item to item under your cursor instead of blinking between them."
    >
      <DocSection title="Blink or glide">
        <p className="text-site-body text-muted-foreground">
          Watch both cursors. The left blinks off and on 9 times per pass,
          and each blink pulls your eye back to the list. The right glides
          once, and your eye stays on the task.
        </p>
        <PlainVsFluidDemo />
      </DocSection>

      <DocSection title="Show the math">
        <p className="text-site-body text-muted-foreground">
          By default the item under the pointer lights, and empty space puts
          the highlight out. Pass <Code>nearest</Code> for 1 rule with no dead
          zones: the nearest dot wins. Flip the switch and that is the whole
          algorithm.
        </p>
        <ShowTheMathDemo />
      </DocSection>

      <DocSection title="3 axes">
        <p className="text-site-body text-muted-foreground">
          Menus, tabs, and card grids all feel the same under the cursor. With{" "}
          <Code>nearest</Code>, pass <Code>y</Code>, <Code>x</Code>, or{" "}
          <Code>xy</Code> to say how near is measured: down the list, across
          the strip, or to the closest card.
        </p>
        <AxesDemo />
      </DocSection>

      <DocSection title="When to split a list">
        <p className="text-site-body text-muted-foreground">
          Split at the divider. Rows that are alternatives to each other share
          1 list, children included, and the highlight never crosses into
          the next one.
        </p>
        <ListsDemo />
      </DocSection>

      <DocSection title="What it costs">
        <p className="text-site-body text-muted-foreground">
          1 element, 1 transform, 1 loop per move. 200 rows below: hover and
          watch the meter.
        </p>
        <CostDemo />
      </DocSection>

      {/* Two columns, no section title: the column headings carry it. Same
          rhythm as a DocSection. */}
      <div className="grid gap-6 pt-6 sm:grid-cols-2">
          <UseList
            title="Use when"
            items={[
              "Everything in the list can be clicked: a menu, a list, tabs, a grid of links.",
              "The items sit close together.",
              "The items stay where they are while you look at them.",
            ]}
          />
          <UseList
            title="Skip when"
            items={[
              "A wrong click would hurt.",
              "Only some of the cards can be clicked.",
              "There is a lot of empty space around the items.",
              "Rows change place as you scroll.",
            ]}
          />
      </div>

      <DocSection title="Reduced motion">
        <p className="text-site-body text-muted-foreground">
          The highlight respects the OS setting on its own. Turn on reduced
          motion and the travel drops out: the highlight still fades in on
          the row under the pointer, it just stops sliding between rows. No{" "}
          <Code>{`<MotionConfig>`}</Code> needed, so a copied component
          behaves the same in your app.
        </p>
      </DocSection>

      <DocSection title="Reference">
        <p className="text-site-body text-muted-foreground">
          <Code>useFluidHover(containerRef, options)</Code> picks, the
          highlight draws. Focus, roles, and focus rings stay with your rows.
        </p>
        <h3
          className="mt-2 text-site-subtitle text-foreground"
          style={{ fontVariationSettings: fontWeights.semibold }}
        >
          Options
        </h3>
        <PropsTable props={hookOptions} />
        <h3
          className="mt-6 text-site-subtitle text-foreground"
          style={{ fontVariationSettings: fontWeights.semibold }}
        >
          Returns
        </h3>
        <PropsTable props={hookReturn} />
        <h3
          className="mt-6 text-site-subtitle text-foreground"
          style={{ fontVariationSettings: fontWeights.semibold }}
        >
          FluidHoverHighlight
        </h3>
        <PropsTable props={highlightProps} />
        <p className="text-site-body text-muted-foreground">
          The highlight moves on a transform. Width and height only animate
          between items of different sizes.
        </p>
      </DocSection>
    </DocPage>
  );
}
