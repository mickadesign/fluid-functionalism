"use client";

import { useMemo, useState } from "react";
import {
  DatePicker,
  type DateRange,
  type DatePickerPreset,
  type TimeRange,
} from "@/components/ui/date-picker";
import { Switch } from "@/registry/radix/switch";
import {
  PLAY_SWITCH,
  PlayDivider,
  PlayField,
  PlaySelect,
  PlaygroundPanel,
} from "@/lib/docs/playground";
import { omit } from "@/lib/omit";
import { PRESET_GLOBAL_KEYS } from "@/lib/preset/sidebar-options";
import { demoBookedDays } from "./calendar";
import {
  DATE_PICKER_PRESET_DEF,
  DATE_PICKER_DEFAULT_CODE,
  DATE_PICKER_DEFAULT_TIME,
  DATE_PICKER_DEFAULT_TIME_RANGE,
  DEFAULT_DATE_PICKER_STATE as DEFAULT_STATE,
  defaultDatePickerMonths as defaultMonths,
  encodeDatePickerPreset,
  decodeDatePickerPreset,
  type DatePickerTime as Time,
  type DatePickerPlayState as PlayState,
} from "@/lib/preset/date-picker-options";
import {
  usePresetGlobals,
  usePresetUrlSync,
  GetCodeDialog,
} from "@/lib/docs/preset-ui";
import type { PlaygroundProps } from "./types";

// ── DatePicker playground ────────────────────────────────
// What gets picked (a date, a range, a date with a time or a time range),
// how the trigger sits on the page (a field, or inline text), and every
// prop that changes what the popovers show. Handlers, `locale` and the open
// state have no visual knob and stay in the API table.

function pick<T>(options: readonly T[]): T {
  return options[Math.floor(Math.random() * options.length)];
}

function addDays(date: Date, days: number) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
}

/** 4 ranges counted from today. */
export function demoPresets(today = new Date()): DatePickerPreset[] {
  return [
    { label: "Next 7 days", range: { from: today, to: addDays(today, 6) } },
    { label: "Next 14 days", range: { from: today, to: addDays(today, 13) } },
    { label: "Next 30 days", range: { from: today, to: addDays(today, 29) } },
    { label: "This weekend", range: { from: addDays(today, (6 - today.getDay() + 7) % 7), to: addDays(today, ((6 - today.getDay() + 7) % 7) + 1) } },
  ];
}

export function buildDatePickerPlaygroundCode(o: PlayState): string {
  const range = o.mode === "range";
  const time = !range && o.time !== "none" ? o.time : "none";
  const calendarProps = [
    ...(o.days === "booked" ? ["booked", "disabled: { before: new Date() }"] : []),
    ...(o.weekNumbers ? ["showWeekNumber: true"] : []),
  ];
  const props = [
    ...(range ? [`mode="range"`] : []),
    ...(o.variant === "ghost" ? [`variant="ghost"`] : []),
    `value={${range ? "range" : "date"}}`,
    `onValueChange={${range ? "setRange" : "setDate"}}`,
    ...(time === "time" ? ["time={time}", "onTimeChange={setTime}"] : []),
    ...(time === "timeRange" ? ["timeRange={time}", "onTimeRangeChange={setTime}"] : []),
    ...(time !== "none" && o.step !== "15" ? [`step={${o.step}}`] : []),
    ...(time !== "none" && o.clock !== "locale" ? [`hourCycle={${o.clock}}`] : []),
    ...(range && o.presets ? ["presets={presets}"] : []),
    ...(o.months !== defaultMonths(o.mode) ? [`numberOfMonths={${o.months}}`] : []),
    ...(o.months === "2" && o.orientation !== "auto" ? [`orientation="${o.orientation}"`] : []),
    ...(calendarProps.length ? [`calendarProps={{ ${calendarProps.join(", ")} }}`] : []),
    ...(o.variant === "outline" && !o.clearable ? ["clearable={false}"] : []),
    ...(o.disabled ? ["disabled"] : []),
    ...(o.pickerSize !== "site" ? [`size="${o.pickerSize}"`] : []),
  ];
  return [
    `import { DatePicker${range ? ", type DateRange" : ""}${time === "timeRange" ? ", type TimeRange" : ""} } from "./components";`,
    ``,
    range
      ? `const [range, setRange] = useState<DateRange | undefined>();`
      : `const [date, setDate] = useState<Date | undefined>(new Date());`,
    ...(time === "time" ? [`const [time, setTime] = useState<string | null>("11:00");`] : []),
    ...(time === "timeRange"
      ? [`const [time, setTime] = useState<TimeRange | null>({ start: "11:00", end: "12:45" });`]
      : []),
    ...(range && o.presets
      ? [`const presets = [{ label: "Next 7 days", range: { from: today, to: in6Days } }];`]
      : []),
    ``,
    `<DatePicker`,
    ...props.map((p) => `  ${p}`),
    `/>`,
  ].join("\n");
}

export function DatePickerPlayground({ children }: PlaygroundProps) {
  const [state, setState] = useState<PlayState>(DEFAULT_STATE);
  const set = <K extends keyof PlayState>(key: K, value: PlayState[K]) =>
    setState((prev) => ({ ...prev, [key]: value }));
  const [date, setDate] = useState<Date | undefined>(() => new Date());
  const [range, setRange] = useState<DateRange | undefined>(undefined);
  const [time, setTime] = useState<string | null>(DATE_PICKER_DEFAULT_TIME);
  const [timeRange, setTimeRange] = useState<TimeRange | null>({ ...DATE_PICKER_DEFAULT_TIME_RANGE });
  const [presets] = useState(() => demoPresets());
  const booked = useMemo(() => demoBookedDays(), []);

  // ── Get code (presets) ─────────────────────────────────
  const globals = usePresetGlobals();
  const presetCode = encodeDatePickerPreset({ ...state, ...globals });
  usePresetUrlSync(presetCode, DATE_PICKER_DEFAULT_CODE, (raw) => {
    const res = decodeDatePickerPreset(raw);
    if (res.ok) {
      // The globals stay with the site settings; the rail takes the rest.
      setState(omit(res.preset, PRESET_GLOBAL_KEYS));
    }
  });

  const randomize = () => {
    const mode = pick(["single", "range"] as const);
    setState({
      mode,
      variant: pick(["outline", "ghost"] as const),
      time: pick(["none", "time", "timeRange"] as const),
      presets: Math.random() > 0.5,
      months: Math.random() > 0.7 ? (mode === "range" ? "1" : "2") : defaultMonths(mode),
      orientation: pick(["auto", "horizontal", "vertical"] as const),
      step: pick(["15", "15", "30", "60"] as const),
      clock: pick(["locale", "12", "24"] as const),
      weekNumbers: Math.random() > 0.6,
      days: pick(["all", "booked"] as const),
      clearable: true,
      disabled: false,
      pickerSize: "site",
    });
  };

  const range_ = state.mode === "range";
  const hasTime = !range_ && state.time !== "none";
  // Props every variant shares.
  const shared = {
    variant: state.variant,
    numberOfMonths: Number(state.months) as 1 | 2,
    orientation: state.orientation,
    step: Number(state.step),
    hourCycle: state.clock === "locale" ? undefined : (Number(state.clock) as 12 | 24),
    calendarProps: {
      ...(state.days === "booked" ? { booked, disabled: { before: new Date() } } : {}),
      showWeekNumber: state.weekNumbers,
    },
    clearable: state.clearable,
    disabled: state.disabled,
    size: state.pickerSize === "site" ? undefined : state.pickerSize,
  };
  const picker = range_ ? (
    <DatePicker
      key="range"
      mode="range"
      {...shared}
      value={range}
      onValueChange={setRange}
      presets={state.presets ? presets : undefined}
    />
  ) : state.time === "time" ? (
    <DatePicker key="time" {...shared} value={date} onValueChange={setDate} time={time} onTimeChange={setTime} />
  ) : state.time === "timeRange" ? (
    <DatePicker
      key="timeRange"
      {...shared}
      value={date}
      onValueChange={setDate}
      timeRange={timeRange}
      onTimeRangeChange={setTimeRange}
    />
  ) : (
    <DatePicker key="single" {...shared} value={date} onValueChange={setDate} />
  );

  const controls = (
    <PlaygroundPanel onShuffle={randomize}>
      <PlayField label="Design">
        <PlaySelect
          value={state.variant}
          onChange={(v) => set("variant", v as PlayState["variant"])}
          options={[
            { value: "outline", label: "Outline" },
            { value: "ghost", label: "Ghost" },
          ]}
        />
      </PlayField>
      <PlayField label="Mode">
        <PlaySelect
          value={state.mode}
          onChange={(v) => {
            const mode = v as PlayState["mode"];
            // Each mode opens on its own default month count.
            setState((prev) => ({ ...prev, mode, months: defaultMonths(mode) }));
          }}
          options={[
            { value: "single", label: "Date" },
            { value: "range", label: "Range" },
          ]}
        />
      </PlayField>
      <PlayField label="Time" disabled={range_}>
        <PlaySelect
          value={state.time}
          onChange={(v) => set("time", v as Time)}
          options={[
            { value: "none", label: "None" },
            { value: "time", label: "One time" },
            { value: "timeRange", label: "Start → end" },
          ]}
        />
      </PlayField>
      <PlayField label="Step" disabled={!hasTime}>
        <PlaySelect
          value={state.step}
          onChange={(v) => set("step", v as PlayState["step"])}
          options={[
            { value: "15", label: "15 min" },
            { value: "30", label: "30 min" },
            { value: "60", label: "1 hour" },
          ]}
        />
      </PlayField>
      <PlayField label="Clock" disabled={!hasTime}>
        <PlaySelect
          value={state.clock}
          onChange={(v) => set("clock", v as PlayState["clock"])}
          options={[
            { value: "locale", label: "Auto" },
            { value: "12", label: "12h" },
            { value: "24", label: "24h" },
          ]}
        />
      </PlayField>
      <Switch
        label="Presets"
        checked={state.presets}
        disabled={!range_}
        onToggle={() => set("presets", !state.presets)}
        className={PLAY_SWITCH}
      />
      <PlayDivider />
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
      <PlayField label="Days">
        <PlaySelect
          value={state.days}
          onChange={(v) => set("days", v as PlayState["days"])}
          options={[
            { value: "all", label: "All open" },
            { value: "booked", label: "Booked + past" },
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
      <PlayField label="Size">
        <PlaySelect
          value={state.pickerSize}
          onChange={(v) => set("pickerSize", v as PlayState["pickerSize"])}
          options={[
            { value: "site", label: "Site" },
            { value: "default", label: "Default" },
            { value: "compact", label: "Compact" },
          ]}
        />
      </PlayField>
      <Switch
        label="Clearable"
        checked={state.clearable}
        disabled={state.variant !== "outline"}
        onToggle={() => set("clearable", !state.clearable)}
        className={PLAY_SWITCH}
      />
      <Switch
        label="Disabled"
        checked={state.disabled}
        onToggle={() => set("disabled", !state.disabled)}
        className={PLAY_SWITCH}
      />
      <PlayDivider />
      {/* shadcn's preset principle: the exact configuration above, as a
          stateless code the registry can turn into an installable block. */}
      <GetCodeDialog def={DATE_PICKER_PRESET_DEF} code={presetCode} />
    </PlaygroundPanel>
  );

  return children({
    // Top left, so the row never slides sideways as its fields change width.
    preview: <div className="flex w-full justify-start px-6 py-16">{picker}</div>,
    demoPreview: <div className="flex w-full justify-center">{picker}</div>,
    controls,
    code: buildDatePickerPlaygroundCode(state),
  });
}
