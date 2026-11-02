// Writes lib/docs/google-fonts.json: every Google Fonts family, with just
// what the custom heading font needs to build a css2 URL (static weights,
// the wght and opsz axis ranges, italic-only flag) and the category the
// picker's tabs filter on. The source is the font metadata next/font ships,
// so no API key. That file is a Next internal: the shape check below fails
// loudly if an upgrade moves or reshapes it, and tests/heading-font.test.ts
// fails when the committed catalog no longer matches it. Next doesn't carry
// categories, so those come from Google's public metadata feed, the one
// network call; the test reuses the committed ones. Rerun after a Next
// upgrade:
//   npm run google-fonts
import { readFileSync, realpathSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);

export const NEXT_FONT_DATA = "next/dist/compiled/@next/font/dist/google/font-data.json";
export const CATALOG_PATH = fileURLToPath(new URL("../lib/docs/google-fonts.json", import.meta.url));

/** Next's font metadata, checked for the fields the catalog reads. */
export function readNextFontData() {
  let path;
  try {
    path = require.resolve(NEXT_FONT_DATA);
  } catch {
    throw new Error(`${NEXT_FONT_DATA} is gone: Next moved its Google font metadata. Point NEXT_FONT_DATA at the new file.`);
  }
  const data = JSON.parse(readFileSync(path, "utf-8"));
  const entries = Object.entries(data);
  const bad = entries.find(
    ([, font]) =>
      !Array.isArray(font?.weights) ||
      !Array.isArray(font?.styles) ||
      (font.axes !== undefined && !Array.isArray(font.axes))
  );
  if (entries.length < 1000 || bad) {
    throw new Error(
      `${NEXT_FONT_DATA} changed shape${bad ? ` (first odd entry: ${bad[0]})` : ""}: update generate-google-fonts.mjs.`
    );
  }
  return data;
}

export const GOOGLE_METADATA = "https://fonts.google.com/metadata/fonts";

/** Google's category names, as the catalog's one-letter codes. */
export const CATEGORY_CODES = {
  Serif: "s",
  "Sans Serif": "a",
  Display: "d",
  Handwriting: "h",
  Monospace: "m",
};

/** Family name to category code, from Google's metadata feed. */
export async function fetchCategories() {
  const res = await fetch(GOOGLE_METADATA);
  if (!res.ok) throw new Error(`${GOOGLE_METADATA} answered ${res.status}`);
  const list = (await res.json()).familyMetadataList;
  if (!Array.isArray(list) || list.length < 1000) {
    throw new Error(`${GOOGLE_METADATA} changed shape: update generate-google-fonts.mjs.`);
  }
  const categories = {};
  for (const { family, category } of list) {
    if (CATEGORY_CODES[category]) categories[family] = CATEGORY_CODES[category];
  }
  return categories;
}

/** The catalog entries, in Next's (alphabetical) order. A family Google's
 *  feed doesn't list goes without a category, which the picker files
 *  under Other. */
export function buildCatalog(data, categories) {
  return Object.entries(data).map(([name, font]) => {
    const entry = { n: name };
    if (categories[name]) entry.c = categories[name];
    const weights = font.weights.filter((w) => w !== "variable").map(Number);
    const axes = {};
    for (const axis of font.axes ?? []) {
      if (axis.tag === "wght" || axis.tag === "opsz") axes[axis.tag] = [axis.min, axis.max];
    }
    if (axes.wght) entry.a = axes;
    else if (weights.length && !(weights.length === 1 && weights[0] === 400)) entry.w = weights;
    if (!font.styles.includes("normal")) entry.i = 1;
    return entry;
  });
}

export function serializeCatalog(fonts) {
  return JSON.stringify(fonts) + "\n";
}

const isMain = process.argv[1] && realpathSync(process.argv[1]) === realpathSync(fileURLToPath(import.meta.url));
if (isMain) {
  const fonts = buildCatalog(readNextFontData(), await fetchCategories());
  writeFileSync(CATALOG_PATH, serializeCatalog(fonts));
  console.log(`Wrote ${fonts.length} families to lib/docs/google-fonts.json`);
}
