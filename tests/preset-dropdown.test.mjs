// Dropdown preset guards, modeled on preset-codec + preset-install: round-trip
// integrity, the shadcn-style compat rules (defaults at index 0, < 53 bits),
// a golden code, and a compile guard — generated files are injected as
// virtual files into a REAL TypeScript program over the project's tsconfig
// and must produce zero diagnostics.
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import ts from "typescript";
import { createPresetTypechecker } from "./helpers/preset-typecheck.mjs";
import {
  encodeDropdownPreset,
  decodeDropdownPreset,
  DROPDOWN_DEFAULT_CODE,
  DROPDOWN_PRESET_FIELDS,
  DEFAULT_DROPDOWN_PRESET,
} from "../lib/preset/dropdown-options.ts";
import { totalBits } from "../lib/preset/codec.ts";
import {
  generateDropdownPresetFiles,
  dropdownPresetRegistryDeps,
} from "../lib/preset/dropdown-install.ts";

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
  for (const f of DROPDOWN_PRESET_FIELDS) {
    p[f.key] = f.values[Math.floor(rand() * f.values.length)];
  }
  return p;
}

describe("dropdown preset codec", () => {
  it("stays under 53 bits", () => {
    expect(totalBits(DROPDOWN_PRESET_FIELDS)).toBeLessThan(53);
  });

  it("every field's default sits at index 0", () => {
    for (const f of DROPDOWN_PRESET_FIELDS) {
      expect(f.values[0], `field "${f.key}" default must be values[0]`).toEqual(
        DEFAULT_DROPDOWN_PRESET[f.key]
      );
    }
  });

  it("every field allocates enough bits for its values", () => {
    for (const f of DROPDOWN_PRESET_FIELDS) {
      expect(2 ** f.bits, `field "${f.key}"`).toBeGreaterThanOrEqual(
        f.values.length
      );
    }
  });

  it("the three globals fields sit LAST, matching the sidebar's layout", () => {
    const tail = DROPDOWN_PRESET_FIELDS.slice(-3).map((f) => [f.key, f.bits]);
    expect(tail).toEqual([
      ["flavor", 3],
      ["shape", 2],
      ["size", 2],
    ]);
  });

  it("the all-defaults code decodes to the defaults", () => {
    const res = decodeDropdownPreset(DROPDOWN_DEFAULT_CODE);
    expect(res.ok).toBe(true);
    expect(res.preset).toEqual(DEFAULT_DROPDOWN_PRESET);
  });

  it("round-trips 300 random presets exactly", () => {
    const rand = rng(1234);
    for (let i = 0; i < 300; i++) {
      const p = randomPreset(rand);
      const res = decodeDropdownPreset(encodeDropdownPreset(p));
      expect(res.ok).toBe(true);
      expect(res.preset, `seed iteration ${i}`).toEqual({
        ...DEFAULT_DROPDOWN_PRESET,
        ...p,
      });
    }
  });

  it("rejects garbage without throwing", () => {
    for (const bad of ["", "d", "xz99", "dZ!!!", "da" + "z".repeat(40)]) {
      const res = decodeDropdownPreset(bad);
      expect(res.ok).toBe(false);
      expect(typeof res.error).toBe("string");
    }
  });

  // Golden: if this fails, a value array was reordered or a field inserted
  // mid-table — that breaks every code in the wild. Append instead.
  it("golden code for a fixed non-default preset is stable", () => {
    const code = encodeDropdownPreset({
      mode: "inline",
      selection: "multiple",
      groups: true,
      disabledRow: true,
      flavor: "base",
    });
    const back = decodeDropdownPreset(code);
    expect(back.ok).toBe(true);
    expect(back.preset.selection).toBe("multiple");
    expect(back.preset.flavor).toBe("base");
    // Pin the literal string — update ONLY on a deliberate version bump.
    expect(code).toMatchInlineSnapshot(`"dbBR"`);
  });

  // Version "a" codes were published before creatable joined the table;
  // they must keep decoding, with the new field at its default.
  it("a version-a code still decodes", () => {
    const back = decodeDropdownPreset("da7J");
    expect(back.ok).toBe(true);
    expect(back.version).toBe("a");
    expect(back.preset).toEqual({
      ...DEFAULT_DROPDOWN_PRESET,
      mode: "inline",
      selection: "multiple",
      groups: true,
      disabledRow: true,
      flavor: "base",
    });
  });
});

// ── Install generator: compile guard ────────────────────────────────────────

const typecheck = createPresetTypechecker();

function typecheckPreset(preset) {
  return typecheck(generateDropdownPresetFiles(preset));
}

// Curated matrix: every structural branch flips at least once — each media
// kind, both orientations (with and without the inline button reversal),
// every column count, selection mode, borders/separated/fluid hover, and the
// no-description / no-button extremes.
// Curated matrix: every structural branch flips at least once — both modes,
// each selection model, search (with the groups/search exclusion), icons
// off, groups, and the disabled row.
const MATRIX = [
  {}, // all defaults: menu, single, icons
  { selection: "multiple", search: true },
  { selection: "none", icons: false },
  { groups: true, disabledRow: true },
  { groups: true, search: true }, // search wins over groups
  { mode: "inline", selection: "multiple", groups: true },
  { mode: "inline", selection: "none", icons: false, disabledRow: true },
  { mode: "inline", search: true }, // search ignored inline
  { selection: "multiple", icons: false, search: true, disabledRow: true },
  { shape: "pill", size: "compact", flavor: "base", groups: true },
  { search: true, creatable: true },
  { selection: "multiple", search: true, creatable: true, icons: false },
  { selection: "none", search: true, creatable: true, disabledRow: true },
  { creatable: true }, // derived off: no search
  { mode: "inline", search: true, creatable: true }, // derived off: inline
];

describe("dropdown preset install generator", () => {
  for (const [i, partial] of MATRIX.entries()) {
    it(`matrix ${i} typechecks: ${JSON.stringify(partial)}`, () => {
      const diags = typecheckPreset({ ...DEFAULT_DROPDOWN_PRESET, ...partial });
      expect(diags, diags.join("\n")).toEqual([]);
    });
  }

  it("fuzz: 100 random presets parse cleanly", () => {
    const rand = rng(42);
    for (let i = 0; i < 100; i++) {
      const p = { ...DEFAULT_DROPDOWN_PRESET, ...randomPreset(rand) };
      for (const file of generateDropdownPresetFiles(p)) {
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
      const p = { ...DEFAULT_DROPDOWN_PRESET, ...randomPreset(rand) };
      for (const dep of dropdownPresetRegistryDeps(p)) {
        expect(dep === "utils" || names.has(dep), `unknown dep "${dep}"`).toBe(true);
      }
    }
  });

  it("generated sources obey payload purity (no docs or repo-internal imports)", () => {
    const rand = rng(99);
    for (let i = 0; i < 100; i++) {
      const p = { ...DEFAULT_DROPDOWN_PRESET, ...randomPreset(rand) };
      for (const file of generateDropdownPresetFiles(p)) {
        expect(file.content).not.toContain("@/lib/docs");
        expect(file.content).not.toContain('from "@/registry/');
      }
    }
  });
});
