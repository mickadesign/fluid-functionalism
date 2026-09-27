// @vitest-environment jsdom
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render } from "@testing-library/react";
import type { HTMLMotionProps } from "framer-motion";

// Inspect the animation's start and destination without running a spring in
// jsdom. The sidebar, row registration, measurement and hover hook stay real.
vi.mock("framer-motion", async (importOriginal) => {
  const actual = await importOriginal<typeof import("framer-motion")>();
  const { createElement, useRef } = await import("react");
  return {
    ...actual,
    useReducedMotion: () => false,
    AnimatePresence: ({ children }: { children: React.ReactNode }) => children,
    motion: {
      ...actual.motion,
      div: ({ initial, animate, children, className, "data-slot": slot }: HTMLMotionProps<"div"> & { "data-slot"?: string }) => {
        const start = useRef(initial);
        return createElement("div", {
          children,
          className,
          "data-slot": slot,
          "data-start": JSON.stringify(start.current),
          "data-target": JSON.stringify(animate),
        });
      },
    },
  };
});

import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/registry/default/sidebar-menu";

let frames: Map<number, FrameRequestCallback>;
let nextFrame: number;
const flushFrame = () => act(() => {
  const pending = [...frames.values()];
  frames.clear();
  pending.forEach((callback) => callback(0));
});

beforeEach(() => {
  frames = new Map();
  nextFrame = 0;
  vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => {
    frames.set(++nextFrame, callback);
    return nextFrame;
  });
  vi.stubGlobal("cancelAnimationFrame", (id: number) => frames.delete(id));
  // Supply layout boxes, which jsdom does not calculate.
  vi.spyOn(HTMLElement.prototype, "offsetWidth", "get").mockReturnValue(200);
  vi.spyOn(HTMLElement.prototype, "offsetHeight", "get").mockReturnValue(36);
  vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockReturnValue(new DOMRect(0, 0, 200, 36));
  vi.spyOn(HTMLElement.prototype, "offsetTop", "get").mockImplementation(function (this: HTMLElement) {
    return Number(this.dataset.top ?? 0);
  });
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

it("starts each sidebar hover session at the pointer, even with another route active", () => {
  const { container, getByRole } = render(
    <SidebarMenu aria-label="Components">
      <SidebarMenuItem><SidebarMenuButton data-top="40">Accordion</SidebarMenuButton></SidebarMenuItem>
      <SidebarMenuItem><SidebarMenuButton data-top="80">Button</SidebarMenuButton></SidebarMenuItem>
      <SidebarMenuItem><SidebarMenuButton data-top="120" isActive>Carousel Dot</SidebarMenuButton></SidebarMenuItem>
    </SidebarMenu>
  );
  flushFrame();
  const menu = getByRole("list", { name: "Components" });
  const overlay = () => container.querySelector<HTMLElement>('[data-slot="fluid-hover-highlight"]')!;
  const moveTo = (y: number) => {
    fireEvent.mouseMove(menu, { clientX: 10, clientY: y });
    flushFrame();
  };
  const start = (el: HTMLElement) => JSON.parse(el.dataset.start!);
  const target = (el: HTMLElement) => JSON.parse(el.dataset.target!);

  expect(overlay()).toBeNull();
  expect(container.querySelector(".bg-active")).not.toBeNull();
  fireEvent.mouseEnter(menu);
  moveTo(50);
  const first = overlay();
  expect(start(first)).toMatchObject({ y: 40, opacity: 0 });
  expect(target(first)).toMatchObject({ y: 40, opacity: 1 });

  moveTo(90);
  expect(overlay()).toBe(first);
  expect(target(first)).toMatchObject({ y: 80 });

  fireEvent.mouseLeave(menu);
  expect(overlay()).toBeNull();
  fireEvent.mouseEnter(menu);
  moveTo(90);
  expect(overlay()).not.toBe(first);
  expect(start(overlay())).toMatchObject({ y: 80, opacity: 0 });
});
