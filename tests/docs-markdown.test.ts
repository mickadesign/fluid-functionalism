// The docs as agents read them: /llms.txt, /llms-full.txt and
// /docs/<slug>.md (lib/docs/markdown.ts), the per-page metadata that points
// at them, and the robots rules that let agents in. A doc page or PropsTable
// added without its Markdown counterpart fails here.
import { describe, expect, it } from "vitest";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import {
  MARKDOWN_PAGES,
  docMarkdown,
  llmsFullTxt,
  llmsTxt,
  markdownUrl,
} from "@/lib/docs/markdown";
import { API_REFERENCE } from "@/lib/docs/api";
import { PROMPT_ENTRIES } from "@/lib/docs/prompt-entries";
import { DUAL_FLAVOR_SLUGS } from "@/lib/install-url";
import { docMetadata } from "@/lib/docs/metadata";
import { plainDescription } from "@/lib/docs/install-brief";
import robots from "@/app/robots";

const root = new URL("..", import.meta.url).pathname;
const docsDir = join(root, "app/docs");
const pageSlugs = readdirSync(docsDir).filter((d) => existsSync(join(docsDir, d, "page.tsx")));

describe("every doc page has a Markdown version", () => {
  it("MARKDOWN_PAGES lists exactly the doc folders", () => {
    expect(MARKDOWN_PAGES.map((p) => p.slug).sort()).toEqual([...pageSlugs].sort());
  });

  it.each(pageSlugs)("%s has a layout.tsx exporting its own metadata", (slug) => {
    const layout = readFileSync(join(docsDir, slug, "layout.tsx"), "utf8");
    expect(layout).toContain(`docMetadata("${slug}")`);
  });

  it.each(pageSlugs)("%s: every PropsTable on the page is in its API module", async (slug) => {
    const page = readFileSync(join(docsDir, slug, "page.tsx"), "utf8");
    const used = [...page.matchAll(/<PropsTable props=\{(\w+)\}/g)].map((m) => m[1]);
    if (!used.length) return;
    // Tables come from lib/docs/api/<slug>.ts, the module the Markdown reads.
    expect(page).toContain(`from "@/lib/docs/api/${slug}"`);
    const mod = await import(`@/lib/docs/api/${slug}`);
    expect(API_REFERENCE[slug]).toBe(mod.apiReference);
    for (const name of used) {
      expect(mod[name], `${name} is not exported by lib/docs/api/${slug}.ts`).toBeDefined();
      expect(
        mod.apiReference.some((t: { props: unknown }) => t.props === mod[name]),
        `${name} renders on /docs/${slug} but is missing from apiReference, so the .md leaves it out`,
      ).toBe(true);
    }
  });

  it("every API module is wired into API_REFERENCE", () => {
    const modules = readdirSync(join(root, "lib/docs/api"))
      .filter((f) => f.endsWith(".ts") && f !== "types.ts" && f !== "index.ts")
      .map((f) => f.replace(/\.ts$/, ""));
    expect(Object.keys(API_REFERENCE).sort()).toEqual(modules.sort());
  });
});

describe("page Markdown", () => {
  const pages = MARKDOWN_PAGES.filter((p) => p.kind !== "skill").map((p) => p.slug);

  it.each(pages)("%s: title, install command, usage and the full API", (slug) => {
    const md = docMarkdown(slug)!;
    const entry = MARKDOWN_PAGES.find((p) => p.slug === slug)!;
    expect(md.startsWith(`# ${entry.name}\n`)).toBe(true);
    expect(md).toMatch(/npx shadcn@latest add https:\/\/www\.fluidfunctionalism\.com\/r\/[a-z-]+\.json --overwrite/);
    expect(md).toContain(`https://www.fluidfunctionalism.com/docs/${slug}`);
    const usage = PROMPT_ENTRIES[slug]?.usage;
    if (usage) expect(md).toContain(usage.trim());
    for (const table of API_REFERENCE[slug] ?? []) {
      for (const prop of table.props) expect(md).toContain(prop.name.replace(/\|/g, "\\|"));
    }
  });

  it.each([...DUAL_FLAVOR_SLUGS].filter((s) => pages.includes(s)))(
    "%s offers both flavors",
    (slug) => {
      const md = docMarkdown(slug)!;
      expect(md).toContain(`/r/${slug}.json --overwrite`);
      expect(md).toContain(`/r/base/${slug}.json --overwrite`);
    },
  );

  it("system pages install their own registry item", () => {
    expect(docMarkdown("motion")).toContain("/r/springs.json");
    expect(docMarkdown("surfaces")).toContain("/r/elevated.json");
    expect(docMarkdown("fluid-hover")).toContain("/r/use-fluid-hover.json");
  });

  it.each(pages)("%s: every table row has as many cells as its header", (slug) => {
    const md = docMarkdown(slug)!;
    const lines = md.split("\n");
    const cells = (line: string) => line.replace(/\\\|/g, "").split("|").length;
    for (let i = 0; i < lines.length; i++) {
      if (!lines[i].startsWith("| Prop |")) continue;
      const width = cells(lines[i]);
      for (let j = i + 1; j < lines.length && lines[j].startsWith("|"); j++) {
        expect(cells(lines[j]), `${slug}: ${lines[j]}`).toBe(width);
      }
    }
  });

  it.each(pages)("%s: the craft link lands on an anchor in craft.md", (slug) => {
    const craft = readFileSync(join(root, "skills/fluid-functionalism/references/craft.md"), "utf8");
    expect(docMarkdown(slug)).toContain(`craft.md#${slug}`);
    expect(craft).toContain(`<a id="${slug}"></a>`);
  });

  it("the skill page installs the skill", () => {
    expect(docMarkdown("skill")).toContain("npx skills add mickadesign/fluid-functionalism");
  });

  it("unknown slugs have no Markdown", () => {
    expect(docMarkdown("not-a-page")).toBeNull();
  });
});

describe("llms.txt", () => {
  const txt = llmsTxt();

  it("follows the llms.txt shape: H1, summary quote, sections of links", () => {
    expect(txt.startsWith("# Fluid Functionalism\n\n> ")).toBe(true);
    expect(txt).toContain("\n## Components\n");
  });

  it("links every page's Markdown", () => {
    for (const page of MARKDOWN_PAGES) expect(txt).toContain(`](${markdownUrl(page.slug)})`);
  });

  it("points agents at the changelog, where updates and migrations live", () => {
    expect(txt).toContain("https://www.fluidfunctionalism.com/changelog.md");
  });

  it("follows the tone of voice: no em dashes", () => {
    expect(txt).not.toContain("—");
  });

  // plainDescription turns a lone dash into a colon, so a description that
  // already has a colon before it would read "X: a: b". None does today.
  it.each(
    [...MARKDOWN_PAGES.map((p) => p.description), ...MARKDOWN_PAGES.map((p) => ("installNote" in p ? p.installNote : undefined))]
      .filter((s): s is string => !!s),
  )("rewrites %s without em dashes or a second colon", (description) => {
    const plain = plainDescription(description);
    expect(plain).not.toContain("—");
    expect(plain.split(": ").length - 1).toBeLessThanOrEqual(1);
  });

  it("llms-full.txt carries every page", () => {
    const full = llmsFullTxt();
    for (const page of MARKDOWN_PAGES) expect(full).toContain(docMarkdown(page.slug)!.trimEnd());
  });
});

describe("metadata", () => {
  it("gives each page its own title, canonical and Markdown alternate", () => {
    const meta = docMetadata("button");
    expect(meta.title).toBe("Button · Fluid Functionalism");
    expect(meta.alternates?.canonical).toBe("/docs/button");
    expect(meta.alternates?.types).toEqual({ "text/markdown": "/docs/button.md" });
  });

  it("refuses a slug with no doc page", () => {
    expect(() => docMetadata("nope")).toThrow();
  });
});

describe("robots.txt", () => {
  const { rules } = robots();
  const blocked = new Set(
    [rules]
      .flat()
      .filter((rule) => rule.disallow === "/")
      .flatMap((rule) => [rule.userAgent ?? []].flat()),
  );

  it.each(["ChatGPT-User", "OAI-SearchBot", "PerplexityBot", "Perplexity-User", "Claude-User", "Claude-SearchBot"])(
    "lets %s read the docs (agents acting for a person, AI search)",
    (agent) => expect(blocked.has(agent)).toBe(false),
  );

  it.each(["GPTBot", "ClaudeBot", "CCBot", "Google-Extended"])("still blocks %s (training)", (bot) =>
    expect(blocked.has(bot)).toBe(true),
  );
});
