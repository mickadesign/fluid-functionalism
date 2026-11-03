// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render } from "@testing-library/react";
import { Profiler, createContext, useContext, useRef, type ReactNode } from "react";

// Rows read the highlighted index through `activeStore` + `useFluidHoverSelect`,
// so a hover change re-renders the row it left and the row it reached, not
// every row in the list. The accordion's per-frame remeasure (while a panel's
// height springs) re-renders the group's overlays, never its items.

// Springs don't run in jsdom: motion.div renders a plain div and hands its
// onUpdate to the test, which calls it the way a running animation would.
const onUpdates: (() => void)[] = [];
vi.mock("motion/react", async (importOriginal) => {
  const actual = await importOriginal<typeof import("motion/react")>();
  const { createElement, forwardRef } = await import("react");
  const MotionDiv = forwardRef<HTMLDivElement, Record<string, unknown>>(function MotionDiv(
    {
      initial: _initial,
      animate: _animate,
      exit: _exit,
      transition: _transition,
      layout: _layout,
      onUpdate,
      onAnimationComplete: _onAnimationComplete,
      ...rest
    },
    ref
  ) {
    if (typeof onUpdate === "function") onUpdates.push(onUpdate as () => void);
    return createElement("div", { ...rest, ref });
  });
  return {
    ...actual,
    useReducedMotion: () => false,
    AnimatePresence: ({ children }: { children: ReactNode }) => children,
    // `motion` is a Proxy, so spreading it would drop motion.span & co.
    motion: new Proxy(actual.motion, {
      get: (target, key, receiver) =>
        key === "div" ? MotionDiv : Reflect.get(target, key, receiver),
    }),
  };
});

import {
  useFluidHover,
  useFluidHoverSelect,
  useRegisterFluidHoverItem,
  type FluidHoverActiveStore,
} from "@/registry/default/hooks/use-fluid-hover";
import * as StandardHover from "@/registry/standard/hooks/use-fluid-hover";
import { Table, TableBody, TableCell, TableRow } from "@/registry/default/table";
import * as RadixAccordion from "@/registry/radix/accordion";
import * as BaseAccordion from "@/registry/base/accordion";

let frames: Map<number, FrameRequestCallback>;
let nextFrame: number;
let shift: number;
const flushFrames = () =>
  act(() => {
    // A pass can schedule another (the remeasure retry), so drain.
    for (let guard = 0; guard < 10 && frames.size > 0; guard++) {
      const pending = [...frames.values()];
      frames.clear();
      pending.forEach((callback) => callback(0));
    }
  });

beforeEach(() => {
  frames = new Map();
  nextFrame = 0;
  shift = 0;
  onUpdates.length = 0;
  vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => {
    frames.set(++nextFrame, callback);
    return nextFrame;
  });
  vi.stubGlobal("cancelAnimationFrame", (id: number) => frames.delete(id));
  vi.stubGlobal(
    "ResizeObserver",
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    }
  );
  vi.spyOn(HTMLElement.prototype, "offsetWidth", "get").mockReturnValue(200);
  vi.spyOn(HTMLElement.prototype, "offsetHeight", "get").mockReturnValue(36);
  vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockReturnValue(new DOMRect(0, 0, 200, 36));
  // Every element sits at its data-top, plus `shift`: bumping it moves the
  // whole layout, as a panel springing open above would.
  vi.spyOn(HTMLElement.prototype, "offsetTop", "get").mockImplementation(function (this: HTMLElement) {
    return Number(this.dataset.top ?? 0) + shift;
  });
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

/** Renders per Profiler id, reset between steps. */
function useRenderLog() {
  const renders = new Map<string, number>();
  const onRender = (id: string) => renders.set(id, (renders.get(id) ?? 0) + 1);
  const rendered = () => [...renders.keys()].sort();
  const reset = () => renders.clear();
  return { onRender, rendered, reset };
}

describe("useFluidHoverSelect", () => {
  for (const [flavor, hook] of [
    ["fluid", { useFluidHover, useFluidHoverSelect, useRegisterFluidHoverItem }],
    ["standard", StandardHover],
  ] as const) {
    it(`re-renders only the rows a highlight change touches (${flavor})`, () => {
      const log = useRenderLog();
      const ListContext = createContext<{
        activeStore: FluidHoverActiveStore;
        registerItem: (index: number, element: HTMLElement | null) => void;
      } | null>(null);
      let setActive: (index: number | null) => void = () => {};

      function Row({ index }: { index: number }) {
        const ctx = useContext(ListContext)!;
        const ref = useRef<HTMLDivElement>(null);
        hook.useRegisterFluidHoverItem(ctx.registerItem, index, ref);
        const lit = hook.useFluidHoverSelect(ctx.activeStore, (i) => i === index);
        return <div ref={ref} data-row={index} data-lit={lit || undefined} />;
      }
      function List({ children }: { children: ReactNode }) {
        const ref = useRef<HTMLDivElement>(null);
        const hover = hook.useFluidHover(ref);
        setActive = hover.setActiveIndex;
        return (
          <ListContext.Provider value={{ activeStore: hover.activeStore, registerItem: hover.registerItem }}>
            <div ref={ref}>{children}</div>
          </ListContext.Provider>
        );
      }
      // A fresh context value each render on purpose would defeat the point;
      // the components memo theirs. Here the store and registerItem are
      // stable, so React skips rows whose selector result is unchanged once
      // children are stable elements.
      const rows = Array.from({ length: 20 }, (_, i) => (
        <Profiler key={i} id={`row-${String(i).padStart(2, "0")}`} onRender={log.onRender}>
          <Row index={i} />
        </Profiler>
      ));
      const { container } = render(<List>{rows}</List>);
      flushFrames();

      log.reset();
      act(() => setActive(3));
      expect(log.rendered()).toEqual(["row-03"]);
      expect(container.querySelector("[data-lit]")?.getAttribute("data-row")).toBe("3");

      log.reset();
      act(() => setActive(4));
      expect(log.rendered()).toEqual(["row-03", "row-04"]);

      log.reset();
      act(() => setActive(null));
      expect(log.rendered()).toEqual(["row-04"]);
      expect(container.querySelector("[data-lit]")).toBeNull();
    });
  }
});

describe("Table", () => {
  it("lights the hovered row and hides the borders around it, re-rendering only those rows", () => {
    const log = useRenderLog();
    const { container } = render(
      <Table>
        <TableBody>
          {Array.from({ length: 12 }, (_, i) => (
            <Profiler key={i} id={`row-${String(i).padStart(2, "0")}`} onRender={log.onRender}>
              <TableRow index={i} data-top={i * 36}>
                <TableCell>Row {i}</TableCell>
              </TableRow>
            </Profiler>
          ))}
        </TableBody>
      </Table>
    );
    flushFrames();
    const row = (i: number) => container.querySelectorAll("tr")[i];

    log.reset();
    fireEvent.mouseMove(row(5).querySelector("td")!);
    flushFrames();
    expect(row(5).className).toContain("is-active");
    expect(row(5).className).toContain("border-transparent");
    expect(row(4).className).toContain("border-transparent");
    expect(row(6).className).not.toContain("border-transparent");
    // The lit row and the one whose border sits on its top edge.
    expect(log.rendered()).toEqual(["row-04", "row-05"]);

    log.reset();
    fireEvent.mouseMove(row(6).querySelector("td")!);
    flushFrames();
    expect(row(6).className).toContain("is-active");
    expect(row(5).className).not.toContain("is-active");
    expect(row(4).className).not.toContain("border-transparent");
    // Row 4 lets go of its hidden border, 5 goes from lit to edge, 6 lights.
    expect(log.rendered()).toEqual(["row-04", "row-05", "row-06"]);
  });
});

describe("AccordionGroup", () => {
  for (const [flavor, mod] of [
    ["radix", RadixAccordion],
    ["base", BaseAccordion],
  ] as const) {
    it(`keeps its items still while a panel's height springs (${flavor})`, () => {
      const log = useRenderLog();
      const { AccordionGroup, AccordionItem, AccordionTrigger, AccordionContent } = mod;
      const { container } = render(
        <AccordionGroup defaultValue="a">
          {["a", "b", "c", "d"].map((value, i) => (
            <Profiler key={value} id={`item-${value}`} onRender={log.onRender}>
              <AccordionItem value={value} index={i} data-top={i * 40}>
                <AccordionTrigger>Item {value}</AccordionTrigger>
                <AccordionContent>Body {value}</AccordionContent>
              </AccordionItem>
            </Profiler>
          ))}
        </AccordionGroup>
      );
      flushFrames();
      expect(onUpdates.length).toBeGreaterThan(0);

      // Three frames of a spring: the layout moves each time, and each
      // frame's onUpdate makes the group re-measure every row.
      log.reset();
      for (let frame = 1; frame <= 3; frame++) {
        shift = frame * 7;
        act(() => onUpdates.at(-1)!());
        flushFrames();
      }
      expect(log.rendered()).toEqual([]);

      // Hover still reaches the triggers, and only the one it lands on.
      const trigger = container.querySelectorAll("button")[2];
      fireEvent.mouseMove(trigger);
      flushFrames();
      expect(log.rendered()).toEqual(["item-c"]);
    });
  }
});
