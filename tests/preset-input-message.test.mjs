// InputMessage preset guards, mirroring the sidebar's: codec round-trip
// integrity, the shadcn-style compat rules (defaults at index 0, < 53 bits),
// a golden code, and a compile guard — generated files are injected as
// virtual files into a REAL TypeScript program over the project's tsconfig
// and must produce zero diagnostics. A seeded fuzz sweep parses a wide
// sample cheaply, and payload purity + dep existence match the route tests.
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import ts from "typescript";
import { createPresetTypechecker } from "./helpers/preset-typecheck.mjs";
import {
  encodeInputMessagePreset,
  decodeInputMessagePreset,
  INPUT_MESSAGE_DEFAULT_CODE,
  INPUT_MESSAGE_DEFAULT_PRESET,
  INPUT_MESSAGE_PRESET_FIELDS,
} from "../lib/preset/input-message-options.ts";
import { totalBits } from "../lib/preset/codec.ts";
import {
  generateInputMessagePresetFiles,
  inputMessagePresetRegistryDeps,
} from "../lib/preset/input-message-install.ts";

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
  for (const f of INPUT_MESSAGE_PRESET_FIELDS) {
    p[f.key] = f.values[Math.floor(rand() * f.values.length)];
  }
  return p;
}

describe("input-message preset codec", () => {
  it("stays under 53 bits", () => {
    expect(totalBits(INPUT_MESSAGE_PRESET_FIELDS)).toBeLessThan(53);
  });

  it("every field's default sits at index 0", () => {
    for (const f of INPUT_MESSAGE_PRESET_FIELDS) {
      expect(f.values[0], `field "${f.key}" default must be values[0]`).toEqual(
        INPUT_MESSAGE_DEFAULT_PRESET[f.key]
      );
    }
  });

  it("every field allocates enough bits for its values", () => {
    for (const f of INPUT_MESSAGE_PRESET_FIELDS) {
      expect(2 ** f.bits, `field "${f.key}"`).toBeGreaterThanOrEqual(
        f.values.length
      );
    }
  });

  it("globals ride at the end with the sidebar's shapes", () => {
    const tail = INPUT_MESSAGE_PRESET_FIELDS.slice(-3).map((f) => [
      f.key,
      f.bits,
    ]);
    expect(tail).toEqual([
      ["flavor", 3],
      ["shape", 2],
      ["size", 2],
    ]);
  });

  it("the all-defaults code decodes to the defaults", () => {
    const res = decodeInputMessagePreset(INPUT_MESSAGE_DEFAULT_CODE);
    expect(res.ok).toBe(true);
    expect(res.preset).toEqual(INPUT_MESSAGE_DEFAULT_PRESET);
  });

  it("round-trips 300 random presets exactly", () => {
    const rand = rng(1234);
    for (let i = 0; i < 300; i++) {
      const p = randomPreset(rand);
      const res = decodeInputMessagePreset(encodeInputMessagePreset(p));
      expect(res.ok).toBe(true);
      expect(res.preset, `seed iteration ${i}`).toEqual({
        ...INPUT_MESSAGE_DEFAULT_PRESET,
        ...p,
      });
    }
  });

  it("rejects garbage without throwing", () => {
    for (const bad of ["", "m", "xz99", "mZ!!!", "ma" + "z".repeat(40)]) {
      const res = decodeInputMessagePreset(bad);
      expect(res.ok).toBe(false);
      expect(typeof res.error).toBe("string");
    }
  });

  it("refuses codes from other components", () => {
    const res = decodeInputMessagePreset("sa0");
    expect(res.ok).toBe(false);
  });

  // Golden: if this fails, a value array was reordered or a field inserted
  // mid-table — that breaks every code in the wild. Append instead.
  it("golden code for a fixed non-default preset is stable", () => {
    const code = encodeInputMessagePreset({
      suggestionsOn: false,
      attachments: true,
      minRows: 3,
      rightSlot: true,
      status: "streaming",
      flavor: "base",
      shape: "pill",
    });
    const back = decodeInputMessagePreset(code);
    expect(back.ok).toBe(true);
    expect(back.preset.status).toBe("streaming");
    expect(back.preset.shape).toBe("pill");
    // Pin the literal string — update ONLY on a deliberate version bump.
    expect(code).toMatchInlineSnapshot(`"maJr8"`);
  });
});

// ── Install generator ───────────────────────────────────────────────────────

const typecheck = createPresetTypechecker({
  // The generated page imports the composer by alias, so map it into the
  // virtual dir. The shipped queued-stack block installs to
  // components/queued-stack.tsx; in-repo its source lives under
  // registry/blocks, so map the install path onto it.
  paths: {
    "@/components/chat-composer": ["./__preset__/components/chat-composer.tsx"],
    "@/components/queued-stack": ["./registry/blocks/queued-stack.tsx"],
  },
});

function typecheckPreset(preset) {
  return typecheck(generateInputMessagePresetFiles(preset));
}

// Curated matrix: every structural branch flips at least once — queue mode,
// attachments, both slots, disabled, minRows extremes, and the pinned-globals
// page (pill + compact + base).
const MATRIX = [
  {}, // all defaults (leftSlot on → files wiring)
  { leftSlot: false, rightSlot: false, suggestion: false, suggestionsOn: false, historyOn: false }, // bare composer
  { status: "idle" }, // queue mode + queued→sent morph
  { status: "streaming", attachments: true, rightSlot: true }, // queue, seeded streaming, full chrome
  { status: "idle", leftSlot: false, attachments: false, suggestionsOn: false }, // queue without files wiring
  { attachments: true, minRows: 3 }, // prefilled attachments + minRows max
  { leftSlot: true, rightSlot: true, minRows: 2 }, // both slots
  { disabled: true, minRows: 1, historyOn: false }, // disabled + minRows min
  { shape: "pill", size: "compact", flavor: "base", status: "idle" }, // pinned globals page
  { shape: "pill", size: "compact", disabled: true, rightSlot: true, leftSlot: false },
];

describe("input-message preset install generator", () => {
  for (const [i, partial] of MATRIX.entries()) {
    it(`matrix ${i} typechecks: ${JSON.stringify(partial)}`, () => {
      const diags = typecheckPreset({
        ...INPUT_MESSAGE_DEFAULT_PRESET,
        ...partial,
      });
      expect(diags, diags.join("\n")).toEqual([]);
    });
  }

  it("fuzz: 100 random presets parse cleanly", () => {
    const rand = rng(42);
    for (let i = 0; i < 100; i++) {
      const p = { ...INPUT_MESSAGE_DEFAULT_PRESET, ...randomPreset(rand) };
      for (const file of generateInputMessagePresetFiles(p)) {
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
        expect(errs, `iteration ${i} ${file.target}:\n${errs.join("\n")}`).toEqual(
          []
        );
      }
    }
  });

  it("generated sources obey payload purity (no docs or repo-internal imports)", () => {
    for (const partial of [
      {},
      { status: "streaming", attachments: true, rightSlot: true },
      { shape: "pill", size: "compact", flavor: "base", status: "idle" },
    ]) {
      for (const file of generateInputMessagePresetFiles({
        ...INPUT_MESSAGE_DEFAULT_PRESET,
        ...partial,
      })) {
        expect(file.content).not.toContain("@/lib/docs");
        expect(file.content).not.toContain('from "@/registry/');
      }
    }
  });

  it("every preset registry dep exists as a manifest item (or is 'utils')", () => {
    const manifest = JSON.parse(
      readFileSync(new URL("../registry.json", import.meta.url), "utf-8")
    );
    const names = new Set(manifest.items.map((i) => i.name));
    const rand = rng(7);
    for (let i = 0; i < 100; i++) {
      const p = { ...INPUT_MESSAGE_DEFAULT_PRESET, ...randomPreset(rand) };
      const deps = inputMessagePresetRegistryDeps(p);
      for (const dep of deps) {
        expect(dep === "utils" || names.has(dep), `unknown dep "${dep}"`).toBe(
          true
        );
      }
      // The shipped stack block rides along exactly when queue mode is on.
      expect(deps.includes("queued-stack")).toBe(p.status !== "off");
    }
  });
});
