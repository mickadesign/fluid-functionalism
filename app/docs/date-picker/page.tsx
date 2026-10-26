"use client";

import { useState } from "react";
import {
  DatePicker,
  type DateRange,
  type TimeRange,
} from "@/components/ui/date-picker";
import { ComponentPreview } from "@/lib/docs/ComponentPreview";
import { PropsTable } from "@/lib/docs/PropsTable";
import { DocPage, DocSection } from "@/lib/docs/DocPage";
import { PlaygroundLayout } from "@/lib/docs/playground";
import { DatePickerPlayground, demoPresets } from "@/lib/docs/playgrounds/date-picker";
import { apiReference } from "@/lib/docs/api/date-picker";
import { fontWeights } from "@/lib/font-weight";

// ---------------------------------------------------------------------------
// Code snippets
// ---------------------------------------------------------------------------

const singleCode = `import { DatePicker } from "./components";

const [date, setDate] = useState<Date | undefined>();

<DatePicker value={date} onValueChange={setDate} />`;

const rangeCode = `import { DatePicker, type DateRange } from "./components";

const [range, setRange] = useState<DateRange | undefined>();

<DatePicker
  mode="range"
  value={range}
  onValueChange={setRange}
  presets={[
    { label: "Next 7 days", range: { from: today, to: in6Days } },
    { label: "Next 30 days", range: { from: today, to: in29Days } },
  ]}
/>`;

const eventCode = `import { DatePicker, type TimeRange } from "./components";

const [date, setDate] = useState<Date | undefined>(new Date());
const [time, setTime] = useState<TimeRange | null>({ start: "11:00", end: "12:45" });

<div className="flex items-center gap-2">
  <span className="w-20 text-muted-foreground">When</span>
  <DatePicker
    variant="ghost"
    value={date}
    onValueChange={setDate}
    timeRange={time}
    onTimeRangeChange={setTime}
  />
</div>`;

const timeCode = `import { DatePicker } from "./components";

const [time, setTime] = useState<string | null>(null);

<DatePicker value={date} onValueChange={setDate} time={time} onTimeChange={setTime} step={30} />`;

const bookingCode = `import { DatePicker, type DateRange } from "./components";

<DatePicker
  mode="range"
  value={stay}
  onValueChange={setStay}
  placeholder="Check in → check out"
  calendarProps={{ booked, disabled: { before: new Date() } }}
/>`;

// ── Playground ───────────────────────────────────────────

function DatePickerPlaygroundSection() {
  return (
    <DatePickerPlayground>
      {({ preview, controls, code }) => (
        <PlaygroundLayout
          controls={controls}
          preview={
            <ComponentPreview code={code} padding="none" minHeightClass="min-h-[480px]" align="top">
              {preview}
            </ComponentPreview>
          }
        />
      )}
    </DatePickerPlayground>
  );
}

function addDays(date: Date, days: number) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
}

export default function DatePickerDoc() {
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [range, setRange] = useState<DateRange | undefined>(undefined);
  const [presets] = useState(() => demoPresets());
  const [eventDate, setEventDate] = useState<Date | undefined>(() => new Date());
  const [eventTime, setEventTime] = useState<TimeRange | null>({ start: "11:00", end: "12:45" });
  const [deadline, setDeadline] = useState<Date | undefined>(undefined);
  const [deadlineTime, setDeadlineTime] = useState<string | null>(null);
  const [stay, setStay] = useState<DateRange | undefined>(undefined);
  const [booked] = useState(() => [3, 4, 5, 11, 12].map((n) => addDays(new Date(), n)));

  return (
    <DocPage
      title="DatePicker"
      slug="date-picker"
      description="Outline or ghost trigger for a date, a range, or a date and a time: a calendar popover with presets, and time slot lists that show each duration."
    >
      <DocSection title="Playground">
        <DatePickerPlaygroundSection />
      </DocSection>

      <DocSection title="Date">
        <p className="text-site-body text-muted-foreground">
          Opens on the selected day, or today. Pick one and it closes.
        </p>
        <ComponentPreview code={singleCode} minHeightClass="min-h-[420px]" align="top">
          <div className="w-full">
            <DatePicker value={date} onValueChange={setDate} />
          </div>
        </ComponentPreview>
      </DocSection>

      <DocSection title="Range with presets">
        <p className="text-site-body text-muted-foreground">
          Pick a start and an end, or a preset. It closes once the end is set; <code>Escape</code> mid-pick puts the previous range back.
        </p>
        <ComponentPreview code={rangeCode} minHeightClass="min-h-[460px]" align="top">
          <div className="w-full">
            <DatePicker mode="range" value={range} onValueChange={setRange} presets={presets} />
          </div>
        </ComponentPreview>
      </DocSection>

      <DocSection title="Date and time">
        <p className="text-site-body text-muted-foreground">
          2 segments, 2 popovers. Type <code>1130</code> or <code>11:30am</code> in a time, or arrow through the slots. The end list counts the duration from the start.
        </p>
        <ComponentPreview code={eventCode} minHeightClass="min-h-[420px]" align="top">
          <div className="flex w-full flex-col gap-1">
            <div
              className="px-2 text-site-title text-foreground"
              style={{ fontVariationSettings: fontWeights.semibold }}
            >
              Design review
            </div>
            <div className="flex items-center gap-2">
              <span className="w-20 px-2 text-site-body text-muted-foreground">When</span>
              <DatePicker
                variant="ghost"
                value={eventDate}
                onValueChange={setEventDate}
                timeRange={eventTime}
                onTimeRangeChange={setEventTime}
              />
            </div>
          </div>
        </ComponentPreview>
        <p className="text-site-body text-muted-foreground">
          <code>time</code> takes one time instead. <code>step</code> sets the minutes between slots.
        </p>
        <ComponentPreview code={timeCode} minHeightClass="min-h-[420px]" align="top">
          <div className="w-full">
            <DatePicker
              value={deadline}
              onValueChange={setDeadline}
              time={deadlineTime}
              onTimeChange={setDeadlineTime}
              step={30}
            />
          </div>
        </ComponentPreview>
      </DocSection>

      <DocSection title="Booked days">
        <p className="text-site-body text-muted-foreground">
          <code>calendarProps</code> reaches the calendar inside: booked nights, past days, cell size.
        </p>
        <ComponentPreview code={bookingCode} minHeightClass="min-h-[460px]" align="top">
          <div className="w-full">
            <DatePicker
              mode="range"
              value={stay}
              onValueChange={setStay}
              placeholder="Check in → check out"
              calendarProps={{ booked, disabled: { before: new Date() } }}
            />
          </div>
        </ComponentPreview>
      </DocSection>

      <DocSection title="API Reference">
        <PropsTable groups={apiReference} />
      </DocSection>
    </DocPage>
  );
}
