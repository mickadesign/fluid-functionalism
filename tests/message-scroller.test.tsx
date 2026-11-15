// @vitest-environment jsdom
/**
 * MessageScroller's follow state lives in refs and a ResizeObserver, where a
 * regression makes no noise. These pin it with a mocked observer and a
 * viewport whose scroll metrics are set by hand (jsdom lays nothing out):
 * the view follows growth at the end, lets go when the reader scrolls away,
 * and still watches the content after Strict Mode re-runs its effects.
 */
import { StrictMode } from "react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import {
  MessageScroller,
  MessageScrollerButton,
  MessageScrollerContent,
  MessageScrollerItem,
} from "@/registry/default/message-scroller";

/** Every observer built, with what it watches now. */
const observers: MockResizeObserver[] = [];

class MockResizeObserver {
  watched = new Set<Element>();
  constructor(private callback: ResizeObserverCallback) {
    observers.push(this);
  }
  observe(el: Element) {
    this.watched.add(el);
  }
  unobserve(el: Element) {
    this.watched.delete(el);
  }
  disconnect() {
    this.watched.clear();
  }
  fire() {
    if (this.watched.size === 0) return;
    this.callback([], this as unknown as ResizeObserver);
  }
}

const original = globalThis.ResizeObserver;

beforeEach(() => {
  observers.length = 0;
  globalThis.ResizeObserver =
    MockResizeObserver as unknown as typeof ResizeObserver;
});

afterEach(() => {
  cleanup();
  globalThis.ResizeObserver = original;
});

/** Give the viewport a 100px window onto `scrollHeight` px of content. */
function setMetrics(viewport: HTMLElement, scrollHeight: number) {
  Object.defineProperty(viewport, "clientHeight", {
    configurable: true,
    value: 100,
  });
  Object.defineProperty(viewport, "scrollHeight", {
    configurable: true,
    value: scrollHeight,
  });
}

/** The content resized: every live observer reports it. */
function resize() {
  act(() => {
    for (const observer of observers) observer.fire();
  });
}

function Transcript() {
  return (
    <MessageScroller>
      <MessageScrollerContent>
        <MessageScrollerItem>Hello</MessageScrollerItem>
      </MessageScrollerContent>
      <MessageScrollerButton />
    </MessageScroller>
  );
}

describe("MessageScroller", () => {
  it("follows the end while content grows", () => {
    render(<Transcript />);
    const viewport = screen.getByRole("region", { name: "Conversation" });

    setMetrics(viewport, 300);
    resize();
    expect(viewport.scrollTop).toBe(200);

    setMetrics(viewport, 500);
    resize();
    expect(viewport.scrollTop).toBe(400);
  });

  it("lets go when the reader scrolls away, and shows the button", () => {
    render(<Transcript />);
    const viewport = screen.getByRole("region", { name: "Conversation" });
    setMetrics(viewport, 300);
    resize();
    expect(screen.queryByRole("button", { name: "Scroll to latest" })).toBeNull();

    viewport.scrollTop = 50;
    fireEvent.scroll(viewport);
    expect(
      screen.getByRole("button", { name: "Scroll to latest" })
    ).toBeTruthy();

    // More content arrives: the view stays where the reader put it.
    setMetrics(viewport, 500);
    resize();
    expect(viewport.scrollTop).toBe(50);
  });

  it("picks the follow back up when the reader returns to the end", () => {
    render(<Transcript />);
    const viewport = screen.getByRole("region", { name: "Conversation" });
    setMetrics(viewport, 300);
    resize();

    viewport.scrollTop = 50;
    fireEvent.scroll(viewport);
    // Back within 24px of the end.
    viewport.scrollTop = 190;
    fireEvent.scroll(viewport);

    setMetrics(viewport, 500);
    resize();
    expect(viewport.scrollTop).toBe(400);
  });

  it("does not follow with autoScroll off", () => {
    render(
      <MessageScroller autoScroll={false}>
        <MessageScrollerContent>
          <MessageScrollerItem>Hello</MessageScrollerItem>
        </MessageScrollerContent>
      </MessageScroller>
    );
    const viewport = screen.getByRole("region", { name: "Conversation" });
    setMetrics(viewport, 300);
    resize();
    expect(viewport.scrollTop).toBe(0);
  });

  it("still watches the content after Strict Mode re-runs its effects", () => {
    render(
      <StrictMode>
        <Transcript />
      </StrictMode>
    );
    const viewport = screen.getByRole("region", { name: "Conversation" });
    const content = screen.getByRole("log");

    const live = observers.filter((observer) => observer.watched.size > 0);
    expect(live).toHaveLength(1);
    expect(live[0].watched.has(content)).toBe(true);
    expect(live[0].watched.has(viewport)).toBe(true);

    setMetrics(viewport, 300);
    resize();
    expect(viewport.scrollTop).toBe(200);
  });
});
