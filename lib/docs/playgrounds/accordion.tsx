"use client";

import { useState } from "react";
import {
  AccordionGroup,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/registry/radix/accordion";
import { Switch } from "@/registry/radix/switch";
import {
  PLAY_SWITCH,
  PlayField,
  PlaySelect,
  PlaygroundPanel,
} from "@/lib/docs/playground";
import { ACCORDION_ITEMS } from "@/app/components/demo-data";
import type { PlaygroundProps } from "./types";

// ── Accordion playground ─────────────────────────────────
// Two questions: how many items open at once, and what an open one tints.
// `type` and `collapsible` are one decision in practice, so they read as one
// control — "one or none" is the pair, not a flag on top of a mode.

interface PlayState {
  /** one — always exactly one open · oneOrNone — single + collapsible ·
   *  any — multiple. */
  expand: "one" | "oneOrNone" | "any";
  /** On, an expanded item holds its tint (highlight="item"). Off, the fill
   *  scopes to the row and waits for hover (highlight="trigger"). */
  highlightExpanded: boolean;
}

const DEFAULT_STATE: PlayState = {
  expand: "oneOrNone",
  highlightExpanded: true,
};

function pick<T>(options: readonly T[]): T {
  return options[Math.floor(Math.random() * options.length)];
}

export function buildAccordionPlaygroundCode(o: PlayState): string {
  const single = o.expand !== "any";
  const props = [
    `type="${single ? "single" : "multiple"}"`,
    ...(o.expand === "oneOrNone" ? ["collapsible"] : []),
    ...(o.highlightExpanded ? [] : [`highlight="trigger"`]),
    single ? `defaultValue="item-1"` : `defaultValue={["item-1"]}`,
  ].join(" ");
  return [
    `import {`,
    `  AccordionGroup, AccordionItem, AccordionTrigger, AccordionContent,`,
    `} from "./components";`,
    ``,
    ...(o.highlightExpanded
      ? []
      : [
          `{/* highlight="trigger" keeps an open item's tint on the row and`,
          `    leaves its panel on the page's own surface */}`,
        ]),
    `<AccordionGroup ${props}>`,
    `  {items.map((item, i) => (`,
    `    <AccordionItem key={item.value} value={item.value} index={i}>`,
    `      <AccordionTrigger>{item.title}</AccordionTrigger>`,
    `      <AccordionContent>{item.content}</AccordionContent>`,
    `    </AccordionItem>`,
    `  ))}`,
    `</AccordionGroup>`,
  ].join("\n");
}

export function AccordionPlayground({ children }: PlaygroundProps) {
  const [state, setState] = useState<PlayState>(DEFAULT_STATE);
  const set = <K extends keyof PlayState>(key: K, value: PlayState[K]) =>
    setState((prev) => ({ ...prev, [key]: value }));

  const randomize = () =>
    setState({
      expand: pick(["one", "oneOrNone", "oneOrNone", "any"] as const),
      highlightExpanded: Math.random() > 0.4,
    });

  const items = ACCORDION_ITEMS.slice(0, 4);

  // `key` remounts the group when type flips: single and multiple take
  // different defaultValue shapes, and an uncontrolled group keeps the first.
  const single = state.expand !== "any";
  const group = (
    <AccordionGroup
      key={state.expand}
      {...(single
        ? {
            type: "single" as const,
            collapsible: state.expand === "oneOrNone",
            defaultValue: items[0].value,
          }
        : { type: "multiple" as const, defaultValue: [items[0].value] })}
      highlight={state.highlightExpanded ? "item" : "trigger"}
    >
      {items.map((item, i) => (
        <AccordionItem key={item.value} value={item.value} index={i}>
          <AccordionTrigger>{item.title}</AccordionTrigger>
          <AccordionContent>{item.content}</AccordionContent>
        </AccordionItem>
      ))}
    </AccordionGroup>
  );

  const controls = (
    <PlaygroundPanel onShuffle={randomize}>
      <PlayField label="Expand">
        <PlaySelect
          value={state.expand}
          onChange={(v) => set("expand", v as PlayState["expand"])}
          options={[
            { value: "one", label: "One at a time" },
            { value: "oneOrNone", label: "One or none" },
            { value: "any", label: "Any number" },
          ]}
        />
      </PlayField>
      <Switch
        label="Highlight expanded"
        checked={state.highlightExpanded}
        onToggle={() => set("highlightExpanded", !state.highlightExpanded)}
        className={PLAY_SWITCH}
      />
    </PlaygroundPanel>
  );

  return children({
    preview: <div className="flex w-full justify-center px-4 py-10 sm:px-6">{group}</div>,
    demoPreview: <div className="w-full max-w-[320px]">{group}</div>,
    controls,
    code: buildAccordionPlaygroundCode(state),
  });
}
