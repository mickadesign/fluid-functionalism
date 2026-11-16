// The Copy prompt names a preset's files from a light outline, not from the
// generators: the DataTable generator carries the whole API reference and
// two source files as text, which every docs page would otherwise download.
// Two guards: each outline says what its generator writes, and nothing the
// prompt imports reaches the heavy modules.
import { describe, it, expect } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { PRESET_GENERATORS } from "../lib/preset/generators.ts";
import { PRESET_OUTLINES, outlineOf } from "../lib/preset/outlines.ts";
import { getAllPresetComponents, encodePreset, decodePreset } from "../lib/preset/codec.ts";

const root = path.dirname(fileURLToPath(new URL("../package.json", import.meta.url)));

function rng(seed) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

describe("preset outlines", () => {
  it("every installable preset has an outline", () => {
    for (const def of getAllPresetComponents()) {
      if (!def.installable) continue;
      expect(PRESET_OUTLINES[def.tag], def.label).toBeTypeOf("function");
      expect(PRESET_GENERATORS[def.tag], def.label).toBeDefined();
    }
  });

  it("an outline lists the files its generator writes, with their exports and helpers", () => {
    const rand = rng(11);
    for (const def of getAllPresetComponents()) {
      if (!def.installable) continue;
      for (let i = 0; i < 40; i++) {
        const config = {};
        for (const field of def.versions[def.currentVersion]) config[field.key] = field.values[Math.floor(rand() * field.values.length)];
        const decoded = decodePreset(encodePreset(def, i === 0 ? {} : config));
        const fromGenerator = outlineOf(PRESET_GENERATORS[def.tag], decoded.preset);
        expect(PRESET_OUTLINES[def.tag](decoded.preset), `${def.label} ${JSON.stringify(decoded.preset)}`).toEqual(fromGenerator);
      }
    }
  });
});

// ── What the prompt pulls into the browser ──────────────────────────────────

/** A module's imports, resolved to files of this repo. */
function importsOf(file) {
  const source = readFileSync(file, "utf8");
  const specs = [...source.matchAll(/(?:import|export)\s[^;]*?from\s+"([^"]+)"/g)].map((m) => m[1]);
  return specs.flatMap((spec) => {
    const base = spec.startsWith("@/") ? path.join(root, spec.slice(2)) : spec.startsWith(".") ? path.resolve(path.dirname(file), spec) : null;
    if (!base) return [];
    const found = [base, `${base}.ts`, `${base}.tsx`, `${base}.mjs`, path.join(base, "index.ts"), path.join(base, "index.tsx")].find(
      (candidate) => existsSync(candidate) && !candidate.endsWith(path.sep) && path.extname(candidate) !== ""
    );
    return found ? [found] : [];
  });
}

function closure(entry) {
  const seen = new Set();
  const queue = [path.join(root, entry)];
  while (queue.length) {
    const file = queue.pop();
    if (seen.has(file)) continue;
    seen.add(file);
    queue.push(...importsOf(file));
  }
  return [...seen].map((file) => path.relative(root, file));
}

describe("the Copy prompt stays light", () => {
  it("lib/docs/install-prompt.ts never reaches the DataTable generator or its data", () => {
    const reached = closure("lib/docs/install-prompt.ts");
    // It does reach the light generators: the walk works.
    expect(reached).toContain("lib/preset/light-generators.ts");
    for (const heavy of [
      "lib/preset/generators.ts",
      "lib/preset/data-table-install.ts",
      "lib/preset/data-table-sources.generated.ts",
      "lib/docs/playgrounds/data-table-rows.ts",
      "lib/docs/api/index.ts",
    ]) {
      expect(reached, `${heavy} is in the Copy prompt's imports`).not.toContain(heavy);
    }
  });
});
