// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import { act, cleanup, fireEvent, render } from "@testing-library/react";
import { useState } from "react";
import * as Base from "@/registry/base/combobox";
import * as Radix from "@/registry/radix/combobox";

afterEach(cleanup);

class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}
globalThis.ResizeObserver ??= ResizeObserverStub as unknown as typeof ResizeObserver;
Element.prototype.scrollIntoView ??= () => {};
window.matchMedia ??= ((query: string) =>
  ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  }) as MediaQueryList) as typeof window.matchMedia;

const items = [
  { value: "a", label: "Alpha" },
  { value: "b", label: "Beta" },
];

describe.each([
  ["base", Base],
  ["radix", Radix],
] as const)("%s Combobox multiple values", (name, C) => {
  async function setup(initial: string[]) {
    const calls: string[][] = [];
    function Harness() {
      const [value, setValue] = useState<string[]>(initial);
      return (
        <C.Combobox
          multiple
          items={items}
          value={value}
          onValueChange={(next: string[]) => {
            calls.push(next);
            setValue(next);
          }}
        >
          <C.ComboboxInput placeholder="Pick" />
          <C.ComboboxContent>
            <C.ComboboxEmpty>None.</C.ComboboxEmpty>
            <C.ComboboxList>
              {(item: string | { value: string; label: string }) =>
                typeof item === "string" ? null : (
                  <C.ComboboxItem key={item.value} value={item.value}>
                    {item.label}
                  </C.ComboboxItem>
                )}
            </C.ComboboxList>
          </C.ComboboxContent>
        </C.Combobox>
      );
    }
    const utils = render(<Harness />);
    const input = utils.getByRole("combobox");
    await act(async () => {
      input.focus();
      fireEvent.keyDown(input, { key: "ArrowDown" });
    });
    const click = async (label: string) => {
      const option = await utils.findByRole("option", { name: label });
      await act(async () => {
        fireEvent.click(option);
      });
    };
    return { calls, click };
  }

  it("pick keeps ids that have no item", async () => {
    const { calls, click } = await setup(["ghost", "a"]);
    await click("Beta");
    expect(calls.at(-1)).toEqual(["ghost", "a", "b"]);
  });

  it("deselect keeps ids that have no item", async () => {
    const { calls, click } = await setup(["ghost", "a"]);
    await click("Alpha");
    expect(calls.at(-1)).toEqual(["ghost"]);
  });

  it("pick without unknown ids appends", async () => {
    const { calls, click } = await setup(["a"]);
    await click("Beta");
    expect(calls.at(-1)).toEqual(["a", "b"]);
  });

  it("deselect without unknown ids removes only that id", async () => {
    const { calls, click } = await setup(["a", "b"]);
    await click("Alpha");
    expect(calls.at(-1)).toEqual(["b"]);
  });
});
