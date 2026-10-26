/**
 * The reveal CSS has one source (lib/reveal/presets.ts plus the rule list in
 * scripts/generate-reveal.mjs) and 2 generated copies: the marked block in
 * app/globals.css and the `reveal` item in registry.json. This fails when a
 * copy is stale.
 */
import { describe, expect, it } from "vitest";
import { generate } from "../scripts/generate-reveal.mjs";

describe("reveal CSS generation", () => {
  it("globals.css and registry.json are up to date", async () => {
    const files = await generate();
    const stale = Object.entries(files)
      .filter(([, [before, after]]) => before !== after)
      .map(([path]) => path);
    expect(stale, "run `npm run reveal-css`").toEqual([]);
  });
});
