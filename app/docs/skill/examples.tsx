"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { cn } from "@/registry/default/lib/utils";
import { useShape } from "@/registry/default/lib/shape-context";
import { InputCopy } from "@/registry/default/input-copy";
import { Tabs, TabsItem } from "@/components/flavored/tabs";
import { Compare, clickStep, turns, useLoop, usePlayback, useScriptCursor, type Side } from "./hero-shared";

// ---------------------------------------------------------------------------
// The other /docs/skill examples. Each pairs what an agent writes on its own with
// what it writes following the skill's references: the real Tabs component,
// InputCopy component, and the Button's 1px press.
// The script plays the generic side, then the skill side, turn by turn, with
// a cursor that glides to each target and clicks it; a real pointer takes
// over while inside.
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Tabs: weight without reflow and a sliding pill
// ---------------------------------------------------------------------------

const TABS = ["Overview", "Activity", "Settings"];

/** Generic tabs: font-semibold on the active tab widens it and
 *  shoves its neighbors; the active pill jumps instead of sliding, and each
 *  tab paints its own hover. */
function GenericTabs({ selected, onSelect }: { selected: number; onSelect: (i: number) => void }) {
  const shape = useShape();
  return (
    <div role="tablist" className="inline-flex">
      {TABS.map((label, i) => (
        <button
          key={label}
          type="button"
          role="tab"
          aria-selected={selected === i}
          onClick={() => onSelect(i)}
          className={cn(
            "h-9 px-3 text-site-body text-muted-foreground [&:is(:hover,[data-script-hover])]:bg-muted/60",
            // eslint-disable-next-line no-restricted-syntax -- the generic version, bold on purpose to show the reflow
            selected === i && "bg-muted font-semibold text-foreground [&:is(:hover,[data-script-hover])]:bg-muted",
            shape.bg
          )}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

export function TabsExample() {
  const { rootRef, playing, bind } = usePlayback();
  const cursor = useScriptCursor(rootRef, playing);
  const [generic, setGeneric] = useState(0);
  const [skill, setSkill] = useState(0);
  const [active, setActive] = useState<Side | null>(null);
  const set = (side: Side) => (side === "generic" ? setGeneric : setSkill);
  const tab = (side: Side) => `[data-side="${side}"] [role="tab"]`;
  useLoop(
    playing,
    turns(setActive, (side) => [
      ...clickStep(cursor, tab(side), 1, () => set(side)(1), 700),
      ...clickStep(cursor, tab(side), 2, () => set(side)(2), 700),
      ...clickStep(cursor, tab(side), 0, () => set(side)(0), 900),
    ])
  );

  return (
    <Compare
      rootRef={rootRef}
      bind={bind}
      active={playing ? active : null}
      cursor={playing ? cursor : null}
      generic={<GenericTabs selected={generic} onSelect={setGeneric} />}
      skill={
        <Tabs selectedIndex={skill} onSelect={setSkill} idPrefix="skill-example-tabs" aria-label="Example tabs">
          {TABS.map((label, i) => (
            <TabsItem key={label} index={i} label={label} />
          ))}
        </Tabs>
      }
    />
  );
}

// ---------------------------------------------------------------------------
// Copy field: the action swaps in place, the field never reflows
// ---------------------------------------------------------------------------

const COMMAND = "npx skills add mickadesign/fluid-functionalism";

/** The generic read-only field: the command, truncated, with the
 *  copy action inside on the right, like shadcn's copy input. */
function CopyField({ children }: { children: React.ReactNode }) {
  const shape = useShape();
  return (
    <div
      className={cn(
        "flex h-9 w-full max-w-[240px] items-center gap-1 border border-border bg-background pl-3 pr-1",
        shape.bg
      )}
    >
      <span className="min-w-0 flex-1 truncate font-mono text-site-caption text-muted-foreground">{COMMAND}</span>
      {children}
    </div>
  );
}

const actionClass =
  "flex h-7 shrink-0 items-center gap-1.5 px-1.5 text-site-caption text-muted-foreground [&:is(:hover,[data-script-hover])]:text-foreground";

/** Generic: the icon snaps to a check and "Copy" turns into "Copied!", which
 *  is wider, so the action grows and eats into the command text. */
function GenericCopy({ copied, onCopy }: { copied: boolean; onCopy: () => void }) {
  const shape = useShape();
  const Icon = copied ? Check : Copy;
  return (
    <CopyField>
      <button type="button" onClick={onCopy} className={cn(actionClass, shape.bg)}>
        <Icon className="size-3.5" strokeWidth={1.5} />
        {copied ? "Copied!" : "Copy"}
      </button>
    </CopyField>
  );
}

/** Clicks the real InputCopy so it plays its own feedback, without touching
 *  the visitor's clipboard. A stand-in `writeText` swallows the one write of
 *  `value` this click makes, whenever InputCopy gets to it, and passes any
 *  other write through; it steps aside after that write, or after 1s. With
 *  no async Clipboard API, InputCopy would fall back to execCommand, which
 *  nothing can intercept, so the click is skipped. */
function clickWithoutClipboard(button: HTMLElement | null, value: string) {
  const clipboard = navigator.clipboard;
  if (!button || !clipboard) return;
  const own = Object.prototype.hasOwnProperty.call(clipboard, "writeText");
  const writeText = clipboard.writeText;
  let restored = false;
  const restore = () => {
    if (restored) return;
    restored = true;
    if (own) clipboard.writeText = writeText;
    else Reflect.deleteProperty(clipboard, "writeText");
  };
  clipboard.writeText = (text: string) => {
    if (text !== value) return writeText.call(clipboard, text);
    restore();
    return Promise.resolve();
  };
  window.setTimeout(restore, 1000);
  button.click();
}

export function CopyExample() {
  const { rootRef, playing, bind } = usePlayback();
  const cursor = useScriptCursor(rootRef, playing);
  const [generic, setGeneric] = useState(false);
  const [active, setActive] = useState<Side | null>(null);
  useLoop(
    playing,
    turns(setActive, (side) =>
      side === "generic"
        ? [
            // Aim for the small action button, the only part that copies.
            ...clickStep(cursor, '[data-side="generic"] button', 0, () => setGeneric(true), 1400),
            { ms: 600, run: () => setGeneric(false) },
          ]
        : // Click the command itself: the whole field copies.
          clickStep(cursor, '[data-side="skill"] mark', 0, () => {
            clickWithoutClipboard(rootRef.current?.querySelector<HTMLElement>('[data-side="skill"] button') ?? null, COMMAND);
          }, 2300)
    ),
    // InputCopy reverts on its own timer; the generic "Copied!" waits on the script.
    () => setGeneric(false)
  );

  return (
    <Compare
      rootRef={rootRef}
      bind={bind}
      active={playing ? active : null}
      cursor={playing ? cursor : null}
      generic={<GenericCopy copied={generic} onCopy={() => setGeneric((v) => !v)} />}
      skill={
        <InputCopy
          value={COMMAND}
          align="left"
          // InputCopy's hover is CSS group-hover on its button, which the
          // scripted cursor can't trigger, so its look is mirrored here for
          // [data-script-hover]: the value tints, the icon thickens, muted
          // text comes up to full strength.
          className="w-full max-w-[240px] [&_button[data-script-hover]_mark]:bg-[color-mix(in_oklab,var(--fluid-accent,#6B97FF)_20%,transparent)] [&_button[data-script-hover]_svg]:stroke-[2] [&_button[data-script-hover]_.text-muted-foreground]:text-foreground"
        />
      }
    />
  );
}

// ---------------------------------------------------------------------------
// Button press: 1px per side, not a scale
// ---------------------------------------------------------------------------

/** Script and pointer both drive which button is down, since :active can't
 *  be scripted. `pressed` is the index of the button held, or null. */
function pressProps(index: number, pressed: number | null, setPressed: (v: number | null) => void) {
  return {
    "data-pressed": pressed === index,
    onPointerDown: () => setPressed(index),
    onPointerUp: () => setPressed(null),
    onPointerLeave: () => setPressed(null),
  };
}

const button = "relative inline-flex items-center justify-center text-background outline-none";

/** The same press on 2 sizes: the compact rung of the ladder above a wide
 *  default button. The script presses them one after the other, so the
 *  difference between them is felt, not just seen. */
const SIZES = [
  { className: "h-7 px-3 text-site-caption", label: "Skip" },
  { className: "h-9 w-full max-w-64 text-site-body", label: "Continue" },
];

type PressProps = { pressed: number | null; setPressed: (v: number | null) => void };

/** Generic: scale(0.9) takes 10% of each button, not a fixed amount. The
 *  48px button loses about 2px a side; the 256px one loses about 13px a side
 *  but under 2px top and bottom, so it squashes. It takes the same pressed
 *  color as the skill side, so the geometry is the only difference. */
function GenericPress({ pressed, setPressed }: PressProps) {
  const shape = useShape();
  return (
    <div className="flex w-full flex-col items-center gap-4">
      {SIZES.map(({ className, label }, i) => (
        <button
          key={label}
          type="button"
          {...pressProps(i, pressed, setPressed)}
          className={cn(
            button,
            className,
            // Tailwind v4's scale-* sets the `scale` property, not transform.
            "bg-foreground transition-[scale,background-color] duration-150 ease-out",
            "[&:is(:hover,[data-script-hover]):not([data-pressed=true])]:bg-foreground/90",
            pressed === i && "scale-90 bg-[color-mix(in_oklab,var(--foreground)_80%,var(--background))]",
            shape.bg
          )}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

/** With the skill: the Button's press. The surface sits 1px inside and a
 *  same-color 1px spread fills it out; pressing collapses the spread, so the
 *  surface shrinks exactly 1px per side at any size. Fast in (80ms), slow
 *  out (180ms). */
function SkillPress({ pressed, setPressed }: PressProps) {
  const shape = useShape();
  return (
    <div className="flex w-full flex-col items-center gap-4">
      {SIZES.map(({ className, label }, i) => (
        <button
          key={label}
          type="button"
          {...pressProps(i, pressed, setPressed)}
          className={cn(
            button,
            className,
            // The Button's hover: the surface eases 10% toward the page.
            "[--btn-rest:var(--foreground)] [&:is(:hover,[data-script-hover])]:[--btn-rest:color-mix(in_oklab,var(--foreground)_90%,var(--background))]",
            shape.bg
          )}
        >
          <span
            aria-hidden
            className={cn(
              "absolute inset-px rounded-[inherit] bg-[var(--btn-bg)] transition-[box-shadow,background-color]",
              pressed === i
                ? "shadow-[0_0_0_0px_var(--btn-bg)] [--btn-bg:color-mix(in_oklab,var(--foreground)_80%,var(--background))] [transition-duration:80ms,80ms]"
                : "shadow-[0_0_0_1px_var(--btn-bg)] [--btn-bg:var(--btn-rest)] [transition-duration:180ms,80ms] [transition-timing-function:cubic-bezier(0.23,1,0.32,1),ease]"
            )}
          />
          <span className="relative">{label}</span>
        </button>
      ))}
    </div>
  );
}

export function PressExample() {
  const { rootRef, playing, bind } = usePlayback();
  const cursor = useScriptCursor(rootRef, playing);
  const [generic, setGeneric] = useState<number | null>(null);
  const [skill, setSkill] = useState<number | null>(null);
  const [active, setActive] = useState<Side | null>(null);
  const set = (side: Side) => (side === "generic" ? setGeneric : setSkill);
  // Each turn clicks the small button, then the wide one.
  const target = (side: Side) => `[data-side="${side}"] button`;
  useLoop(
    playing,
    turns(setActive, (side) => [
      ...clickStep(cursor, target(side), 0, () => set(side)(0), 260),
      { ms: 400, run: () => set(side)(null) },
      ...clickStep(cursor, target(side), 1, () => set(side)(1), 260),
      { ms: 800, run: () => set(side)(null) },
    ]),
    // Never leave a button held down for the visitor taking over.
    () => {
      setGeneric(null);
      setSkill(null);
    }
  );

  return (
    <Compare
      rootRef={rootRef}
      bind={bind}
      active={playing ? active : null}
      cursor={playing ? cursor : null}
      generic={<GenericPress pressed={generic} setPressed={setGeneric} />}
      skill={<SkillPress pressed={skill} setPressed={setSkill} />}
    />
  );
}
