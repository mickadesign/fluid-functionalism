// Calendar preset guards, modeled on preset-dropdown: round-trip integrity,
// the shadcn-style compat rules (defaults at index 0, < 53 bits), a golden
// code, and a compile guard — generated files are injected as virtual files
// into a REAL TypeScript program over the project's tsconfig and must
// produce zero diagnostics.
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import ts from "typescript";
import { createPresetTypechecker } from "./helpers/preset-typecheck.mjs";
import {
  encodeCalendarPreset,
  decodeCalendarPreset,
  CALENDAR_DEFAULT_CODE,
  CALENDAR_PRESET_FIELDS,
  DEFAULT_CALENDAR_PRESET,
} from "../lib/preset/calendar-options.ts";
import { totalBits } from "../lib/preset/codec.ts";
import {
  generateCalendarPresetFiles,
  calendarPresetRegistryDeps,
} from "../lib/preset/calendar-install.ts";

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
  for (const f of CALENDAR_PRESET_FIELDS) {
    p[f.key] = f.values[Math.floor(rand() * f.values.length)];
  }
  return p;
}

describe("calendar preset codec", () => {
  it("stays under 53 bits", () => {
    expect(totalBits(CALENDAR_PRESET_FIELDS)).toBeLessThan(53);
  });

  it("every field's default sits at index 0", () => {
    for (const f of CALENDAR_PRESET_FIELDS) {
      expect(f.values[0], `field "${f.key}" default must be values[0]`).toEqual(
        DEFAULT_CALENDAR_PRESET[f.key]
      );
    }
  });

  it("every field allocates enough bits for its values", () => {
    for (const f of CALENDAR_PRESET_FIELDS) {
      expect(2 ** f.bits, `field "${f.key}"`).toBeGreaterThanOrEqual(
        f.values.length
      );
    }
  });

  it("the three globals fields sit LAST, matching the sidebar's layout", () => {
    const tail = CALENDAR_PRESET_FIELDS.slice(-3).map((f) => [f.key, f.bits]);
    expect(tail).toEqual([
      ["flavor", 3],
      ["shape", 2],
      ["size", 2],
    ]);
  });

  it("the all-defaults code decodes to the defaults", () => {
    const res = decodeCalendarPreset(CALENDAR_DEFAULT_CODE);
    expect(res.ok).toBe(true);
    expect(res.preset).toEqual(DEFAULT_CALENDAR_PRESET);
  });

  it("round-trips 300 random presets exactly", () => {
    const rand = rng(1234);
    for (let i = 0; i < 300; i++) {
      const p = randomPreset(rand);
      const res = decodeCalendarPreset(encodeCalendarPreset(p));
      expect(res.ok).toBe(true);
      expect(res.preset, `seed iteration ${i}`).toEqual({
        ...DEFAULT_CALENDAR_PRESET,
        ...p,
      });
    }
  });

  it("rejects garbage and other components' codes without throwing", () => {
    for (const bad of ["", "n", "xz99", "nZ!!!", "na" + "z".repeat(40), "dc0"]) {
      const res = decodeCalendarPreset(bad);
      expect(res.ok).toBe(false);
      expect(typeof res.error).toBe("string");
    }
  });

  // Golden: if this fails, a value array was reordered or a field inserted
  // mid-table — that breaks every code in the wild. Append instead.
  it("golden code for a fixed non-default preset is stable", () => {
    const code = encodeCalendarPreset({
      mode: "single",
      months: "1",
      cellSize: "44",
      weekNumbers: true,
      days: "weekdays",
      flavor: "base",
    });
    const back = decodeCalendarPreset(code);
    expect(back.ok).toBe(true);
    expect(back.preset.cellSize).toBe("44");
    expect(back.preset.flavor).toBe("base");
    // Pin the literal string — update ONLY on a deliberate version bump.
    expect(code).toMatchInlineSnapshot(`"na2pZ"`);
  });
});

// ── Install generator: compile guard ────────────────────────────────────────

const typecheck = createPresetTypechecker();

function typecheckPreset(preset) {
  return typecheck(generateCalendarPresetFiles(preset));
}

// Curated matrix: every structural branch flips at least once — both modes,
// one and two months in each orientation, every cell size, week numbers,
// and each day rule.
const MATRIX = [
  {}, // all defaults: range, 2 months, auto
  { mode: "single" },
  { mode: "single", months: "1", cellSize: "40" },
  { orientation: "horizontal", cellSize: "44", weekNumbers: true },
  { orientation: "vertical", cellSize: "48" },
  { months: "1", orientation: "vertical" }, // orientation dropped at 1 month
  { days: "booked" },
  { mode: "single", days: "booked", weekNumbers: true },
  { days: "weekdays" },
  { mode: "single", days: "weekdays", months: "1" },
  { shape: "pill", size: "compact", flavor: "base", days: "booked" },
];

describe("calendar preset install generator", () => {
  for (const [i, partial] of MATRIX.entries()) {
    it(`matrix ${i} typechecks: ${JSON.stringify(partial)}`, () => {
      const diags = typecheckPreset({ ...DEFAULT_CALENDAR_PRESET, ...partial });
      expect(diags, diags.join("\n")).toEqual([]);
    });
  }

  it("fuzz: 100 random presets parse cleanly", () => {
    const rand = rng(42);
    for (let i = 0; i < 100; i++) {
      const p = { ...DEFAULT_CALENDAR_PRESET, ...randomPreset(rand) };
      for (const file of generateCalendarPresetFiles(p)) {
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
      const p = { ...DEFAULT_CALENDAR_PRESET, ...randomPreset(rand) };
      for (const dep of calendarPresetRegistryDeps(p)) {
        expect(dep === "utils" || names.has(dep), `unknown dep "${dep}"`).toBe(true);
      }
    }
  });

  it("generated sources obey payload purity (no docs or repo-internal imports)", () => {
    const rand = rng(99);
    for (let i = 0; i < 100; i++) {
      const p = { ...DEFAULT_CALENDAR_PRESET, ...randomPreset(rand) };
      for (const file of generateCalendarPresetFiles(p)) {
        expect(file.content).not.toContain("@/lib/docs");
        expect(file.content).not.toContain('from "@/registry/');
        expect(file.content).not.toContain("—");
      }
    }
  });
});
