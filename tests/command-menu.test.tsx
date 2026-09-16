// @vitest-environment jsdom
/**
 * Command menu: the shortcut syntax both the trigger and the caps read, the
 * default filter, the sectioning with suggestions first, and the keyboard
 * flow the input drives through aria-activedescendant.
 */
import { afterEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, createEvent } from "@testing-library/react";
import { useRef } from "react";
import {
  CommandMenu,
  CommandMenuDialog,
  CommandMenuInput,
  CommandMenuTabs,
  CommandMenuList,
  CommandMenuEmpty,
  CommandMenuFooter,
  parseShortcut,
  matchesShortcut,
  formatShortcut,
  defaultCommandMenuFilter,
  sectionRows,
  type CommandMenuItemData,
} from "@/registry/default/command-menu";

afterEach(cleanup);

// jsdom has neither ResizeObserver nor matchMedia; the list's ScrollArea
// wants both (Radix observes the viewport, the touch check reads a query).
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

const key = (overrides: Partial<KeyboardEvent> & { key: string }) => ({
  code: "",
  metaKey: false,
  ctrlKey: false,
  altKey: false,
  shiftKey: false,
  ...overrides,
});

describe("parseShortcut", () => {
  it("reads modifiers and one key", () => {
    expect(parseShortcut("mod+shift+p")).toEqual({
      mod: true, meta: false, ctrl: false, alt: false, shift: true, key: "p",
    });
    expect(parseShortcut("Ctrl+Alt+Delete").key).toBe("delete");
    expect(parseShortcut("/").key).toBe("/");
  });

  it("keeps a trailing + as the key", () => {
    expect(parseShortcut("mod++")).toMatchObject({ mod: true, key: "+" });
  });
});

describe("matchesShortcut", () => {
  const modK = parseShortcut("mod+k");

  it("mod accepts ⌘ or Ctrl", () => {
    expect(matchesShortcut(key({ key: "k", metaKey: true }), modK)).toBe(true);
    expect(matchesShortcut(key({ key: "k", ctrlKey: true }), modK)).toBe(true);
    expect(matchesShortcut(key({ key: "k" }), modK)).toBe(false);
  });

  it("an unnamed modifier rules the press out", () => {
    expect(matchesShortcut(key({ key: "k", metaKey: true, altKey: true }), modK)).toBe(false);
    expect(matchesShortcut(key({ key: "K", metaKey: true, shiftKey: true }), modK)).toBe(true);
  });

  it("letters also match on code, for ⌥ combos that change key", () => {
    const altK = parseShortcut("alt+k");
    expect(matchesShortcut(key({ key: "˚", code: "KeyK", altKey: true }), altK)).toBe(true);
  });

  it("the physical key only stands in for non-Latin layouts, never for a Latin letter", () => {
    // Cyrillic layout: the K key types "л", the combo still lands.
    expect(matchesShortcut(key({ key: "л", code: "KeyK", metaKey: true }), modK)).toBe(true);
    // Dvorak: the physical K types "t"; ⌘T must stay ⌘T.
    expect(matchesShortcut(key({ key: "t", code: "KeyK", metaKey: true }), modK)).toBe(false);
  });

  it("a bare key ignores modified presses", () => {
    const slash = parseShortcut("/");
    expect(matchesShortcut(key({ key: "/" }), slash)).toBe(true);
    expect(matchesShortcut(key({ key: "/", metaKey: true }), slash)).toBe(false);
  });
});

describe("formatShortcut", () => {
  it("draws symbols on a Mac and words elsewhere", () => {
    expect(formatShortcut("mod+shift+p", true)).toEqual(["⌘", "⇧", "P"]);
    expect(formatShortcut("mod+shift+p", false)).toEqual(["Ctrl", "Shift", "P"]);
    expect(formatShortcut("mod+,", true)).toEqual(["⌘", ","]);
    expect(formatShortcut("enter", false)).toEqual(["Enter"]);
  });

  it("keeps pre-formatted caps, one per glyph", () => {
    expect(formatShortcut("⌘⇧P", false)).toEqual(["⌘", "⇧", "P"]);
  });
});

const ITEMS: CommandMenuItemData[] = [
  { value: "new", label: "New file", description: "Blank document", keywords: ["create"], group: "Actions" },
  { value: "theme", label: "Toggle dark mode", group: "Actions" },
  { value: "locked", label: "Export", group: "Actions", disabled: true },
  { value: "home", label: "Home", group: "Go to" },
  { value: "calendar", label: "Calendar", group: "Go to" },
];

describe("defaultCommandMenuFilter", () => {
  it("matches every word against label, description, and keywords", () => {
    expect(defaultCommandMenuFilter(ITEMS[0], "blank doc")).toBe(true);
    expect(defaultCommandMenuFilter(ITEMS[0], "create")).toBe(true);
    expect(defaultCommandMenuFilter(ITEMS[0], "new home")).toBe(false);
    expect(defaultCommandMenuFilter(ITEMS[1], "DARK")).toBe(true);
  });
});

describe("sectionRows", () => {
  it("lists suggestions first while the query is empty, and only once", () => {
    const sections = sectionRows(ITEMS, ["calendar", "new"], "Recent", "");
    expect(sections.map((s) => s.heading)).toEqual(["Recent", "Actions", "Go to"]);
    expect(sections[0].items.map((i) => i.value)).toEqual(["calendar", "new"]);
    expect(sections[1].items.map((i) => i.value)).toEqual(["theme", "locked"]);
    expect(sections[2].items.map((i) => i.value)).toEqual(["home"]);
    expect(sections.map((s) => s.start)).toEqual([0, 2, 4]);
  });

  it("drops the suggestions once something is typed", () => {
    const sections = sectionRows(ITEMS.slice(0, 2), ["theme"], "Recent", "t");
    expect(sections.map((s) => s.heading)).toEqual(["Actions"]);
  });
});

function Menu({ onSelect }: { onSelect?: (item: CommandMenuItemData) => void }) {
  return (
    <CommandMenu items={ITEMS} suggestions={["calendar"]} onSelect={onSelect}>
      <CommandMenuInput />
      <CommandMenuList>
        <CommandMenuEmpty>No results.</CommandMenuEmpty>
      </CommandMenuList>
    </CommandMenu>
  );
}

describe("CommandMenu", () => {
  it("renders the rows under their headings, suggestions first", () => {
    const { getAllByRole } = render(<Menu />);
    const labels = getAllByRole("option").map((el) => el.textContent);
    expect(labels[0]).toContain("Calendar");
    expect(labels).toHaveLength(5);
  });

  it("filters as you type and shows the empty state when nothing matches", () => {
    const { getByRole, queryAllByRole, getByText } = render(<Menu />);
    const input = getByRole("combobox") as HTMLInputElement;
    fireEvent.change(input, { target: { value: "dark" } });
    expect(queryAllByRole("option").map((el) => el.textContent)).toEqual(["Toggle dark mode"]);
    fireEvent.change(input, { target: { value: "zzz" } });
    expect(queryAllByRole("option")).toHaveLength(0);
    expect(getByText("No results.")).toBeTruthy();
  });

  it("arrows move aria-activedescendant, skip disabled rows, wrap, and Enter runs", async () => {
    const onSelect = vi.fn();
    const { getByRole, getAllByRole } = render(<Menu onSelect={onSelect} />);
    const input = getByRole("combobox") as HTMLInputElement;
    const rows = getAllByRole("option");
    // The first row is highlighted on mount.
    await act(async () => {});
    expect(input.getAttribute("aria-activedescendant")).toBe(rows[0].id);

    fireEvent.keyDown(input, { key: "ArrowDown" });
    expect(input.getAttribute("aria-activedescendant")).toBe(rows[1].id);
    fireEvent.keyDown(input, { key: "ArrowDown" });
    fireEvent.keyDown(input, { key: "ArrowDown" });
    // rows[3] is disabled: skipped.
    expect(input.getAttribute("aria-activedescendant")).toBe(rows[4].id);
    fireEvent.keyDown(input, { key: "ArrowDown" });
    expect(input.getAttribute("aria-activedescendant")).toBe(rows[0].id);

    fireEvent.keyDown(input, { key: "ArrowUp" });
    expect(input.getAttribute("aria-activedescendant")).toBe(rows[4].id);
    fireEvent.keyDown(input, { key: "Enter" });
    expect(onSelect).toHaveBeenCalledWith(expect.objectContaining({ value: "home" }));
  });

  it("a click runs the row; a disabled row does nothing", () => {
    const onSelect = vi.fn();
    const { getAllByRole } = render(<Menu onSelect={onSelect} />);
    const rows = getAllByRole("option");
    fireEvent.click(rows[3]);
    expect(onSelect).not.toHaveBeenCalled();
    fireEvent.click(rows[1]);
    expect(onSelect).toHaveBeenCalledWith(expect.objectContaining({ value: "new" }));
  });

  it("with tabs, ← and → switch tabs from the field, wrapping", () => {
    const onValueChange = vi.fn();
    const tabs = [
      { value: "all", label: "All" },
      { value: "Actions", label: "Actions" },
      { value: "Go to", label: "Go to" },
    ];
    const { getByRole, getByText } = render(
      <CommandMenu items={ITEMS}>
        <CommandMenuInput />
        <CommandMenuTabs tabs={tabs} value="all" onValueChange={onValueChange} />
        <CommandMenuList />
        <CommandMenuFooter />
      </CommandMenu>
    );
    const input = getByRole("combobox");
    fireEvent.keyDown(input, { key: "ArrowRight" });
    expect(onValueChange).toHaveBeenLastCalledWith("Actions");
    fireEvent.keyDown(input, { key: "ArrowLeft" });
    expect(onValueChange).toHaveBeenLastCalledWith("Go to");
    // The footer knows the tabs are there.
    expect(getByText("Tabs")).toBeTruthy();
    expect(getByText("Select")).toBeTruthy();
  });

  it("leaves Shift+\u2190/\u2192 to the field so selection still extends", () => {
    // Shift+Arrow is how you select text in an input. The tab switcher claimed
    // every unmodified-looking arrow and swallowed it, so a user could not
    // select their own query while tabs were mounted.
    const onValueChange = vi.fn();
    const tabs = [
      { value: "all", label: "All" },
      { value: "Actions", label: "Actions" },
    ];
    const { getByRole } = render(
      <CommandMenu items={ITEMS}>
        <CommandMenuInput />
        <CommandMenuTabs tabs={tabs} value="all" onValueChange={onValueChange} />
        <CommandMenuList />
      </CommandMenu>
    );
    const input = getByRole("combobox");
    for (const key of ["ArrowLeft", "ArrowRight"]) {
      const event = createEvent.keyDown(input, { key, shiftKey: true });
      fireEvent(input, event);
      expect(onValueChange).not.toHaveBeenCalled();
      expect(event.defaultPrevented).toBe(false);
    }
  });

  it("the footer names Enter after the highlighted row, its action first", async () => {
    const items: CommandMenuItemData[] = [
      { value: "home", label: "Home", action: "Go to Home", group: "Go to" },
      { value: "new", label: "New file", group: "Actions" },
    ];
    const { getByRole, container } = render(
      <CommandMenu items={items}>
        <CommandMenuInput />
        <CommandMenuList />
        <CommandMenuFooter />
      </CommandMenu>
    );
    await act(async () => {});
    const footer = container.querySelector('[data-slot="command-menu-footer"]') as HTMLElement;
    const action = () => footer.querySelector('[data-slot="command-menu-footer-action"]')?.textContent;
    expect(action()).toContain("Go to Home");
    expect(footer.textContent).not.toContain("Run");
    const input = getByRole("combobox") as HTMLInputElement;
    fireEvent.keyDown(input, { key: "ArrowDown" });
    expect(action()).toContain("New file");
    // No row, no Enter hint.
    fireEvent.change(input, { target: { value: "zzz" } });
    await act(async () => {});
    expect(action()).toBeUndefined();
  });

  it("keys inside an IME composition are left to the composer", () => {
    const onSelect = vi.fn();
    const { getByRole } = render(<Menu onSelect={onSelect} />);
    const input = getByRole("combobox") as HTMLInputElement;
    fireEvent.keyDown(input, { key: "Enter", isComposing: true });
    expect(onSelect).not.toHaveBeenCalled();
    fireEvent.keyDown(input, { key: "Enter", keyCode: 229 });
    expect(onSelect).not.toHaveBeenCalled();
  });

  it("group headings get ids without spaces", () => {
    const { getAllByRole } = render(<Menu />);
    for (const group of getAllByRole("group")) {
      const id = group.getAttribute("aria-labelledby");
      expect(id).toBeTruthy();
      expect(id).not.toMatch(/\s/);
      expect(document.getElementById(id as string)?.textContent).toBeTruthy();
    }
  });

  it("Escape clears the query inline", () => {
    const { getByRole } = render(<Menu />);
    const input = getByRole("combobox") as HTMLInputElement;
    fireEvent.change(input, { target: { value: "cal" } });
    fireEvent.keyDown(input, { key: "Escape" });
    expect(input.value).toBe("");
  });
});

describe("CommandMenuDialog shortcut peers", () => {
  function Scoped({ onOpenChange }: { onOpenChange: (open: boolean) => void }) {
    const scope = useRef<HTMLDivElement>(null);
    return (
      <div ref={scope}>
        <button>inside</button>
        <CommandMenuDialog open={false} onOpenChange={onOpenChange} shortcutScope={scope}>
          <Menu />
        </CommandMenuDialog>
      </div>
    );
  }

  it("a scoped dialog takes the combo only while focus is inside its element", () => {
    const root = vi.fn();
    const demo = vi.fn();
    const { getByText } = render(
      <>
        <CommandMenuDialog open={false} onOpenChange={root}>
          <Menu />
        </CommandMenuDialog>
        <button>outside</button>
        <Scoped onOpenChange={demo} />
      </>
    );
    // Focus outside: the root palette answers, though the demo mounted last.
    getByText("outside").focus();
    fireEvent.keyDown(window, { key: "k", metaKey: true });
    expect(root).toHaveBeenCalledWith(true);
    expect(demo).not.toHaveBeenCalled();
    // Focus inside the scope: the demo answers.
    getByText("inside").focus();
    fireEvent.keyDown(window, { key: "k", metaKey: true });
    expect(demo).toHaveBeenCalledWith(true);
    expect(root).toHaveBeenCalledTimes(1);
  });
});
