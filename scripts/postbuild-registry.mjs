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
 *    `-base` file into `base/`. Flavour-aware components (single source, but
 *    depending on dual-flavour primitives — see `FLAVOR_AWARE_SLUGS`) get the
 *    same three URLs, differing only in how their dual-flavour deps resolve.
 *
 * 3. **Rewrite cross-component dependencies to the matching base.**
 *    Inside `r/base/dialog.json`, a dep on `button` becomes the URL of the
 *    Base flavour of button. Inside `r/radix/dialog.json` and `r/dialog.json`,
 *    it becomes the URL of the Radix flavour. Primitive-agnostic deps
 *    (Badge, Table, etc.) always resolve to the bare `r/<name>.json`.
 */

import { mkdir, readdir, readFile, writeFile, rm } from "node:fs/promises";
import { join } from "node:path";
import { DUAL_FLAVOR_SLUGS, FLAVOR_AWARE_SLUGS } from "../lib/dual-flavor-slugs.mjs";

const REGISTRY_DIR = new URL("../public/r", import.meta.url).pathname;
const BASE_URL = "https://www.fluidfunctionalism.com/r";

// Single source of truth lives in lib/dual-flavor-slugs.mjs.
const DUAL_FLAVOR_ITEMS = new Set(DUAL_FLAVOR_SLUGS);
const FLAVOR_AWARE_ITEMS = new Set(FLAVOR_AWARE_SLUGS);

// All custom items (not on the default shadcn registry). Used to decide whether
// a `registryDependencies` entry needs URL rewriting.
const CUSTOM_ITEMS = new Set([
  // libs / hooks (primitive-agnostic, single source under @fluid)
  "font-weight",
  "shape-context",
  "surface-context",
  "surface-classes",
  "icon-context",
  "icon-map",
  "springs",
  "use-proximity-hover",
  "use-merge-split",
  "elevated",
  // themes (cssVars-only items, e.g. the elevation surface ladder)
  "surfaces",
  // primitive-touching components (have both Radix and Base flavours)
  ...DUAL_FLAVOR_SLUGS,
  // primitive-agnostic UI components (single source under @fluid)
  "badge",
  "chat-message",
  "color-picker",
  "dropdown",
  "file-thumbnail",
  "input-copy",
  "input-group",
  "menu-item",
  "select",
  "table",
  "tabs-subtle",
  "thinking-indicator",
  "thinking-steps",
]);

/**
 * Build the URL for a dependency, given the consuming flavour.
 *  - For dual-flavour deps: pick the matching flavour subpath.
 *  - For primitive-agnostic deps: always bare `r/<dep>.json`.
 *  - "utils" stays plain (resolves from default shadcn registry).
 */
function depUrl(dep, flavor /* 'flat' | 'radix' | 'base' */) {
  if (!CUSTOM_ITEMS.has(dep)) return dep; // e.g. "utils"
  if (DUAL_FLAVOR_ITEMS.has(dep) || FLAVOR_AWARE_ITEMS.has(dep)) {
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

/** Pick the right flavour to use when rewriting an individual item. */
function flavorForItem(item) {
  return typeof item.name === "string" && item.name.endsWith("-base") ? "base" : "flat";
}

async function readJson(path) {
  return JSON.parse(await readFile(path, "utf-8"));
}

async function writeJson(path, data) {
  await writeFile(path, JSON.stringify(data, null, 2) + "\n");
}

async function run() {
  const radixDir = join(REGISTRY_DIR, "radix");
  const baseDir = join(REGISTRY_DIR, "base");
  await mkdir(radixDir, { recursive: true });
  await mkdir(baseDir, { recursive: true });

  const files = await readdir(REGISTRY_DIR);

  for (const file of files.filter((f) => f.endsWith(".json"))) {
    const filePath = join(REGISTRY_DIR, file);
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
      // For dual-flavour items, also emit radix/<name>.json with radix URLs.
      // (Their base/<name>.json comes from the dedicated `-base` item above.)
      if (DUAL_FLAVOR_ITEMS.has(baseName)) {
        const radixCopy = JSON.parse(JSON.stringify(data));
        rewriteDeps(radixCopy, "radix");
        await writeJson(join(radixDir, `${baseName}.json`), radixCopy);
        console.log(`  ✓ radix/${baseName}.json`);
      }

      // Flavour-aware items share one source but depend on dual-flavour
      // components, so emit both flavours with matching dep URLs.
      if (FLAVOR_AWARE_ITEMS.has(baseName)) {
        for (const [flavor, dir] of [["radix", radixDir], ["base", baseDir]]) {
          const copy = JSON.parse(JSON.stringify(data));
          rewriteDeps(copy, flavor);
          await writeJson(join(dir, `${baseName}.json`), copy);
          console.log(`  ✓ ${flavor}/${baseName}.json`);
        }
      }

      // Flat file: rewrite deps as "flat" (back-compat URLs). Done last —
      // the per-flavour copies above need the original plain dep names.
      rewriteDeps(data, "flat");
      await writeJson(filePath, data);
      console.log(`  ✓ ${file}`);
    }
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
