// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import * as Base from "@/registry/base/sidebar";
import * as Radix from "@/registry/radix/sidebar";

class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}
globalThis.ResizeObserver ??= ResizeObserverStub as unknown as typeof ResizeObserver;
Element.prototype.scrollIntoView ??= () => {};

const flavors = [
  ["base", Base],
  ["radix", Radix],
] as const;

const sheet = () => document.querySelector('[data-mobile="true"]');
const dialogs = () => document.querySelectorAll('[role="dialog"]');

async function advance(ms: number) {
  await act(async () => {
    vi.advanceTimersByTime(ms);
  });
}


function watchSheetAdds() {
  let added = 0;
  const hit = (n: Node) =>
    n instanceof Element && (n.matches('[data-mobile="true"]') || !!n.querySelector('[data-mobile="true"]'));
  const mo = new MutationObserver((ms) => {
    for (const m of ms) m.addedNodes.forEach((n) => { if (hit(n)) added++; });
  });
  mo.observe(document.body, { childList: true, subtree: true });
  return {
    stop() {
      mo.takeRecords().forEach((m) => m.addedNodes.forEach((n) => { if (hit(n)) added++; }));
      mo.disconnect();
      return added;
    },
  };
}

async function settle() {
  for (let i = 0; i < 30; i++) await advance(100);
}

beforeEach(() => {
  vi.useFakeTimers();
  window.matchMedia = ((query: string) =>
    ({
      matches: true,
      media: query,
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    }) as MediaQueryList) as typeof window.matchMedia;
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe.each(flavors)("mobile sheet close (%s)", (_name, mod) => {
  const { SidebarProvider, Sidebar, SidebarContent, SidebarTrigger } = mod;

  function setup() {
    render(
      <SidebarProvider>
        <Sidebar>
          <SidebarContent>Nav</SidebarContent>
        </Sidebar>
        <SidebarTrigger />
      </SidebarProvider>,
    );
  }

  async function openSheet() {
    const trigger = screen.getByLabelText("Toggle Sidebar");
    await act(async () => {
      fireEvent.click(trigger);
    });
    await advance(100);
    expect(sheet()).not.toBeNull();
    return trigger;
  }

  it("a dismissed sheet stays closed", async () => {
    setup();
    await openSheet();

    const watch = watchSheetAdds();
    await act(async () => {
      fireEvent.keyDown(document.activeElement ?? document.body, { key: "Escape" });
    });
    await settle();
    // The sheet must never be mounted again after a dismiss.
    expect(watch.stop()).toBe(0);
    await advance(3000);
    expect(sheet()).toBeNull();
    expect(dialogs().length).toBe(0);

    await advance(3000);
    expect(sheet()).toBeNull();
    expect(dialogs().length).toBe(0);
  });

  it("a parent-driven close plays out and stays closed", async () => {
    setup();
    const trigger = await openSheet();

    const watch = watchSheetAdds();
    await act(async () => {
      fireEvent.click(trigger);
    });
    await settle();
    expect(watch.stop()).toBe(0);
    await advance(3000);
    expect(sheet()).toBeNull();
    expect(dialogs().length).toBe(0);

    await advance(3000);
    expect(sheet()).toBeNull();
    expect(dialogs().length).toBe(0);
  });

  it("reopens after a close", async () => {
    setup();
    await openSheet();

    await act(async () => {
      fireEvent.keyDown(document.activeElement ?? document.body, { key: "Escape" });
    });
    await advance(3000);
    expect(sheet()).toBeNull();

    await act(async () => {
      fireEvent.click(screen.getByLabelText("Toggle Sidebar"));
    });
    await advance(100);
    expect(sheet()).not.toBeNull();
  });
});
