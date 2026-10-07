// @vitest-environment jsdom
/**
 * Dropdown submenus, both flavors. While a submenu is open its trigger row
 * stays lit in the parent menu: pointer moves over the parent (the pointer
 * crossing other rows inside the primitive's safe area) don't move the
 * highlight. The submenu renders through a portal but is a React child of
 * the parent popup, so its events bubble into the parent's handlers: focus
 * on a submenu row must not light the parent row with the same index, and a
 * click on one must not reach the parent's gap-click routing (which would
 * click the parent's highlighted row too).
 */
import { afterEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, waitFor } from "@testing-library/react";
import { DirectionProvider as RadixDirectionProvider } from "@radix-ui/react-direction";
import { DirectionProvider as BaseDirectionProvider } from "@base-ui/react/direction-provider";
import * as Base from "@/registry/base/dropdown";
import * as Radix from "@/registry/radix/dropdown";
import { MenuItem } from "@/registry/default/menu-item";

afterEach(cleanup);

// jsdom has neither ResizeObserver nor matchMedia; the hover hook observes
// the rows with one, the popup's ScrollArea touch check reads the other.
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

const flavors = [
  ["base", Base],
  ["radix", Radix],
] as const;

const frame = () => act(() => new Promise((r) => setTimeout(r, 32)));

/** The highlighted row index the menu's fluid hover reports, or null. */
function activeIn(menu: HTMLElement) {
  return (
    menu
      .querySelector("[data-fluid-hover-active-index]")
      ?.getAttribute("data-fluid-hover-active-index") ?? null
  );
}

describe.each(flavors)("%s dropdown submenu", (_name, F) => {
  async function setup() {
    const onTriggerClick = vi.fn();
    const onPick = vi.fn();
    // The submenu is held open (controlled, closing ignored), so only the
    // dropdown's own handling decides what the parent highlights.
    const Menu = ({ subOpen, rootOpen = true }: { subOpen: boolean; rootOpen?: boolean }) => (
      <F.DropdownMenu open={rootOpen}>
        <F.DropdownTrigger>Open</F.DropdownTrigger>
        <F.DropdownContent>
          <MenuItem index={0} label="Rename" onSelect={() => {}} />
          <F.DropdownSub open={subOpen} onOpenChange={() => {}}>
            <F.DropdownSubTrigger index={1} label="Move to" onClick={onTriggerClick} />
            <F.DropdownSubContent>
              <MenuItem index={0} label="Inbox" onSelect={() => onPick("Inbox")} />
              <MenuItem index={1} label="Archive" onSelect={() => onPick("Archive")} />
            </F.DropdownSubContent>
          </F.DropdownSub>
          <MenuItem index={2} label="Delete" onSelect={() => {}} />
        </F.DropdownContent>
      </F.DropdownMenu>
    );
    const view = render(<Menu subOpen={false} />);
    // Let the menu's open autofocus land on its first row, then open the
    // submenu, as a user would. Waited on, not timed: under a loaded run
    // the autofocus's frames can land late.
    await waitFor(() =>
      expect(document.activeElement?.getAttribute("aria-label")).toBe("Rename")
    );
    view.rerender(<Menu subOpen />);
    await waitFor(() => expect(view.getAllByRole("menu")).toHaveLength(2));
    const [parent, sub] = view.getAllByRole("menu");
    await waitFor(() => expect(activeIn(parent)).toBe("1"));
    return { view, Menu, parent, sub, onTriggerClick, onPick };
  }

  it("renders the submenu beside a trigger row with a chevron", async () => {
    const { view, parent, sub } = await setup();
    const trigger = view.getByRole("menuitem", { name: "Move to" });
    expect(parent.contains(trigger)).toBe(true);
    expect(trigger.getAttribute("aria-haspopup")).toBe("menu");
    expect(trigger.querySelector("svg")).not.toBeNull();
    expect(sub.contains(view.getByRole("menuitem", { name: "Inbox" }))).toBe(true);
  });

  it("keeps the trigger lit while the pointer crosses the parent", async () => {
    const { view, parent } = await setup();
    expect(activeIn(parent)).toBe("1");
    // A pointer move over the parent, away from the trigger. It moves over
    // the list rather than onto a row: in a browser the primitive keeps a
    // row from reacting while the pointer is in the safe area (Base UI
    // switches its pointer events off), which jsdom can't reproduce.
    const list = parent.querySelector<HTMLElement>("[data-fluid-hover-active-index]")!;
    fireEvent.mouseMove(list, { clientX: 5, clientY: 500 });
    await frame();
    expect(activeIn(parent)).toBe("1");
    // The pointer leaving the parent for the submenu.
    fireEvent.mouseOut(view.getByRole("menuitem", { name: "Delete" }), {
      relatedTarget: document.body,
    });
    await frame();
    expect(activeIn(parent)).toBe("1");
  });

  it("re-entering the parent keeps the held highlight instead of re-keying it", async () => {
    // jsdom lays nothing out; give rows a size so the highlight measures and
    // renders.
    const size = Object.getOwnPropertyDescriptor(HTMLElement.prototype, "offsetHeight");
    Object.defineProperty(HTMLElement.prototype, "offsetHeight", {
      configurable: true,
      get: () => 36,
    });
    try {
      const { view, parent } = await setup();
      await frame();
      const before = parent.querySelector('[data-slot="fluid-hover-highlight"]');
      expect(before).not.toBeNull();
      // The pointer comes back into the parent from outside the menu, then
      // focus moves to the row it rests on. A new hover session would re-key
      // the highlight: a new element fading in instead of the held one
      // gliding over.
      const del = view.getByRole("menuitem", { name: "Delete" });
      fireEvent.mouseOver(del, { relatedTarget: document.body });
      act(() => del.focus());
      await frame();
      expect(activeIn(parent)).toBe("2");
      const after = parent.querySelectorAll('[data-slot="fluid-hover-highlight"]');
      expect(after).toHaveLength(1);
      expect(after[0]).toBe(before);
    } finally {
      if (size) Object.defineProperty(HTMLElement.prototype, "offsetHeight", size);
    }
  });

  it("does not light the parent row a submenu row shares an index with", async () => {
    const { view, parent, sub } = await setup();
    act(() => view.getByRole("menuitem", { name: "Inbox" }).focus());
    await frame();
    expect(activeIn(sub)).toBe("0");
    expect(activeIn(parent)).toBe("1");
  });

  it("a click on a submenu row picks it and never reaches the parent's rows", async () => {
    const { view, onTriggerClick, onPick } = await setup();
    fireEvent.click(view.getByRole("menuitem", { name: "Archive" }));
    expect(onPick).toHaveBeenCalledTimes(1);
    expect(onPick).toHaveBeenCalledWith("Archive");
    expect(onTriggerClick).not.toHaveBeenCalled();
  });

  // Closing hands the highlight back: to the row focus is on (the open
  // autofocus left it on "Rename"), else to the row under the pointer, else
  // to nothing.
  it("on close, the highlight goes to the focused parent row", async () => {
    const { view, Menu, parent } = await setup();
    expect(activeIn(parent)).toBe("1");
    view.rerender(<Menu subOpen={false} />);
    await frame();
    expect(activeIn(parent)).toBe("0");
  });

  it("on close with the pointer elsewhere, the highlight follows focus or clears", async () => {
    const { view, Menu, parent } = await setup();
    act(() => (document.activeElement as HTMLElement | null)?.blur());
    view.rerender(<Menu subOpen={false} />);
    await frame();
    // Base UI hands focus back to the trigger as its submenu closes; Radix
    // leaves it where it was (nowhere, here).
    const focused = document.activeElement?.closest("[data-fluid-hover-index]");
    expect(activeIn(parent)).toBe(
      focused && parent.contains(focused)
        ? focused.getAttribute("data-fluid-hover-index")
        : null
    );
  });

  it("when the whole menu closes, its last highlight fades out with it", async () => {
    const { view, Menu, parent } = await setup();
    view.rerender(<Menu subOpen={false} rootOpen={false} />);
    expect(activeIn(parent)).toBe("1");
  });
});

// A submenu inside a submenu: the middle menu is both a held child of the
// root and the host of the innermost one.
describe.each(flavors)("%s nested submenus", (_name, F) => {
  async function setup() {
    const onMoveTo = vi.fn();
    const onArchive = vi.fn();
    const onPick = vi.fn();
    const Menu = ({ depth }: { depth: 0 | 1 | 2 }) => (
      <F.DropdownMenu defaultOpen>
        <F.DropdownTrigger>Open</F.DropdownTrigger>
        <F.DropdownContent>
          <MenuItem index={0} label="Rename" onSelect={() => {}} />
          <F.DropdownSub open={depth >= 1} onOpenChange={() => {}}>
            <F.DropdownSubTrigger index={1} label="Move to" onClick={onMoveTo} />
            <F.DropdownSubContent>
              <MenuItem index={0} label="Inbox" onSelect={() => {}} />
              <F.DropdownSub open={depth >= 2} onOpenChange={() => {}}>
                <F.DropdownSubTrigger index={1} label="Archive" onClick={onArchive} />
                <F.DropdownSubContent>
                  <MenuItem index={0} label="2025" onSelect={() => onPick("2025")} />
                  <MenuItem index={1} label="2026" onSelect={() => onPick("2026")} />
                </F.DropdownSubContent>
              </F.DropdownSub>
            </F.DropdownSubContent>
          </F.DropdownSub>
        </F.DropdownContent>
      </F.DropdownMenu>
    );
    const view = render(<Menu depth={0} />);
    await waitFor(() =>
      expect(document.activeElement?.getAttribute("aria-label")).toBe("Rename")
    );
    view.rerender(<Menu depth={1} />);
    await waitFor(() => expect(view.getAllByRole("menu")).toHaveLength(2));
    view.rerender(<Menu depth={2} />);
    await waitFor(() => expect(view.getAllByRole("menu")).toHaveLength(3));
    const [root, middle, inner] = view.getAllByRole("menu");
    return { view, root, middle, inner, onMoveTo, onArchive, onPick };
  }

  it("renders all 3 menus, each submenu in its own popup", async () => {
    const { view, root, middle, inner } = await setup();
    expect(root.contains(view.getByRole("menuitem", { name: "Move to" }))).toBe(true);
    expect(middle.contains(view.getByRole("menuitem", { name: "Archive" }))).toBe(true);
    expect(inner.contains(view.getByRole("menuitem", { name: "2026" }))).toBe(true);
  });

  it("keeps both triggers lit, each in its own menu", async () => {
    const { root, middle } = await setup();
    await waitFor(() => {
      expect(activeIn(root)).toBe("1");
      expect(activeIn(middle)).toBe("1");
    });
  });

  it("focus in the innermost menu lights a row there only", async () => {
    const { view, root, middle, inner } = await setup();
    act(() => view.getByRole("menuitem", { name: "2025" }).focus());
    await frame();
    expect(activeIn(inner)).toBe("0");
    expect(activeIn(middle)).toBe("1");
    expect(activeIn(root)).toBe("1");
  });

  it("a click in the innermost menu picks once and reaches no trigger", async () => {
    const { view, onMoveTo, onArchive, onPick } = await setup();
    fireEvent.click(view.getByRole("menuitem", { name: "2026" }));
    expect(onPick).toHaveBeenCalledTimes(1);
    expect(onPick).toHaveBeenCalledWith("2026");
    expect(onMoveTo).not.toHaveBeenCalled();
    expect(onArchive).not.toHaveBeenCalled();
  });
});

// Both flavors open a submenu toward the reading direction's end, read from
// each primitive's own DirectionProvider.
describe.each(flavors)("%s submenu side", (_name, F) => {
  it.each([
    ["ltr", "right"],
    ["rtl", "left"],
  ] as const)("in %s it opens on the %s", async (dir, side) => {
    const view = render(
      <RadixDirectionProvider dir={dir}>
        <BaseDirectionProvider direction={dir}>
          <F.DropdownMenu defaultOpen>
            <F.DropdownTrigger>Open</F.DropdownTrigger>
            <F.DropdownContent>
              <F.DropdownSub defaultOpen>
                <F.DropdownSubTrigger index={0} label="Move to" />
                <F.DropdownSubContent>
                  <MenuItem index={0} label="Inbox" onSelect={() => {}} />
                </F.DropdownSubContent>
              </F.DropdownSub>
            </F.DropdownContent>
          </F.DropdownMenu>
        </BaseDirectionProvider>
      </RadixDirectionProvider>
    );
    await waitFor(() => expect(view.getAllByRole("menu")).toHaveLength(2));
    const sub = view.getAllByRole("menu")[1];
    await waitFor(() =>
      expect(sub.closest("[data-side]")?.getAttribute("data-side")).toBe(side)
    );
  });
});
