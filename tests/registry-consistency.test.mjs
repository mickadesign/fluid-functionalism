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
import { join, posix } from "node:path";
import { describe, expect, it } from "vitest";
import { DUAL_FLAVOR_SLUGS, FLAVORED_SINGLE_SOURCE_SLUGS } from "../lib/dual-flavor-slugs.mjs";
import { BASE_URL, CUSTOM_ITEMS, FLAVORED_SINGLE_SOURCE } from "../scripts/postbuild-registry.mjs";

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

  it("the hand-maintained flavoured single-source list matches the postbuild's derivation", () => {
    // The client-side install URL reads the list (no manifest in the bundle);
    // the postbuild derives the same set from registry.json. A component
    // that gains a dual-flavour dependency must be added here, or Base UI
    // installs of it silently pull the Radix flavours.
    expect([...FLAVORED_SINGLE_SOURCE_SLUGS].sort()).toEqual([...FLAVORED_SINGLE_SOURCE].sort());
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

  it("every public docs page is listed; the skill page is navigation only", async () => {
    const { componentList, systemList, systemNavList } = await import("../lib/docs/components.ts");
    const listed = new Set([...componentList, ...systemList].map((e) => e.slug));
    const pages = readdirSync(join(ROOT, "app/docs"), { withFileTypes: true })
      .filter((e) => e.isDirectory() && existsSync(join(ROOT, "app/docs", e.name, "page.tsx")))
      .map((e) => e.name);
    // The skill page sits in the sidebar's System group but is not a
    // registry item, so it stays out of systemList (which feeds the README
    // install table and the install prompts).
    expect(pages).toContain("skill");
    expect(listed.has("skill")).toBe(false);
    expect(systemNavList.some((e) => e.slug === "skill")).toBe(true);
    for (const page of pages.filter((slug) => slug !== "skill")) {
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

/** Every per-item payload in public/r, keyed by its public/r-relative path. */
const payloads = new Map();
(function collect(dir, prefix = "") {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      collect(join(dir, entry.name), `${prefix}${entry.name}/`);
    } else if (entry.name.endsWith(".json")) {
      const data = JSON.parse(readFileSync(join(dir, entry.name), "utf-8"));
      if (!Array.isArray(data.items)) payloads.set(`${prefix}${entry.name}`, data);
    }
  }
})(join(ROOT, "public/r"));

/** Payload paths reachable from `rel` through registryDependencies URLs. */
function reachable(rel, seen = new Set()) {
  if (seen.has(rel)) return seen;
  seen.add(rel);
  const payload = payloads.get(rel);
  for (const dep of payload?.registryDependencies ?? []) {
    if (!dep.startsWith(BASE_URL)) continue; // "utils" etc. — shadcn default
    reachable(dep.slice(BASE_URL.length + 1), seen);
  }
  return seen;
}

describe("shipped CSS variables reach installers", () => {
  // Every `var(--x)` a payload's embedded source references must resolve in an
  // installer project. Valid sources of a definition, in order of checking:
  //  1. the allowlists below (things installers already have),
  //  2. an assignment inside the payload's own shipped source
  //     (`[--btn-bg:...]` arbitrary properties, `"--icon-size": ...` style objects),
  //  3. the payload's own cssVars/css,
  //  4. the cssVars/css of any item reachable through its registryDependencies
  //     chain (following the rewritten fluidfunctionalism.com URLs).
  // Anything else is a variable that renders as `unset` in installer projects.

  // 1a. Tokens every shadcn/Tailwind v4 project defines in its own globals.css
  //     (the standard shadcn base theme), plus names Tailwind itself provides:
  //     Tailwind v4 emits `--color-<name>` for every @theme color, `--spacing`
  //     and `--font-*` come from the default theme, and `--tw-*` are Tailwind's
  //     internal composition properties.
  const INSTALLER_PROVIDED = new Set([
    "--background",
    "--foreground",
    "--card",
    "--card-foreground",
    "--muted",
    "--muted-foreground",
    "--accent",
    "--accent-foreground",
    "--border",
    "--input",
    "--ring",
    "--destructive",
    "--color-accent", // Tailwind-emitted alias of the shadcn `accent` theme color
    "--spacing",
    "--font-sans",
  ]);
  // 1b. Variables the primitives set on their own nodes at runtime — they are
  //     never defined in any stylesheet.
  const RUNTIME_PROVIDED = [
    /^--radix-/, // Radix poppers publish trigger/content metrics
    /^--tw-/, // Tailwind internal custom properties
    /^--anchor-/, // Base UI popup positioning
    /^--available-/, // Base UI popup available-size
    /^--scroll-area-thumb-/, // Base UI ScrollArea thumb metrics
  ];

  /** Custom-property names defined by a payload's cssVars + css blocks. */
  function cssDefinedVars(payload) {
    const defined = new Set();
    for (const scope of Object.values(payload.cssVars ?? {})) {
      for (const key of Object.keys(scope)) defined.add(`--${key}`);
    }
    (function walk(node) {
      if (typeof node !== "object" || node === null) return;
      for (const [key, value] of Object.entries(node)) {
        if (key.startsWith("--")) defined.add(key);
        const prop = key.match(/^@property\s+(--[\w-]+)/);
        if (prop) defined.add(prop[1]);
        walk(value);
      }
    })(payload.css ?? {});
    return defined;
  }

  it.each([...payloads.keys()])("%s resolves every var(--x) its source references", (rel) => {
    const chain = [...reachable(rel)];
    const defined = new Set();
    const sources = [];
    for (const dep of chain) {
      const payload = payloads.get(dep);
      if (!payload) continue; // dangling URLs are caught by the dep-URL test above
      for (const name of cssDefinedVars(payload)) defined.add(name);
      for (const file of payload.files ?? []) sources.push(file.content ?? "");
    }
    // 2. Assignments anywhere in the chain's shipped source: `--x:` (arbitrary
    //    property syntax) or `"--x":` / `'--x':` (React style objects).
    const localAssign = /(--[\w-]+)["']?\s*:/g;
    for (const content of sources) {
      for (const m of content.matchAll(localAssign)) defined.add(m[1]);
    }

    const payload = payloads.get(rel);
    for (const file of payload.files ?? []) {
      for (const m of (file.content ?? "").matchAll(/var\(\s*(--[\w-]+)/g)) {
        const name = m[1];
        const ok =
          INSTALLER_PROVIDED.has(name) ||
          RUNTIME_PROVIDED.some((re) => re.test(name)) ||
          defined.has(name);
        expect(
          ok,
          `${rel}: ${file.path} references var(${name}) but nothing in its registryDependencies chain defines it`
        ).toBe(true);
      }
    }
  });
});

describe("shipped imports reach installers", () => {
  // Every local import in a payload's shipped source must land on a file the
  // install writes: the payload's own files plus everything its
  // registryDependencies chain installs. Files the installer's project already
  // has don't count (a stock components/ui/button.tsx would satisfy the import
  // and quietly stand in for ours), except lib/utils.ts, which the plain
  // "utils" dep installs from ui.shadcn.com.
  //
  // The shadcn CLI (4.21: resolveFilePath, transformImport,
  // resolveModuleByProbablePath) resolves an import in three steps:
  //  1. Install path: the file's `target`, else its type's folder plus the part
  //     of its path after that folder's name (or just its basename).
  //  2. Alias transform: `@/registry/<x>/lib/*` → `@/lib/*`, `.../hooks/*` →
  //     `@/hooks/*`, any other `@/registry/<x>/<name>` → `@/components/<name>`.
  //  3. The import resolves to a written file at that path (any extension, or
  //     an index file); failing that, the CLI rewrites it to a written file
  //     with the same basename. That rewrite is how every
  //     `@/components/ui/fluid-hover-highlight` import finds the
  //     registry:component at components/fluid-hover-highlight.tsx.
  // Anything else is "Cannot find module" in the installer's tsc and build.
  const EXTENSIONS = [".tsx", ".ts", ".js", ".jsx", ".css"];
  const SHADCN_DEFAULT_FILES = { utils: ["lib/utils.ts"] };
  const TYPE_DIRS = { "registry:ui": "components/ui", "registry:lib": "lib", "registry:hook": "hooks" };

  function installPath(file) {
    if (file.target) return file.target.replace(/^~\//, "");
    const dir = TYPE_DIRS[file.type] ?? "components";
    const segments = file.path.split("/");
    const at = segments.indexOf(dir.split("/").pop());
    return posix.join(dir, at === -1 ? segments.at(-1) : segments.slice(at + 1).join("/"));
  }

  function aliasTransform(spec) {
    if (!spec.startsWith("@/registry/")) return spec;
    if (/^@\/registry\/(.+)\/ui/.test(spec)) return spec.replace(/^@\/registry\/(.+)\/ui/, "@/components/ui");
    if (/^@\/registry\/(.+)\/lib\/utils$/.test(spec)) return "@/lib/utils";
    if (/^@\/registry\/(.+)\/components/.test(spec)) return spec.replace(/^@\/registry\/(.+)\/components/, "@/components");
    if (/^@\/registry\/(.+)\/lib/.test(spec)) return spec.replace(/^@\/registry\/(.+)\/lib/, "@/lib");
    if (/^@\/registry\/(.+)\/hooks/.test(spec)) return spec.replace(/^@\/registry\/(.+)\/hooks/, "@/hooks");
    return spec.replace(/^@\/registry\/[^/]+/, "@/components");
  }

  /** Whether `probable` (a project-relative path, maybe extensionless) lands on a written file. */
  function resolves(probable, written, { rewrite }) {
    const ext = posix.extname(probable);
    const stem = ext ? probable.slice(0, -ext.length) : probable;
    const exts = ext ? [ext] : EXTENSIONS;
    if (exts.some((e) => written.has(stem + e) || written.has(`${stem}/index${e}`))) return true;
    const base = posix.basename(stem);
    return rewrite && [...written].some((p) => exts.some((e) => p.endsWith(`/${base}${e}`)));
  }

  // Imports and re-exports that start a line (so JSDoc examples don't count),
  // side-effect imports, and dynamic import().
  const IMPORT =
    /^\s*(?:import|export)\s[^;"']*?\bfrom\s*["']([^"']+)["']|^\s*import\s*["']([^"']+)["']|\bimport\(\s*["']([^"']+)["']\s*\)/gm;

  // Install path (extensionless) → the item that ships it, for the hint.
  const shippedBy = new Map();
  for (const [rel, payload] of payloads) {
    if (rel.includes("/")) continue; // flat payloads carry the plain item name
    for (const file of payload.files ?? []) {
      const path = installPath(file);
      shippedBy.set(path.slice(0, path.length - posix.extname(path).length), payload.name);
    }
  }

  it.each([...payloads.keys()])("%s installs every file its source imports", (rel) => {
    const written = new Set();
    for (const dep of reachable(rel)) {
      const payload = payloads.get(dep);
      if (!payload) continue; // dangling URLs are caught by the dep-URL test above
      for (const file of payload.files ?? []) written.add(installPath(file));
      for (const name of payload.registryDependencies ?? []) {
        for (const path of SHADCN_DEFAULT_FILES[name] ?? []) written.add(path);
      }
    }

    const missing = [];
    for (const file of payloads.get(rel).files ?? []) {
      const at = installPath(file);
      for (const m of (file.content ?? "").matchAll(IMPORT)) {
        const spec = m[1] ?? m[2] ?? m[3];
        let probable;
        // Only alias imports get the CLI's same-basename rewrite.
        if (spec.startsWith("@/")) probable = aliasTransform(spec).slice(2);
        else if (spec.startsWith(".")) probable = posix.join(posix.dirname(at), spec);
        else continue; // packages: the item's `dependencies`
        if (resolves(probable, written, { rewrite: spec.startsWith("@/") })) continue;
        const item = shippedBy.get(probable);
        const hint = item ? `; add "${item}" to its registryDependencies` : "";
        missing.push(`${at} imports "${spec}", which nothing in its registryDependencies chain installs${hint}`);
      }
    }
    expect(missing, rel).toEqual([]);
  });
});

describe("shipped theme utilities reach installers", () => {
  // The var() check above can't see Tailwind theme utilities. `bg-hover` reads
  // `--color-hover` from the project's @theme, and where nothing defines it
  // Tailwind emits no rule: the class compiles to nothing, the build passes,
  // and the fill never shows. use-fluid-hover shipped that way (its
  // FluidHoverHighlight paints bg-hover) until it listed `tokens`.
  //
  // Checked: every theme key a payload ships in cssVars.theme, every @utility
  // its css adds, and every one the site's app/globals.css defines that a stock
  // shadcn theme doesn't. A payload that paints with one needs it from its own
  // cssVars/css or its registryDependencies chain. A site-only one has no item
  // to depend on yet: ship it in one first.

  // @theme colors a stock `shadcn init` writes, so they resolve anywhere.
  const STOCK_THEME = new Set(
    [
      "background", "foreground", "card", "card-foreground", "popover",
      "popover-foreground", "primary", "primary-foreground", "secondary",
      "secondary-foreground", "muted", "muted-foreground", "accent",
      "accent-foreground", "destructive", "border", "input", "ring",
    ].map((name) => `color-${name}`)
  );
  // Shipped files that name theme utilities without painting with them.
  const NOT_PAINTED = new Set([
    "registry/default/lib/utils.ts", // the type-scale roles, for tailwind-merge's font-size group
  ]);

  // Requirement keys: a theme key (`color-hover`) or `@utility <name>`.
  // Line-height companions (`text-body--line-height`) ride along with their
  // size, so they are not keys of their own.
  function payloadKeys(payload) {
    const keys = Object.keys(payload.cssVars?.theme ?? {}).filter((k) => !k.includes("--"));
    for (const k of Object.keys(payload.css ?? {})) if (k.startsWith("@utility ")) keys.push(k);
    return keys;
  }

  const shippedBy = new Map(); // key → the flat item that ships it, for the hint
  for (const [rel, payload] of payloads) {
    if (rel.includes("/")) continue;
    for (const key of payloadKeys(payload)) shippedBy.set(key, payload.name);
  }
  const siteCss = readFileSync(join(ROOT, "app/globals.css"), "utf-8");
  const siteKeys = new Set();
  for (const [, body] of siteCss.matchAll(/@theme\b[^{]*\{([^}]*)\}/g)) {
    for (const [, key] of body.matchAll(/--((?:color|shadow|text)-[\w-]+?)\s*:/g)) {
      if (!key.includes("--") && !STOCK_THEME.has(key)) siteKeys.add(key);
    }
  }
  for (const [, name] of siteCss.matchAll(/@utility\s+([\w-]+)/g)) siteKeys.add(`@utility ${name}`);

  // The class names a key produces: `color-hover` → bg-hover, text-hover,
  // border-hover, ...; `shadow-surface-1` and `text-caption` → themselves.
  // Variants (`hover:bg-hover`) and opacity modifiers (`bg-hover/50`) match.
  const COLOR_PREFIXES =
    "bg|text|border(?:-[xytrblse])?|ring|ring-offset|outline|fill|stroke|from|via|to|decoration|divide|accent|caret|shadow|inset-shadow|inset-ring|placeholder";
  function utilityPattern(key) {
    const name = key.startsWith("@utility ") ? key.slice("@utility ".length) : key;
    const color = name.match(/^color-(.+)$/);
    const classes = color ? `(?:${COLOR_PREFIXES})-${color[1]}` : name;
    return new RegExp(`(?<![\\w-])${classes}(?![\\w-])`);
  }
  const checked = [...new Set([...shippedBy.keys(), ...siteKeys])].map((key) => ({
    key,
    pattern: utilityPattern(key),
  }));

  it.each([...payloads.keys()])("%s defines every theme utility its source paints with", (rel) => {
    const defined = new Set();
    for (const dep of reachable(rel)) {
      const payload = payloads.get(dep);
      if (payload) for (const key of payloadKeys(payload)) defined.add(key);
    }

    const missing = [];
    for (const file of payloads.get(rel).files ?? []) {
      if (NOT_PAINTED.has(file.path)) continue;
      for (const { key, pattern } of checked) {
        if (defined.has(key)) continue;
        const used = (file.content ?? "").match(pattern)?.[0];
        if (!used) continue;
        const item = shippedBy.get(key);
        missing.push(
          item
            ? `${file.path} paints with ${used}, which needs "${item}" in its registryDependencies`
            : `${file.path} paints with ${used}, which only the site's app/globals.css defines`
        );
      }
    }
    expect(missing, rel).toEqual([]);
  });
});

describe("fluid hover highlight", () => {
  // The hover overlay is one component, `FluidHoverHighlight`
  // (registry/default/fluid-hover-highlight.tsx). The 2026-09-07
  // `refactor(fluid-hover)` migration emptied this list; it stays so a future
  // hand-rolled copy has to be listed here on purpose, and a listed file
  // that no longer carries one fails until it is removed.
  const HAND_ROLLED_OVERLAYS = new Set([
  ]);
  // Any session-keyed hover fill, whatever the session ref is called
  // (`sessionRef`, `suggestionSession`, a template key around either).
  const MARKER = /key=\{[^}]*[sS]ession[^}]*\}[\s\S]{0,400}?bg-hover/;

  function* registrySources(dir) {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const full = join(dir, entry.name);
      if (entry.isDirectory()) yield* registrySources(full);
      else if (entry.name.endsWith(".tsx")) yield full.slice(ROOT.length);
    }
  }

  it("no registry file hand-rolls the hover overlay outside the migration list", () => {
    for (const rel of registrySources(join(ROOT, "registry"))) {
      // The component is the one place the keyed fill is allowed to live.
      if (rel === "registry/default/fluid-hover-highlight.tsx") continue;
      const hasCopy = MARKER.test(readFileSync(join(ROOT, rel), "utf-8"));
      if (hasCopy) {
        expect(
          HAND_ROLLED_OVERLAYS.has(rel),
          `${rel} hand-rolls the hover overlay; use FluidHoverHighlight`
        ).toBe(true);
      }
    }
  });

  it("every listed file still carries the copy (drop entries as you migrate)", () => {
    for (const rel of HAND_ROLLED_OVERLAYS) {
      expect(
        MARKER.test(readFileSync(join(ROOT, rel), "utf-8")),
        `${rel} is migrated; remove it from HAND_ROLLED_OVERLAYS`
      ).toBe(true);
    }
  });
});
