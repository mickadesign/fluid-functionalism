/**
 * Base UI popups keep their Motion exit through a local
 * `usePopupExit` hook. Registry files install one by one, so each popup file
 * carries its own copy: these checks keep the copies identical, and keep the
 * registry on the Base UI release whose close cycle the hook relies on.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = new URL("..", import.meta.url).pathname;

const COPIES = [
  "registry/base/dialog.tsx",
  "registry/base/date-picker.tsx",
  "registry/base/dropdown.tsx",
  "registry/base/mobile-drawer.tsx",
  "registry/base/tooltip.tsx",
  "registry/default/color-picker.tsx",
];

/** The hook with the comment block above it. Only the actions type differs
 *  between files, so it is normalized away. */
function hookSource(path) {
  const source = readFileSync(join(ROOT, path), "utf-8");
  const start = source.indexOf("function usePopupExit(");
  if (start === -1) return null;
  const end = source.indexOf("\n}\n", start);
  const lines = source.slice(0, start).split("\n");
  let first = lines.length - 1;
  while (first > 0 && lines[first - 1].startsWith("//")) first--;
  const comment = lines.slice(first).join("\n");
  return (comment + source.slice(start, end + 2)).replace(
    /useRef<[^>]+ \| null>\(null\)/,
    "useRef<Actions | null>(null)"
  );
}

describe("usePopupExit copies", () => {
  const canonical = hookSource(COPIES[0]);

  it("exists in the canonical file", () => {
    expect(canonical).toContain("preventUnmountOnClose()");
  });

  it.each(COPIES.slice(1))("%s matches registry/base/dialog.tsx", (path) => {
    expect(hookSource(path)).toBe(canonical);
  });
});

// TooltipGroup's bubble is the same code in both flavors, for the same
// reason: one file per install.
describe("TooltipGroup bubble copies", () => {
  const block = (path) => {
    const source = readFileSync(join(ROOT, path), "utf-8");
    const start = source.indexOf("const GROUP_HOLD_MS");
    const end = source.indexOf("\n}\n", source.indexOf("function GroupBubble(", start));
    return start === -1 ? null : source.slice(start, end + 2);
  };

  it("registry/base/tooltip.tsx matches registry/radix/tooltip.tsx", () => {
    const radix = block("registry/radix/tooltip.tsx");
    expect(radix).toContain("function GroupBubble(");
    expect(block("registry/base/tooltip.tsx")).toBe(radix);
  });
});

describe("Base UI version", () => {
  const registry = JSON.parse(readFileSync(join(ROOT, "registry.json"), "utf-8"));

  // preventUnmountOnClose on Select/Combobox and the checkbox click that
  // reaches the row once both need Base UI 1.9.
  it.each(
    registry.items.filter((item) =>
      (item.dependencies ?? []).some((dep) => dep.startsWith("@base-ui/react"))
    ).map((item) => item.name)
  )("%s requires @base-ui/react@^1.9.0", (name) => {
    const item = registry.items.find((i) => i.name === name);
    expect(item.dependencies).toContain("@base-ui/react@^1.9.0");
  });
});
