import { existsSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it, vi } from "vitest";
import { parseRelease, releaseEntries, type Inline } from "@/lib/changelog/parse";
import { AHEAD_OF_RELEASE, latestMarks, loadReleases } from "@/lib/changelog/load";
import { buildMigrationPrompt } from "@/lib/changelog/migration-prompt";
import { highlightDiff } from "@/lib/docs/highlight";
import { releasesToMarkdown } from "@/lib/changelog/markdown";
import { entryInstall } from "@/lib/changelog/install";
import { buildUpgradePrompt } from "@/lib/changelog/upgrade-prompt";
import { SHOWCASE_PREVIEW_SLUGS } from "@/app/changelog/previews";
import { componentList, systemNavList } from "@/lib/docs/components";

// The release files in content/changelog/ follow changelog-guidelines.md.
// The parser already rejects anything off-format; these checks cover what it
// cannot see from one file: links that resolve, months in order.

const root = join(__dirname, "..");
const docSlugs = new Set([...componentList, ...systemNavList].map((e) => e.slug));
const systemSlugs = new Set(systemNavList.map((e) => e.slug));

/** Where an entry's label sorts inside its section (changelog-guidelines.md). */
function entryRank(href: string | null): number {
  if (href === null) return 3;
  const slug = /^\/docs\/([^/#]+)$/.exec(href)?.[1];
  if (!slug) return 2;
  return systemSlugs.has(slug) ? 0 : 1;
}

function routeExists(href: string): boolean {
  const path = href.split("#")[0].replace(/\/$/, "");
  const docs = /^\/docs\/([^/]+)$/.exec(path);
  if (docs) return docSlugs.has(docs[1]);
  return existsSync(join(root, "app", path, "page.tsx"));
}

// The checkable half of tone-of-voice.md's Changelog variant. A code span
// counts as 1 word, so a long prop value doesn't eat the budget.
const BANNED = /\b(now|we|our|has been|have been|is renamed|are renamed|seamless|powerful|robust|beautiful)\b/i;

function voiceProblems(inline: Inline[], maxSentences: number): string[] {
  const flat = inline.map((p) => (p.type === "code" ? "\u00a7" : p.value)).join("");
  const sentences = flat.split(/(?<=[.!?])\s+(?=[A-Z0-9\u00a7])/).filter(Boolean);
  const problems: string[] = [];
  if (sentences.length > maxSentences) problems.push(`${sentences.length} sentences`);
  for (const sentence of sentences) {
    const words = sentence.split(/\s+/).filter(Boolean).length;
    const codes = (sentence.match(/\u00a7/g) ?? []).length;
    if (words > 25) problems.push(`${words} words: "${sentence.slice(0, 40)}..."`);
    if (codes > 3) problems.push(`${codes} code spans: "${sentence.slice(0, 40)}..."`);
  }
  const banned = BANNED.exec(flat);
  if (banned) problems.push(`"${banned[0]}"`);
  return problems;
}

// One test per file, so a malformed month names itself instead of stopping
// the whole suite at collection time.
const dir = join(root, "content", "changelog");
const files = readdirSync(dir).filter((name) => /^\d{4}-\d{2}\.md$/.test(name)).sort().reverse();

describe("changelog releases", () => {
  it("has at least one release, every file named after its month", () => {
    expect(files.length).toBeGreaterThan(0);
  });

  it.each(files)("%s follows the format, links to pages that exist, lists each label once per kind, in order", (name) => {
    const release = parseRelease(readFileSync(join(dir, name), "utf8"), `content/changelog/${name}`);
    expect(release.month).toBe(name.slice(0, 7));
    for (const entry of releaseEntries(release)) {
      if (entry.href) expect(routeExists(entry.href), `${entry.name} -> ${entry.href}`).toBe(true);
    }
    for (const group of release.groups) {
      const names = group.entries.map((e) => e.name);
      expect(new Set(names).size, `${group.kind}: ${names.join(", ")}`).toBe(names.length);
      // System pages A to Z, then component pages, then other site
      // routes, then bold labels, each A to Z.
      const sorted = [...group.entries]
        .sort((a, b) => entryRank(a.href) - entryRank(b.href) || a.name.localeCompare(b.name))
        .map((e) => e.name);
      expect(names, `${group.kind} order`).toEqual(sorted);
    }
  });

  it.each(files)("%s follows the changelog voice", (name) => {
    const release = parseRelease(readFileSync(join(dir, name), "utf8"), `content/changelog/${name}`);
    const problems = releaseEntries(release).flatMap((entry) =>
      voiceProblems(entry.text, 2).map((problem) => `${entry.kind} ${entry.name}: ${problem}`)
    );
    if (release.intro) problems.push(...voiceProblems(release.intro, 1).map((p) => `intro: ${p}`));
    expect(problems).toEqual([]);
  });
});

describe("lazy previews", () => {
  it("lists exactly the slugs the Showcase's previewMap covers", () => {
    const source = readFileSync(join(root, "app", "components", "bento-previews.tsx"), "utf8");
    const map = /export const previewMap[^{]*\{([\s\S]*?)\n\};/.exec(source)?.[1] ?? "";
    const keys = [...map.matchAll(/^\s+"?([a-z-]+)"?:/gm)].map((m) => m[1]).sort();
    expect(keys.length).toBeGreaterThan(0);
    expect([...SHOWCASE_PREVIEW_SLUGS].sort()).toEqual(keys);
  });
});

describe("/changelog.md", () => {
  const releases = files.map((name) => parseRelease(readFileSync(join(dir, name), "utf8"), name));
  const md = releasesToMarkdown(releases);

  it("carries every month and every entry, with absolute links only", () => {
    for (const release of releases) {
      expect(md).toContain(`Highlights: ${release.title}`);
      for (const entry of releaseEntries(release)) expect(md).toContain(entry.name);
    }
    expect(md).not.toMatch(/\]\(\//);
    expect(md).not.toContain("\u2014");
  });

  it("names what each entry installs, under the registry's own names", () => {
    const withInstall = releasesToMarkdown(releases, entryInstall);
    const SITE = "https://www.fluidfunctionalism.com";
    // A system page installs under another name; a flavored component lists
    // both URLs; the skill page installs the skill.
    expect(withInstall).toContain(`Install: \`${SITE}/r/use-fluid-hover.json\``);
    expect(withInstall).toContain(`\`${SITE}/r/combobox.json\`, or \`${SITE}/r/base/combobox.json\``);
    expect(withInstall).toContain("Install: `npx skills add mickadesign/fluid-functionalism`.");
    // Every entry gets a line, and every Breaking entry its steps.
    const entries = releases.flatMap(releaseEntries);
    expect(withInstall.match(/^ {2}Install: /gm)?.length).toBe(entries.length);
    expect(withInstall.match(/^ {2}Migrate:$/gm)?.length).toBe(entries.filter((e) => e.diff).length);
  });

  it("keeps each Breaking diff", () => {
    for (const entry of releases.flatMap(releaseEntries)) {
      if (entry.diff) expect(md).toContain(entry.diff.split("\n")[0]);
    }
  });
});

describe("the Copy upgrade prompt", () => {
  const prompt = buildUpgradePrompt();

  it("leads with the skill, then the same job by hand from the changelog", () => {
    expect(prompt.indexOf("npx skills add mickadesign/fluid-functionalism")).toBeLessThan(prompt.indexOf("Without the skill"));
    expect(prompt).toContain("https://www.fluidfunctionalism.com/changelog.md");
    expect(prompt).toContain("--overwrite");
  });

  it("follows the tone of voice: no em dashes", () => {
    expect(prompt).not.toContain("\u2014");
  });
});

describe("parseRelease", () => {
  const valid = `---
month: 2026-07
released: 2026-08-07
title: Springs, Select
---

One line about the month.

## Breaking

- [Motion](/docs/motion): The \`settle\` tier is gone, use \`slow\`. (#18)

  \`\`\`diff
  - transition={spring.settle}
  + transition={spring.slow}
  \`\`\`

## Updated

- [Select](/docs/select): The highlight stops sliding on reopen. (#22, #23)
- **All components**: Installs pass the lint. (a28dd34)
`;

  it("reads a release into data", () => {
    const release = parseRelease(valid);
    expect(release.month).toBe("2026-07");
    expect(release.released).toBe("2026-08-07");
    expect(release.intro).toEqual([{ type: "text", value: "One line about the month." }]);
    expect(release.groups.map((g) => g.kind)).toEqual(["breaking", "updated"]);
    const [breaking] = release.groups[0].entries;
    expect(breaking.text).toEqual([
      { type: "text", value: "The " },
      { type: "code", value: "settle" },
      { type: "text", value: " tier is gone, use " },
      { type: "code", value: "slow" },
      { type: "text", value: "." },
    ]);
    expect(breaking.diff).toContain("spring.settle");
    const [select, all] = release.groups[1].entries;
    expect(select.refs).toEqual([
      { type: "pr", number: 22 },
      { type: "pr", number: 23 },
    ]);
    expect(all.href).toBeNull();
    expect(all.refs).toEqual([{ type: "commit", sha: "a28dd34" }]);
  });

  const broken: Array<[string, string, RegExp]> = [
    ["an em dash", valid.replace("One line", "One line — about"), /em dash/],
    ["an unknown section", valid.replace("## Updated", "## Fixed"), /unknown section/],
    ["sections out of order", `${valid}\n## New\n\n- [Badge](/docs/badge): A late section. (#1)\n`, /New, Breaking, Updated/],
    ["a Breaking entry with no diff", valid.replace(/ {2}```diff[\s\S]*?```\n/, ""), /needs a ```diff block/],
    ["missing refs", valid.replace(" (#22, #23)", ""), /ends with its refs/],
    ["a bad ref", valid.replace("#22", "PR22"), /is not a PR/],
    ["more than 3 refs", valid.replace("(#22, #23)", "(#22, #23, #24, #25)"), /3 refs at most/],
    ["a missing period", valid.replace("on reopen. (#22", "on reopen (#22"), /ends with a period/],
    ["an external label link", valid.replace("(/docs/select)", "(https://example.com)"), /use a site route/],
    ["a protocol-relative label link", valid.replace("(/docs/select)", "(//example.com/x)"), /use a site route/],
    ["an impossible release day", valid.replace("2026-08-07", "2026-09-31"), /not a real day/],
    ["an unknown diff language", valid.replace("```diff\n", "```diff python\n"), /not a diff language/],
    ["a link inside the sentence", valid.replace("stops sliding", "stops [sliding](/x)"), /only plain text and inline code/],
    ["a long title", valid.replace("Springs, Select", "x".repeat(91)), /90 characters/],
    ["a title ending in a period", valid.replace("Springs, Select", "Springs, Select."), /ends with a period/],
    ["an early release date", valid.replace("2026-08-07", "2026-07-31"), /before the month ended/],
    ["an unknown frontmatter key", valid.replace("title:", "author: me\ntitle:"), /unknown frontmatter key/],
  ];

  it.each(broken)("rejects %s", (_, source, message) => {
    expect(() => parseRelease(source)).toThrow(message);
  });

  it("reads the diff's language from the fence, TSX by default", () => {
    expect(parseRelease(valid).groups[0].entries[0].diffLang).toBe("tsx");
    const css = parseRelease(valid.replace("```diff\n", "```diff css\n"));
    expect(css.groups[0].entries[0].diffLang).toBe("css");
    expect(css.groups[1].entries[0].diffLang).toBeNull();
  });
});

describe("highlightDiff", () => {
  const lines = (html: string) =>
    html
      .replace(/<[^>]+>/g, "")
      .replace(/&#x3C;/g, "<")
      .split("\n");

  it("drops the space after each marker, so code starts at the gutter", async () => {
    const html = await highlightDiff("- <A size=\"md\" />\n+ <A size=\"default\" />\n");
    expect(html).toContain("diff remove");
    expect(html).toContain("diff add");
    expect(lines(html)).toEqual(['<A size="md" />', '<A size="default" />']);
  });

  it("keeps a plain unified diff's indentation", async () => {
    // `-code`: no space after the marker on the first line, so the second
    // line's spaces are indentation.
    expect(lines(await highlightDiff("-if (a) {\n+  b();"))).toEqual(["if (a) {", "  b();"]);
  });

  it("highlights in the fence's language", async () => {
    const html = await highlightDiff("- --overlay: 0 0 0;\n+ --overlay: 255 255 255;", "css");
    expect(lines(html)).toEqual(["--overlay: 0 0 0;", "--overlay: 255 255 255;"]);
  });
});

describe("Copy migration prompt", () => {
  const breaking = loadReleases().flatMap(releaseEntries).filter((e) => e.kind === "breaking");

  it("re-installs the item /changelog.md names, system pages included", () => {
    const fluidHover = breaking.find((e) => e.href === "/docs/fluid-hover")!;
    const scrollbars = breaking.find((e) => e.href === "/docs/scrollbars")!;
    for (const [entry, url] of [
      [fluidHover, "/r/use-fluid-hover.json"],
      [scrollbars, "/r/scroll-area.json"],
    ] as const) {
      const prompt = buildMigrationPrompt({ entry, month: "2026-09", install: entryInstall(entry), base: "radix" });
      expect(prompt).toContain(`npx shadcn@latest add https://www.fluidfunctionalism.com${url} --overwrite`);
      expect(prompt).not.toContain("every Fluid Functionalism component");
    }
  });

  it("takes the Base UI URL only for an item that has one", () => {
    for (const entry of breaking) {
      const install = entryInstall(entry);
      if (install.kind !== "item") continue;
      const prompt = buildMigrationPrompt({ entry, month: "2026-09", install, base: "base" });
      expect(prompt).toContain(`/r/${install.base ? "base/" : ""}${install.name}.json --overwrite`);
    }
  });
});

describe("latestMarks", () => {
  const release = (month: string, body: string) => `---\nmonth: ${month}\ntitle: A month\n---\n\n${body}`;
  const dirWith = (files: Record<string, string>) => {
    const dir = mkdtempSync(join(tmpdir(), "ff-marks-"));
    for (const [name, text] of Object.entries(files)) writeFileSync(join(dir, name), text);
    return dir;
  };

  it("marks the latest release's Updated and Breaking docs pages, never its New ones", () => {
    const dir = dirWith({
      "2026-08.md": release("2026-08", "## New\n\n- [Badge](/docs/badge): Old news. (#1)\n"),
      "2026-09.md": release(
        "2026-09",
        [
          "## New",
          "",
          "- [Combobox](/docs/combobox): A field. (#2)",
          "",
          "## Updated",
          "",
          "- [Select](/docs/select#sizes): A fix. (#3)",
          "- [Combobox](/docs/combobox): Counted once, as New. (#4)",
          "- [Showcase](/): Not a docs page. (#5)",
          "",
        ].join("\n"),
      ),
    });
    try {
      expect(latestMarks(dir, [])).toEqual({ updated: ["select"], ahead: [] });
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("badges pages listed ahead of the next release, until that release lands", () => {
    const ahead = [{ month: "2026-10", slugs: ["banner"] }];
    const september = release("2026-09", "## Updated\n\n- [Banner](/docs/banner): A fix. (#1)\n");
    const october = release("2026-10", "## New\n\n- [Banner](/docs/banner): A status message. (#2)\n");
    const before = dirWith({ "2026-09.md": september });
    const after = dirWith({ "2026-09.md": september, "2026-10.md": october });
    try {
      // Ahead of its release it is New, not Updated; once October lands, the
      // ahead list lapses and the New mark with it.
      expect(latestMarks(before, ahead)).toEqual({ updated: [], ahead: ["banner"] });
      expect(latestMarks(after, ahead)).toEqual({ updated: [], ahead: [] });
    } finally {
      rmSync(before, { recursive: true, force: true });
      rmSync(after, { recursive: true, force: true });
    }
  });

  it("lists only real docs pages ahead of a release", () => {
    for (const { month, slugs } of AHEAD_OF_RELEASE) {
      expect(month).toMatch(/^\d{4}-(0[1-9]|1[0-2])$/);
      for (const slug of slugs) expect(docSlugs.has(slug), slug).toBe(true);
    }
  });

  it("costs the site its markers, never the page, on a malformed release", () => {
    const dir = dirWith({ "2026-09.md": "no frontmatter" });
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    try {
      expect(latestMarks(dir)).toEqual({ updated: [], ahead: [] });
      expect(error).toHaveBeenCalledOnce();
    } finally {
      error.mockRestore();
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
