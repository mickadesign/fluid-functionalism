// @vitest-environment jsdom
/**
 * Banner's appear and dismiss are hand-rolled on framer's presence API (the
 * row and the banner move separately). These pin the behaviours that are easy
 * to break: a dismiss finishes even when the parent keeps re-rendering, focus
 * leaves a closing banner for a neighbour, the flex gap is taken back from the
 * first open, and a leaving banner takes no clicks.
 */
import { useEffect, useState } from "react";
import { afterEach, describe, expect, it } from "vitest";
import { act, cleanup, fireEvent, render, waitFor } from "@testing-library/react";
import { Banner, BannerTitle, bannerMotion } from "@/registry/default/banner";

const closeMs = Number(bannerMotion.dismiss.row.duration) * 1000;

// Without vitest globals, Testing Library does not clean up between tests.
afterEach(cleanup);

/** A dismissible banner whose parent re-renders it every `tickMs`, like a
 *  page with a live clock: the banner gets a new prop on every tick. */
function TickingBanner({ tickMs }: { tickMs: number }) {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), tickMs);
    return () => clearInterval(id);
  }, [tickMs]);
  return (
    <Banner dismissible data-tick={tick}>
      <BannerTitle>Saved</BannerTitle>
    </Banner>
  );
}

describe("Banner dismiss", () => {
  it("finishes even when the parent re-renders mid-dismiss", async () => {
    const { queryByText, getByLabelText } = render(<TickingBanner tickMs={30} />);
    fireEvent.click(getByLabelText("Dismiss"));
    // Re-renders every 30ms used to restart the 240ms close each time, so it
    // never finished.
    await waitFor(() => expect(queryByText("Saved")).toBeNull(), {
      timeout: closeMs * 4,
    });
  });

  it("moves keyboard focus to the next focusable element", () => {
    const { getByLabelText, getByText } = render(
      <div>
        <button type="button">Before</button>
        <Banner dismissible>
          <BannerTitle>Saved</BannerTitle>
        </Banner>
        <button type="button">After</button>
      </div>
    );
    const dismiss = getByLabelText("Dismiss");
    dismiss.focus();
    fireEvent.click(dismiss);
    expect(document.activeElement).toBe(getByText("After"));
  });

  it("falls back to the previous focusable element when nothing follows", () => {
    const { getByLabelText, getByText } = render(
      <div>
        <button type="button">Before</button>
        <Banner dismissible>
          <BannerTitle>Saved</BannerTitle>
        </Banner>
      </div>
    );
    const dismiss = getByLabelText("Dismiss");
    dismiss.focus();
    fireEvent.click(dismiss);
    expect(document.activeElement).toBe(getByText("Before"));
  });

  it("takes no clicks once it starts leaving", async () => {
    const { getByLabelText, getByText } = render(
      <Banner dismissible>
        <BannerTitle>Saved</BannerTitle>
      </Banner>
    );
    fireEvent.click(getByLabelText("Dismiss"));
    const content = getByText("Saved").closest('[data-slot="banner"]')!
      .parentElement as HTMLElement;
    await waitFor(() => expect(content.style.pointerEvents).toBe("none"), {
      timeout: closeMs * 2,
    });
  });
});

describe("Banner gap", () => {
  const column = { display: "flex", flexDirection: "column" as const, rowGap: "12px" };

  function Toggle({ initial, alone = false }: { initial: boolean; alone?: boolean }) {
    const [open, setOpen] = useState(initial);
    return (
      <>
        <button type="button" onClick={() => setOpen(true)}>
          Open
        </button>
        <div style={column} data-testid="column">
          {!alone && <p>Above</p>}
          <Banner open={open}>
            <BannerTitle>Saved</BannerTitle>
          </Banner>
          {!alone && <p>Below</p>}
        </div>
      </>
    );
  }

  const row = (root: HTMLElement) =>
    root.querySelector('[data-slot="banner"]')!.parentElement!.parentElement!
      .parentElement as HTMLElement;

  it("takes the gap back from the very first open", async () => {
    const { getByText, getByTestId } = render(<Toggle initial={false} />);
    await act(async () => fireEvent.click(getByText("Open")));
    // framer applies the measured gap on the next animation frame, which in
    // a browser runs before the first paint.
    await act(() => new Promise<void>((r) => requestAnimationFrame(() => r())));
    // Starting closed used to open with gap 0, so the content below jumped
    // by the whole gap on the first frame. The row has barely opened, so the
    // margin is still close to minus the whole gap. How far the spring got
    // depends on how long that frame took, and a busy CI runner reached 18%
    // (-9.8px), so the bar is half the gap: 0 still fails it.
    expect(parseFloat(row(getByTestId("column")).style.marginBottom)).toBeLessThan(
      -parseFloat(column.rowGap) / 2,
    );
  });

  it("takes nothing back when the banner is the only child", async () => {
    const { getByText, getByTestId } = render(<Toggle initial={false} alone />);
    await act(async () => fireEvent.click(getByText("Open")));
    await waitFor(() => {
      const margin = row(getByTestId("column")).style.marginBottom;
      expect(margin === "" || parseFloat(margin) === 0).toBe(true);
    });
  });
});

describe("Banner re-open", () => {
  it("keeps its scale continuous when re-opened mid-dismiss", async () => {
    function Flip() {
      const [open, setOpen] = useState(true);
      return (
        <>
          <button type="button" onClick={() => setOpen((o) => !o)}>
            Flip
          </button>
          <Banner open={open}>
            <BannerTitle>Saved</BannerTitle>
          </Banner>
        </>
      );
    }
    const { getByText } = render(<Flip />);
    const content = () =>
      getByText("Saved").closest('[data-slot="banner"]')!.parentElement as HTMLElement;
    const scaleOf = (el: HTMLElement) => {
      const match = el.style.transform.match(/scale\(([\d.]+)\)/);
      return match ? Number(match[1]) : 1;
    };

    fireEvent.click(getByText("Flip"));
    // Let the dismiss run about half way.
    await new Promise((r) => setTimeout(r, closeMs / 2));
    const before = scaleOf(content());
    fireEvent.click(getByText("Flip"));
    await new Promise((r) => setTimeout(r, 34));
    const after = scaleOf(content());
    // The appear formula used to take over at once and snap the scale by
    // ~10%; now it continues from where the dismiss left it.
    expect(Math.abs(after - before)).toBeLessThan(0.05);
  });
});
