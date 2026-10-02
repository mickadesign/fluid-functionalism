"use client";

import { type ReactNode } from "react";
import { DocPage, DocSection } from "@/lib/docs/DocPage";
import { PropsTable, type PropDef } from "@/lib/docs/PropsTable";
import { fontWeights } from "@/registry/default/lib/font-weight";
import {
  PlainVsFluidDemo,
  ShowTheMathDemo,
  AxesDemo,
  ListsDemo,
  CostDemo,
} from "./demos";

/** Inline code chip used throughout the prose. */
function Code({ children }: { children: ReactNode }) {
  return (
    <code className="mx-1 rounded bg-[light-dark(#EBEBED,#2C2C2C)] px-1 py-0.5 text-caption text-foreground">
      {children}
    </code>
  );
}


const hookOptions: PropDef[] = [
  { name: "axis", type: '"y" | "x" | "xy"', default: '"y"', description: "Which way the list runs: y for lists, x for strips, xy for grids." },
  { name: "isItemDisabled", type: "(el: HTMLElement) => boolean", description: "Skips an item: never lit, never clicked. Runs on every move, so keep it cheap." },
  { name: "gapClick", type: "boolean | { maxDistance?: number }", default: "true", description: "A click between items goes to the lit one. false turns it off. maxDistance limits it to clicks within that many px." },
];

const hookReturn: PropDef[] = [
  { name: "handlers", type: "{ onMouseEnter, onMouseMove, onMouseLeave, onClick }", description: "Spread onto the container. Mouse only. onClick is the gap click." },
  { name: "registerItem", type: "(index, element | null) => void", description: "Give it to each row. Indices start at 0 and must not change while the list is on screen." },
  { name: "activeIndex", type: "number | null", description: "The lit item, or null. Also set as data-fluid-hover-active on the item." },
  { name: "setActiveIndex", type: "(index | null) => void", description: "Light an item yourself, for keyboard focus. The hook never moves focus." },
  { name: "itemRects", type: "ItemRect[]", description: "Each item's box inside the container. Survives a parent scale, not a rotation." },
  { name: "isMeasured", type: "boolean", description: "True once every item has a box. Measured again on register and on resize." },
  { name: "remeasure", type: "() => void", description: "Measure again and hide the highlight until done. Call it when a popup opens." },
  { name: "sessionRef", type: "RefObject<number>", description: "Counts pointer entries. The highlight fades in fresh on each one." },
  { name: "pointerDrivenRef", type: "RefObject<boolean>", description: "True while the pointer lights the highlight. A key press, a press outside, or leaving turns it off." },
];

const highlightProps: PropDef[] = [
  { name: "hover", type: "ReturnType<typeof useFluidHover>", description: "The hook. The highlight reads what it needs from it." },
  { name: "hidden", type: "boolean", default: "false", description: "Show nothing, keep the state. A closed popup." },
  { name: "from", type: "ItemRect | null", description: "Where a fresh highlight fades in from when the pointer lights it. Dropdowns pass the checked row. A row lit by the keyboard fades in where it is." },
  { name: "className", type: "string", description: "Radius and z-index. The container must be position: relative." },
  { name: "transition", type: "Transition | false", default: "spring.fast", description: "The travel. false snaps in place after a reflow." },
];

function UseList({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="flex flex-col gap-2">
      <h2
        className="text-title leading-none text-foreground"
        style={{ fontVariationSettings: fontWeights.semibold }}
      >
        {title}
      </h2>
      <ul className="flex list-disc flex-col gap-1.5 pl-5 marker:text-muted-foreground/50">
        {items.map((item) => (
          <li key={item} className="pl-1 text-body leading-relaxed text-muted-foreground">
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
      installSlug="use-fluid-hover"
      installNote="Installs the useFluidHover hook, the FluidHoverHighlight component, and the springs tokens, and adds framer-motion as a dependency. Every list, menu, strip, and grid in the library hovers with it."
      description="Hover that never blinks and always follows your cursor to the nearest item."
    >
      <DocSection title="Blink or glide">
        <p className="text-body leading-relaxed text-muted-foreground">
          Watch both cursors. The left blinks off and on 9 times per pass,
          and each blink pulls your eye back to the list. The right glides
          once, and your eye stays on the task.
        </p>
        <PlainVsFluidDemo />
      </DocSection>

      <DocSection title="Show the math">
        <p className="text-body leading-relaxed text-muted-foreground">
          1 rule, no dead zones: the nearest dot wins. Flip the switch and
          that is the whole algorithm.
        </p>
        <ShowTheMathDemo />
      </DocSection>

      <DocSection title="3 axes">
        <p className="text-body leading-relaxed text-muted-foreground">
          Menus, tabs, and card grids all feel the same under the cursor.
          Pass <Code>y</Code>, <Code>x</Code>, or <Code>xy</Code> and the
          highlight follows you down the list, across the strip, or to the
          closest card.
        </p>
        <AxesDemo />
      </DocSection>

      <DocSection title="When to split a list">
        <p className="text-body leading-relaxed text-muted-foreground">
          Split at the divider. Rows that are alternatives to each other share
          1 list, children included, and the highlight never crosses into
          the next one.
        </p>
        <ListsDemo />
      </DocSection>

      <DocSection title="What it costs">
        <p className="text-body leading-relaxed text-muted-foreground">
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
        <p className="text-body leading-relaxed text-muted-foreground">
          The highlight respects the OS setting on its own. Turn on reduced
          motion and the travel drops out: the highlight still fades in on
          the nearest row, it just stops sliding between rows. No{" "}
          <Code>{`<MotionConfig>`}</Code> needed, so a copied component
          behaves the same in your app.
        </p>
      </DocSection>

      <DocSection title="Reference">
        <p className="text-body leading-relaxed text-muted-foreground">
          <Code>useFluidHover(containerRef, options)</Code> picks, the
          highlight draws. Focus, roles, and focus rings stay with your rows.
        </p>
        <h3
          className="mt-2 text-[15px] text-foreground"
          style={{ fontVariationSettings: fontWeights.semibold }}
        >
          Options
        </h3>
        <PropsTable props={hookOptions} />
        <h3
          className="mt-6 text-[15px] text-foreground"
          style={{ fontVariationSettings: fontWeights.semibold }}
        >
          Returns
        </h3>
        <PropsTable props={hookReturn} />
        <h3
          className="mt-6 text-[15px] text-foreground"
          style={{ fontVariationSettings: fontWeights.semibold }}
        >
          FluidHoverHighlight
        </h3>
        <PropsTable props={highlightProps} />
        <p className="text-body leading-relaxed text-muted-foreground">
          The highlight moves on a transform. Width and height only animate
          between items of different sizes.
        </p>
      </DocSection>
    </DocPage>
  );
}
