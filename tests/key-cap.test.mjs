/**
 * A keystroke looks the same everywhere on the site and in the registry:
 * KeyCap (registry/default/lib/key-cap.tsx), a filled cap with no outline.
 * It is the only file that draws a <kbd>, so no page or component can grow a
 * second look. The shadcn originals on /compare are not ours and are skipped.
 */
import { readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = new URL("..", import.meta.url).pathname;
const DIRS = ["app", "components", "lib", "registry"];
const KEY_CAP = "registry/default/lib/key-cap.tsx";
const SKIP = [KEY_CAP, "components/shadcn/", "lib/docs/prompt-entries.ts"];

function sourceFiles(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return sourceFiles(path);
    return /\.(tsx|ts)$/.test(entry.name) ? [path] : [];
  });
}

describe("KeyCap", () => {
  const source = readFileSync(join(ROOT, KEY_CAP), "utf-8");

  it("is a filled cap with no outline", () => {
    expect(source).toContain("bg-foreground/[0.08]");
    expect(source).toContain("bg-background/15");
    expect(source).not.toMatch(/\bborder\b/);
  });
});

describe("one key cap", () => {
  const raw = DIRS.flatMap((dir) => sourceFiles(join(ROOT, dir)))
    .map((path) => relative(ROOT, path))
    .filter((path) => !SKIP.some((skip) => path.startsWith(skip)))
    .flatMap((path) =>
      readFileSync(join(ROOT, path), "utf-8")
        .split("\n")
        .flatMap((line, i) => (line.includes("<kbd") ? [`${path}:${i + 1}`] : []))
    );

  it("no file draws its own <kbd>", () => {
    expect(raw).toEqual([]);
  });
});
