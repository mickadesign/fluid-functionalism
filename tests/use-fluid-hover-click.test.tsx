// @vitest-environment jsdom
/**
 * Gap clicks: the highlight promises a target, and `handlers.onClick` makes
 * the click keep that promise. A click between rows (a gap, the padding,
 * past the last row) lands on the highlighted row; a click inside a row, or
 * on a control that sits between rows, is left alone.
 */
import { afterEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render } from "@testing-library/react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal, flushSync } from "react-dom";
import {
  useFluidHover,
  useRegisterFluidHoverItem,
  ACTIVE_ATTR,
  ACTIVE_INDEX_ATTR,
} from "@/registry/default/hooks/use-fluid-hover";

// No vitest globals, so Testing Library does not unmount between tests on its own.
afterEach(cleanup);

type Api = ReturnType<typeof useFluidHover>;

function Row({
  index,
  registerItem,
  onClick,
  children,
}: {
  index: number;
  registerItem: Api["registerItem"];
  onClick?: () => void;
  children?: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useRegisterFluidHoverItem(registerItem, index, ref);
  return (
    <div ref={ref} data-testid={`row-${index}`} onClick={onClick}>
      {children ?? `Row ${index}`}
    </div>
  );
}

/** A box around a button: the sidebar's row shape. */
function BoxedRow({
  index,
  registerItem,
  onClick,
}: {
  index: number;
  registerItem: Api["registerItem"];
  onClick: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useRegisterFluidHoverItem(registerItem, index, ref);
  return (
    <div ref={ref} data-testid={`row-${index}`}>
      <button type="button" onClick={onClick}>
        Row {index}
      </button>
    </div>
  );
}

function List({
  expose,
  rows,
  keys,
  pin,
  boxed,
  disabled,
  gapClick,
  portal,
}: {
  expose: (api: Api) => void;
  rows: Array<() => void>;
  /** Row keys; a changed key remounts that row under the same index. */
  keys?: string[];
  /** Re-highlights this index whenever the rows change, in the same commit
   *  the rows register in: what a filtering list does to keep Enter armed. */
  pin?: number;
  boxed?: boolean;
  disabled?: (el: HTMLElement) => boolean;
  gapClick?: boolean | { maxDistance?: number };
  /** A React child rendered through a portal, like a row's own dropdown. */
  portal?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const api = useFluidHover(ref, { isItemDisabled: disabled, gapClick });
  expose(api);
  const { setActiveIndex } = api;
  const rowsKey = keys?.join("|") ?? String(rows.length);
  useEffect(() => {
    if (pin !== undefined) setActiveIndex(pin);
  }, [pin, rowsKey, setActiveIndex]);
  const RowKind = boxed ? BoxedRow : Row;
  return (
    <div ref={ref} data-testid="list" {...api.handlers}>
      <input data-testid="search" placeholder="Search" />
      {rows.map((onClick, i) => (
        <RowKind key={keys?.[i] ?? i} index={i} registerItem={api.registerItem} onClick={onClick} />
      ))}
      <span data-testid="gap">gap</span>
      {portal && createPortal(<span data-testid="portal">layer</span>, document.body)}
    </div>
  );
}

function setup(
  opts: { boxed?: boolean; disabled?: boolean; gapClick?: boolean | { maxDistance?: number } } = {}
) {
  const clicks = [vi.fn(), vi.fn(), vi.fn()];
  let api!: Api;
  const utils = render(
    <List
      expose={(a) => (api = a)}
      rows={clicks}
      boxed={opts.boxed}
      disabled={opts.disabled ? (el) => el.dataset.testid === "row-1" : undefined}
      gapClick={opts.gapClick}
    />
  );
  const highlight = (index: number | null) => act(() => api.setActiveIndex(index));
  return { ...utils, clicks, highlight };
}

describe("useFluidHover: gap clicks land on the highlighted row", () => {
  it("a click between rows activates the highlighted row", () => {
    const { getByTestId, clicks, highlight } = setup();
    highlight(1);
    fireEvent.click(getByTestId("gap"));
    expect(clicks[1]).toHaveBeenCalledTimes(1);
    expect(clicks[0]).not.toHaveBeenCalled();
  });

  it("a click on the container itself counts as a gap", () => {
    const { getByTestId, clicks, highlight } = setup();
    highlight(2);
    fireEvent.click(getByTestId("list"));
    expect(clicks[2]).toHaveBeenCalledTimes(1);
  });

  it("does nothing when no row is highlighted", () => {
    const { getByTestId, clicks, highlight } = setup();
    highlight(null);
    fireEvent.click(getByTestId("gap"));
    for (const c of clicks) expect(c).not.toHaveBeenCalled();
  });

  it("a row that unmounted during its own click is not a gap", () => {
    // A "create" row becomes a real item inside its click (the primitive
    // flushes the pick synchronously), so the click reaches the list from a
    // detached target. It already landed; routing it again would activate
    // the highlighted row on top.
    const clicks = [vi.fn(), vi.fn()];
    let api!: Api;
    function Vanishing() {
      const ref = useRef<HTMLDivElement>(null);
      const [gone, setGone] = useState(false);
      api = useFluidHover(ref, {});
      return (
        <div ref={ref} data-testid="list" {...api.handlers}>
          <Row index={0} registerItem={api.registerItem} onClick={clicks[0]} />
          {!gone && (
            <Row
              index={1}
              registerItem={api.registerItem}
              onClick={() => {
                clicks[1]();
                flushSync(() => setGone(true));
              }}
            />
          )}
        </div>
      );
    }
    const { getByTestId } = render(<Vanishing />);
    act(() => api.setActiveIndex(0));
    fireEvent.click(getByTestId("row-1"));
    expect(clicks[1]).toHaveBeenCalledTimes(1);
    expect(clicks[0]).not.toHaveBeenCalled();
  });

  it("a click inside a row is the row's own, not routed", () => {
    const { getByTestId, clicks, highlight } = setup();
    highlight(1);
    fireEvent.click(getByTestId("row-0"));
    expect(clicks[0]).toHaveBeenCalledTimes(1);
    expect(clicks[1]).not.toHaveBeenCalled();
  });

  it("a control between rows keeps its click (the search field)", () => {
    const { getByTestId, clicks, highlight } = setup();
    highlight(1);
    fireEvent.click(getByTestId("search"));
    for (const c of clicks) expect(c).not.toHaveBeenCalled();
  });

  it("never activates a disabled row", () => {
    const { getByTestId, clicks, highlight } = setup({ disabled: true });
    highlight(1);
    fireEvent.click(getByTestId("gap"));
    for (const c of clicks) expect(c).not.toHaveBeenCalled();
  });

  it("`gapClick: false` leaves empty space inert", () => {
    const { getByTestId, clicks, highlight } = setup({ gapClick: false });
    highlight(1);
    fireEvent.click(getByTestId("gap"));
    for (const c of clicks) expect(c).not.toHaveBeenCalled();
  });

  it("`maxDistance` routes only clicks near the highlighted row", () => {
    const { getByTestId, clicks, highlight } = setup({ gapClick: { maxDistance: 10 } });
    highlight(1);
    // jsdom has no layout: every rect is 0x0 at (0,0), so a click at (5,5) is
    // within 10px and a click at (100,100) is not.
    fireEvent.click(getByTestId("gap"), { clientX: 100, clientY: 100 });
    expect(clicks[1]).not.toHaveBeenCalled();
    fireEvent.click(getByTestId("gap"), { clientX: 5, clientY: 5 });
    expect(clicks[1]).toHaveBeenCalledTimes(1);
  });

  it("lands on the control inside a boxed row, so a sidebar link still fires", () => {
    const { getByTestId, clicks, highlight } = setup({ boxed: true });
    highlight(0);
    fireEvent.click(getByTestId("gap"));
    expect(clicks[0]).toHaveBeenCalledTimes(1);
  });
});

describe("useFluidHover: the hover state is in the DOM", () => {
  it("marks the highlighted row and the container's index", () => {
    const { getByTestId, highlight } = setup();
    highlight(1);
    expect(getByTestId("row-1").hasAttribute(ACTIVE_ATTR)).toBe(true);
    expect(getByTestId("row-0").hasAttribute(ACTIVE_ATTR)).toBe(false);
    expect(getByTestId("list").getAttribute(ACTIVE_INDEX_ATTR)).toBe("1");
  });

  it("moves the mark when the highlight moves, and clears it on null", () => {
    const { getByTestId, highlight } = setup();
    highlight(1);
    highlight(2);
    expect(getByTestId("row-1").hasAttribute(ACTIVE_ATTR)).toBe(false);
    expect(getByTestId("row-2").hasAttribute(ACTIVE_ATTR)).toBe(true);
    expect(getByTestId("list").getAttribute(ACTIVE_INDEX_ATTR)).toBe("2");
    highlight(null);
    expect(getByTestId("row-2").hasAttribute(ACTIVE_ATTR)).toBe(false);
    expect(getByTestId("list").hasAttribute(ACTIVE_INDEX_ATTR)).toBe(false);
  });

  it("a row remounted under the highlighted index gives the mark up when the highlight moves", () => {
    const clicks = [vi.fn(), vi.fn(), vi.fn()];
    let api!: Api;
    const { getByTestId, rerender } = render(
      <List expose={(a) => (api = a)} rows={clicks} keys={["a", "b", "c"]} pin={1} />
    );
    expect(getByTestId("row-1").hasAttribute(ACTIVE_ATTR)).toBe(true);
    // Row 1 remounts (a filtering list re-keys its rows) and the list pins
    // index 1 again in the same commit: the index never changes, so the
    // mark reaches the new element through registerItem, not the effect.
    rerender(<List expose={(a) => (api = a)} rows={clicks} keys={["a", "b2", "c"]} pin={1} />);
    expect(getByTestId("list").getAttribute(ACTIVE_INDEX_ATTR)).toBe("1");
    expect(getByTestId("row-1").hasAttribute(ACTIVE_ATTR)).toBe(true);
    act(() => api.setActiveIndex(2));
    expect(getByTestId("row-1").hasAttribute(ACTIVE_ATTR)).toBe(false);
    expect(getByTestId("row-2").hasAttribute(ACTIVE_ATTR)).toBe(true);
  });
});

describe("useFluidHover: rows move index", () => {
  it("a row that moves off the highlighted index hands the highlight to the row now there", () => {
    const clicks = [vi.fn(), vi.fn(), vi.fn()];
    let api!: Api;
    const { rerender, getByTestId } = render(
      <List expose={(a) => (api = a)} rows={clicks} keys={["b", "c", "d"]} pin={0} />
    );
    expect(api.activeIndex).toBe(0);
    expect(getByTestId("row-0").hasAttribute("data-fluid-hover-active")).toBe(true);
    // The query clears: row "a" returns at the top and "b" moves to index 1,
    // unregistering index 0 on its way. The list pins index 0 again.
    rerender(<List expose={(a) => (api = a)} rows={[vi.fn(), ...clicks]} keys={["a", "b", "c", "d"]} pin={0} />);
    expect(api.activeIndex).toBe(0);
    expect(getByTestId("row-0").hasAttribute("data-fluid-hover-active")).toBe(true);
    expect(getByTestId("row-1").hasAttribute("data-fluid-hover-active")).toBe(false);
  });
});

describe("useFluidHover: the highlighted row unregisters", () => {
  it("clears the highlight so nothing stale stays lit or takes a routed click", () => {
    const clicks = [vi.fn(), vi.fn(), vi.fn()];
    let api!: Api;
    const { getByTestId, rerender } = render(
      <List expose={(a) => (api = a)} rows={clicks} />
    );
    act(() => api.setActiveIndex(2));
    expect(getByTestId("list").getAttribute(ACTIVE_INDEX_ATTR)).toBe("2");
    // Row 2 unmounts and unregisters.
    rerender(<List expose={(a) => (api = a)} rows={clicks.slice(0, 2)} />);
    expect(getByTestId("list").hasAttribute(ACTIVE_INDEX_ATTR)).toBe(false);
    fireEvent.click(getByTestId("gap"));
    for (const c of clicks) expect(c).not.toHaveBeenCalled();
  });
});

describe("useFluidHover: events from a portalled child", () => {
  // React bubbles them through the list, but they happened in another layer
  // (a dropdown opened from a row, a submenu): no routed click, no pick.
  function setupPortal() {
    const clicks = [vi.fn(), vi.fn(), vi.fn()];
    let api!: Api;
    const utils = render(<List expose={(a) => (api = a)} rows={clicks} portal />);
    act(() => api.setActiveIndex(1));
    return { ...utils, clicks, api: () => api };
  }

  it("a click in the portal is not routed to the highlighted row", () => {
    const { getByTestId, clicks } = setupPortal();
    fireEvent.click(getByTestId("portal"));
    for (const c of clicks) expect(c).not.toHaveBeenCalled();
  });

  it("a move in the portal leaves the highlight where it is", async () => {
    const { getByTestId, api } = setupPortal();
    fireEvent.mouseMove(getByTestId("portal"), { clientX: 5, clientY: 500 });
    await act(() => new Promise((r) => setTimeout(r, 32)));
    expect(api().activeIndex).toBe(1);
  });
});
