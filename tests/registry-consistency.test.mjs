/**
 * Consistency checks across the hand-maintained lists that must stay in sync:
 *
 *  - lib/dual-flavor-slugs.mjs        (which components have two flavours)
 *  - scripts/postbuild-registry.mjs   (CUSTOM_ITEMS — deps that get URL-rewritten)
 *  - registry.json                    (the shadcn build input)
 *  - registry/{radix,base}/*.tsx      (the per-flavour sources)
 *  - app/docs/<slug>/page.tsx         (the docs routes)
 *  - public/r/**.json                 (the committed build output users install from)
 *
 * These lists drift silently — a forgotten entry breaks `npx shadcn add` for
 * external users without any build error. Each test names the invariant it
 * guards so a failure reads as "you forgot X", not "the test is wrong".
 */
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { DUAL_FLAVOR_SLUGS } from "../lib/dual-flavor-slugs.mjs";
import { BASE_URL, CUSTOM_ITEMS } from "../scripts/postbuild-registry.mjs";

const ROOT = new URL("..", import.meta.url).pathname;
const registry = JSON.parse(readFileSync(join(ROOT, "registry.json"), "utf-8"));
const itemNames = new Set(registry.items.map((item) => item.name));

// Deps that intentionally stay plain names and resolve from the default
// shadcn registry (ui.shadcn.com) instead of being URL-rewritten.
const SHADCN_DEFAULT_DEPS = new Set(["utils"]);

describe("dual-flavour slugs", () => {
  it.each(DUAL_FLAVOR_SLUGS)("%s has a Radix and a Base UI source file", (slug) => {
    expect(existsSync(join(ROOT, "registry/radix", `${slug}.tsx`))).toBe(true);
    expect(existsSync(join(ROOT, "registry/base", `${slug}.tsx`))).toBe(true);
  });

  it.each(DUAL_FLAVOR_SLUGS)("%s has both <slug> and <slug>-base items in registry.json", (slug) => {
    expect(itemNames.has(slug)).toBe(true);
    expect(itemNames.has(`${slug}-base`)).toBe(true);
  });

  it("every -base item in registry.json is a declared dual-flavour slug", () => {
    const baseItems = [...itemNames]
      .filter((name) => name.endsWith("-base"))
      .map((name) => name.replace(/-base$/, ""));
    expect(baseItems.sort()).toEqual([...DUAL_FLAVOR_SLUGS].sort());
  });
});

describe("registry.json", () => {
  it("every file an item ships actually exists on disk", () => {
    for (const item of registry.items) {
      for (const file of item.files ?? []) {
        expect(existsSync(join(ROOT, file.path)), `${item.name}: missing ${file.path}`).toBe(true);
      }
    }
  });

  it("every registryDependency is a registry item or a known shadcn default", () => {
    for (const item of registry.items) {
      for (const dep of item.registryDependencies ?? []) {
        const known = itemNames.has(dep) || SHADCN_DEFAULT_DEPS.has(dep);
        expect(known, `${item.name} depends on unknown item "${dep}"`).toBe(true);
      }
    }
  });

  it("every custom dep the postbuild script would URL-rewrite exists as an item", () => {
    // A CUSTOM_ITEMS entry with no matching item rewrites deps to a URL that
    // 404s; an item missing from CUSTOM_ITEMS ships a plain name the shadcn
    // CLI resolves against ui.shadcn.com and fails to find.
    for (const name of CUSTOM_ITEMS) {
      expect(itemNames.has(name), `CUSTOM_ITEMS entry "${name}" has no registry.json item`).toBe(true);
    }
  });

  it("every custom dep actually referenced by an item is listed in CUSTOM_ITEMS", () => {
    for (const item of registry.items) {
      for (const dep of item.registryDependencies ?? []) {
        if (SHADCN_DEFAULT_DEPS.has(dep)) continue;
        expect(
          CUSTOM_ITEMS.has(dep),
          `${item.name} depends on "${dep}", which postbuild would leave as a plain name`
        ).toBe(true);
      }
    }
  });
});

describe("docs pages", () => {
  // Lazily import the docs list: lib/docs/components.ts is TypeScript, which
  // vitest transforms on the fly.
  it("every component and system entry has a docs page", async () => {
    const { componentList, systemList } = await import("../lib/docs/components.ts");
    for (const entry of [...componentList, ...systemList]) {
      expect(
        existsSync(join(ROOT, "app/docs", entry.slug, "page.tsx")),
        `docs entry "${entry.slug}" has no app/docs/${entry.slug}/page.tsx`
      ).toBe(true);
    }
  });

  it("every docs page is listed in componentList or systemList (no orphan pages)", async () => {
    const { componentList, systemList } = await import("../lib/docs/components.ts");
    const listed = new Set([...componentList, ...systemList].map((e) => e.slug));
    const pages = readdirSync(join(ROOT, "app/docs"), { withFileTypes: true })
      .filter((e) => e.isDirectory() && existsSync(join(ROOT, "app/docs", e.name, "page.tsx")))
      .map((e) => e.name);
    for (const page of pages) {
      expect(listed.has(page), `app/docs/${page} is not in componentList/systemList`).toBe(true);
    }
  });
});

describe("committed build output (public/r)", () => {
  const outDir = join(ROOT, "public/r");

  function* outputFiles(dir, prefix = "") {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      if (entry.isDirectory()) yield* outputFiles(join(dir, entry.name), `${prefix}${entry.name}/`);
      else if (entry.name.endsWith(".json")) yield `${prefix}${entry.name}`;
    }
  }

  it("every fluidfunctionalism.com dep URL points at a file that exists in public/r", () => {
    // This validates the artifact users actually install from: a dangling URL
    // here is a guaranteed `npx shadcn add` failure regardless of how it got in.
    for (const rel of outputFiles(outDir)) {
      const data = JSON.parse(readFileSync(join(outDir, rel), "utf-8"));
      const items = Array.isArray(data.items) ? data.items : [data];
      for (const item of items) {
        for (const dep of item.registryDependencies ?? []) {
          if (!dep.startsWith(BASE_URL)) continue;
          const target = dep.slice(BASE_URL.length + 1);
          expect(
            existsSync(join(outDir, target)),
            `${rel}: dep "${dep}" has no public/r/${target}`
          ).toBe(true);
        }
      }
    }
  });

  it("every dual-flavour slug has flat, radix/, and base/ output files", () => {
    for (const slug of DUAL_FLAVOR_SLUGS) {
      for (const rel of [`${slug}.json`, `radix/${slug}.json`, `base/${slug}.json`]) {
        expect(existsSync(join(outDir, rel)), `missing public/r/${rel}`).toBe(true);
      }
    }
  });

  it("no stray <name>-base.json files remain at the top level", () => {
    const strays = readdirSync(outDir).filter((f) => f.endsWith("-base.json"));
    expect(strays).toEqual([]);
  });
});
