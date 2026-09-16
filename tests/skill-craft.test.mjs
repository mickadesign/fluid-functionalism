// Guards the craft pipeline: every doc page carries a PROMPT_ENTRIES entry
// with a real craft section (this is how command-menu once shipped with no
// entry at all), and the skill's generated craft reference matches a fresh
// run of the generator — the same fails-on-drift contract the registry
// build has for public/r.
import { describe, it, expect } from "vitest";
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, readdirSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { SECTIONS } from "../scripts/build-skill-craft.mjs";

const root = fileURLToPath(new URL("..", import.meta.url));
const entriesSrc = readFileSync(join(root, "lib/docs/prompt-entries.ts"), "utf8");

const docSlugs = readdirSync(join(root, "app/docs")).filter((name) =>
  statSync(join(root, "app/docs", name)).isDirectory(),
);

describe("prompt entries cover the docs", () => {
  it.each(docSlugs)("doc page %s has a PROMPT_ENTRIES entry with craft", (slug) => {
    const entry = new RegExp(
      `^  ("?)${slug}\\1: \\{\\n    craft: \\[\\n((?:      ".*",\\n)+)    \\],`,
      "m",
    ).exec(entriesSrc);
    expect(entry, `add a ${slug} entry (usage, props, craft) to lib/docs/prompt-entries.ts`).toBeTruthy();
    const bullets = entry[2].trim().split("\n");
    expect(
      bullets.length,
      `${slug} needs at least 4 craft bullets (one decision per bullet)`,
    ).toBeGreaterThanOrEqual(4);
  });
});

describe("the craft reference covers every component", () => {
  // The generator's section list is hand-maintained. Without this check a new
  // doc page could carry a full craft entry, satisfy the per-page test AND the
  // drift test (which regenerates with the same incomplete list), and still be
  // absent from the reference the skill ships.
  const listed = SECTIONS.map(([slug]) => slug);

  it.each(docSlugs)("doc page %s has a section in build-skill-craft.mjs", (slug) => {
    expect(
      listed,
      `add ["${slug}", "<DisplayName>"] to SYSTEMS, COMPONENTS or BLOCKS in scripts/build-skill-craft.mjs, or it never reaches craft.md`,
    ).toContain(slug);
  });

  // The reverse direction cannot require a doc page: blocks are sections by
  // design and have none. What every section must have is a craft entry, so
  // a typo or a slug left behind by a rename fails here rather than throwing
  // out of the generator with no context.
  it.each(listed)("section %s has a craft entry to render", (slug) => {
    const entry = new RegExp(
      `^  ("?)${slug}\\1: \\{\\n    craft: \\[\\n`,
      "m",
    ).test(entriesSrc);
    expect(
      entry,
      `scripts/build-skill-craft.mjs lists "${slug}", but lib/docs/prompt-entries.ts has no craft entry for it`,
    ).toBe(true);
  });
});

describe("the skill's craft reference", () => {
  it("matches a fresh run of scripts/build-skill-craft.mjs", () => {
    const out = join(mkdtempSync(join(tmpdir(), "craft-")), "craft.md");
    execFileSync("node", [join(root, "scripts/build-skill-craft.mjs"), "--out", out]);
    const fresh = readFileSync(out, "utf8");
    const committed = readFileSync(
      join(root, "skills/fluid-functionalism/references/craft.md"),
      "utf8",
    );
    expect(
      committed,
      "skills/fluid-functionalism/references/craft.md is stale — run `node scripts/build-skill-craft.mjs` and commit it",
    ).toBe(fresh);
  });
});
