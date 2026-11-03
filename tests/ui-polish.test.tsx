// @vitest-environment jsdom
/**
 * UI polish guards (the emil-ui-polish audit, 2026-11-02):
 * - no `transition-all` in the registry, and portalled or fixed layers read
 *   the --z-* stacking scale instead of a bare z-40 / z-50;
 * - a loading Button is busy, not dimmed like a disabled one;
 * - the Slider reserves the wider end of its scale (a negative min);
 * - TableEmpty spans the table and holds the height of its rows;
 * - shortcut caps paint for the visitor's platform on the server, and
 *   hydrate without swapping;
 * - no results keeps the last results' height in CommandMenu, Combobox and
 *   a searchable Dropdown;
 * - the file-remove badge never takes taps while hidden, and shows on touch.
 */
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { act, cleanup, fireEvent, render } from "@testing-library/react";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { renderToString } from "react-dom/server";
import { hydrateRoot } from "react-dom/client";
import { useState } from "react";
import { Button as RadixButton } from "@/registry/radix/button";
import { Button as BaseButton } from "@/registry/base/button";
import { Slider as RadixSlider } from "@/registry/radix/slider";
import { Slider as BaseSlider } from "@/registry/base/slider";
import * as RadixCombobox from "@/registry/radix/combobox";
import * as BaseCombobox from "@/registry/base/combobox";
import * as RadixDropdown from "@/registry/radix/dropdown";
import * as BaseDropdown from "@/registry/base/dropdown";
import { MenuItem } from "@/registry/default/menu-item";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableEmpty,
} from "@/registry/default/table";
import {
  CommandMenu,
  CommandMenuEmpty,
  CommandMenuInput,
  CommandMenuList,
  CommandMenuPlatform,
  CommandMenuShortcut,
} from "@/registry/default/command-menu";
import { InputMessage } from "@/registry/default/input-message";
import { readMacPlatform } from "@/lib/docs/site-settings";

afterEach(cleanup);

// jsdom has neither ResizeObserver nor matchMedia; ScrollArea and the hover
// hook want both. `hoverNone` flips the (hover: none) query for touch cases.
class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}
globalThis.ResizeObserver ??= ResizeObserverStub as unknown as typeof ResizeObserver;
Element.prototype.scrollIntoView ??= () => {};
let hoverNone = false;
window.matchMedia = ((query: string) =>
  ({
    matches: query.includes("hover: none") ? hoverNone : false,
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  }) as MediaQueryList) as typeof window.matchMedia;

// jsdom does no layout: every box reports this height, so "the height the
// last results showed" is a known number.
const BOX_HEIGHT = 168;
const boxProps = ["offsetHeight", "clientHeight"] as const;
let saved: (PropertyDescriptor | undefined)[] = [];
beforeEach(() => {
  saved = boxProps.map((p) => Object.getOwnPropertyDescriptor(HTMLElement.prototype, p) ?? Object.getOwnPropertyDescriptor(Element.prototype, p));
  for (const p of boxProps) {
    Object.defineProperty(HTMLElement.prototype, p, { configurable: true, get: () => BOX_HEIGHT });
  }
});
afterEach(() => {
  boxProps.forEach((p, i) => {
    delete (HTMLElement.prototype as unknown as Record<string, unknown>)[p];
    const d = saved[i];
    if (d && !Object.getOwnPropertyDescriptor(Element.prototype, p)) Object.defineProperty(HTMLElement.prototype, p, d);
  });
  hoverNone = false;
});

const flavorDirs = ["registry/radix", "registry/base", "registry/default", "registry/blocks"];
const sourceFiles = flavorDirs.flatMap((dir) =>
  readdirSync(dir, { recursive: true, encoding: "utf8" })
    .filter((f) => f.endsWith(".tsx") || f.endsWith(".ts"))
    .map((f) => join(dir, f))
);

describe("registry source", () => {
  it("never transitions `all`", () => {
    const offenders = sourceFiles.filter((f) =>
      // Comments may name it; class strings may not.
      readFileSync(f, "utf8")
        .split("\n")
        .some((line) => /transition-all\b/.test(line) && !line.trim().startsWith("//"))
    );
    expect(offenders).toEqual([]);
  });

  it("puts portalled and fixed layers on the --z-* scale", () => {
    // Bare z-40 / z-50 were the shared "popup" values; inside a component
    // plain z-10 / z-20 still order rows over their fill. The sidebar's peek
    // strip and card stack inside the shell's own context (the shell sits on
    // --z-sticky), so their values never meet a page layer.
    const local = ["registry/default/sidebar-core.tsx"];
    const offenders = sourceFiles
      .filter((f) => !local.includes(f))
      .filter((f) => /["`\s]z-(40|50)["`\s]/.test(readFileSync(f, "utf8")));
    expect(offenders).toEqual([]);
  });

  it("defines the scale in globals.css in the order the components assume", () => {
    const css = readFileSync("app/globals.css", "utf8");
    const step = (name: string) => Number(css.match(new RegExp(`--z-${name}:\\s*(\\d+)`))?.[1]);
    expect(step("sticky")).toBeLessThan(step("overlay"));
    expect(step("overlay")).toBeLessThan(step("modal"));
    expect(step("modal")).toBeLessThan(step("popover"));
    expect(step("popover")).toBeLessThan(step("tooltip"));
  });
});

describe.each([
  ["radix", RadixButton],
  ["base", BaseButton],
] as const)("%s Button loading", (_name, Button) => {
  it("is busy and disabled, and only real disabled dims", () => {
    const { getByRole, rerender } = render(<Button loading>Save</Button>);
    const button = getByRole("button");
    expect(button.getAttribute("aria-busy")).toBe("true");
    expect(button.hasAttribute("disabled")).toBe(true);
    expect(button.className).toContain("disabled:not-aria-busy:opacity-50");
    expect(button.className).not.toMatch(/(^|\s)disabled:opacity-50/);
    rerender(<Button disabled>Save</Button>);
    expect(getByRole("button").hasAttribute("aria-busy")).toBe(false);
  });
});

describe.each([
  ["radix", RadixSlider],
  ["base", BaseSlider],
] as const)("%s Slider value width", (_name, Slider) => {
  it("reserves the negative min when it prints wider than max (compact engine)", () => {
    const { container } = render(
      <Slider size="compact" value={0} onChange={() => {}} min={-100} max={50} />
    );
    const ghosts = [...container.querySelectorAll('[aria-hidden="true"].invisible')].map(
      (el) => el.textContent
    );
    expect(ghosts).toContain("-100");
    expect(ghosts).toContain("50");
  });

  it("joins a range with an en dash, in the ghost and on screen", () => {
    const { container } = render(
      <Slider size="compact" value={[10, 40]} onChange={() => {}} min={0} max={100} />
    );
    expect(container.textContent).toContain("10–40");
    expect(container.textContent).not.toContain("—");
  });

  it("sizes the comfortable value slot for the longer end", () => {
    const { container } = render(
      <Slider value={0} onChange={() => {}} min={-1000} max={10} />
    );
    const slots = [...container.querySelectorAll<HTMLElement>("[style*='min-width']")].map(
      (el) => el.style.minWidth
    );
    expect(slots).toContain("5ch");
  });
});

describe("TableEmpty", () => {
  function Empty({ size }: { size?: "compact" }) {
    return (
      <Table size={size}>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Role</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableEmpty
            columns={2}
            title="No members yet"
            description="People you invite show up here."
            action={<button type="button">Invite</button>}
          />
        </TableBody>
      </Table>
    );
  }

  it("spans every column with the headline, explanation and action", () => {
    const { container, getByRole } = render(<Empty />);
    expect(container.querySelector("td")?.getAttribute("colspan")).toBe("2");
    const status = getByRole("status");
    expect(status.textContent).toContain("No members yet");
    expect(status.textContent).toContain("People you invite show up here.");
    expect(getByRole("button", { name: "Invite" })).toBeTruthy();
  });

  it("holds 3 rows of height on each ladder step", () => {
    const { getByRole, unmount } = render(<Empty />);
    expect(getByRole("status").style.minHeight).toBe("108px");
    unmount();
    expect(render(<Empty size="compact" />).getByRole("status").style.minHeight).toBe("84px");
  });
});

describe("shortcut caps platform", () => {
  const caps = (mac?: boolean) => {
    const cap = <CommandMenuShortcut keys="mod+k" />;
    return mac === undefined ? cap : <CommandMenuPlatform mac={mac}>{cap}</CommandMenuPlatform>;
  };

  it("draws the platform the server was told, ⌘ by default", () => {
    expect(renderToString(caps())).toContain("⌘");
    expect(renderToString(caps(true))).toContain("⌘");
    const other = renderToString(caps(false));
    expect(other).toContain("Ctrl");
    expect(other).not.toContain("⌘");
  });

  it("hydrates a Windows render with no mismatch and no swap", async () => {
    const platform = Object.getOwnPropertyDescriptor(Navigator.prototype, "platform");
    Object.defineProperty(navigator, "platform", { configurable: true, get: () => "Win32" });
    const errors: unknown[] = [];
    const host = document.createElement("div");
    host.innerHTML = renderToString(caps(false));
    document.body.append(host);
    await act(async () => {
      hydrateRoot(host, caps(false), { onRecoverableError: (e) => errors.push(e) });
    });
    expect(errors).toEqual([]);
    expect(host.textContent).toContain("Ctrl");
    host.remove();
    if (platform) Object.defineProperty(navigator, "platform", platform);
    else delete (navigator as { platform?: string }).platform;
  });

  it("reads the platform hint first, the user agent otherwise", () => {
    expect(readMacPlatform('"macOS"', "anything")).toBe(true);
    expect(readMacPlatform('"Windows"', "Macintosh")).toBe(false);
    expect(readMacPlatform('"Chrome OS"', null)).toBe(false);
    expect(readMacPlatform('"iOS"', null)).toBe(true);
    expect(readMacPlatform(null, "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X)")).toBe(true);
    expect(readMacPlatform(null, "Mozilla/5.0 (Windows NT 10.0; Win64; x64)")).toBe(false);
    expect(readMacPlatform(null, null)).toBe(false);
  });
});

describe("no results keeps the last results' height", () => {
  it("CommandMenu", () => {
    const items = [
      { value: "a", label: "Alpha" },
      { value: "b", label: "Beta" },
    ];
    const { getByRole, container } = render(
      <CommandMenu items={items}>
        <CommandMenuInput />
        <CommandMenuList>
          <CommandMenuEmpty>No results.</CommandMenuEmpty>
        </CommandMenuList>
      </CommandMenu>
    );
    const list = container.querySelector<HTMLElement>('[data-slot="command-menu-list"]')!;
    expect(list.style.minHeight).toBe("");
    fireEvent.change(getByRole("combobox"), { target: { value: "zzz" } });
    expect(list.hasAttribute("data-empty")).toBe(true);
    expect(list.style.minHeight).toBe(`${BOX_HEIGHT}px`);
    fireEvent.change(getByRole("combobox"), { target: { value: "al" } });
    expect(list.style.minHeight).toBe("");
  });

  describe.each([
    ["radix", RadixCombobox],
    ["base", BaseCombobox],
  ] as const)("%s Combobox", (_name, C) => {
    it("floors the popup while nothing matches", async () => {
      const items = [
        { value: "next", label: "Next.js" },
        { value: "remix", label: "Remix" },
      ];
      const { getByRole, findByRole } = render(
        <C.Combobox items={items}>
          <C.ComboboxInput placeholder="Pick" />
          <C.ComboboxContent>
            <C.ComboboxEmpty>No framework found.</C.ComboboxEmpty>
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
      const input = getByRole("combobox");
      await act(async () => {
        input.focus();
        fireEvent.keyDown(input, { key: "ArrowDown" });
        fireEvent.change(input, { target: { value: "n" } });
      });
      const option = await findByRole("option", { name: "Next.js" });
      const surface = option
        .closest<HTMLElement>('[data-slot="scroll-area"]')!
        .parentElement!;
      expect(surface.style.minHeight).toBe("");
      await act(async () => {
        fireEvent.change(input, { target: { value: "zzz" } });
      });
      expect(surface.style.minHeight).toBe(`${BOX_HEIGHT}px`);
      // The empty list gives up its flex-1 so ComboboxEmpty centers in the floor.
      expect(surface.querySelector('[data-slot="scroll-area"]')!.className).toContain(
        "[&:not(:has([role=option]))]:flex-none"
      );
      await act(async () => {
        fireEvent.change(input, { target: { value: "re" } });
      });
      expect(surface.style.minHeight).toBe("");
    });
  });

  describe.each([
    ["radix", RadixDropdown],
    ["base", BaseDropdown],
  ] as const)("%s searchable Dropdown", (_name, F) => {
    function Searchable() {
      const [query, setQuery] = useState("");
      const labels = ["Teamspaces", "Recents", "Favorites"].filter((l) =>
        l.toLowerCase().includes(query.toLowerCase())
      );
      return (
        <F.DropdownMenu defaultOpen>
          <F.DropdownTrigger>Open</F.DropdownTrigger>
          <F.DropdownContent>
            <F.DropdownSearch value={query} onValueChange={setQuery} />
            {labels.map((label, index) => (
              <MenuItem key={label} index={index} label={label} />
            ))}
            {labels.length === 0 && <F.DropdownEmpty>Nothing found</F.DropdownEmpty>}
          </F.DropdownContent>
        </F.DropdownMenu>
      );
    }

    it("floors the rows' box while nothing matches", () => {
      const { getByRole, getByText } = render(<Searchable />);
      const field = getByRole("searchbox");
      const box = getByRole("menuitem", { name: "Recents" }).parentElement!;
      fireEvent.change(field, { target: { value: "zzz" } });
      expect(getByText("Nothing found")).toBeTruthy();
      expect(box.style.minHeight).toBe(`${BOX_HEIGHT}px`);
      fireEvent.change(field, { target: { value: "re" } });
      expect(box.style.minHeight).toBe("");
    });
  });
});

describe("InputMessage file remove", () => {
  function Composer() {
    const [value, setValue] = useState("");
    const [files, setFiles] = useState([new File(["x"], "notes.pdf", { type: "application/pdf" })]);
    return (
      <InputMessage
        value={value}
        onValueChange={setValue}
        files={files}
        onFilesChange={setFiles}
        onSend={() => {}}
      />
    );
  }

  async function attach() {
    const view = render(<Composer />);
    await act(async () => {});
    return view.getByRole("button", { name: "Remove notes.pdf" });
  }

  it("takes no taps while hidden on hover devices", async () => {
    const remove = await attach();
    expect(remove.className).toContain("pointer-events-none");
    expect(remove.className).toContain("opacity-0");
    expect(remove.className).toContain("group-hover/tile:pointer-events-auto");
  });

  it("stays visible on touch, where there is no hover to reveal it", async () => {
    hoverNone = true;
    const remove = await attach();
    expect(remove.className).toContain("opacity-100");
    expect(remove.className).not.toContain("pointer-events-none");
  });
});
