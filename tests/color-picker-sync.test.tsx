// @vitest-environment jsdom
/**
 * A controlled ColorPicker follows its value during the render that brings
 * it, skips its own emitted string coming back, and keeps the hue it holds
 * when the outside value is a gray.
 */
import { useState } from "react";
import { afterEach, describe, expect, it } from "vitest";
import { act, cleanup, fireEvent, render } from "@testing-library/react";
import { ColorPicker } from "@/registry/default/color-picker";

// Without vitest globals, Testing Library does not clean up between tests.
afterEach(cleanup);

// jsdom has no ResizeObserver; the panel's sliders observe their tracks.
class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}
globalThis.ResizeObserver ??= ResizeObserverStub as unknown as typeof ResizeObserver;

const hexField = (container: HTMLElement) =>
  container.querySelector<HTMLInputElement>('input[aria-label="Hex value"]')!;

describe("ColorPicker controlled sync", () => {
  it("shows a value changed from outside", () => {
    const { container, rerender } = render(<ColorPicker value="#ff0000" hideEyedropper />);
    expect(hexField(container).value).toBe("FF0000");
    rerender(<ColorPicker value="#00ff00" hideEyedropper />);
    expect(hexField(container).value).toBe("00FF00");
  });

  it("keeps the held hue when the outside value is a gray", () => {
    const { container, rerender } = render(<ColorPicker value="#00ff00" hideEyedropper />);
    // The thumb carries the slider role (Radix Slider).
    const hue = () =>
      container
        .querySelector('[aria-label="Hue"] [role="slider"], [role="slider"][aria-label="Hue"]')
        ?.getAttribute("aria-valuenow");
    expect(hue()).toBe("120");
    rerender(<ColorPicker value="#808080" hideEyedropper />);
    expect(hexField(container).value).toBe("808080");
    expect(hue()).toBe("120");
  });

  it("does not re-parse its own emitted string", () => {
    const emitted: string[] = [];
    function Host() {
      const [color, setColor] = useState("#6b97ff");
      return (
        <ColorPicker
          value={color}
          hideEyedropper
          onValueChange={(v) => {
            emitted.push(v);
            setColor(v);
          }}
        />
      );
    }
    const { container } = render(<Host />);
    const field = hexField(container);
    fireEvent.change(field, { target: { value: "123456" } });
    fireEvent.keyDown(field, { key: "Enter" });
    fireEvent.blur(field);
    expect(emitted.at(-1)?.toLowerCase()).toBe("#123456");
    expect(hexField(container).value).toBe("123456");
  });

  it("shows an emitted string again when the parent returns to it", () => {
    // Pick a color, the parent resets to another, then undoes back to the pick.
    let set: (v: string) => void = () => {};
    function Host() {
      const [color, setColor] = useState("#6b97ff");
      set = setColor;
      return <ColorPicker value={color} hideEyedropper onValueChange={setColor} />;
    }
    const { container } = render(<Host />);
    const field = hexField(container);
    fireEvent.change(field, { target: { value: "123456" } });
    fireEvent.keyDown(field, { key: "Enter" });
    fireEvent.blur(field);
    const emitted = `#${hexField(container).value}`;
    act(() => set("#ff0000"));
    expect(hexField(container).value).toBe("FF0000");
    act(() => set(emitted));
    expect(hexField(container).value).toBe("123456");
  });
});
