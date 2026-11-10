// DataTable preset guards, modeled on preset-dropdown: round-trip integrity,
// the shadcn-style compat rules (defaults at index 0, < 53 bits), a golden
// code, and a compile guard — generated files are injected as virtual files
// into a REAL TypeScript program over the project's tsconfig and must
// produce zero diagnostics.
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import ts from "typescript";
import { createPresetTypechecker } from "./helpers/preset-typecheck.mjs";
import {
  encodeDataTablePreset,
  decodeDataTablePreset,
  DATA_TABLE_DEFAULT_CODE,
  DATA_TABLE_PRESET_FIELDS,
  DEFAULT_DATA_TABLE_PRESET,
} from "../lib/preset/data-table-options.ts";
import { totalBits } from "../lib/preset/codec.ts";
import {
  generateDataTablePresetFiles,
  dataTablePresetRegistryDeps,
} from "../lib/preset/data-table-install.ts";

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
  for (const f of DATA_TABLE_PRESET_FIELDS) {
    p[f.key] = f.values[Math.floor(rand() * f.values.length)];
  }
  return p;
}

describe("data table preset codec", () => {
  it("stays under 53 bits", () => {
    expect(totalBits(DATA_TABLE_PRESET_FIELDS)).toBeLessThan(53);
  });

  it("every field's default sits at index 0", () => {
    for (const f of DATA_TABLE_PRESET_FIELDS) {
      expect(f.values[0], `field "${f.key}" default must be values[0]`).toEqual(
        DEFAULT_DATA_TABLE_PRESET[f.key]
      );
    }
  });

  it("every field allocates enough bits for its values", () => {
    for (const f of DATA_TABLE_PRESET_FIELDS) {
      expect(2 ** f.bits, `field "${f.key}"`).toBeGreaterThanOrEqual(
        f.values.length
      );
    }
  });

  it("the three globals fields sit LAST, matching the sidebar's layout", () => {
    const tail = DATA_TABLE_PRESET_FIELDS.slice(-3).map((f) => [f.key, f.bits]);
    expect(tail).toEqual([
      ["flavor", 3],
      ["shape", 2],
      ["size", 2],
    ]);
  });

  it("the all-defaults code decodes to the defaults", () => {
    const res = decodeDataTablePreset(DATA_TABLE_DEFAULT_CODE);
    expect(res.ok).toBe(true);
    expect(res.preset).toEqual(DEFAULT_DATA_TABLE_PRESET);
  });

  it("round-trips 300 random presets exactly", () => {
    const rand = rng(1234);
    for (let i = 0; i < 300; i++) {
      const p = randomPreset(rand);
      const res = decodeDataTablePreset(encodeDataTablePreset(p));
      expect(res.ok).toBe(true);
      expect(res.preset, `seed iteration ${i}`).toEqual({
        ...DEFAULT_DATA_TABLE_PRESET,
        ...p,
      });
    }
  });

  it("rejects garbage and other components' codes without throwing", () => {
    for (const bad of ["", "t", "xz99", "tZ!!!", "ta" + "z".repeat(40), "dc0"]) {
      const res = decodeDataTablePreset(bad);
      expect(res.ok).toBe(false);
      expect(typeof res.error).toBe("string");
    }
  });

  // Golden: if this fails, a value array was reordered or a field inserted
  // mid-table — that breaks every code in the wild. Append instead.
  it("golden code for a fixed non-default preset is stable", () => {
    const code = encodeDataTablePreset({
      filter: "all",
      selection: false,
      pageSize: "20",
      lines: "wrap",
      align: "top",
      headerIcons: false,
      flavor: "base",
    });
    const back = decodeDataTablePreset(code);
    expect(back.ok).toBe(true);
    expect(back.preset.lines).toBe("wrap");
    expect(back.preset.flavor).toBe("base");
    // Pin the literal string — update ONLY on a deliberate version bump.
    expect(code).toMatchInlineSnapshot(`"te17Yv"`);
  });

  // Version "d" codes were published before filters and sticky columns.
  it("a version-d code still decodes", () => {
    const back = decodeDataTablePreset("tdIPp");
    expect(back.ok).toBe(true);
    expect(back.version).toBe("d");
    expect(back.preset).toEqual({
      ...DEFAULT_DATA_TABLE_PRESET,
      filter: "all",
      selection: false,
      pageSize: "20",
      lines: "wrap",
      align: "top",
      headerIcons: false,
      flavor: "base",
    });
    expect(back.preset.filters).toBe(false);
    expect(back.preset.pinning).toBe(true);
  });

  // Version "c" codes were published while header icons defaulted on.
  it("a version-c code still decodes", () => {
    const back = decodeDataTablePreset("tcf3h");
    expect(back.ok).toBe(true);
    expect(back.version).toBe("c");
    expect(back.preset).toEqual({
      ...DEFAULT_DATA_TABLE_PRESET,
      filter: "all",
      selection: false,
      pageSize: "20",
      lines: "wrap",
      align: "top",
      headerIcons: false,
      flavor: "base",
    });
  });

  // Version "b" codes were published before sub-rows joined the table.
  it("a version-b code still decodes", () => {
    const back = decodeDataTablePreset("tbO0f");
    expect(back.ok).toBe(true);
    expect(back.version).toBe("b");
    expect(back.preset).toEqual({
      ...DEFAULT_DATA_TABLE_PRESET,
      filter: "all",
      selection: false,
      pageSize: "20",
      lines: "wrap",
      align: "top",
      headerIcons: false,
      flavor: "base",
    });
  });

  // Version "a" codes were published before editable cells joined the
  // table; they must keep decoding, with editable at its default.
  it("a version-a code still decodes", () => {
    const back = decodeDataTablePreset("taFU9");
    expect(back.ok).toBe(true);
    expect(back.version).toBe("a");
    expect(back.preset).toEqual({
      ...DEFAULT_DATA_TABLE_PRESET,
      filter: "all",
      selection: false,
      pageSize: "20",
      lines: "wrap",
      align: "top",
      headerIcons: false,
      flavor: "base",
    });
  });
});

// ── Install generator: compile guard ────────────────────────────────────────

const typecheck = createPresetTypechecker();

function typecheckPreset(preset) {
  return typecheck(generateDataTablePresetFiles(preset));
}

// Curated matrix: every structural branch flips at least once: each search
// mode, menus and selection on and off, pagination, resizing and reordering,
// every text fit and alignment, and header icons.
const MATRIX = [
  {}, // all defaults
  { filter: "all", viewMenu: false },
  { filter: "none", viewMenu: false, selection: false, rowActions: false },
  { pagination: false, resize: false, reorder: false },
  { lines: "2", align: "top", headerIcons: false },
  { lines: "wrap", align: "center", pageSize: "5" },
  { selection: false, rowActions: true, pageSize: "20", filter: "all" },
  { shape: "pill", size: "compact", flavor: "base", headerIcons: false },
  { editable: true },
  { editable: true, headerIcons: false, selection: false, rowActions: false, pagination: false },
  { expandable: true },
  { expandable: true, editable: true, selection: false },
];

describe("data table preset install generator", () => {
  for (const [i, partial] of MATRIX.entries()) {
    it(`matrix ${i} typechecks: ${JSON.stringify(partial)}`, () => {
      const diags = typecheckPreset({ ...DEFAULT_DATA_TABLE_PRESET, ...partial });
      expect(diags, diags.join("\n")).toEqual([]);
    });
  }

  it("fuzz: 100 random presets parse cleanly", () => {
    const rand = rng(42);
    for (let i = 0; i < 100; i++) {
      const p = { ...DEFAULT_DATA_TABLE_PRESET, ...randomPreset(rand) };
      for (const file of generateDataTablePresetFiles(p)) {
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
      const p = { ...DEFAULT_DATA_TABLE_PRESET, ...randomPreset(rand) };
      for (const dep of dataTablePresetRegistryDeps(p)) {
        expect(dep === "utils" || names.has(dep), `unknown dep "${dep}"`).toBe(true);
      }
    }
  });

  it("generated sources obey payload purity (no docs or repo-internal imports)", () => {
    const rand = rng(99);
    for (let i = 0; i < 100; i++) {
      const p = { ...DEFAULT_DATA_TABLE_PRESET, ...randomPreset(rand) };
      for (const file of generateDataTablePresetFiles(p)) {
        expect(file.content).not.toContain("@/lib/docs");
        expect(file.content).not.toContain('from "@/registry/');
        expect(file.content).not.toContain("—");
      }
    }
  });
});
