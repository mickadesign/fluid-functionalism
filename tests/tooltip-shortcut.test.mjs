/**
 * A one-line tooltip is the same height with a key cap or without. Tooltip's
 * `shortcut` prop is the one place that builds the label-and-cap row (it
 * trims the label again, since a flex row escapes the bubble's text-box
 * trim), so no Tooltip writes a <kbd> into `content` by hand.
 */
import { readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = new URL("..", import.meta.url).pathname;
const DIRS = ["app", "components", "lib", "registry"];

function sourceFiles(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return sourceFiles(path);
    return /\.(tsx|ts)$/.test(entry.name) ? [path] : [];
  });
}

/** The opening tag starting at `start`, braces and strings skipped. */
function openingTag(source, start) {
  let depth = 0;
  let quote = null;
  for (let i = start; i < source.length; i++) {
    const char = source[i];
    if (quote) {
      if (char === quote) quote = null;
    } else if (char === '"' || char === "`") quote = char;
    else if (char === "{") depth++;
    else if (char === "}") depth--;
    else if (char === ">" && depth === 0) return source.slice(start, i + 1);
  }
  return source.slice(start);
}

/** Lines of the Tooltips whose opening tag holds a hand-placed cap: a
 *  <kbd>, or a <KeyCap>/<KeyCaps> without the shortcut row's trim.
 *  <TooltipShortcut> is the one sanctioned way to place caps by hand. */
const HAND_BUILT = /<kbd|<KeyCaps?[\s>/]/;
export function handBuiltCaps(source) {
  const lines = [];
  const tooltip = /<Tooltip[\s>]/g;
  for (let match; (match = tooltip.exec(source)); ) {
    if (HAND_BUILT.test(openingTag(source, match.index))) {
      lines.push(source.slice(0, match.index).split("\n").length);
    }
  }
  return lines;
}

describe("handBuiltCaps", () => {
  it("finds a <kbd> written into content", () => {
    const source = `
      <Tooltip content="Plain"><button /></Tooltip>
      <Tooltip content={<span>Close <kbd>Esc</kbd></span>}><button /></Tooltip>
      <Tooltip content="Close" shortcut="Esc"><button><kbd>k</kbd></button></Tooltip>`;
    expect(handBuiltCaps(source)).toEqual([3]);
  });

  it("finds a KeyCap or KeyCaps written into content, not TooltipShortcut", () => {
    const source = `
      <Tooltip content={<span>Close <KeyCap>Esc</KeyCap></span>}><button /></Tooltip>
      <Tooltip content={<span>New <KeyCaps keys="⇧⌘O" /></span>}><button /></Tooltip>
      <Tooltip content={<span>Drag <TooltipShortcut>[</TooltipShortcut></span>}><button /></Tooltip>`;
    expect(handBuiltCaps(source)).toEqual([2, 3]);
  });
});

describe("tooltip key caps go through `shortcut`", () => {
  const found = DIRS.flatMap((dir) => sourceFiles(join(ROOT, dir))).flatMap(
    (path) =>
      handBuiltCaps(readFileSync(path, "utf-8")).map(
        (line) => `${relative(ROOT, path)}:${line}`
      )
  );

  it("no Tooltip holds a hand-built <kbd>", () => {
    expect(found).toEqual([]);
  });
});

// The row is the same in both flavors.
describe("shortcut row", () => {
  const row = (path) => {
    const source = readFileSync(join(ROOT, path), "utf-8");
    const start = source.indexOf("function TooltipShortcut(");
    const body = source.indexOf("  const content =\n");
    return (
      source.slice(start, source.indexOf("\n}\n", start)) +
      source.slice(body, source.indexOf(");\n", body))
    );
  };

  it("trims the label and keeps the caps out of the row's height", () => {
    const radix = row("registry/radix/tooltip.tsx");
    expect(radix).toContain("[text-box:trim-both_cap_alphabetic]");
    expect(radix).toContain("-my-[5px]");
    expect(row("registry/base/tooltip.tsx")).toBe(radix);
  });
});
