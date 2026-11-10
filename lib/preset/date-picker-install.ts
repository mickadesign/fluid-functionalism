// ---------------------------------------------------------------------------
// Install-grade code generation for date picker presets. Emits ONE
// compilable component reproducing what the playground preview renders for
// the encoded state — same mode, time fields, presets, months and calendar
// rules. The file imports `@/components/ui/date-picker`, which both flavors
// install to; the route picks the Radix or Base UI payload from the code's
// flavor. tests/preset-date-picker.test.mjs compiles the output across the
// state space through a real ts.createProgram over the project tsconfig.
// ---------------------------------------------------------------------------

import type { PresetFile } from "./sidebar-install";
import type { PresetGenerator } from "./generators";
import { CALENDAR_BOOKED_OFFSETS } from "./calendar-options";
import {
  type DatePickerPreset,
  deriveDatePicker,
  defaultDatePickerMonths,
  DATE_PICKER_DEFAULT_TIME,
  DATE_PICKER_DEFAULT_TIME_RANGE,
} from "./date-picker-options";

function datePickerDemoFile(p: DatePickerPreset): string {
  const d = deriveDatePicker(p);
  const booked = p.days === "booked";
  const hasTime = d.time !== "none";
  const l: string[] = [];

  l.push(`"use client";`);
  l.push(``);
  l.push(`import { useState } from "react";`);
  const types = [
    ...(d.range ? ["type DateRange"] : []),
    ...(d.presets ? ["type DatePickerPreset"] : []),
    ...(d.time === "timeRange" ? ["type TimeRange"] : []),
  ];
  l.push(
    `import { ${["DatePicker", ...types].join(", ")} } from "@/components/ui/date-picker";`
  );
  l.push(``);
  if (booked || d.presets) {
    l.push(`function addDays(date: Date, days: number) {`);
    l.push(`  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);`);
    l.push(`}`);
    l.push(``);
    l.push(`const today = new Date();`);
  }
  if (booked) {
    l.push(`// Taken nights, counted from today. Replace with your own.`);
    l.push(
      `const BOOKED = [${CALENDAR_BOOKED_OFFSETS.join(", ")}].map((n) => addDays(today, n));`
    );
  }
  if (d.presets) {
    l.push(`// Ranges listed beside the calendar, counted from today.`);
    l.push(`const saturday = addDays(today, (6 - today.getDay() + 7) % 7);`);
    l.push(`const PRESETS: DatePickerPreset[] = [`);
    l.push(`  { label: "Next 7 days", range: { from: today, to: addDays(today, 6) } },`);
    l.push(`  { label: "Next 14 days", range: { from: today, to: addDays(today, 13) } },`);
    l.push(`  { label: "Next 30 days", range: { from: today, to: addDays(today, 29) } },`);
    l.push(`  { label: "This weekend", range: { from: saturday, to: addDays(saturday, 1) } },`);
    l.push(`];`);
  }
  if (booked || d.presets) l.push(``);

  const calendarProps = [
    ...(booked ? ["booked: BOOKED", "disabled: { before: new Date() }"] : []),
    ...(p.weekNumbers ? ["showWeekNumber: true"] : []),
  ];
  const props = [
    ...(d.range ? [`mode="range"`] : []),
    ...(p.variant === "ghost" ? [`variant="ghost"`] : []),
    `value={${d.range ? "range" : "date"}}`,
    `onValueChange={${d.range ? "setRange" : "setDate"}}`,
    ...(d.time === "time" ? ["time={time}", "onTimeChange={setTime}"] : []),
    ...(d.time === "timeRange" ? ["timeRange={time}", "onTimeRangeChange={setTime}"] : []),
    ...(hasTime && p.step !== "15" ? [`step={${p.step}}`] : []),
    ...(hasTime && p.clock !== "locale" ? [`hourCycle={${p.clock}}`] : []),
    ...(d.presets ? ["presets={PRESETS}"] : []),
    ...(p.months !== defaultDatePickerMonths(p.mode) ? [`numberOfMonths={${p.months}}`] : []),
    ...(p.months === "2" && p.orientation !== "auto" ? [`orientation="${p.orientation}"`] : []),
    ...(calendarProps.length ? [`calendarProps={{ ${calendarProps.join(", ")} }}`] : []),
    ...(!d.clearable ? ["clearable={false}"] : []),
    ...(p.disabled ? ["disabled"] : []),
    ...(p.pickerSize !== "site" ? [`size="${p.pickerSize}"`] : []),
  ];

  l.push(`export function DatePickerDemo() {`);
  l.push(
    d.range
      ? `  const [range, setRange] = useState<DateRange | undefined>();`
      : `  const [date, setDate] = useState<Date | undefined>(() => new Date());`
  );
  if (d.time === "time") {
    l.push(`  const [time, setTime] = useState<string | null>(${JSON.stringify(DATE_PICKER_DEFAULT_TIME)});`);
  } else if (d.time === "timeRange") {
    const { start, end } = DATE_PICKER_DEFAULT_TIME_RANGE;
    l.push(
      `  const [time, setTime] = useState<TimeRange | null>({ start: ${JSON.stringify(start)}, end: ${JSON.stringify(end)} });`
    );
  }
  l.push(``);
  l.push(`  return (`);
  l.push(`    <DatePicker`);
  for (const prop of props) l.push(`      ${prop}`);
  l.push(`    />`);
  l.push(`  );`);
  l.push(`}`);
  return l.join("\n") + "\n";
}

export function generateDatePickerPresetFiles(p: DatePickerPreset): PresetFile[] {
  return [
    {
      path: "components/date-picker-demo.tsx",
      type: "registry:component",
      target: "components/date-picker-demo.tsx",
      content: datePickerDemoFile(p),
    },
  ];
}

/** Registry dependencies the generated file needs, as plain names. The
 *  route resolves "date-picker" to the code's flavor (radix or base)
 *  through buildDepResolver, the same rule the static payloads follow. */
export function datePickerPresetRegistryDeps(_p: DatePickerPreset): string[] {
  return ["utils", "date-picker"];
}

/** npm dependencies beyond what registryDependencies pull transitively. */
export function datePickerPresetNpmDeps(_p: DatePickerPreset): string[] {
  return [];
}

export const DATE_PICKER_PRESET_GENERATOR: PresetGenerator = {
  title: "Date Picker (playground preset)",
  description:
    "A date picker generated from a fluidfunctionalism.com playground configuration: the exact variant you built, installable.",
  files: (p) => generateDatePickerPresetFiles(p as unknown as DatePickerPreset),
  registryDeps: (p) => datePickerPresetRegistryDeps(p as unknown as DatePickerPreset),
  npmDeps: (p) => datePickerPresetNpmDeps(p as unknown as DatePickerPreset),
};
