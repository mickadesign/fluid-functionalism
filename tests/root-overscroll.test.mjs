import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

// Safari (WebKit) stops a mouse wheel from scrolling the page at all when
// the root carries an overscroll-behavior other than auto (none or contain),
// so neither html nor body may set one.
describe("root overscroll", () => {
  it("globals.css sets no overscroll-behavior on html or body", () => {
    const css = readFileSync(join(process.cwd(), "app/globals.css"), "utf8").replace(/\/\*[\s\S]*?\*\//g, "");
    const rootRules = [...css.matchAll(/(^|\})\s*([^{}]*\b(?:html|body)\b[^{}]*)\{([^{}]*)\}/g)];
    for (const [, , selector, body] of rootRules) {
      expect(body, `overscroll-behavior on "${selector.trim()}"`).not.toMatch(/overscroll-behavior/);
    }
  });

  it("the root layout doesn't add it as a utility either", () => {
    const layout = readFileSync(join(process.cwd(), "app/layout.tsx"), "utf8");
    expect(layout).not.toMatch(/overscroll-(?:y-|x-)?(?:none|contain)/);
  });
});
