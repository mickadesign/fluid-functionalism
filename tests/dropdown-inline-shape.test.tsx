// @vitest-environment jsdom
/**
 * The inline Dropdown panel keeps the popup's rounded corners, in both
 * flavors. A class-string edit once dropped `${shape.container}` from the
 * panel and left it square for weeks: nothing else checks the class.
 */
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render } from "@testing-library/react";
import * as Base from "@/registry/base/dropdown";
import * as Radix from "@/registry/radix/dropdown";
import { MenuItem } from "@/registry/default/menu-item";
import { shapeMap } from "@/registry/default/lib/shape-context";

afterEach(cleanup);

// jsdom has no ResizeObserver; the hover hook observes the rows with one.
class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}
globalThis.ResizeObserver ??= ResizeObserverStub as unknown as typeof ResizeObserver;

const flavors = [
  ["base", Base],
  ["radix", Radix],
] as const;

describe.each(flavors)("%s inline dropdown", (_name, F) => {
  it("rounds the panel with the rounded shape's container radius", () => {
    const { getByRole } = render(
      <F.Dropdown checkedIndex={0}>
        <MenuItem index={0} label="Teamspaces" checked onSelect={() => {}} />
        <MenuItem index={1} label="Recents" onSelect={() => {}} />
      </F.Dropdown>
    );
    const panel = getByRole("group");
    for (const cls of shapeMap.rounded.container.split(" ")) {
      expect(panel.classList).toContain(cls);
    }
  });
});
