// @vitest-environment jsdom
/**
 * Calendar: booked and unavailable days map onto DayPicker's matchers with
 * different looks, a range never spans a booked day, week numbers are ISO
 * 8601, and Escape during a range pick puts the previous range back.
 */
import { afterEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { dateMatchModifiers } from "@daypicker/react";
import {
  Calendar,
  resolveDayMatchers,
  resolveWeekNumbering,
  dayNumber,
  type DateRange,
} from "@/registry/default/calendar";

afterEach(cleanup);

// jsdom has neither ResizeObserver nor matchMedia; the hover hook observes
// the days with one, motion's reduced-motion check reads the other.
class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}
globalThis.ResizeObserver ??= ResizeObserverStub as unknown as typeof ResizeObserver;
window.matchMedia ??= ((query: string) =>
  ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  }) as MediaQueryList) as typeof window.matchMedia;

const dayButton = (name: RegExp) => screen.getByRole("button", { name });

describe("resolveDayMatchers", () => {
  const booked = new Date(2026, 10, 12);
  const past = { before: new Date(2026, 10, 10) };

  it("makes booked days unpickable and marks them booked", () => {
    const { disabled, modifiers } = resolveDayMatchers({ booked: [booked], disabled: past });
    expect(dateMatchModifiers(booked, disabled)).toBe(true);
    expect(dateMatchModifiers(booked, modifiers.booked)).toBe(true);
    expect(dateMatchModifiers(booked, modifiers.unavailable)).toBe(false);
  });

  it("makes disabled days unavailable without marking them booked", () => {
    const { disabled, modifiers } = resolveDayMatchers({ booked: [booked], disabled: past });
    const day = new Date(2026, 10, 3);
    expect(dateMatchModifiers(day, disabled)).toBe(true);
    expect(dateMatchModifiers(day, modifiers.unavailable)).toBe(true);
    expect(dateMatchModifiers(day, modifiers.booked)).toBe(false);
  });

  it("turns every day outside `available` unavailable", () => {
    const { disabled, modifiers } = resolveDayMatchers({ available: { dayOfWeek: [1, 2, 3, 4, 5] } });
    const saturday = new Date(2026, 10, 14);
    const monday = new Date(2026, 10, 16);
    expect(dateMatchModifiers(saturday, disabled)).toBe(true);
    expect(dateMatchModifiers(saturday, modifiers.unavailable)).toBe(true);
    expect(dateMatchModifiers(monday, disabled)).toBe(false);
  });

  it("leaves every day open with no matchers", () => {
    const { disabled } = resolveDayMatchers({});
    expect(dateMatchModifiers(new Date(2026, 10, 14), disabled)).toBe(false);
  });
});

describe("day states", () => {
  it("strikes booked days through, disables them and labels them booked", () => {
    render(
      <Calendar
        month={new Date(2026, 10, 1)}
        booked={[new Date(2026, 10, 12)]}
        disabled={{ before: new Date(2026, 10, 10) }}
      />
    );
    const booked = dayButton(/November 12th, 2026, booked/);
    expect(booked.hasAttribute("disabled")).toBe(true);
    expect(booked.getAttribute("data-booked")).not.toBeNull();
    expect(booked.className).toContain("line-through");

    const past = dayButton(/November 3rd, 2026$/);
    expect(past.hasAttribute("disabled")).toBe(true);
    expect(past.getAttribute("data-booked")).toBeNull();
    expect(past.className).not.toContain("line-through");
  });

  it("fills the selected day and keeps its regular weight", () => {
    render(<Calendar month={new Date(2026, 10, 1)} selected={new Date(2026, 10, 20)} onSelect={() => {}} />);
    const day = dayButton(/November 20th, 2026/);
    expect(day.getAttribute("data-selected")).not.toBeNull();
    expect(day.className).toContain("bg-foreground");
    expect(day.style.fontVariationSettings).not.toContain("550");
  });
});

describe("range", () => {
  function Range({
    initial,
    onChange,
    booked,
  }: {
    initial?: DateRange;
    onChange?: (r: DateRange | undefined) => void;
    booked?: Date[];
  }) {
    const [range, setRange] = useState<DateRange | undefined>(initial);
    return (
      <Calendar
        mode="range"
        month={new Date(2026, 10, 1)}
        selected={range}
        booked={booked}
        onSelect={(r) => {
          setRange(r);
          onChange?.(r);
        }}
      />
    );
  }

  it("starts a range on the first pick and ends it on the second", () => {
    const onChange = vi.fn();
    render(<Range onChange={onChange} />);
    fireEvent.click(dayButton(/November 9th, 2026/));
    expect(onChange.mock.lastCall?.[0]?.to).toBeUndefined();
    fireEvent.click(dayButton(/November 13th, 2026/));
    const range = onChange.mock.lastCall?.[0] as DateRange;
    expect(dayNumber(range.from!)).toBe(dayNumber(new Date(2026, 10, 9)));
    expect(dayNumber(range.to!)).toBe(dayNumber(new Date(2026, 10, 13)));
  });

  it("never spans a booked day: the second pick starts over", () => {
    const onChange = vi.fn();
    render(<Range onChange={onChange} booked={[new Date(2026, 10, 12)]} />);
    fireEvent.click(dayButton(/November 9th, 2026/));
    fireEvent.click(dayButton(/November 15th, 2026/));
    const range = onChange.mock.lastCall?.[0] as DateRange;
    expect(dayNumber(range.from!)).toBe(dayNumber(new Date(2026, 10, 15)));
    expect(range.to).toBeUndefined();
  });

  it("fills the day that commits the range end in the same frame", () => {
    render(<Range />);
    fireEvent.click(dayButton(/November 9th, 2026/));
    const end = dayButton(/November 13th, 2026/);
    // Focus proposes the end, as the pointer would.
    act(() => end.focus());
    fireEvent.click(end);
    expect(end.className).toContain("bg-foreground");
    // No fade: the gliding highlight hands its fill over at once.
    expect(end.className).toContain("transition-none");
    expect(dayButton(/November 9th, 2026/).className).not.toContain("transition-none");
  });

  it("keeps the usual fades when Escape cancels the pick", () => {
    const initial = { from: new Date(2026, 10, 2), to: new Date(2026, 10, 4) };
    render(<Range initial={initial} />);
    fireEvent.click(dayButton(/November 20th, 2026/));
    const end = dayButton(/November 24th, 2026/);
    act(() => end.focus());
    fireEvent.keyDown(end, { key: "Escape" });
    expect(document.querySelector("button.transition-none")).toBeNull();
  });

  it("puts the previous range back on Escape before the end is picked", () => {
    const onChange = vi.fn();
    const initial = { from: new Date(2026, 10, 2), to: new Date(2026, 10, 4) };
    render(<Range initial={initial} onChange={onChange} />);
    const start = dayButton(/November 20th, 2026/);
    fireEvent.click(start);
    expect(onChange.mock.lastCall?.[0]?.to).toBeUndefined();
    fireEvent.keyDown(start, { key: "Escape" });
    const restored = onChange.mock.lastCall?.[0] as DateRange;
    expect(dayNumber(restored.from!)).toBe(dayNumber(initial.from));
    expect(dayNumber(restored.to!)).toBe(dayNumber(initial.to));
  });

  it("draws the band between the ends and fills both ends", () => {
    render(<Range initial={{ from: new Date(2026, 10, 9), to: new Date(2026, 10, 13) }} />);
    expect(dayButton(/November 9th, 2026/).getAttribute("data-selected")).not.toBeNull();
    expect(dayButton(/November 13th, 2026/).getAttribute("data-selected")).not.toBeNull();
    expect(dayButton(/November 11th, 2026/).getAttribute("data-range-middle")).not.toBeNull();
    // The 9th draws the band's right half, the 13th its left half, the
    // middle days the full width.
    const bands = document.querySelectorAll("[data-slot=calendar-range-band]");
    expect(bands.length).toBe(5);
  });

  it("gives row ends 2px corners, square where the next row continues the band", () => {
    render(
      <Calendar
        mode="range"
        month={new Date(2026, 10, 1)}
        weekStartsOn={0}
        selected={{ from: new Date(2026, 10, 8), to: new Date(2026, 10, 28) }}
        onSelect={() => {}}
      />
    );
    const corners = (day: number) => {
      const band = dayButton(new RegExp(`November ${day}(st|nd|rd|th), 2026`))
        .closest("[role=gridcell]")!
        .querySelector<HTMLElement>("[data-slot=calendar-range-band]")!;
      const { borderTopLeftRadius: tl, borderBottomLeftRadius: bl } = band.style;
      const { borderTopRightRadius: tr, borderBottomRightRadius: br } = band.style;
      return [tl, tr, br, bl].map((r) => (r === "2px" ? "2" : "0")).join(" ");
    };
    // Rows 8-14, 15-21, 22-28 (Sunday start). Top-left, top-right,
    // bottom-right, bottom-left.
    expect(corners(14)).toBe("0 2 0 0");
    expect(corners(15)).toBe("2 0 0 0");
    expect(corners(21)).toBe("0 0 2 0");
    expect(corners(22)).toBe("0 0 0 2");
    expect(corners(18)).toBe("0 0 0 0");
  });

  it("stops the band at a month break with 2px corners", () => {
    render(
      <Calendar
        mode="range"
        numberOfMonths={2}
        weekStartsOn={0}
        month={new Date(2026, 9, 1)}
        selected={{ from: new Date(2026, 9, 27), to: new Date(2026, 10, 3) }}
        onSelect={() => {}}
      />
    );
    const band = (re: RegExp) =>
      dayButton(re)
        .closest("[role=gridcell]")!
        .querySelector<HTMLElement>("[data-slot=calendar-range-band]")!;
    const last = band(/October 31st, 2026/);
    expect(last.style.right).toBe("0px");
    expect(last.style.borderTopRightRadius).toBe("2px");
    expect(last.style.borderBottomRightRadius).toBe("2px");
    const first = band(/November 1st, 2026/);
    expect(first.style.left).toBe("0px");
    expect(first.style.borderTopLeftRadius).toBe("2px");
    expect(first.style.borderBottomLeftRadius).toBe("2px");
  });

  it("finds row ends from the grid with ISO weeks (Monday start)", () => {
    render(
      <Calendar
        mode="range"
        showWeekNumber
        month={new Date(2026, 10, 1)}
        selected={{ from: new Date(2026, 10, 2), to: new Date(2026, 10, 18) }}
        onSelect={() => {}}
      />
    );
    const corners = (day: number) => {
      const band = dayButton(new RegExp(`November ${day}(st|nd|rd|th), 2026`))
        .closest("[role=gridcell]")!
        .querySelector<HTMLElement>("[data-slot=calendar-range-band]")!;
      const { borderTopLeftRadius: tl, borderBottomLeftRadius: bl } = band.style;
      const { borderTopRightRadius: tr, borderBottomRightRadius: br } = band.style;
      return [tl, tr, br, bl].map((r) => (r === "2px" ? "2" : "0")).join(" ");
    };
    // Rows 2-8, 9-15, 16-22: Sunday ends a row, Monday starts one.
    expect(corners(7)).toBe("0 0 0 0");
    expect(corners(8)).toBe("0 2 0 0");
    expect(corners(9)).toBe("2 0 0 0");
    expect(corners(15)).toBe("0 0 2 0");
    expect(corners(16)).toBe("0 0 0 2");
  });
});

describe("required", () => {
  it("keeps the selection when the selected day is picked again", () => {
    const onSelect = vi.fn();
    render(
      <Calendar required month={new Date(2026, 10, 1)} selected={new Date(2026, 10, 20)} onSelect={onSelect} />
    );
    fireEvent.click(dayButton(/November 20th, 2026/));
    expect(onSelect.mock.lastCall?.[0]).toBeInstanceOf(Date);
  });
});

describe("day detail", () => {
  it("renders a line under each in-month day and describes the day with it", () => {
    render(
      <Calendar
        month={new Date(2026, 10, 1)}
        cellSize={56}
        dayDetail={(d) => (d.getDate() === 4 ? null : `$${100 + d.getDate()}`)}
      />
    );
    const day = dayButton(/November 20th, 2026/);
    expect(day.querySelector("[data-slot=calendar-day-detail]")?.textContent).toBe("$120");
    // Read after the date: the button points at the detail.
    const detail = day.querySelector("[data-slot=calendar-day-detail]")!;
    expect(day.getAttribute("aria-describedby")).toBe(detail.id);
    // null means no detail.
    expect(dayButton(/November 4th, 2026/).querySelector("[data-slot=calendar-day-detail]")).toBeNull();
    // Outside days skip it.
    const outside = document.querySelectorAll("[data-outside] [data-slot=calendar-day-detail]");
    expect(outside.length).toBe(0);
  });
});

describe("week numbers", () => {
  it("uses ISO 8601 numbering with a Monday start by default", () => {
    expect(resolveWeekNumbering(true, undefined, undefined)).toBe(true);
    expect(resolveWeekNumbering(true, 0, undefined)).toBe(false);
    expect(resolveWeekNumbering(false, undefined, undefined)).toBe(false);

    // 1 January 2027 is a Friday: ISO week 53 of 2026.
    render(<Calendar month={new Date(2027, 0, 1)} showWeekNumber />);
    const rows = screen.getAllByRole("rowheader");
    expect(rows[0].textContent).toBe("53");
    expect(rows[1].textContent).toBe("1");
    const headers = screen.getAllByRole("columnheader", { hidden: true });
    // The empty week-number header, then Monday first.
    expect(headers[1].getAttribute("aria-label")).toBe("Monday");
  });

  it("follows the locale rules when the week starts on Sunday", () => {
    render(<Calendar month={new Date(2027, 0, 1)} showWeekNumber weekStartsOn={0} />);
    const headers = screen.getAllByRole("columnheader", { hidden: true });
    expect(headers[1].getAttribute("aria-label")).toBe("Sunday");
    expect(screen.getAllByRole("rowheader")[0].textContent).toBe("1");
  });
});

describe("two months", () => {
  it("hides outside days so no date renders twice", () => {
    render(<Calendar numberOfMonths={2} month={new Date(2026, 9, 1)} />);
    expect(screen.getAllByRole("button", { name: /October 31st, 2026/ })).toHaveLength(1);
    expect(screen.getAllByRole("button", { name: /November 1st, 2026/ })).toHaveLength(1);
  });
});
