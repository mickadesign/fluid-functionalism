// @vitest-environment jsdom
/**
 * The Radix Dropdown's hover-to-open timer (`openOnHover`): what a hover
 * opens, a hover closes; a click or the keyboard owns its own open; a click
 * pins a hover-opened menu; and a request a controlled parent turns down
 * leaves no stale ownership behind.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, renderHook } from "@testing-library/react";
import { useState } from "react";
import { useHoverControl } from "@/registry/radix/dropdown";

/** The menu's open state plus the hover control over it. `accept` false
 *  plays a controlled parent that turns every change down. */
function useHarness(accept = true) {
  const [open, setOpenState] = useState(false);
  const setOpen = (next: boolean) => {
    if (accept) setOpenState(next);
  };
  const hover = useHoverControl(open, setOpen);
  return { open, setOpenState, hover };
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout", "performance"] });
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe("Radix openOnHover timer", () => {
  it("opens after the rest delay and closes after the close delay", () => {
    const { result } = renderHook(() => useHarness());
    act(() => result.current.hover.enter(100));
    act(() => vi.advanceTimersByTime(99));
    expect(result.current.open).toBe(false);
    act(() => vi.advanceTimersByTime(1));
    expect(result.current.open).toBe(true);
    expect(result.current.hover.openedByHover()).toBe(true);

    act(() => result.current.hover.leave(150));
    act(() => vi.advanceTimersByTime(150));
    expect(result.current.open).toBe(false);
  });

  it("keeps the menu while the pointer crosses into it", () => {
    const { result } = renderHook(() => useHarness());
    act(() => result.current.hover.enter(100));
    act(() => vi.advanceTimersByTime(100));
    act(() => result.current.hover.leave(150));
    act(() => vi.advanceTimersByTime(80));
    act(() => result.current.hover.cancel()); // the popup's pointerenter
    act(() => vi.advanceTimersByTime(500));
    expect(result.current.open).toBe(true);
  });

  it("leaves a click-opened menu alone", () => {
    const { result } = renderHook(() => useHarness());
    act(() => result.current.setOpenState(true)); // Radix's own toggle
    expect(result.current.hover.openedByHover()).toBe(false);
    act(() => result.current.hover.enter(100));
    act(() => vi.advanceTimersByTime(100));
    act(() => result.current.hover.leave(150));
    act(() => vi.advanceTimersByTime(500));
    expect(result.current.open).toBe(true);
  });

  it("pins a hover-opened menu on click, once", () => {
    const { result } = renderHook(() => useHarness());
    act(() => result.current.hover.enter(100));
    act(() => vi.advanceTimersByTime(100));
    let pinned = false;
    act(() => {
      pinned = result.current.hover.pin();
    });
    expect(pinned).toBe(true);
    expect(result.current.hover.takePin()).toBe(true);
    expect(result.current.hover.takePin()).toBe(false);
    act(() => result.current.hover.leave(150));
    act(() => vi.advanceTimersByTime(500));
    expect(result.current.open).toBe(true);
    expect(result.current.hover.openedByHover()).toBe(false);
  });

  it("drops a hover request the parent turned down", () => {
    const { result, rerender } = renderHook(({ accept }) => useHarness(accept), {
      initialProps: { accept: false },
    });
    act(() => result.current.hover.enter(100));
    act(() => vi.advanceTimersByTime(100));
    expect(result.current.open).toBe(false);

    // Nothing is open, so a press has nothing to pin and opens the menu.
    let pinned = true;
    act(() => {
      pinned = result.current.hover.pin();
    });
    expect(pinned).toBe(false);

    // A later open from a click is the reader's, focus and all.
    rerender({ accept: true });
    act(() => vi.advanceTimersByTime(1000));
    act(() => result.current.setOpenState(true));
    expect(result.current.hover.openedByHover()).toBe(false);
  });

  it("does not claim a stale request when the menu opens much later", () => {
    const { result } = renderHook(() => useHarness(false));
    act(() => result.current.hover.enter(100));
    act(() => vi.advanceTimersByTime(100));
    // No pin in between: the keyboard opens it a second later.
    act(() => vi.advanceTimersByTime(1000));
    act(() => result.current.setOpenState(true));
    expect(result.current.hover.openedByHover()).toBe(false);
  });
});
