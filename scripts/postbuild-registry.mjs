/**
 * Post-build script for the shadcn registry.
 *
 * `shadcn build` outputs plain names in registryDependencies (e.g. "font-weight").
 * When consumed via a direct URL, the shadcn CLI resolves plain names against
 * the default shadcn registry (ui.shadcn.com), which fails for our custom items.
 *
 * This script rewrites plain names → full URLs so dependencies resolve correctly.
 */

import { readdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

const REGISTRY_DIR = new URL("../public/r", import.meta.url).pathname;
const BASE_URL = "https://fluid-functionalism.vercel.app/r";

// Registry items that are custom (not available on the default shadcn registry).
// "utils" is intentionally omitted — shadcn's built-in utils provides the same cn().
const CUSTOM_ITEMS = new Set([
  "font-weight",
  "shape-context",
  "springs",
  "use-proximity-hover",
  "button",
  "checkbox-group",
  "dialog",
  "dropdown",
  "input-group",
  "menu-item",
  "radio-group",
  "subtle-tab",
  "switch",
  "table",
  "thinking-indicator",
]);

async function run() {
  const files = await readdir(REGISTRY_DIR);

  for (const file of files.filter((f) => f.endsWith(".json"))) {
    const filePath = join(REGISTRY_DIR, file);
    const data = JSON.parse(await readFile(filePath, "utf-8"));

    let changed = false;

    // Rewrite registryDependencies in individual item files
    if (Array.isArray(data.registryDependencies)) {
      data.registryDependencies = data.registryDependencies.map((dep) => {
        if (CUSTOM_ITEMS.has(dep)) {
          changed = true;
          return `${BASE_URL}/${dep}.json`;
        }
        return dep;
      });
    }

    // Rewrite registryDependencies inside registry.json items array
    if (Array.isArray(data.items)) {
      for (const item of data.items) {
        if (Array.isArray(item.registryDependencies)) {
          item.registryDependencies = item.registryDependencies.map((dep) => {
            if (CUSTOM_ITEMS.has(dep)) {
              changed = true;
              return `${BASE_URL}/${dep}.json`;
            }
            return dep;
          });
        }
      }
    }

    if (changed) {
      await writeFile(filePath, JSON.stringify(data, null, 2) + "\n");
      console.log(`  ✓ ${file}`);
    }
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
