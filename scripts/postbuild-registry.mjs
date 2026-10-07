/**
 * Post-build script for the shadcn registry.
 *
 * Three responsibilities:
 *
 * 1. **Rewrite `registryDependencies` from plain names to full URLs.**
 *    `shadcn build` outputs plain names (e.g. "font-weight"). When consumed via
 *    a direct URL, the shadcn CLI resolves plain names against ui.shadcn.com,
 *    which fails for our custom items.
 *
 * 2. **Emit per-namespace JSONs.** For each primitive-touching component we
 *    keep three URLs:
 *      - `r/<name>.json`        (back-compat alias of the Radix flavour)
 *      - `r/radix/<name>.json`  (explicit Radix)
 *      - `r/base/<name>.json`   (explicit Base UI)
 *    `shadcn build` only knows about flat `<name>.json` and `<name>-base.json`.
 *    This script duplicates the flat Radix file into `radix/` and moves the
 *    `-base` file into `base/`.
 *
 * 3. **Rewrite cross-component dependencies to the matching base.**
 *    Inside `r/base/dialog.json`, a dep on `button` becomes the URL of the
 *    Base flavour of button. Inside `r/radix/dialog.json` and `r/dialog.json`,
 *    it becomes the URL of the Radix flavour. Primitive-agnostic deps
 *    (Badge, Table, etc.) always resolve to the bare `r/<name>.json`.
 *
 * 4. **Emit flavoured payloads for single-source components that depend on
 *    dual-flavour components.** InputMessage, for example, has one source that
 *    imports `@/registry/radix/button`; installing it from `r/base/…` must pull
 *    the Base flavour of Button instead. For any flat item whose deps include a
 *    dual-flavour slug, this script also writes `base/<name>.json` and
 *    `radix/<name>.json` with flavour-matched dep URLs and with component
 *    imports rewritten to their installed location (`@/components/ui/<name>`),
 *    so the embedded source is flavour-neutral.
 */

import { mkdir, readdir, readFile, writeFile, rm } from "node:fs/promises";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { DUAL_FLAVOR_SLUGS } from "../lib/dual-flavor-slugs.mjs";

const REGISTRY_DIR = new URL("../public/r", import.meta.url).pathname;
export const BASE_URL = "https://www.fluidfunctionalism.com/r";

// Single source of truth lives in lib/dual-flavor-slugs.mjs.
const DUAL_FLAVOR_ITEMS = new Set(DUAL_FLAVOR_SLUGS);

// All custom items (not on the default shadcn registry). Used to decide whether
// a `registryDependencies` entry needs URL rewriting. Every entry must exist as
// an item in registry.json (enforced by tests/registry-consistency.test.mjs).
export const CUSTOM_ITEMS = new Set([
  // libs / hooks (primitive-agnostic, single source under @fluid)
  "font-weight",
  "shape-context",
  "size-context",
  "surface-context",
  "surface-classes",
  "icon-context",
  "springs",
  "sidebar-menu-grid",
  "use-fluid-hover",
  "use-merge-split",
  "use-touch-primary",
  "elevated",
  "popup",
  "omit",
  "use-keyboard-nav-gate",
  // themes (cssVars/css-only items: the elevation surface ladder and the
  // shared interaction/focus tokens)
  "surfaces",
  "tokens",
  "type-scale",
  "typography",
  // primitive-touching components (have both Radix and Base flavours)
  ...DUAL_FLAVOR_SLUGS,
  // blocks (single-source compositions over flavoured components)
  "sidebar-workspace-header",
  "sidebar-user-footer",
  "sidebar-search-field",
  "sidebar-inset-topbar",
  "dialog-sidebar",
  // primitive-agnostic UI components (single source under @fluid)
  "badge",
  "banner",
  "carousel-dots",
  "chat-message",
  "color-picker",
  "command-menu",
  "dropdown",
  "file-thumbnail",
  "input-copy",
  "input-group",
  "input-message",
  "select",
  "table",
  "tabs-subtle",
  "thinking-indicator",
  "thinking-steps",
]);

/**
 * Single-source items that themselves depend on a dual-flavour component.
 * They get `base/` and `radix/` payload variants emitted below, so a
 * flavoured consumer must reference the matching variant — otherwise a Base
 * install of e.g. `sidebar-app` would drag the Radix sidebar in through the
 * flat URL. Derived from registry.json so the set can never drift from what
 * the emit loop actually clones.
 */
const REGISTRY_MANIFEST = JSON.parse(
  readFileSync(new URL("../registry.json", import.meta.url), "utf-8")
);
export const FLAVORED_SINGLE_SOURCE = new Set(
  REGISTRY_MANIFEST.items
    .filter(
      (i) =>
        typeof i.name === "string" &&
        !i.name.endsWith("-base") &&
        !DUAL_FLAVOR_ITEMS.has(i.name) &&
        (i.registryDependencies ?? []).some((d) => DUAL_FLAVOR_ITEMS.has(d))
    )
    .map((i) => i.name)
);

/**
 * Build the URL for a dependency, given the consuming flavour.
 *  - For dual-flavour deps (and single-source deps that carry flavoured
 *    variants): pick the matching flavour subpath.
 *  - For primitive-agnostic deps: always bare `r/<dep>.json`.
 *  - "utils" stays plain (resolves from default shadcn registry).
 */
export function depUrl(dep, flavor /* 'flat' | 'radix' | 'base' */) {
  if (!CUSTOM_ITEMS.has(dep)) return dep; // e.g. "utils"
  if (DUAL_FLAVOR_ITEMS.has(dep) || FLAVORED_SINGLE_SOURCE.has(dep)) {
    if (flavor === "base") return `${BASE_URL}/base/${dep}.json`;
    if (flavor === "radix") return `${BASE_URL}/radix/${dep}.json`;
    return `${BASE_URL}/${dep}.json`; // flat / back-compat
  }
  return `${BASE_URL}/${dep}.json`;
}

function rewriteDeps(item, flavor) {
  if (Array.isArray(item.registryDependencies)) {
    item.registryDependencies = item.registryDependencies.map((dep) => depUrl(dep, flavor));
  }
}

/**
 * Rewrite a single-source file's component imports to their installed
 * location. `@/registry/radix/button`, `@/registry/base/button`, and
 * `@/registry/default/file-thumbnail` all install to `@/components/ui/*`, so
 * the flavoured payload embeds a flavour-neutral source and lets
 * `registryDependencies` decide which flavour of the dep gets installed.
 * Lib/hook imports (`@/registry/default/lib/*`, `.../hooks/*`) are left for
 * the shadcn CLI's own alias mapping.
 */
export function neutralizeComponentImports(content) {
  return content.replace(
    /@\/registry\/(?:default|radix|base)\/(?!lib\/|hooks\/)/g,
    "@/components/ui/"
  );
}

/** Pick the right flavour to use when rewriting an individual item. */
export function flavorForItem(item) {
  return typeof item.name === "string" && item.name.endsWith("-base") ? "base" : "flat";
}

async function readJson(path) {
  return JSON.parse(await readFile(path, "utf-8"));
}

async function writeJson(path, data) {
  await writeFile(path, JSON.stringify(data, null, 2) + "\n");
}

export async function processRegistry(registryDir = REGISTRY_DIR) {
  const radixDir = join(registryDir, "radix");
  const baseDir = join(registryDir, "base");
  await mkdir(radixDir, { recursive: true });
  await mkdir(baseDir, { recursive: true });

  const files = await readdir(registryDir);

  for (const file of files.filter((f) => f.endsWith(".json"))) {
    const filePath = join(registryDir, file);
    const data = await readJson(filePath);
    const isBaseFile = file.endsWith("-base.json");
    const baseName = file.replace(/-base\.json$/, ".json").replace(/\.json$/, "");

    // Top-level registry index file (`registry.json` mirror) — rewrite each
    // item's deps using the flavour matching that item's name. `dialog-base`
    // entries get base/* URLs; everything else gets back-compat URLs.
    if (Array.isArray(data.items)) {
      for (const item of data.items) rewriteDeps(item, flavorForItem(item));
      await writeJson(filePath, data);
      console.log(`  ✓ ${file} (index)`);
      continue;
    }

    // Per-item file
    if (isBaseFile) {
      // Move <name>-base.json → base/<name>.json with base-flavoured deps.
      rewriteDeps(data, "base");
      // Strip the "-base" suffix from the registry item name so installs work.
      data.name = baseName;
      await writeJson(join(baseDir, `${baseName}.json`), data);
      await rm(filePath);
      console.log(`  ✓ base/${baseName}.json`);
    } else {
      // For dual-flavour items, clone before the flat rewrite: depUrl only
      // rewrites plain names, so a copy taken after the rewrite would keep the
      // flat URLs instead of getting radix/* ones.
      const radixCopy = DUAL_FLAVOR_ITEMS.has(baseName)
        ? JSON.parse(JSON.stringify(data))
        : null;

      // Single-source item that depends on dual-flavour components (e.g.
      // InputMessage → Button/Tooltip): clone before the flat rewrite too, so
      // base/ and radix/ variants below can pick flavour-matched dep URLs.
      // Clone when the manifest says so, or when this payload's own deps
      // include a dual-flavour slug (keeps the pipeline testable against
      // synthetic fixtures that aren't in registry.json).
      const flavourClone =
        !DUAL_FLAVOR_ITEMS.has(baseName) &&
        (FLAVORED_SINGLE_SOURCE.has(baseName) ||
          (Array.isArray(data.registryDependencies) &&
            data.registryDependencies.some((dep) => DUAL_FLAVOR_ITEMS.has(dep))))
          ? JSON.parse(JSON.stringify(data))
          : null;

      // Flat file: rewrite deps as "flat" (back-compat URLs).
      rewriteDeps(data, "flat");
      await writeJson(filePath, data);
      console.log(`  ✓ ${file}`);

      // Also emit radix/<name>.json with radix URLs.
      if (radixCopy) {
        rewriteDeps(radixCopy, "radix");
        await writeJson(join(radixDir, `${baseName}.json`), radixCopy);
        console.log(`  ✓ radix/${baseName}.json`);
      }

      // Emit both flavoured variants of a single-source item with dual deps.
      if (flavourClone) {
        for (const flavor of ["base", "radix"]) {
          const copy = JSON.parse(JSON.stringify(flavourClone));
          rewriteDeps(copy, flavor);
          for (const f of copy.files ?? []) {
            if (typeof f.content === "string") {
              f.content = neutralizeComponentImports(f.content);
            }
          }
          const outDir = flavor === "base" ? baseDir : radixDir;
          await writeJson(join(outDir, `${baseName}.json`), copy);
          console.log(`  ✓ ${flavor}/${baseName}.json`);
        }
      }
    }
  }
}

// Run only when invoked directly (`node scripts/postbuild-registry.mjs`), so
// tests can import the functions above without triggering a build pass.
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  processRegistry().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
