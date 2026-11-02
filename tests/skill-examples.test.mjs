// The /docs/skill Copy example clicks the real InputCopy from a script.
// Hover can't be scripted, so the example mirrors InputCopy's group-hover
// for [data-script-hover] with selectors on InputCopy's markup, and it keeps
// the visitor's clipboard untouched by standing in for
// navigator.clipboard.writeText. Both lean on InputCopy's internals: these
// fail when InputCopy changes them, so the example gets updated with it.
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const inputCopy = readFileSync(join(root, "registry/default/input-copy.tsx"), "utf8");
const example = readFileSync(join(root, "app/docs/skill/examples.tsx"), "utf8");

describe("the skill page's Copy example keeps up with InputCopy", () => {
  it("mirrors hover styles InputCopy still has", () => {
    const mirrored = [
      // [example selector, InputCopy class it stands in for]
      [
        "[&_button[data-script-hover]_mark]:bg-[color-mix(in_oklab,var(--fluid-accent,#6B97FF)_20%,transparent)]",
        /<mark className="[^"]*group-hover:bg-\[color-mix\(in_oklab,var\(--fluid-accent,#6B97FF\)_20%,transparent\)\]/,
      ],
      ["[&_button[data-script-hover]_svg]:stroke-[2]", /group-hover:stroke-\[2\]/],
      ["[&_button[data-script-hover]_.text-muted-foreground]:text-foreground", /text-muted-foreground group-hover:text-foreground/],
    ];
    for (const [selector, original] of mirrored) {
      expect(example, selector).toContain(selector);
      expect(inputCopy, `InputCopy lost ${original}: update the mirror in examples.tsx`).toMatch(original);
    }
  });

  it("copies through the writeText the example stands in for", () => {
    expect(inputCopy, "InputCopy no longer calls writeText: the script would reach the real clipboard").toContain(
      "navigator.clipboard.writeText(value)",
    );
  });
});
