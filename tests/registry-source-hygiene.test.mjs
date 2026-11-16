/**
 * Guards registry sources against two defects: raw control bytes and imports
 * from framer-motion. A raw NUL byte once made git treat a component as
 * binary, which hid a wrong import from review. Write control characters as
 * escapes (\u0000), and import animation APIs from "motion/react".
 */
import { readFileSync, readdirSync } from "node:fs";
import { join, relative } from "node:path";
import { describe, it, expect } from "vitest";

const ROOT = new URL("..", import.meta.url).pathname;
const REGISTRY = join(ROOT, "registry");

function walk(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) return walk(full);
    return /\.tsx?$/.test(entry.name) ? [full] : [];
  });
}

const files = walk(REGISTRY).map((f) => relative(ROOT, f)).sort();
const CONTROL = /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/;

describe("registry source hygiene", () => {
  it.each(files)("%s has no raw control bytes", (file) => {
    const lines = readFileSync(join(ROOT, file), "utf8").split("\n");
    const hit = lines.findIndex((line) => CONTROL.test(line));
    expect(hit, hit >= 0 ? `${file}:${hit + 1} contains a raw control byte` : "").toBe(-1);
  });

  it.each(files)("%s does not import from framer-motion", (file) => {
    const text = readFileSync(join(ROOT, file), "utf8");
    expect(/from\s+["']framer-motion["']/.test(text)).toBe(false);
  });
});
