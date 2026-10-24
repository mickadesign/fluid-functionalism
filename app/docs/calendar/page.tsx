"use client";

import { useMemo, useState } from "react";
import { Calendar, type DateRange } from "@/components/ui/calendar";
import { ComponentPreview } from "@/lib/docs/ComponentPreview";
import { PropsTable } from "@/lib/docs/PropsTable";
import { DocPage, DocSection, DocSubheading } from "@/lib/docs/DocPage";
import { PlaygroundLayout } from "@/lib/docs/playground";
import { CalendarPlayground, demoBookedDays } from "@/lib/docs/playgrounds/calendar";
import {
  calendarAppearanceProps,
  calendarDaysProps,
  calendarLayoutProps,
  calendarSelectionProps,
} from "@/lib/docs/api/calendar";

// ---------------------------------------------------------------------------
// Code snippets
// ---------------------------------------------------------------------------

const singleCode = `import { Calendar } from "./components";

const [date, setDate] = useState<Date | undefined>(new Date());

<Calendar selected={date} onSelect={setDate} />`;

const rangeCode = `import { Calendar, type DateRange } from "./components";

const [range, setRange] = useState<DateRange | undefined>();

<Calendar
  mode="range"
  numberOfMonths={2}
  orientation="horizontal"
  selected={range}
  onSelect={setRange}
/>`;

const verticalCode = `import { Calendar, type DateRange } from "./components";

<Calendar
  mode="range"
  numberOfMonths={2}
  orientation="vertical"
  selected={range}
  onSelect={setRange}
/>`;

const bookingCode = `import { Calendar, type DateRange } from "./components";

const booked = [/* Date[] of taken nights */];

<Calendar
  mode="range"
  selected={range}
  onSelect={setRange}
  booked={booked}
  disabled={{ before: new Date() }}
/>`;

const availableCode = `import { Calendar } from "./components";

<Calendar
  selected={date}
  onSelect={setDate}
  available={{ dayOfWeek: [1, 2, 3, 4, 5] }}
/>`;

const sizeCode = `import { Calendar } from "./components";

// Your nightly rate for a day: weeknights cheaper here.
const rateFor = (day: Date) => ([0, 5, 6].includes(day.getDay()) ? 169 : 109);

<Calendar
  cellSize={56}
  selected={date}
  onSelect={setDate}
  dayDetail={(day) => {
    const rate = rateFor(day);
    // Good deals in green, the rest muted.
    return <span className={rate <= 119 ? "text-[color:var(--success)]" : undefined}>\${rate}</span>;
  }}
/>`;

/**
 * A made-up nightly rate per day for the cell size demo, $99 to $189. Hashed
 * from the date, so it varies day to day but renders the same on the server
 * and the client.
 */
function demoRate(day: Date) {
  const seed = day.getFullYear() * 400 + day.getMonth() * 32 + day.getDate();
  const hash = Math.imul(seed, 2654435761) >>> 0;
  return 99 + ((hash >>> 8) % 10) * 10;
}

const weekNumbersCode = `import { Calendar } from "./components";

<Calendar showWeekNumber selected={date} onSelect={setDate} />`;

// ── Playground ───────────────────────────────────────────

function CalendarPlaygroundSection() {
  return (
    <CalendarPlayground>
      {({ preview, controls, code }) => (
        <PlaygroundLayout
          controls={controls}
          preview={
            <ComponentPreview code={code} padding="none" align="top" minHeightClass="min-h-[420px]">
              {preview}
            </ComponentPreview>
          }
        />
      )}
    </CalendarPlayground>
  );
}

export default function CalendarDoc() {
  const [date, setDate] = useState<Date | undefined>(() => new Date());
  const [range, setRange] = useState<DateRange | undefined>(undefined);
  const [stacked, setStacked] = useState<DateRange | undefined>(undefined);
  const [booking, setBooking] = useState<DateRange | undefined>(undefined);
  const [weekday, setWeekday] = useState<Date | undefined>(undefined);
  const [big, setBig] = useState<Date | undefined>(() => new Date());
  const [week, setWeek] = useState<Date | undefined>(() => new Date());
  const booked = useMemo(() => demoBookedDays(), []);

  return (
    <DocPage
      title="Calendar"
      slug="calendar"
      description="Month grid for a day or a range: one fluid hover across both months, a range band that follows the pointer, booked and unavailable days, and week numbers."
    >
      <DocSection title="Playground">
        <CalendarPlaygroundSection />
      </DocSection>

      <DocSection title="Single">
        <p className="text-site-body text-muted-foreground">
          Click a day, or arrow to it and press <code>Enter</code>. <code>PageUp</code> and <code>PageDown</code> change the month.
        </p>
        <ComponentPreview code={singleCode} minHeightClass="min-h-[360px]">
          <Calendar selected={date} onSelect={setDate} />
        </ComponentPreview>
      </DocSection>

      <DocSection title="Range">
        <p className="text-site-body text-muted-foreground">
          2 months, one hover. Pick a start, then move: the band follows the pointer across the month break.
        </p>
        <ComponentPreview code={rangeCode} minHeightClass="min-h-[360px]">
          <Calendar
            mode="range"
            numberOfMonths={2}
            orientation="horizontal"
            selected={range}
            onSelect={setRange}
          />
        </ComponentPreview>
      </DocSection>

      <DocSection title="Stacked months">
        <p className="text-site-body text-muted-foreground">
          <code>orientation=&quot;vertical&quot;</code> stacks the months under one weekday row, which stays put when they scroll in a shorter box. <code>auto</code> picks this when 2 months don&apos;t fit side by side.
        </p>
        <ComponentPreview code={verticalCode}>
          <Calendar
            mode="range"
            numberOfMonths={2}
            orientation="vertical"
            selected={stacked}
            onSelect={setStacked}
          />
        </ComponentPreview>
      </DocSection>

      <DocSection title="Booked and unavailable">
        <p className="text-site-body text-muted-foreground">
          Booked days are struck through and a range can&apos;t cross them. Past days only fade.
        </p>
        <ComponentPreview code={bookingCode} minHeightClass="min-h-[360px]">
          <Calendar
            mode="range"
            selected={booking}
            onSelect={setBooking}
            booked={booked}
            disabled={{ before: new Date() }}
          />
        </ComponentPreview>
        <p className="text-site-body text-muted-foreground">
          <code>available</code> flips the rule: every day it doesn&apos;t match is unavailable.
        </p>
        <ComponentPreview code={availableCode} minHeightClass="min-h-[360px]">
          <Calendar
            selected={weekday}
            onSelect={setWeekday}
            available={{ dayOfWeek: [1, 2, 3, 4, 5] }}
          />
        </ComponentPreview>
      </DocSection>

      <DocSection title="Cell size">
        <p className="text-site-body text-muted-foreground">
          <code>cellSize</code> sets the cell in px; the numbers keep their size. <code>dayDetail</code> puts a line under each number, a price here, and needs the room of a taller cell. It takes any node: good deals show green.
        </p>
        <ComponentPreview code={sizeCode} minHeightClass="min-h-[420px]">
          <Calendar
            cellSize={56}
            selected={big}
            onSelect={setBig}
            dayDetail={(day) => {
              const rate = demoRate(day);
              return (
                <span className={rate <= 119 ? "text-[color:var(--success)]" : undefined}>
                  ${rate}
                </span>
              );
            }}
          />
        </ComponentPreview>
      </DocSection>

      <DocSection title="Week numbers">
        <p className="text-site-body text-muted-foreground">
          ISO week numbers in a muted column, with weeks starting on Monday.
        </p>
        <ComponentPreview code={weekNumbersCode} minHeightClass="min-h-[360px]">
          <Calendar showWeekNumber selected={week} onSelect={setWeek} />
        </ComponentPreview>
      </DocSection>

      <DocSection title="API Reference">
        <DocSubheading title="Selection" />
        <PropsTable props={calendarSelectionProps} />
        <DocSubheading title="Days" />
        <PropsTable props={calendarDaysProps} />
        <DocSubheading title="Layout" />
        <PropsTable props={calendarLayoutProps} />
        <DocSubheading title="Appearance" />
        <PropsTable props={calendarAppearanceProps} />
      </DocSection>
    </DocPage>
  );
}
