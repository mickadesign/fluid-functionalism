"use client";

import { useMemo, useState } from "react";
import { Calendar, type DateRange, type Matcher } from "@/components/ui/calendar";
import { Switch } from "@/registry/radix/switch";
import {
  PLAY_SWITCH,
  PlayField,
  PlaySelect,
  PlayDivider,
  PlaygroundPanel,
} from "@/lib/docs/playground";
import {
  CALENDAR_PRESET_DEF,
  CALENDAR_DEFAULT_CODE,
  CALENDAR_BOOKED_OFFSETS,
  CALENDAR_WEEKDAYS,
  DEFAULT_CALENDAR_STATE as DEFAULT_STATE,
  encodeCalendarPreset,
  decodeCalendarPreset,
  type CalendarDays as Days,
  type CalendarPlayState as PlayState,
} from "@/lib/preset/calendar-options";
import {
  usePresetGlobals,
  usePresetUrlSync,
  GetCodeDialog,
} from "@/lib/docs/preset-ui";
import { omit } from "@/lib/omit";
import { PRESET_GLOBAL_KEYS } from "@/lib/preset/sidebar-options";
import type { PlaygroundProps } from "./types";

// ── Calendar playground ──────────────────────────────────
// One calendar, driven by the questions a booking or scheduling screen
// asks: one day or a range, one month or two (and how they sit), how big
// the cells are, and which days can't be picked.

function pick<T>(options: readonly T[]): T {
  return options[Math.floor(Math.random() * options.length)];
}

function addDays(date: Date, days: number) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
}

/** Booked nights a few days out, so the demo always shows some. */
export function demoBookedDays(today = new Date()): Date[] {
  return CALENDAR_BOOKED_OFFSETS.map((n) => addDays(today, n));
}

export function buildCalendarPlaygroundCode(o: PlayState): string {
  const range = o.mode === "range";
  const props = [
    ...(range ? [`mode="range"`] : []),
    `selected={${range ? "range" : "date"}}`,
    `onSelect={${range ? "setRange" : "setDate"}}`,
    ...(o.months === "2" ? [`numberOfMonths={2}`] : []),
    ...(o.months === "2" && o.orientation !== "auto" ? [`orientation="${o.orientation}"`] : []),
    ...(o.cellSize !== "auto" ? [`cellSize={${o.cellSize}}`] : []),
    ...(o.weekNumbers ? ["showWeekNumber"] : []),
    ...(o.days === "booked" ? ["booked={booked}", "disabled={{ before: new Date() }}"] : []),
    ...(o.days === "weekdays" ? ["available={{ dayOfWeek: [1, 2, 3, 4, 5] }}"] : []),
  ];
  return [
    `import { Calendar${range ? ", type DateRange" : ""} } from "./components";`,
    ``,
    range
      ? `const [range, setRange] = useState<DateRange | undefined>();`
      : `const [date, setDate] = useState<Date | undefined>(new Date());`,
    ...(o.days === "booked" ? [`const booked = [/* Date[] of taken nights */];`] : []),
    ``,
    `<Calendar`,
    ...props.map((p) => `  ${p}`),
    `/>`,
  ].join("\n");
}

export function CalendarPlayground({ children }: PlaygroundProps) {
  const [state, setState] = useState<PlayState>(DEFAULT_STATE);
  const set = <K extends keyof PlayState>(key: K, value: PlayState[K]) =>
    setState((prev) => ({ ...prev, [key]: value }));
  const [date, setDate] = useState<Date | undefined>(() => new Date());
  const [range, setRange] = useState<DateRange | undefined>(undefined);
  const booked = useMemo(() => demoBookedDays(), []);

  // ── Get code (presets) ─────────────────────────────────
  const globals = usePresetGlobals();
  const presetCode = encodeCalendarPreset({ ...state, ...globals });
  usePresetUrlSync(presetCode, CALENDAR_DEFAULT_CODE, (raw) => {
    const res = decodeCalendarPreset(raw);
    if (res.ok) {
      // The globals stay with the site settings; the rail takes the rest.
      setState(omit(res.preset, PRESET_GLOBAL_KEYS));
    }
  });

  const randomize = () =>
    setState({
      mode: pick(["single", "range", "range"] as const),
      months: pick(["1", "2"] as const),
      orientation: pick(["auto", "horizontal", "vertical"] as const),
      cellSize: pick(["auto", "auto", "40", "44", "48"] as const),
      weekNumbers: Math.random() > 0.6,
      days: pick(["all", "booked", "weekdays"] as const),
    });

  const dayProps: { booked?: Matcher[]; disabled?: Matcher; available?: Matcher } =
    state.days === "booked"
      ? { booked, disabled: { before: new Date() } }
      : state.days === "weekdays"
        ? { available: { dayOfWeek: [...CALENDAR_WEEKDAYS] } }
        : {};

  const common = {
    ...dayProps,
    numberOfMonths: Number(state.months) as 1 | 2,
    orientation: state.orientation,
    cellSize: state.cellSize === "auto" ? undefined : Number(state.cellSize),
    showWeekNumber: state.weekNumbers,
  };
  const calendar =
    state.mode === "range" ? (
      <Calendar {...common} mode="range" selected={range} onSelect={setRange} />
    ) : (
      <Calendar {...common} selected={date} onSelect={setDate} />
    );

  const controls = (
    <PlaygroundPanel onShuffle={randomize}>
      <PlayField label="Mode">
        <PlaySelect
          value={state.mode}
          onChange={(v) => set("mode", v as PlayState["mode"])}
          options={[
            { value: "single", label: "Single" },
            { value: "range", label: "Range" },
          ]}
        />
      </PlayField>
      <PlayField label="Months">
        <PlaySelect
          value={state.months}
          onChange={(v) => set("months", v as PlayState["months"])}
          options={[
            { value: "1", label: "1" },
            { value: "2", label: "2" },
          ]}
        />
      </PlayField>
      <PlayField label="Orientation" disabled={state.months === "1"}>
        <PlaySelect
          value={state.orientation}
          onChange={(v) => set("orientation", v as PlayState["orientation"])}
          options={[
            { value: "auto", label: "Auto" },
            { value: "horizontal", label: "Horizontal" },
            { value: "vertical", label: "Vertical" },
          ]}
        />
      </PlayField>
      <PlayField label="Cell size">
        <PlaySelect
          value={state.cellSize}
          onChange={(v) => set("cellSize", v as PlayState["cellSize"])}
          options={[
            { value: "auto", label: "Size" },
            { value: "40", label: "40px" },
            { value: "44", label: "44px" },
            { value: "48", label: "48px" },
          ]}
        />
      </PlayField>
      <PlayDivider />
      <PlayField label="Days">
        <PlaySelect
          value={state.days}
          onChange={(v) => set("days", v as Days)}
          options={[
            { value: "all", label: "All open" },
            { value: "booked", label: "Booked + past" },
            { value: "weekdays", label: "Weekdays only" },
          ]}
        />
      </PlayField>
      <Switch
        label="Week numbers"
        checked={state.weekNumbers}
        onToggle={() => set("weekNumbers", !state.weekNumbers)}
        className={PLAY_SWITCH}
      />
      <PlayDivider />
      {/* shadcn's preset principle: the exact configuration above, as a
          stateless code the registry can turn into an installable block. */}
      <GetCodeDialog def={CALENDAR_PRESET_DEF} code={presetCode} />
    </PlaygroundPanel>
  );

  return children({
    preview: <div className="flex w-full justify-center px-6 py-10">{calendar}</div>,
    demoPreview: <div className="flex w-full justify-center">{calendar}</div>,
    demoMaxWidth: 640,
    controls,
    code: buildCalendarPlaygroundCode(state),
  });
}
