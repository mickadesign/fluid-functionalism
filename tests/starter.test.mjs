// Starter guards: the settings slug round-trips for every combination, the
// item lists every component once (flavored by the chosen primitive, one
// icon set), and the generated files compile against the real components.
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { createPresetTypechecker } from "./helpers/preset-typecheck.mjs";
import { buildDepResolver } from "../lib/registry-urls.mjs";
import { SETTING_VALUES } from "../lib/docs/site-settings.ts";
import {
  DEFAULT_SLUG,
  STARTER_DEFAULTS,
  parseStarterSlug,
  starterSlug,
} from "../lib/starter/settings.ts";
import {
  buildSetupItem,
  buildStarterItem,
  setupFiles,
  starterFiles,
  starterRegistryDeps,
} from "../lib/starter/install.ts";

const manifest = JSON.parse(readFileSync(new URL("../registry.json", import.meta.url), "utf-8"));
const depUrl = buildDepResolver(manifest.items);

/** Every combination of the six settings (2 × 2 × 2 × 5 × 3 × 17 = 2040). */
function allSettings() {
  let combos = [{}];
  for (const [key, values] of Object.entries(SETTING_VALUES)) {
    combos = combos.flatMap((c) => values.map((v) => ({ ...c, [key]: v })));
  }
  return combos;
}

describe("starter slug", () => {
  it("spells every default as one word", () => {
    expect(starterSlug(STARTER_DEFAULTS)).toBe(DEFAULT_SLUG);
    expect(parseStarterSlug(DEFAULT_SLUG)).toEqual({ ok: true, settings: STARTER_DEFAULTS });
  });

  it("round-trips all 2040 combinations", () => {
    const combos = allSettings();
    expect(combos).toHaveLength(2040);
    for (const s of combos) {
      expect(parseStarterSlug(starterSlug(s)), starterSlug(s)).toEqual({ ok: true, settings: s });
    }
  });

  it("names only the settings that differ, in a fixed order", () => {
    expect(starterSlug({ ...STARTER_DEFAULTS, theme: "dark", base: "radix", shape: "pill" })).toBe("radix-pill-dark");
  });

  it("reads words in any order", () => {
    expect(parseStarterSlug("dark-pill-radix").settings).toEqual({
      ...STARTER_DEFAULTS,
      theme: "dark",
      shape: "pill",
      base: "radix",
    });
  });

  it("refuses unknown words and a setting given twice", () => {
    expect(parseStarterSlug("radix-sepia")).toMatchObject({ ok: false });
    expect(parseStarterSlug("radix-base")).toMatchObject({ ok: false });
  });
});

describe("starter item", () => {
  const names = new Set(manifest.items.map((i) => i.name));

  it("installs every component once, and only the chosen icon set", () => {
    const deps = starterRegistryDeps(manifest.items, { ...STARTER_DEFAULTS, icons: "phosphor" });
    expect(new Set(deps).size).toBe(deps.length);
    expect(deps.filter((d) => d.endsWith("-base"))).toEqual([]);
    expect(deps.filter((d) => d.startsWith("icons-"))).toEqual(["icons-phosphor"]);
    for (const name of names) {
      if (name.endsWith("-base") || name.startsWith("icons-") || name === "sidebar-app") continue;
      expect(deps, name).toContain(name);
    }
    expect(starterRegistryDeps(manifest.items, { ...STARTER_DEFAULTS, icons: "lucide" }).some((d) => d.startsWith("icons-"))).toBe(false);
  });

  it("resolves every dependency to the chosen flavor", () => {
    for (const base of ["radix", "base"]) {
      const item = buildStarterItem({ ...STARTER_DEFAULTS, base }, manifest.items, depUrl);
      const other = base === "base" ? "/r/radix/" : "/r/base/";
      expect(item.registryDependencies.filter((u) => u.includes(other))).toEqual([]);
      expect(item.registryDependencies).toContain(`https://www.fluidfunctionalism.com/r/${base}/select.json`);
      expect(item.config.style).toBe(base === "base" ? "base-nova" : "radix-nova");
    }
  });

  it("writes the settings into the providers, and the layout loads Inter with opsz and sets the accent", () => {
    const s = { base: "radix", shape: "pill", size: "compact", icons: "phosphor", theme: "dark", accent: "violet" };
    const files = Object.fromEntries(starterFiles(s).map((f) => [f.target, f.content]));
    expect(files["app/layout.tsx"]).toContain(`axes: ["opsz"]`);
    expect(files["app/layout.tsx"]).toContain(`"--fluid-accent": "light-dark(#7F22FE, #A684FF)"`);
    expect(starterFiles(STARTER_DEFAULTS).find((f) => f.target === "app/layout.tsx").content).toContain(`"--fluid-accent": "#6B97FF"`);
    expect(files["components/providers.tsx"]).toContain(`defaultTheme="dark"`);
    expect(files["components/providers.tsx"]).toContain(`<FluidProvider shape="pill" size="compact" icons={phosphorIcons}>`);
    expect(files["components/sidebar-app/app-sidebar.tsx"]).toContain(`@/components/sidebar-app/nav-data`);
    expect(Object.keys(files)).not.toContain("app/sidebar/page.tsx");
  });

  it("keeps the setup item to components plus one wrapper", () => {
    const item = buildSetupItem(STARTER_DEFAULTS, manifest.items, depUrl);
    expect(item.type).toBe("registry:item");
    expect(item.files.map((f) => f.target)).toEqual(["components/fluid-root.tsx"]);
    expect(item.config).toBeUndefined();
  });

  it("lists no dependency the registry lacks", () => {
    for (const dep of starterRegistryDeps(manifest.items, STARTER_DEFAULTS)) {
      expect(names.has(dep) || dep === "utils", dep).toBe(true);
    }
  });
});

describe("generated starter files compile", () => {
  const virtual = (p) => [`./__preset__/${p}`];
  const typecheck = createPresetTypechecker({
    paths: {
      "@/components/providers": virtual("components/providers"),
      "@/components/theme-provider": virtual("components/theme-provider"),
      "@/components/fluid-root": virtual("components/fluid-root"),
      "@/components/sidebar-app/app-sidebar": virtual("components/sidebar-app/app-sidebar"),
      "@/components/sidebar-app/nav-data": virtual("components/sidebar-app/nav-data"),
    },
  });

  const MATRIX = [
    STARTER_DEFAULTS,
    { base: "radix", shape: "pill", size: "compact", icons: "lucide", theme: "dark", accent: "violet" },
    { base: "base", shape: "rounded", size: "default", icons: "tabler", theme: "light", accent: "violet" },
    { base: "radix", shape: "rounded", size: "compact", icons: "phosphor", theme: "system", accent: "red" },
    { base: "base", shape: "pill", size: "default", icons: "hugeicons", theme: "dark", accent: "red" },
  ];

  for (const s of MATRIX) {
    it(starterSlug(s), () => {
      const diags = typecheck([...starterFiles(s), ...setupFiles(s)]);
      expect(diags, diags.join("\n")).toEqual([]);
    });
  }
});
