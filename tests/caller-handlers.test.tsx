// @vitest-environment jsdom
/**
 * A caller's listener never replaces a component's own state:
 * - an uncontrolled Accordion with onValueChange still opens and closes, in
 *   both flavors;
 * - a CardGroup keeps the caller's style and mouse handlers;
 * - an InputField's own focus state survives a caller's onFocus / onBlur;
 * - Enter on a queued message's Remove button removes it, and leaves the
 *   draft alone.
 */
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render } from "@testing-library/react";
import * as RadixAccordion from "@/registry/radix/accordion";
import * as BaseAccordion from "@/registry/base/accordion";
import { Card, CardGroup } from "@/registry/default/card";
import { InputGroup, InputField } from "@/registry/default/input-group";
import { InputMessage } from "@/registry/default/input-message";

// Without vitest globals, Testing Library does not clean up between tests.
afterEach(cleanup);

// jsdom has neither ResizeObserver nor matchMedia; the hover hook observes
// its items and the components read the pointer type.
class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}
globalThis.ResizeObserver ??= ResizeObserverStub as unknown as typeof ResizeObserver;
window.matchMedia ??= ((query: string) =>
  ({
    matches: false,
    media: query,
    onchange: null,
    addListener() {},
    removeListener() {},
    addEventListener() {},
    removeEventListener() {},
    dispatchEvent: () => false,
  }) as MediaQueryList) as typeof window.matchMedia;

describe.each([
  ["radix", RadixAccordion],
  ["base", BaseAccordion],
])("Accordion (%s), uncontrolled with a listener", (_name, A) => {
  it("opens the clicked item and reports it", () => {
    const onValueChange = vi.fn();
    const { getAllByRole } = render(
      <A.Accordion type="single" defaultValue="a" onValueChange={onValueChange}>
        <A.AccordionItem value="a">
          <A.AccordionTrigger>First</A.AccordionTrigger>
          <A.AccordionContent>Panel A</A.AccordionContent>
        </A.AccordionItem>
        <A.AccordionItem value="b">
          <A.AccordionTrigger>Second</A.AccordionTrigger>
          <A.AccordionContent>Panel B</A.AccordionContent>
        </A.AccordionItem>
      </A.Accordion>
    );
    const expanded = () => getAllByRole("button").map((b) => b.getAttribute("aria-expanded"));
    expect(expanded()).toEqual(["true", "false"]);
    fireEvent.click(getAllByRole("button")[1]);
    expect(onValueChange).toHaveBeenLastCalledWith("b");
    expect(expanded()).toEqual(["false", "true"]);
  });
});

describe("CardGroup", () => {
  it("keeps the caller's style and handlers next to its own", () => {
    const onClick = vi.fn();
    const onMouseLeave = vi.fn();
    const { container } = render(
      <CardGroup style={{ maxWidth: 300 }} onClick={onClick} onMouseLeave={onMouseLeave}>
        <Card>One</Card>
        <Card>Two</Card>
      </CardGroup>
    );
    const group = container.querySelector<HTMLElement>('[data-slot="card-group"]')!;
    expect(group.style.maxWidth).toBe("300px");
    expect(group.style.gridTemplateColumns).not.toBe("");
    fireEvent.click(group);
    fireEvent.mouseLeave(group);
    expect(onClick).toHaveBeenCalledTimes(1);
    expect(onMouseLeave).toHaveBeenCalledTimes(1);
  });
});

describe("InputField", () => {
  it("runs the caller's onFocus and onBlur without losing its focus ring", () => {
    const onFocus = vi.fn();
    const onBlur = vi.fn();
    const { getByRole } = render(
      <InputGroup>
        <InputField index={0} label="Name" value="" onChange={() => {}} onFocus={onFocus} onBlur={onBlur} />
      </InputGroup>
    );
    const input = getByRole("textbox");
    const ring = () => input.parentElement!.className;
    fireEvent.focus(input);
    expect(onFocus).toHaveBeenCalledTimes(1);
    expect(ring()).toContain("ring-foreground/40");
    fireEvent.blur(input);
    expect(onBlur).toHaveBeenCalledTimes(1);
    expect(ring()).not.toContain("ring-foreground/40");
  });
});

describe("InputMessage queue", () => {
  it("Enter on a row's Remove button removes the row and keeps the draft", () => {
    const onValueChange = vi.fn();
    const onQueueChange = vi.fn();
    const { getByLabelText } = render(
      <InputMessage
        value="my draft"
        onValueChange={onValueChange}
        status="streaming"
        queue={[{ id: "q1", text: "queued", files: [] }]}
        onQueueChange={onQueueChange}
      />
    );
    const remove = getByLabelText("Remove queued message: queued");
    // The browser turns Enter on a focused button into a click unless a
    // handler above it prevents the keydown.
    const notPrevented = fireEvent.keyDown(remove, { key: "Enter" });
    expect(notPrevented).toBe(true);
    expect(onValueChange).not.toHaveBeenCalled();
    fireEvent.click(remove);
    expect(onQueueChange).toHaveBeenLastCalledWith([]);
  });
});
