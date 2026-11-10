// @vitest-environment jsdom
/**
 * DatePicker: the time and label helpers both flavors share, and the
 * popover lifecycle per flavor: it opens with focus on the selected day,
 * Escape closes it and hands focus back to the trigger, and the popup stays
 * mounted through its exit instead of being cut (Base UI holds its unmount
 * with preventUnmountOnClose, Radix with forceMount).
 */
import { afterEach, describe, expect, it } from "vitest";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { useState } from "react";
import * as Base from "@/registry/base/date-picker";
import * as Radix from "@/registry/radix/date-picker";
import {
  buildSlots,
  formatDateLabel,
  formatDuration,
  formatRangeLabel,
  formatTime,
  nearestSlotIndex,
  parseTime,
  resolveHourCycle,
  shiftEnd,
  timeToMinutes,
  widestLabelParts,
  formValue,
} from "@/registry/default/date-picker-core";

afterEach(cleanup);

class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}
globalThis.ResizeObserver ??= ResizeObserverStub as unknown as typeof ResizeObserver;
Element.prototype.scrollIntoView ??= () => {};
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

// Intl puts a narrow no-break space before AM/PM in recent ICU versions.
const plain = (s: string) => s.replace(/[  ]/g, " ");

describe("durations", () => {
  it.each([
    [15, "15min"],
    [30, "30min"],
    [60, "1h"],
    [75, "1h 15min"],
    [105, "1h 45min"],
    [120, "2h"],
  ])("%i minutes reads %s", (minutes, label) => {
    expect(formatDuration(minutes)).toBe(label);
  });
});

describe("typed times", () => {
  it.each([
    ["1130", 690],
    ["11:30", 690],
    ["11.30", 690],
    ["11:30am", 690],
    ["11:30 pm", 1410],
    ["930", 570],
    ["9", 540],
    ["9pm", 1260],
    ["12am", 0],
    ["12pm", 720],
    ["0000", 0],
    ["2359", 1439],
    ["9h30", 570],
    ["9h", 540],
    ["9h pm", 1260],
    ["123", 83],
  ])("%s is %i minutes", (input, minutes) => {
    expect(parseTime(input)).toBe(minutes);
  });

  it.each(["2400", "1260", "13pm", "abc", "", "11:3"])("%s is not a time", (input) => {
    expect(parseTime(input)).toBeNull();
  });

  it("reads stored HH:mm values", () => {
    expect(timeToMinutes("11:00")).toBe(660);
    expect(timeToMinutes("24:00")).toBeNull();
    expect(timeToMinutes(null)).toBeNull();
  });
});

describe("time ranges", () => {
  it("moves the end with the start, keeping the duration", () => {
    // 11:00 → 12:45, start moved to 12:00: end 13:45.
    expect(shiftEnd(660, 765, 720)).toBe(825);
  });

  it("stops the end at the end of the same day", () => {
    expect(shiftEnd(660, 780, 1380)).toBe(1439);
  });

  it("starts the end list one step after the start, with durations", () => {
    const slots = buildSlots(15, 660);
    expect(slots[0]).toEqual({ minutes: 675, duration: 15 });
    expect(slots[3]).toEqual({ minutes: 720, duration: 60 });
    expect(slots[slots.length - 1].minutes).toBeLessThanOrEqual(1439);
  });

  it("covers the whole day for a start list", () => {
    const slots = buildSlots(15);
    expect(slots).toHaveLength(96);
    expect(slots[0].minutes).toBe(0);
    expect(nearestSlotIndex(slots, 697)).toBe(46); // 11:37 → 11:30
  });
});

describe("12h and 24h", () => {
  it("follows the locale's clock", () => {
    expect(resolveHourCycle("en-US")).toBe(12);
    expect(resolveHourCycle("en-GB")).toBe(24);
    expect(resolveHourCycle("fr-FR")).toBe(24);
  });

  it("lets hourCycle override the locale", () => {
    expect(resolveHourCycle("en-US", 24)).toBe(24);
    expect(resolveHourCycle("en-GB", 12)).toBe(12);
  });

  it("formats a time on either clock", () => {
    expect(formatTime(690, 24, "en-GB")).toBe("11:30");
    expect(formatTime(810, 24, "en-US")).toBe("13:30");
    expect(plain(formatTime(690, 12, "en-US"))).toBe("11:30 AM");
    expect(plain(formatTime(0, 12, "en-US"))).toBe("12:00 AM");
  });
});

describe("form value", () => {
  it("submits ISO 8601 local dates, times and intervals", () => {
    const day = new Date(2026, 9, 21);
    expect(formValue(day)).toBe("2026-10-21");
    expect(formValue(day, "11:00")).toBe("2026-10-21T11:00");
    expect(formValue(day, null, { start: "11:00", end: "12:45" })).toBe(
      "2026-10-21T11:00/2026-10-21T12:45"
    );
    expect(formValue({ from: day, to: new Date(2026, 9, 24) })).toBe("2026-10-21/2026-10-24");
    // Incomplete or empty: nothing to submit.
    expect(formValue({ from: day, to: undefined })).toBe("");
    expect(formValue(undefined)).toBe("");
  });
});

describe("date label width", () => {
  it("stacks every weekday and month so any date fits the same width", () => {
    const options = { weekday: "short", month: "short", day: "numeric" } as const;
    const sample = [
      { type: "weekday", value: "Thu" },
      { type: "literal", value: " " },
      { type: "month", value: "Oct" },
      { type: "literal", value: " " },
      { type: "day", value: "1" },
    ] as const;
    const cells = widestLabelParts([...sample], "en-US", options);
    expect(cells).toHaveLength(5);
    expect(cells[0]).toHaveLength(7);
    expect(cells[0]).toContain("Wed");
    expect(cells[2]).toHaveLength(12);
    expect(cells[2]).toContain("Sep");
    expect(cells[4]).toEqual(["28"]);
    expect(cells[1]).toEqual([" "]);
  });
});

describe("date labels", () => {
  const now = new Date(2026, 9, 19);

  it("reads Wed Oct 21, with the year outside the current one", () => {
    expect(formatDateLabel(new Date(2026, 9, 21), "en-US", now)).toBe("Wed Oct 21");
    expect(formatDateLabel(new Date(2027, 9, 21), "en-US", now)).toBe("Thu Oct 21, 2027");
  });

  it("reads a range as Oct 21 → Oct 24", () => {
    expect(
      formatRangeLabel({ from: new Date(2026, 9, 21), to: new Date(2026, 9, 24) }, "en-US", now)
    ).toBe("Oct 21 → Oct 24");
    expect(
      formatRangeLabel({ from: new Date(2026, 11, 30), to: new Date(2027, 0, 2) }, "en-US", now)
    ).toBe("Dec 30, 2026 → Jan 2, 2027");
  });
});

const flavors = [
  ["base", Base],
  ["radix", Radix],
] as const;

describe.each(flavors)("%s flavor", (_name, mod) => {
  const { DatePicker } = mod;

  function Single() {
    const [date, setDate] = useState<Date | undefined>(new Date(2026, 9, 21));
    return <DatePicker value={date} onValueChange={setDate} locale="en-US" />;
  }

  const trigger = () =>
    document.querySelector<HTMLButtonElement>("[data-slot=date-picker-trigger]")!;
  const popup = () => document.querySelector("[data-slot=date-picker-popup]");

  it("opens with focus on the selected day", async () => {
    render(<Single />);
    expect(trigger().textContent).toContain("Oct 21");
    await act(async () => {
      fireEvent.click(trigger());
    });
    await waitFor(() => expect(popup()).not.toBeNull());
    await waitFor(() =>
      expect(document.activeElement?.getAttribute("aria-label")).toMatch(/October 21st, 2026/)
    );
  });

  it("closes on Escape, returns focus to the trigger, and plays its exit", async () => {
    render(<Single />);
    await act(async () => {
      fireEvent.click(trigger());
    });
    await waitFor(() =>
      expect(document.activeElement?.getAttribute("aria-label")).toMatch(/October 21st, 2026/)
    );
    // Read the popup in the same commit that marks the trigger closed: it
    // must still be mounted there, for its exit spring.
    let mountedAtClose: boolean | null = null;
    const observer = new MutationObserver(() => {
      if (mountedAtClose === null && trigger().getAttribute("aria-expanded") === "false") {
        mountedAtClose = popup() !== null;
      }
    });
    observer.observe(trigger(), { attributes: true, attributeFilter: ["aria-expanded"] });
    await act(async () => {
      fireEvent.keyDown(document.activeElement!, { key: "Escape" });
    });
    await waitFor(() => expect(trigger().getAttribute("aria-expanded")).toBe("false"));
    observer.disconnect();
    expect(mountedAtClose).toBe(true);
    // ...and gone once it has played.
    await waitFor(() => expect(popup()).toBeNull(), { timeout: 1000 });
    await waitFor(() => expect(document.activeElement).toBe(trigger()));
  });

  it("closes after a pick and reports the date", async () => {
    let picked: Date | undefined;
    function Picker() {
      const [date, setDate] = useState<Date | undefined>(new Date(2026, 9, 21));
      return (
        <DatePicker
          value={date}
          onValueChange={(d) => {
            picked = d;
            setDate(d);
          }}
          locale="en-US"
        />
      );
    }
    render(<Picker />);
    await act(async () => {
      fireEvent.click(trigger());
    });
    const day = await screen.findByRole("button", { name: /October 23rd, 2026/ });
    await act(async () => {
      fireEvent.click(day);
    });
    expect(picked?.getDate()).toBe(23);
    await waitFor(() => expect(trigger().getAttribute("aria-expanded")).toBe("false"), {
      timeout: 1000,
    });
    expect(trigger().textContent).toContain("Oct 23");
  });

  it("commits a typed time on Enter", async () => {
    let value: string | null = "11:00";
    function Timed() {
      const [time, setTime] = useState<string | null>("11:00");
      return (
        <DatePicker
          value={new Date(2026, 9, 21)}
          time={time}
          onTimeChange={(t) => {
            value = t;
            setTime(t);
          }}
          hourCycle={24}
        />
      );
    }
    render(<Timed />);
    const input = screen.getByRole("combobox", { name: "Time" });
    await act(async () => {
      fireEvent.focus(input);
      fireEvent.change(input, { target: { value: "1130" } });
    });
    await act(async () => {
      fireEvent.keyDown(input, { key: "Enter" });
    });
    expect(value).toBe("11:30");
    expect((input as HTMLInputElement).value).toBe("11:30");
  });

  it("submits its value through a hidden input when named", () => {
    render(
      <form>
        <DatePicker name="when" value={new Date(2026, 9, 21)} time="11:00" onTimeChange={() => {}} />
      </form>
    );
    const form = document.querySelector("form")!;
    expect(new FormData(form).get("when")).toBe("2026-10-21T11:00");
  });

  it("hides the duration while the end time is being edited, keeping its width", async () => {
    render(
      <DatePicker
        value={new Date(2026, 9, 21)}
        timeRange={{ start: "11:00", end: "12:45" }}
        onTimeRangeChange={() => {}}
        hourCycle={24}
      />
    );
    const duration = () => document.querySelector("[data-slot=date-picker-duration]")!;
    // Hidden but still laid out, so the field keeps its width.
    const hidden = () => duration().parentElement!.classList.contains("invisible");
    expect(duration().textContent).toBe("1h 45min");
    expect(hidden()).toBe(false);
    const end = screen.getByRole("combobox", { name: "End time" });
    await act(async () => {
      fireEvent.focus(end);
    });
    expect(hidden()).toBe(true);
    await act(async () => {
      fireEvent.keyDown(end, { key: "Escape" });
    });
    expect(hidden()).toBe(false);
  });
});
