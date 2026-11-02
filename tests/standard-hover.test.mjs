/**
 * Standard hover's install path: every item that pulls in fluid hover has a
 * twin under r/standard/ whose dependency chain ends at standard hover's
 * hook, and the site's install URLs and prompts point there when the Hover
 * setting is Standard.
 */
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { FLUID_HOVER_SLUGS, DUAL_FLAVOR_SLUGS, FLAVORED_SINGLE_SOURCE_SLUGS } from "../lib/dual-flavor-slugs.mjs";
import { fluidHoverClosure, standardHoverUrl, REGISTRY_BASE_URL } from "../lib/registry-urls.mjs";
import { installUrl } from "../lib/install-url.ts";
import { buildInstallPrompt } from "../lib/docs/install-prompt.ts";

const ROOT = new URL("..", import.meta.url).pathname;
const OUT = join(ROOT, "public/r");
const manifest = JSON.parse(readFileSync(join(ROOT, "registry.json"), "utf-8"));
const closure = fluidHoverClosure(manifest.items);
const read = (rel) => JSON.parse(readFileSync(join(OUT, rel), "utf-8"));

describe("fluid hover closure", () => {
  it("the hand-maintained list matches the closure derived from registry.json", () => {
    // The client-side install URL reads the list; a component that starts
    // using fluid hover must be added, or standard installs pull the glide.
    expect([...FLUID_HOVER_SLUGS].sort()).toEqual([...closure].sort());
  });

  it("rewrites only closure items, keeping the flavour path", () => {
    expect(standardHoverUrl(`${REGISTRY_BASE_URL}/base/dropdown.json`, closure)).toBe(
      `${REGISTRY_BASE_URL}/standard/base/dropdown.json`
    );
    expect(standardHoverUrl(`${REGISTRY_BASE_URL}/use-fluid-hover.json`, closure)).toBe(
      `${REGISTRY_BASE_URL}/standard/use-fluid-hover.json`
    );
    expect(standardHoverUrl(`${REGISTRY_BASE_URL}/button.json`, closure)).toBe(`${REGISTRY_BASE_URL}/button.json`);
    expect(standardHoverUrl("utils", closure)).toBe("utils");
  });
});

describe("r/standard/ output", () => {
  it("every closure item has its standard twins, flavours included", () => {
    for (const slug of closure) {
      expect(existsSync(join(OUT, "standard", `${slug}.json`)), `standard/${slug}.json`).toBe(true);
      if (DUAL_FLAVOR_SLUGS.includes(slug) || FLAVORED_SINGLE_SOURCE_SLUGS.includes(slug)) {
        for (const flavor of ["radix", "base"]) {
          expect(existsSync(join(OUT, "standard", flavor, `${slug}.json`)), `standard/${flavor}/${slug}.json`).toBe(true);
        }
      }
    }
  });

  it("no standard payload depends on a fluid hover payload", () => {
    function* walk(dir, prefix) {
      for (const entry of readdirSync(dir, { withFileTypes: true })) {
        if (entry.isDirectory()) yield* walk(join(dir, entry.name), `${prefix}${entry.name}/`);
        else yield `${prefix}${entry.name}`;
      }
    }
    for (const rel of walk(join(OUT, "standard"), "standard/")) {
      for (const dep of read(rel).registryDependencies ?? []) {
        expect(standardHoverUrl(dep, closure), `${rel} → ${dep}`).toBe(dep);
      }
    }
  });

  it("standard hover installs at fluid hover's paths, without motion", () => {
    const standard = read("standard/use-fluid-hover.json");
    const fluid = read("use-fluid-hover.json");
    expect(standard.name).toBe("use-fluid-hover");
    expect(standard.dependencies ?? []).not.toContain("motion");
    const base = (path) => path.split("/").pop();
    expect(standard.files.map((f) => [base(f.path), f.type])).toEqual(fluid.files.map((f) => [base(f.path), f.type]));
    for (const file of standard.files) expect(file.content).not.toMatch(/from "motion/);
  });

  it("standard hover exports everything the components import from fluid hover", () => {
    const sources = readdirSync(join(ROOT, "registry"), { recursive: true })
      .filter((f) => /\.tsx?$/.test(f) && !f.startsWith("standard"))
      .map((f) => readFileSync(join(ROOT, "registry", f), "utf-8"));
    const wanted = { hook: new Set(), highlight: new Set() };
    const IMPORT = /import\s+(?:type\s+)?\{([^}]*)\}\s+from\s+"@\/(hooks\/use-fluid-hover|components\/ui\/fluid-hover-highlight)"/g;
    for (const src of sources) {
      for (const m of src.matchAll(IMPORT)) {
        const into = m[2].startsWith("hooks") ? wanted.hook : wanted.highlight;
        for (const name of m[1].split(",")) {
          const clean = name.replace(/\btype\b/, "").trim().split(/\s+as\s+/)[0];
          if (clean) into.add(clean);
        }
      }
    }
    const hook = readFileSync(join(ROOT, "registry/standard/hooks/use-fluid-hover.ts"), "utf-8");
    const highlight = readFileSync(join(ROOT, "registry/standard/fluid-hover-highlight.tsx"), "utf-8");
    const exported = (src, name) => new RegExp(`export (?:function|const|interface|type) ${name}\\b`).test(src);
    for (const name of wanted.hook) expect(exported(hook, name), `hook: ${name}`).toBe(true);
    for (const name of wanted.highlight) expect(exported(highlight, name), `highlight: ${name}`).toBe(true);
  });
});

describe("install URLs and prompts", () => {
  it("standard hover points closure items at r/standard/", () => {
    expect(installUrl("dropdown", "base", "standard")).toBe(`${REGISTRY_BASE_URL}/standard/base/dropdown.json`);
    expect(installUrl("dropdown", "radix", "standard")).toBe(`${REGISTRY_BASE_URL}/standard/dropdown.json`);
    expect(installUrl("button", "base", "standard")).toBe(`${REGISTRY_BASE_URL}/base/button.json`);
    expect(installUrl("dropdown", "base")).toBe(`${REGISTRY_BASE_URL}/base/dropdown.json`);
  });

  it("the Copy prompt installs the standard twin and names the fluid one", () => {
    const prompt = buildInstallPrompt({ slug: "dropdown", base: "base", hover: "standard" });
    expect(prompt).toContain(`npx shadcn@latest add ${REGISTRY_BASE_URL}/standard/base/dropdown.json --overwrite`);
    expect(prompt).toContain(`Same API with fluid hover: ${REGISTRY_BASE_URL}/base/dropdown.json.`);
    expect(prompt).toContain(`Same API on Radix: ${REGISTRY_BASE_URL}/standard/dropdown.json.`);
    expect(buildInstallPrompt({ slug: "dropdown", base: "base" })).not.toContain("standard");
  });
});
