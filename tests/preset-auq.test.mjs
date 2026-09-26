// AskUserQuestions preset install guards — same shape as the other
// per-component suites: type-checked matrix through a real ts.createProgram
// over the project tsconfig, parse fuzz, payload purity. Codec-rule guards
// come free from the generic block in preset-codec.test.mjs.
import { describe, it, expect } from "vitest";
import ts from "typescript";
import { createPresetTypechecker } from "./helpers/preset-typecheck.mjs";
import {
  generateAuqPresetFiles,
  auqPresetRegistryDeps,
} from "../lib/preset/ask-user-questions-install.ts";
import {
  DEFAULT_AUQ_PRESET,
  AUQ_PRESET_FIELDS,
} from "../lib/preset/ask-user-questions-options.ts";
import { readFileSync } from "node:fs";

const typecheck = createPresetTypechecker();

function typecheckPreset(preset) {
  return typecheck(generateAuqPresetFiles(preset));
}

const MATRIX = [
  {},
  { type: "freeText", multiline: false, count: 1 },
  { type: "freeText", skippable: false },
  { layout: "stacked", chip: "left", multiSelect: true, allowOther: true },
  { count: 2, skippable: false, allowOther: true },
  { flavor: "base", shape: "pill", size: "compact" },
];

describe("AUQ preset install generator", () => {
  for (const [i, partial] of MATRIX.entries()) {
    it(`matrix ${i} typechecks: ${JSON.stringify(partial)}`, () => {
      const diags = typecheckPreset({ ...DEFAULT_AUQ_PRESET, ...partial });
      expect(diags, diags.join("\n")).toEqual([]);
    });
  }

  it("fuzz: 100 random presets parse cleanly and stay pure", () => {
    let a = 99;
    const rand = () => {
      a |= 0;
      a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
    for (let i = 0; i < 100; i++) {
      const p = { ...DEFAULT_AUQ_PRESET };
      for (const f of AUQ_PRESET_FIELDS) {
        p[f.key] = f.values[Math.floor(rand() * f.values.length)];
      }
      for (const file of generateAuqPresetFiles(p)) {
        const sf = ts.createSourceFile(
          file.target,
          file.content,
          ts.ScriptTarget.Latest,
          true,
          ts.ScriptKind.TSX
        );
        expect(sf.parseDiagnostics.length, `iteration ${i}`).toBe(0);
        expect(file.content).not.toContain("@/lib/docs");
        expect(file.content).not.toContain('from "@/registry/');
      }
    }
  });

  it("registry deps exist in the manifest", () => {
    const manifest = JSON.parse(
      readFileSync(new URL("../registry.json", import.meta.url), "utf-8")
    );
    const names = new Set(manifest.items.map((i) => i.name));
    for (const dep of auqPresetRegistryDeps(DEFAULT_AUQ_PRESET)) {
      expect(names.has(dep), `unknown dep "${dep}"`).toBe(true);
    }
  });
});
