// ---------------------------------------------------------------------------
// Install-grade code generation for calendar presets. Emits ONE compilable
// component reproducing what the playground preview renders for the encoded
// state — same mode, months, cell size and day rules.
// tests/preset-calendar.test.mjs compiles the output across the state space
// through a real ts.createProgram over the project tsconfig.
// ---------------------------------------------------------------------------

import type { PresetFile } from "./sidebar-install";
import type { PresetGenerator } from "./generators";
import {
  type CalendarPreset,
  CALENDAR_BOOKED_OFFSETS,
  CALENDAR_WEEKDAYS,
} from "./calendar-options";

function calendarDemoFile(p: CalendarPreset): string {
  const range = p.mode === "range";
  const booked = p.days === "booked";
  const l: string[] = [];

  l.push(`"use client";`);
  l.push(``);
  l.push(`import { useState } from "react";`);
  l.push(
    `import { Calendar${range ? ", type DateRange" : ""} } from "@/components/ui/calendar";`
  );
  l.push(``);
  if (booked) {
    l.push(`function addDays(date: Date, days: number) {`);
    l.push(`  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);`);
    l.push(`}`);
    l.push(``);
    l.push(`// Taken nights, counted from today. Replace with your own.`);
    l.push(`const today = new Date();`);
    l.push(
      `const BOOKED = [${CALENDAR_BOOKED_OFFSETS.join(", ")}].map((n) => addDays(today, n));`
    );
    l.push(``);
  }

  const props = [
    ...(range ? [`mode="range"`] : []),
    `selected={${range ? "range" : "date"}}`,
    `onSelect={${range ? "setRange" : "setDate"}}`,
    ...(p.months === "2" ? [`numberOfMonths={2}`] : []),
    ...(p.months === "2" && p.orientation !== "auto" ? [`orientation="${p.orientation}"`] : []),
    ...(p.cellSize !== "auto" ? [`cellSize={${p.cellSize}}`] : []),
    ...(p.weekNumbers ? ["showWeekNumber"] : []),
    // Past days can't be picked either, so the booked ones read as taken.
    ...(booked ? ["booked={BOOKED}", "disabled={{ before: new Date() }}"] : []),
    ...(p.days === "weekdays"
      ? [`available={{ dayOfWeek: [${CALENDAR_WEEKDAYS.join(", ")}] }}`]
      : []),
  ];

  l.push(`export function CalendarDemo() {`);
  l.push(
    range
      ? `  const [range, setRange] = useState<DateRange | undefined>();`
      : `  const [date, setDate] = useState<Date | undefined>(() => new Date());`
  );
  l.push(``);
  l.push(`  return (`);
  l.push(`    <Calendar`);
  for (const prop of props) l.push(`      ${prop}`);
  l.push(`    />`);
  l.push(`  );`);
  l.push(`}`);
  return l.join("\n") + "\n";
}

export function generateCalendarPresetFiles(p: CalendarPreset): PresetFile[] {
  return [
    {
      path: "components/calendar-demo.tsx",
      type: "registry:component",
      target: "components/calendar-demo.tsx",
      content: calendarDemoFile(p),
    },
  ];
}

/** Registry dependencies the generated file needs, as plain names — the
 *  route flavors them with the same helpers postbuild uses (calendar pulls
 *  dual-flavor parts, so it resolves to the chosen flavor's payload). */
export function calendarPresetRegistryDeps(_p: CalendarPreset): string[] {
  return ["utils", "calendar"];
}

/** npm dependencies beyond what registryDependencies pull transitively. */
export function calendarPresetNpmDeps(_p: CalendarPreset): string[] {
  return [];
}

export const CALENDAR_PRESET_GENERATOR: PresetGenerator = {
  title: "Calendar (playground preset)",
  description:
    "A calendar generated from a fluidfunctionalism.com playground configuration: the exact variant you built, installable.",
  files: (p) => generateCalendarPresetFiles(p as unknown as CalendarPreset),
  registryDeps: (p) => calendarPresetRegistryDeps(p as unknown as CalendarPreset),
  npmDeps: (p) => calendarPresetNpmDeps(p as unknown as CalendarPreset),
};
