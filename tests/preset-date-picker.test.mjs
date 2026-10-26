// Date picker preset guards, modeled on preset-dropdown: round-trip integrity,
// the shadcn-style compat rules (defaults at index 0, < 53 bits), a golden
// code, and a compile guard — generated files are injected as virtual files
// into a REAL TypeScript program over the project's tsconfig and must
// produce zero diagnostics.
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import ts from "typescript";
import { createPresetTypechecker } from "./helpers/preset-typecheck.mjs";
import {
  encodeDatePickerPreset,
  decodeDatePickerPreset,
  DATE_PICKER_DEFAULT_CODE,
  DATE_PICKER_PRESET_FIELDS,
  DEFAULT_DATE_PICKER_PRESET,
} from "../lib/preset/date-picker-options.ts";
import { totalBits } from "../lib/preset/codec.ts";
import {
  generateDatePickerPresetFiles,
  datePickerPresetRegistryDeps,
} from "../lib/preset/date-picker-install.ts";

// Deterministic PRNG (mulberry32) — seeded, so failures reproduce.
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

function randomPreset(rand) {
  const p = {};
  for (const f of DATE_PICKER_PRESET_FIELDS) {
    p[f.key] = f.values[Math.floor(rand() * f.values.length)];
  }
  return p;
}

describe("date picker preset codec", () => {
  it("stays under 53 bits", () => {
    expect(totalBits(DATE_PICKER_PRESET_FIELDS)).toBeLessThan(53);
  });

  it("every field's default sits at index 0", () => {
    for (const f of DATE_PICKER_PRESET_FIELDS) {
      expect(f.values[0], `field "${f.key}" default must be values[0]`).toEqual(
        DEFAULT_DATE_PICKER_PRESET[f.key]
      );
    }
  });

  it("every field allocates enough bits for its values", () => {
    for (const f of DATE_PICKER_PRESET_FIELDS) {
      expect(2 ** f.bits, `field "${f.key}"`).toBeGreaterThanOrEqual(
        f.values.length
      );
    }
  });

  it("the three globals fields sit LAST, matching the sidebar's layout", () => {
    const tail = DATE_PICKER_PRESET_FIELDS.slice(-3).map((f) => [f.key, f.bits]);
    expect(tail).toEqual([
      ["flavor", 3],
      ["shape", 2],
      ["size", 2],
    ]);
  });

  it("the all-defaults code decodes to the defaults", () => {
    const res = decodeDatePickerPreset(DATE_PICKER_DEFAULT_CODE);
    expect(res.ok).toBe(true);
    expect(res.preset).toEqual(DEFAULT_DATE_PICKER_PRESET);
  });

  it("round-trips 300 random presets exactly", () => {
    const rand = rng(1234);
    for (let i = 0; i < 300; i++) {
      const p = randomPreset(rand);
      const res = decodeDatePickerPreset(encodeDatePickerPreset(p));
      expect(res.ok).toBe(true);
      expect(res.preset, `seed iteration ${i}`).toEqual({
        ...DEFAULT_DATE_PICKER_PRESET,
        ...p,
      });
    }
  });

  it("rejects garbage and other components' codes without throwing", () => {
    for (const bad of ["", "p", "xz99", "pZ!!!", "pa" + "z".repeat(40), "dc0"]) {
      const res = decodeDatePickerPreset(bad);
      expect(res.ok).toBe(false);
      expect(typeof res.error).toBe("string");
    }
  });

  // Golden: if this fails, a value array was reordered or a field inserted
  // mid-table — that breaks every code in the wild. Append instead.
  it("golden code for a fixed non-default preset is stable", () => {
    const code = encodeDatePickerPreset({
      variant: "outline",
      mode: "range",
      presets: true,
      orientation: "vertical",
      days: "booked",
      pickerSize: "compact",
      clearable: false,
      flavor: "base",
    });
    const back = decodeDatePickerPreset(code);
    expect(back.ok).toBe(true);
    expect(back.preset.pickerSize).toBe("compact");
    expect(back.preset.flavor).toBe("base");
    // Pin the literal string — update ONLY on a deliberate version bump.
    expect(code).toMatchInlineSnapshot(`"pamoiL"`);
  });
});

// ── Install generator: compile guard ────────────────────────────────────────

const typecheck = createPresetTypechecker();

function typecheckPreset(preset) {
  return typecheck(generateDatePickerPresetFiles(preset));
}

// Curated matrix: every structural branch flips at least once — both
// designs and modes, each time kind with its step and clock, presets (and
// their single-mode no-op), month counts against each mode's default, each
// orientation, the calendar props, size, clearable and disabled. Flavor
// rides along: the file imports components/ui/date-picker either way.
const MATRIX = [
  {}, // all defaults: ghost, single, start → end time
  { variant: "outline", time: "none" },
  { time: "time", step: "30", clock: "12" },
  { time: "timeRange", step: "60", clock: "24", months: "1" },
  { mode: "range" },
  { mode: "range", presets: true, variant: "outline", clearable: false },
  { mode: "range", months: "1", time: "time" }, // time dropped in range mode
  { presets: true }, // presets dropped in single mode
  { orientation: "auto", weekNumbers: true },
  { orientation: "vertical", days: "booked" },
  { mode: "range", days: "booked", weekNumbers: true, presets: true },
  { pickerSize: "compact", disabled: true },
  { pickerSize: "default", variant: "outline" },
  { flavor: "base", shape: "pill", size: "compact", mode: "range", presets: true },
];

describe("date picker preset install generator", () => {
  for (const [i, partial] of MATRIX.entries()) {
    it(`matrix ${i} typechecks: ${JSON.stringify(partial)}`, () => {
      const diags = typecheckPreset({ ...DEFAULT_DATE_PICKER_PRESET, ...partial });
      expect(diags, diags.join("\n")).toEqual([]);
    });
  }

  it("fuzz: 100 random presets parse cleanly", () => {
    const rand = rng(42);
    for (let i = 0; i < 100; i++) {
      const p = { ...DEFAULT_DATE_PICKER_PRESET, ...randomPreset(rand) };
      for (const file of generateDatePickerPresetFiles(p)) {
        const sf = ts.createSourceFile(
          file.target,
          file.content,
          ts.ScriptTarget.Latest,
          true,
          file.target.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS
        );
        const errs = sf.parseDiagnostics.map((d) =>
          ts.flattenDiagnosticMessageText(d.messageText, " ")
        );
        expect(errs, `iteration ${i} ${file.target}:\n${errs.join("\n")}`).toEqual([]);
      }
    }
  });

  it("every registry dep exists as a manifest item (or is 'utils')", () => {
    const manifest = JSON.parse(
      readFileSync(new URL("../registry.json", import.meta.url), "utf-8")
    );
    const names = new Set(manifest.items.map((i) => i.name));
    const rand = rng(7);
    for (let i = 0; i < 100; i++) {
      const p = { ...DEFAULT_DATE_PICKER_PRESET, ...randomPreset(rand) };
      for (const dep of datePickerPresetRegistryDeps(p)) {
        expect(dep === "utils" || names.has(dep), `unknown dep "${dep}"`).toBe(true);
      }
    }
  });

  it("generated sources obey payload purity (no docs or repo-internal imports)", () => {
    const rand = rng(99);
    for (let i = 0; i < 100; i++) {
      const p = { ...DEFAULT_DATE_PICKER_PRESET, ...randomPreset(rand) };
      for (const file of generateDatePickerPresetFiles(p)) {
        expect(file.content).not.toContain("@/lib/docs");
        expect(file.content).not.toContain('from "@/registry/');
        expect(file.content).not.toContain("—");
      }
    }
  });
});
