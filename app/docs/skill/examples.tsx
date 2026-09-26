"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { cn } from "@/registry/default/lib/utils";
import { useShape } from "@/registry/default/lib/shape-context";
import { InputCopy } from "@/registry/default/input-copy";
import { Tabs, TabsList, TabItem } from "@/registry/radix/tabs";
import { Compare, turns, useLoop, usePlayback, type Side } from "./hero-shared";

// ---------------------------------------------------------------------------
// The hero's other examples. Each pairs what an agent writes on its own with
// what it writes following the skill's references: the real Tabs component,
// InputCopy component, and the Button's 1px press.
// The script plays the generic side, then the skill side, turn by turn; a
// real pointer takes over while inside.
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Tabs: weight without reflow and a sliding indicator
// ---------------------------------------------------------------------------

const TABS = ["Overview", "Activity", "Settings"];

/** Generic: font-semibold on the active tab widens it and shoves its
 *  neighbors; the active background jumps. */
function GenericTabs({ selected, onSelect }: { selected: number; onSelect: (i: number) => void }) {
  const shape = useShape();
  return (
    <div role="tablist" className={cn("inline-flex gap-1 bg-muted p-1", shape.container)}>
      {TABS.map((label, i) => (
        <button
          key={label}
          type="button"
          role="tab"
          aria-selected={selected === i}
          onClick={() => onSelect(i)}
          className={cn(
            "h-7 px-3 text-body text-muted-foreground hover:bg-background/60",
            selected === i && "bg-background font-semibold text-foreground shadow-sm hover:bg-background",
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
  const [generic, setGeneric] = useState(0);
  const [skill, setSkill] = useState(0);
  const [active, setActive] = useState<Side | null>(null);
  const set = (side: Side) => (side === "generic" ? setGeneric : setSkill);
  useLoop(
    playing,
    turns(setActive, (side) => [
      { ms: 1000, run: () => set(side)(1) },
      { ms: 1000, run: () => set(side)(2) },
      { ms: 1200, run: () => set(side)(0) },
    ])
  );

  return (
    <Compare
      rootRef={rootRef}
      bind={bind}
      active={playing ? active : null}
      generic={<GenericTabs selected={generic} onSelect={setGeneric} />}
      skill={
        <Tabs selectedIndex={skill} onSelect={setSkill}>
          <TabsList>
            {TABS.map((label) => (
              <TabItem key={label} value={label} label={label} />
            ))}
          </TabsList>
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
      <span className="min-w-0 flex-1 truncate font-mono text-caption text-muted-foreground">{COMMAND}</span>
      {children}
    </div>
  );
}

const actionClass =
  "flex h-7 shrink-0 items-center gap-1.5 px-1.5 text-caption text-muted-foreground hover:text-foreground";

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

export function CopyExample() {
  const { rootRef, playing, bind } = usePlayback();
  const [generic, setGeneric] = useState(false);
  const [active, setActive] = useState<Side | null>(null);
  useLoop(
    playing,
    [
      { ms: 1400, run: () => { setActive("generic"); setGeneric(true); } },
      { ms: 900, run: () => setGeneric(false) },
      // The real component owns its copy feedback. Autoplay never writes
      // to the clipboard; visitors can hover and click the whole field.
      { ms: 2300, run: () => setActive("skill") },
    ]
  );

  return (
    <Compare
      rootRef={rootRef}
      bind={bind}
      active={playing ? active : null}
      generic={<GenericCopy copied={generic} onCopy={() => setGeneric((v) => !v)} />}
      skill={
        <InputCopy value={COMMAND} align="left" className="w-full max-w-[240px]" />
      }
    />
  );
}

// ---------------------------------------------------------------------------
// Button press: 1px per side, not a scale
// ---------------------------------------------------------------------------

/** Script and pointer both drive `pressed`, since :active can't be scripted. */
function usePress(pressed: boolean, setPressed: (v: boolean) => void) {
  return {
    "data-pressed": pressed,
    onPointerDown: () => setPressed(true),
    onPointerUp: () => setPressed(false),
    onPointerLeave: () => setPressed(false),
  };
}

const wideButton =
  "relative inline-flex h-9 w-52 items-center justify-center text-body text-background outline-none";

/** Generic: scale(0.95) on a 208px button takes about 5px off each side
 *  but under 1px off the top and bottom, so a wide button squashes. */
function GenericPress({ pressed, setPressed }: { pressed: boolean; setPressed: (v: boolean) => void }) {
  const shape = useShape();
  return (
    <button
      type="button"
      {...usePress(pressed, setPressed)}
      className={cn(
        wideButton,
        "bg-foreground transition-transform duration-150 ease-out",
        pressed && "scale-95",
        shape.bg
      )}
    >
      Continue
    </button>
  );
}

/** With the skill: the Button's press. The surface sits 1px inside and a
 *  same-color 1px spread fills it out; pressing collapses the spread, so the
 *  surface shrinks exactly 1px per side at any width. Fast in (80ms), slow
 *  out (180ms). */
function SkillPress({ pressed, setPressed }: { pressed: boolean; setPressed: (v: boolean) => void }) {
  const shape = useShape();
  return (
    <button type="button" {...usePress(pressed, setPressed)} className={cn(wideButton, shape.bg)}>
      <span
        aria-hidden
        className={cn(
          "absolute inset-px rounded-[inherit] bg-[var(--btn-bg)] transition-[box-shadow,background-color]",
          pressed
            ? "shadow-[0_0_0_0px_var(--btn-bg)] [--btn-bg:color-mix(in_oklab,var(--foreground)_80%,var(--background))] [transition-duration:80ms,80ms]"
            : "shadow-[0_0_0_1px_var(--btn-bg)] [--btn-bg:var(--foreground)] [transition-duration:180ms,80ms] [transition-timing-function:cubic-bezier(0.23,1,0.32,1),ease]"
        )}
      />
      <span className="relative">Continue</span>
    </button>
  );
}

export function PressExample() {
  const { rootRef, playing, bind } = usePlayback();
  const [generic, setGeneric] = useState(false);
  const [skill, setSkill] = useState(false);
  const [active, setActive] = useState<Side | null>(null);
  const set = (side: Side) => (side === "generic" ? setGeneric : setSkill);
  useLoop(
    playing,
    turns(setActive, (side) => [
      { ms: 260, run: () => set(side)(true) },
      { ms: 700, run: () => set(side)(false) },
      { ms: 260, run: () => set(side)(true) },
      { ms: 1000, run: () => set(side)(false) },
    ])
  );

  return (
    <Compare
      rootRef={rootRef}
      bind={bind}
      active={playing ? active : null}
      generic={<GenericPress pressed={generic} setPressed={setGeneric} />}
      skill={<SkillPress pressed={skill} setPressed={setSkill} />}
    />
  );
}
