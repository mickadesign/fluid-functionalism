// The skill's upgrade check compares each installed Fluid Functionalism file
// with what the registry ships in the project's flavor. These tests run it
// against a small registry on disk, so they hold the rules without the
// network: each file is compared in the flavor its imports show, a file
// that ships inside another item still finds it, what an install rewrites
// is ignored, a missing index fails loudly, and nothing is ever written.
import { afterAll, describe, expect, it } from "vitest";
import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { checkUpgrade, diffLines, formatDiff, normalize } from "../skills/fluid-functionalism/scripts/upgrade.mjs";

const root = fileURLToPath(new URL("..", import.meta.url));
const script = join(root, "skills/fluid-functionalism/scripts/upgrade.mjs");

const created = [];
afterAll(() => {
  for (const dir of created) rmSync(dir, { recursive: true, force: true });
});

/** Writes a throwaway tree; keys are paths, values file contents. */
function tree(files) {
  const dir = mkdtempSync(join(tmpdir(), "ff-upgrade-"));
  created.push(dir);
  for (const [path, content] of Object.entries(files)) {
    mkdirSync(dirname(join(dir, path)), { recursive: true });
    writeFileSync(join(dir, path), typeof content === "string" ? content : JSON.stringify(content, null, 2));
  }
  return dir;
}

const SELECT_BASE = `import { Select } from "@base-ui/react/select";\nimport { spring } from "@/lib/springs";\nexport const flavor = "base";\n`;
const SELECT_RADIX = `import * as Select from "@radix-ui/react-select";\nimport { spring } from "@/lib/springs";\nexport const flavor = "radix";\n`;
const SPRINGS = `export const spring = {\n  fast: { duration: 0.08 },\n  moderate: { duration: 0.16 },\n};\n`;
const HOOK = `export function useFluidHover() {}\n`;
const DIALOG_RADIX = `import * as Dialog from "@radix-ui/react-dialog";\nimport { spring } from "@/lib/springs";\n`;
const HIGHLIGHT = `import { useFluidHover } from "@/hooks/use-fluid-hover";\nexport function FluidHoverHighlight() {}\n`;

const registry = () =>
  tree({
    "registry.json": {
      items: [
        { name: "select", files: [{ path: "registry/radix/select.tsx" }] },
        { name: "dialog", files: [{ path: "registry/radix/dialog.tsx" }] },
        { name: "springs", files: [{ path: "registry/default/lib/springs.ts" }] },
        {
          name: "use-fluid-hover",
          files: [{ path: "registry/default/hooks/use-fluid-hover.ts" }, { path: "registry/default/fluid-hover-highlight.tsx" }],
        },
      ],
    },
    "select.json": { name: "select", files: [{ path: "registry/radix/select.tsx", content: SELECT_RADIX }] },
    "base/select.json": {
      name: "select",
      registryDependencies: ["https://www.fluidfunctionalism.com/r/springs.json", "utils"],
      files: [{ path: "registry/base/select.tsx", target: "components/ui/select.tsx", content: SELECT_BASE }],
    },
    "dialog.json": { name: "dialog", files: [{ path: "registry/radix/dialog.tsx", content: DIALOG_RADIX }] },
    "springs.json": { name: "springs", files: [{ path: "registry/default/lib/springs.ts", content: SPRINGS }] },
    "use-fluid-hover.json": {
      name: "use-fluid-hover",
      files: [
        // Shipped with "use client"; an rsc: false install drops the line.
        { path: "registry/default/hooks/use-fluid-hover.ts", content: `"use client";\n\n${HOOK}` },
        { path: "registry/default/fluid-hover-highlight.tsx", content: HIGHLIGHT },
      ],
    },
  });

/** A Base UI project: select installed with a ~/ alias, springs edited
 *  locally, the hook and its highlight as shipped, and a part no item in
 *  this registry ships. `extra` adds or replaces files. */
const project = (extra = {}) =>
  tree({
    "package.json": { dependencies: { react: "^19.1.0", motion: "^14.1.0", "@base-ui/react": "^1.4.1" } },
    "components.json": { aliases: { ui: "~/components/ui", lib: "~/lib", hooks: "~/hooks", components: "~/components" } },
    "tsconfig.json": { compilerOptions: { paths: { "~/*": ["./src/*"] } } },
    "src/components/ui/select.tsx": SELECT_BASE.replace("@/lib/springs", "~/lib/springs").replace(/\n/g, "\r\n"),
    "src/lib/springs.ts": SPRINGS.replace("0.16", "0.2"),
    "src/hooks/use-fluid-hover.ts": HOOK,
    "src/components/fluid-hover-highlight.tsx": HIGHLIGHT.replace("@/hooks", "~/hooks"),
    "src/components/ui/menu-item.tsx": `import { spring } from "~/lib/springs";\n`,
    ...extra,
  });

describe("normalize", () => {
  it("drops what an install rewrites: aliases, line endings, trailing spaces", () => {
    expect(normalize(`import { a } from "~/lib/springs";  \r\nimport b from "../hooks/x";\r\n`)).toBe(
      normalize(`import { a } from "@/lib/springs";\nimport b from "@/hooks/x";\n`),
    );
  });

  it("sets aside the \"use client\" line an rsc: false install drops", () => {
    expect(normalize(`"use client";\n\nexport const a = 1;\n`)).toBe(normalize("export const a = 1;\n"));
    expect(normalize(`'use client'\nexport const a = 1;`)).toBe("export const a = 1;");
  });

  it("keeps package imports as they are", () => {
    expect(normalize(`import { motion } from "motion/react";`)).toContain(`"motion/react"`);
  });
});

describe("diffLines", () => {
  it("marks the removed and added lines and keeps the rest", () => {
    const ops = diffLines(["a", "b", "c"], ["a", "x", "c"]);
    expect(ops).toEqual([
      ["=", "a"],
      ["-", "b"],
      ["+", "x"],
      ["=", "c"],
    ]);
    expect(formatDiff(ops)).toContain("- b\n+ x");
  });
});

describe("checkUpgrade", () => {
  it("sorts every installed file into current, differs, or unmatched", async () => {
    const check = await checkUpgrade(project(), { registry: registry() });
    const status = Object.fromEntries(check.results.map((r) => [r.name, r.status]));
    expect(check.flavor.flavor).toBe("base");
    expect(status).toEqual({
      "fluid-hover-highlight": "current",
      "menu-item": "unmatched",
      select: "current",
      springs: "differs",
      "use-fluid-hover": "current",
    });
  });

  it("compares a Base UI project with the base/ build of an item", async () => {
    const check = await checkUpgrade(project(), { registry: registry() });
    expect(check.results.find((r) => r.name === "select").url).toMatch(/base\/select\.json$/);
  });

  it("finds the item that ships a file under another name", async () => {
    const check = await checkUpgrade(project(), { registry: registry() });
    expect(check.results.find((r) => r.name === "fluid-hover-highlight").item).toBe("use-fluid-hover");
  });

  it("shows a difference local on the - side, registry on the +", async () => {
    const check = await checkUpgrade(project(), { registry: registry() });
    const springs = check.results.find((r) => r.name === "springs");
    expect(springs).toMatchObject({ removed: 1, added: 1 });
    expect(springs.diff).toContain("-   moderate: { duration: 0.2 },\n+   moderate: { duration: 0.16 },");
  });

  it("compares each file in the flavor its imports show, in a mixed project too", async () => {
    // A Radix dialog beside the Base UI select makes the project mixed.
    const check = await checkUpgrade(project({ "src/components/ui/dialog.tsx": DIALOG_RADIX }), { registry: registry() });
    expect(check.flavor.flavor).toBe("mixed");
    const byName = Object.fromEntries(check.results.map((r) => [r.name, r]));
    expect(byName.select).toMatchObject({ status: "current", url: expect.stringMatching(/base\/select\.json$/) });
    expect(byName.dialog).toMatchObject({ status: "current", url: expect.stringMatching(/\/dialog\.json$/) });
  });

  it("checks both files when two folders hold one name", async () => {
    const check = await checkUpgrade(project({ "src/components/select.tsx": SELECT_BASE.replace('"base"', '"edited"') }), {
      registry: registry(),
    });
    const selects = check.results.filter((r) => r.name === "select");
    expect(selects.map((r) => [r.path, r.status]).sort()).toEqual([
      ["src/components/select.tsx", "differs"],
      ["src/components/ui/select.tsx", "current"],
    ]);
  });

  it("fails when the registry has no index, instead of matching nothing", async () => {
    await expect(checkUpgrade(project(), { registry: tree({ "springs.json": { name: "springs" } }) })).rejects.toThrow(
      /no registry index/,
    );
  });

  it("prints one re-install line per item, naming the installed dependencies it rewrites", () => {
    const dir = project({ "src/components/ui/select.tsx": SELECT_BASE.replace('"base"', '"edited"') });
    const out = execFileSync(process.execPath, [script, dir, "--registry", registry()], { encoding: "utf8" });
    expect(out).toMatch(/ select: npx shadcn@latest add \S+\/base\/select\.json --overwrite {2}\(also rewrites springs\)\n/);
    expect(out).toMatch(/ springs: npx shadcn@latest add \S+\/springs\.json --overwrite\n/);
    expect(out).not.toMatch(/add \S+\.json \S+\.json/);
  });

  it("writes nothing, from the command line either", () => {
    const dir = project();
    const reg = registry();
    const before = readdirSync(dir, { recursive: true }).map(String).sort();
    const out = execFileSync(process.execPath, [script, dir, "--registry", reg], { encoding: "utf8" });
    expect(out).toContain("DIFFERS   1 file");
    expect(out).toContain("Nothing is written");
    expect(out).toContain("changelog.md");
    expect(readdirSync(dir, { recursive: true }).map(String).sort()).toEqual(before);
  });
});
