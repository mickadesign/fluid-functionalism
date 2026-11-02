// @vitest-environment jsdom
/**
 * Registry components drop props before a spread with omit() rather than a
 * `{ key: _key, ...rest }` destructure: a fresh Next app's lint has no `^_`
 * ignore, so every such binding was a warning in installs. omit() has to keep
 * exactly what the destructure kept, and the components that switched to it
 * have to keep passing the rest through while the dropped props stay off the
 * DOM. These cover the switched sites nothing else renders.
 */
import { afterEach, beforeEach, describe, expect, it, vi, type MockInstance } from "vitest";
import { cleanup, fireEvent, render } from "@testing-library/react";
import { omit } from "@/registry/default/lib/omit";
import * as BaseAccordion from "@/registry/base/accordion";
import * as RadixAccordion from "@/registry/radix/accordion";
import { Slider as BaseSlider } from "@/registry/base/slider";
import { Slider as RadixSlider } from "@/registry/radix/slider";
import { ScrollArea } from "@/registry/radix/scroll-area";
import { Tooltip } from "@/registry/base/tooltip";

// jsdom has no ResizeObserver; the hover hook and the sliders observe with one.
class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}
globalThis.ResizeObserver ??= ResizeObserverStub as unknown as typeof ResizeObserver;
// Nor matchMedia, which the touch hook reads (ScrollArea).
window.matchMedia ??= ((query: string) => ({
  matches: false,
  media: query,
  onchange: null,
  addEventListener() {},
  removeEventListener() {},
  addListener() {},
  removeListener() {},
  dispatchEvent: () => false,
})) as typeof window.matchMedia;

// A prop that reached the DOM by mistake shows up as a React warning.
let consoleError: MockInstance<typeof console.error>;
beforeEach(() => {
  consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
});
afterEach(() => {
  const leaks = consoleError.mock.calls
    .map((args) => args.map(String).join(" "))
    .filter((msg) => /does not recognize|Unknown event handler|non-boolean attribute/.test(msg));
  consoleError.mockRestore();
  cleanup();
  expect(leaks).toEqual([]);
});

describe("omit", () => {
  it("keeps what a rest destructure keeps, in the same order", () => {
    const tag = Symbol("tag");
    const source = { a: 1, b: undefined, c: 3, [tag]: 4 };
    const { a: _a, c: _c, ...expected } = source;
    const result = omit(source, ["a", "c"]);
    expect(result).toEqual(expected);
    expect(Object.keys(result)).toEqual(Object.keys(expected));
    expect("b" in result).toBe(true);
    expect(Object.getOwnPropertySymbols(result)).toEqual([tag]);
  });

  it("leaves the source alone", () => {
    const source = Object.freeze({ a: 1, b: 2 });
    expect(omit(source, ["a"])).toEqual({ b: 2 });
    expect(source).toEqual({ a: 1, b: 2 });
  });
});

describe.each([
  ["base", BaseAccordion],
  ["radix", RadixAccordion],
] as const)("%s AccordionGroup", (_flavor, A) => {
  it("passes HTML props to the root, keeps its own off it, and still opens", () => {
    const { getByTestId } = render(
      <A.AccordionGroup type="single" collapsible defaultValue="a" data-testid="group" aria-label="FAQ">
        <A.AccordionItem value="a" index={0}>
          <A.AccordionTrigger>First</A.AccordionTrigger>
          <A.AccordionContent>First body</A.AccordionContent>
        </A.AccordionItem>
        <A.AccordionItem value="b" index={1}>
          <A.AccordionTrigger>Second</A.AccordionTrigger>
          <A.AccordionContent>Second body</A.AccordionContent>
        </A.AccordionItem>
      </A.AccordionGroup>
    );
    const root = getByTestId("group");
    expect(root.getAttribute("aria-label")).toBe("FAQ");
    for (const attr of ["type", "collapsible", "defaultvalue", "value"]) {
      expect(root.hasAttribute(attr), attr).toBe(false);
    }
    const second = root.querySelectorAll("button[aria-expanded]")[1];
    expect(second.getAttribute("aria-expanded")).toBe("false");
    fireEvent.click(second);
    expect(second.getAttribute("aria-expanded")).toBe("true");
  });
});

describe("base Accordion (standalone)", () => {
  it("renders its root without the primitive's style", () => {
    const { getByTestId } = render(
      <BaseAccordion.Accordion data-testid="solo">
        <BaseAccordion.AccordionItem value="a">
          <BaseAccordion.AccordionTrigger>Only</BaseAccordion.AccordionTrigger>
          <BaseAccordion.AccordionContent>Only body</BaseAccordion.AccordionContent>
        </BaseAccordion.AccordionItem>
      </BaseAccordion.Accordion>
    );
    expect(getByTestId("solo").hasAttribute("style")).toBe(false);
  });
});

describe.each([
  ["base", BaseSlider],
  ["radix", RadixSlider],
] as const)("%s Slider", (_flavor, Slider) => {
  it("passes HTML props through on both engines; compact-only props pick the compact one", () => {
    const noop = () => {};
    const comfortable = render(
      <Slider value={40} onChange={noop} label="Volume" data-testid="slider" />
    );
    const comfortableRoot = comfortable.getByTestId("slider");
    const comfortableMarkup = comfortable.container.innerHTML;
    comfortable.unmount();

    // Presence, not truthiness: an explicit false still routes.
    const compact = render(
      <Slider value={40} onChange={noop} label="Volume" showValue={false} data-testid="slider" />
    );
    expect(compact.getByTestId("slider")).toBeTruthy();
    expect(compact.container.innerHTML).not.toBe(comfortableMarkup);
    expect(comfortableRoot.hasAttribute("showvalue")).toBe(false);
  });
});

describe("radix ScrollArea", () => {
  it("passes the rest of its props to the root", () => {
    // scrollHideDelay is swallowed (the fade classes own hide timing). Radix
    // would consume it anyway, so only the pass-through is observable here.
    const { getByTestId } = render(
      <ScrollArea scrollHideDelay={300} data-testid="area" aria-label="List">
        <p>Row</p>
      </ScrollArea>
    );
    expect(getByTestId("area").getAttribute("aria-label")).toBe("List");
  });
});

describe("base Tooltip", () => {
  it("renders its popup when forced open", () => {
    const { getByText } = render(
      <Tooltip content="Copy link" forceOpen>
        <button type="button">Share</button>
      </Tooltip>
    );
    expect(getByText("Share")).toBeTruthy();
    expect(document.body.textContent).toContain("Copy link");
  });
});
