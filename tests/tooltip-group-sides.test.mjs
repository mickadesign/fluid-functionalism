/**
 * A TooltipGroup's bubble glides from trigger to trigger. Tooltips on
 * different sides would send that glide across the buttons, so every Tooltip
 * written inside one group names the same side (none means "top").
 *
 * The component holds the rule at runtime too (a bubble that flips for lack
 * of room moves the whole group); this check keeps the source honest.
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
    } else if (char === '"' || char === "'" || char === "`") quote = char;
    else if (char === "{") depth++;
    else if (char === "}") depth--;
    else if (char === ">" && depth === 0) return source.slice(start, i + 1);
  }
  return source.slice(start);
}

/** The side each Tooltip names, per TooltipGroup block. */
export function groupSides(source) {
  const groups = [];
  const open = /<TooltipGroup[\s>]/g;
  for (let match; (match = open.exec(source)); ) {
    const end = source.indexOf("</TooltipGroup>", match.index);
    if (end === -1) continue;
    const block = source.slice(match.index, end);
    const sides = [];
    const tooltip = /<Tooltip[\s>]/g;
    for (let tag; (tag = tooltip.exec(block)); ) {
      const text = openingTag(block, tag.index);
      const side = /\sside=("[^"]*"|\{[^}]*\})/.exec(text);
      sides.push(side ? side[1] : '"top"');
    }
    groups.push({
      line: source.slice(0, match.index).split("\n").length,
      sides,
    });
  }
  return groups;
}

describe("groupSides", () => {
  it("reads the side of each Tooltip, top when none is written", () => {
    const source = `
      <TooltipGroup>
        <Tooltip content="A"><button /></Tooltip>
        <Tooltip content={<b>B</b>} side="bottom"><button /></Tooltip>
      </TooltipGroup>`;
    expect(groupSides(source)[0].sides).toEqual(['"top"', '"bottom"']);
  });
});

describe("one side per TooltipGroup", () => {
  const mixed = DIRS.flatMap((dir) => sourceFiles(join(ROOT, dir))).flatMap(
    (path) =>
      groupSides(readFileSync(path, "utf-8"))
        .filter((group) => new Set(group.sides).size > 1)
        .map(
          (group) =>
            `${relative(ROOT, path)}:${group.line} mixes ${[...new Set(group.sides)].join(", ")}`
        )
  );

  it("no group mixes sides", () => {
    expect(mixed).toEqual([]);
  });
});
