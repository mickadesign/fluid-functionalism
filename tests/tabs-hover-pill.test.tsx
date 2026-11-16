// @vitest-environment jsdom
/**
 * Tabs: the hover pill takes no part in the selected tab. A hover that
 * starts from nothing, from the selected tab, or that lands on the far side
 * of it (a fast pointer skips the selected tab without hovering it) gets a
 * new pill, which fades in on the hovered tab. Between two unselected tabs
 * on the same side the same pill glides. The selected pill never dims.
 *
 * Focus drives the hovered tab here: it sets it in the same event, where the
 * pointer path waits for a frame.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, render } from "@testing-library/react";
import type { ComponentType, ReactNode } from "react";
import * as baseTabs from "@/registry/base/tabs";
import * as radixTabs from "@/registry/radix/tabs";

class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}
globalThis.ResizeObserver ??= ResizeObserverStub as unknown as typeof ResizeObserver;

beforeEach(() => {
  // jsdom lays nothing out: every tab is 80px wide, placed by its index.
  vi.spyOn(HTMLElement.prototype, "offsetWidth", "get").mockReturnValue(80);
  vi.spyOn(HTMLElement.prototype, "offsetHeight", "get").mockReturnValue(32);
  vi.spyOn(HTMLElement.prototype, "offsetLeft", "get").mockImplementation(function (
    this: HTMLElement
  ) {
    const index = this.getAttribute("data-fluid-hover-index");
    return index === null ? 0 : Number(index) * 80;
  });
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

type Flavor = {
  Tabs: ComponentType<{ selectedIndex: number; onSelect: (index: number) => void; children: ReactNode }>;
  TabsItem: ComponentType<{ index: number; label: string }>;
};

/** The fills inside the list: the selected pill first, then hover pills
 *  (one, or two while the previous one fades out). */
function fills(container: HTMLElement) {
  return [...container.querySelectorAll<HTMLElement>('[role="tablist"] > .bg-active')];
}

describe.each([
  ["base", baseTabs as unknown as Flavor],
  ["radix", radixTabs as unknown as Flavor],
])("%s Tabs hover pill", (_name, { Tabs, TabsItem }) => {
  async function setup() {
    const view = render(
      <Tabs selectedIndex={1} onSelect={() => {}}>
        {["One", "Two", "Three", "Four"].map((label, index) => (
          <TabsItem key={label} index={index} label={label} />
        ))}
      </Tabs>
    );
    // The hover hook measures the tabs on a frame.
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 50));
    });
    const tabs = [...view.container.querySelectorAll<HTMLElement>('[role="tab"]')];
    const hover = (index: number) => act(() => tabs[index].focus());
    /** The newest hover pill: the last fill after the selected one. */
    const pill = () => fills(view.container).slice(1).at(-1) ?? null;
    return { ...view, hover, pill };
  }

  it("fades in on the hovered tab, not on the selected one", async () => {
    const { container, hover, pill } = await setup();
    expect(fills(container)).toHaveLength(1);
    hover(3);
    expect(pill()!.style.left).toBe("240px");
    expect(pill()!.style.opacity).toBe("0");
  });

  it("keeps the selected pill at full opacity while another tab is hovered", async () => {
    const { container, hover } = await setup();
    hover(3);
    expect(fills(container)[0].style.opacity).not.toBe("0.8");
    expect(fills(container)[0].style.left).toBe("80px");
  });

  it("glides the same pill between unselected tabs on one side", async () => {
    const { hover, pill } = await setup();
    hover(2);
    const first = pill();
    hover(3);
    expect(pill()).toBe(first);
  });

  it("starts a new pill when the hover jumps across the selected tab", async () => {
    const { hover, pill } = await setup();
    hover(0);
    const first = pill();
    hover(2);
    expect(pill()).not.toBe(first);
    expect(pill()!.style.left).toBe("160px");
  });

  it("shows no hover pill over the selected tab, and a new one past it", async () => {
    const { hover, pill } = await setup();
    hover(0);
    const first = pill();
    hover(1);
    hover(2);
    expect(pill()).not.toBe(first);
    expect(pill()!.style.left).toBe("160px");
  });
});
