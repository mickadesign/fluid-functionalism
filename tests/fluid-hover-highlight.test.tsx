// @vitest-environment jsdom
/**
 * FluidHoverHighlight: the one hover overlay every fluid hover list renders.
 * These pin the behaviours the 19 hand-rolled copies it replaced relied on
 * (see the 2026-09-07 `refactor(fluid-hover)` commits).
 */
import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, waitFor } from "@testing-library/react";

const motionState = vi.hoisted(() => ({ reduced: false }));

vi.mock("framer-motion", async (importOriginal) => {
  const actual = await importOriginal<typeof import("framer-motion")>();
  return { ...actual, useReducedMotion: () => motionState.reduced };
});

import {
  FluidHoverHighlight,
  resolveHighlightTransition,
  resolveHighlightSource,
  resolveHighlightFrom,
} from "@/registry/default/fluid-hover-highlight";
import { spring } from "@/registry/default/lib/springs";

const rowA = { top: 8, left: 4, width: 200, height: 36 };
const rowB = { top: 48, left: 4, width: 200, height: 36 };

const highlight = (el: HTMLElement) =>
  el.querySelector<HTMLElement>('[data-slot="fluid-hover-highlight"]');

beforeEach(() => {
  motionState.reduced = false;
});

describe("resolveHighlightTransition", () => {
  it("defaults to spring.fast for position and a 0.08s fade for opacity", () => {
    expect(resolveHighlightTransition(undefined, false)).toEqual({
      ...spring.fast,
      opacity: { duration: 0.08 },
    });
  });

  it("takes a custom positional spring but keeps the opacity fade", () => {
    expect(resolveHighlightTransition(spring.moderate, false)).toEqual({
      ...spring.moderate,
      opacity: { duration: 0.08 },
    });
  });

  it("`false` snaps position (a reflow, not a hover) and still fades", () => {
    expect(resolveHighlightTransition(false, false)).toEqual({
      duration: 0,
      opacity: { duration: 0.08 },
    });
  });

  it("reduced motion drops the travel and keeps the fade", () => {
    expect(resolveHighlightTransition(spring.fast, true)).toEqual({
      duration: 0,
      opacity: { duration: 0.08 },
    });
  });
});

describe("FluidHoverHighlight", () => {
  it("renders nothing without a rect", () => {
    const { container } = render(<FluidHoverHighlight rect={null} session={1} />);
    expect(highlight(container)).toBeNull();
  });

  it("mounts at the rect, invisible, and merges the consumer's classes", () => {
    const { container } = render(
      <FluidHoverHighlight rect={rowA} session={1} className="rounded-lg z-0" />
    );
    const el = highlight(container)!;
    expect(el).not.toBeNull();
    expect(el.className).toContain("absolute");
    expect(el.className).toContain("bg-hover");
    expect(el.className).toContain("pointer-events-none");
    expect(el.className).toContain("rounded-lg");
    expect(el.className).toContain("z-0");
    // framer writes `initial` as inline styles on first render: position as
    // a transform (compositor), size as layout.
    expect(el.style.opacity).toBe("0");
    expect(el.style.transform).toContain("translateY(8px)");
    expect(el.style.transform).toContain("translateX(4px)");
    expect(el.style.top).toBe("");
    expect(el.style.height).toBe("36px");
  });

  it("fades in from `from` when given, so a dropdown starts at its checked row", () => {
    const { container } = render(
      <FluidHoverHighlight rect={rowA} from={rowB} session={1} />
    );
    expect(highlight(container)!.style.transform).toContain("translateY(48px)");
  });

  it("a new session remounts the node, so re-entry fades in fresh", () => {
    const { container, rerender } = render(
      <FluidHoverHighlight rect={rowA} session={1} />
    );
    const first = highlight(container)!;
    rerender(<FluidHoverHighlight rect={rowB} session={2} />);
    const nodes = container.querySelectorAll('[data-slot="fluid-hover-highlight"]');
    const latest = nodes[nodes.length - 1] as HTMLElement;
    expect(latest).not.toBe(first);
    expect(latest.style.opacity).toBe("0");
    expect(latest.style.transform).toContain("translateY(48px)");
  });

  it("the same session keeps the node, so a hover change travels", () => {
    const { container, rerender } = render(
      <FluidHoverHighlight rect={rowA} session={1} />
    );
    const first = highlight(container)!;
    rerender(<FluidHoverHighlight rect={rowB} session={1} />);
    expect(highlight(container)).toBe(first);
  });

  it("unmounts once the rect is gone", async () => {
    const { container, rerender } = render(
      <FluidHoverHighlight rect={rowA} session={1} />
    );
    expect(highlight(container)).not.toBeNull();
    rerender(<FluidHoverHighlight rect={null} session={1} />);
    await waitFor(() => expect(highlight(container)).toBeNull(), { timeout: 2000 });
  });
});


describe("FluidHoverHighlight, driven by the hook", () => {
  const hook = (over: Partial<Parameters<typeof resolveHighlightSource>[0]["hover"] & object> = {}) => ({
    activeIndex: 1,
    itemRects: [rowA, rowB],
    isMeasured: true,
    sessionRef: { current: 7 },
    ...over,
  });

  it("sits on itemRects[activeIndex] and re-keys on the session", () => {
    expect(resolveHighlightSource({ hover: hook() })).toEqual({ rect: rowB, session: 7 });
  });

  it("shows nothing until the rects are measured", () => {
    expect(resolveHighlightSource({ hover: hook({ isMeasured: false }) }).rect).toBeNull();
  });

  it("shows nothing with no highlighted index, or an unmeasured slot", () => {
    expect(resolveHighlightSource({ hover: hook({ activeIndex: null }) }).rect).toBeNull();
    expect(resolveHighlightSource({ hover: hook({ activeIndex: 5 }) }).rect).toBeNull();
  });

  it("`hidden` keeps the state but shows nothing (a closed popup)", () => {
    expect(resolveHighlightSource({ hover: hook(), hidden: true }).rect).toBeNull();
  });

  it("renders from the hook the same as from a rect", () => {
    const { container } = render(<FluidHoverHighlight hover={hook()} className="rounded-lg" />);
    const el = highlight(container)!;
    expect(el.style.transform).toContain("translateY(48px)");
    expect(el.style.height).toBe("36px");
  });
});

describe("FluidHoverHighlight, where a fresh highlight starts", () => {
  const hook = (pointerDriven?: boolean) => ({
    activeIndex: 1,
    itemRects: [rowA, rowB],
    isMeasured: true,
    sessionRef: { current: 1 },
    ...(pointerDriven === undefined ? {} : { pointerDrivenRef: { current: pointerDriven } }),
  });

  it("starts at `from` when the pointer lit the row", () => {
    expect(resolveHighlightFrom({ hover: hook(true), from: rowA })).toBe(rowA);
    const { container } = render(<FluidHoverHighlight hover={hook(true)} from={rowA} />);
    expect(highlight(container)!.style.transform).toContain("translateY(8px)");
  });

  it("fades in where it is when the keyboard lit the row", () => {
    expect(resolveHighlightFrom({ hover: hook(false), from: rowA })).toBeNull();
    const { container } = render(<FluidHoverHighlight hover={hook(false)} from={rowA} />);
    expect(highlight(container)!.style.transform).toContain("translateY(48px)");
  });

  it("keeps `from` for a source without pointerDrivenRef, and for the rect form", () => {
    expect(resolveHighlightFrom({ hover: hook(), from: rowA })).toBe(rowA);
    expect(resolveHighlightFrom({ rect: rowB, session: 1, from: rowA })).toBe(rowA);
  });
});
