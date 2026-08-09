import { mkdtemp, readFile, writeFile, rm, access } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  BASE_URL,
  depUrl,
  flavorForItem,
  processRegistry,
} from "../scripts/postbuild-registry.mjs";

describe("depUrl", () => {
  it("leaves non-custom deps (default shadcn registry) untouched", () => {
    expect(depUrl("utils", "flat")).toBe("utils");
    expect(depUrl("utils", "base")).toBe("utils");
    expect(depUrl("utils", "radix")).toBe("utils");
  });

  it("resolves dual-flavour deps to the consuming flavour's subpath", () => {
    expect(depUrl("button", "base")).toBe(`${BASE_URL}/base/button.json`);
    expect(depUrl("button", "radix")).toBe(`${BASE_URL}/radix/button.json`);
    expect(depUrl("button", "flat")).toBe(`${BASE_URL}/button.json`);
  });

  it("resolves primitive-agnostic custom deps to the bare URL in every flavour", () => {
    for (const flavor of ["flat", "radix", "base"]) {
      expect(depUrl("badge", flavor)).toBe(`${BASE_URL}/badge.json`);
      expect(depUrl("springs", flavor)).toBe(`${BASE_URL}/springs.json`);
    }
  });
});

describe("flavorForItem", () => {
  it("treats -base names as base flavour and everything else as flat", () => {
    expect(flavorForItem({ name: "dialog-base" })).toBe("base");
    expect(flavorForItem({ name: "dialog" })).toBe("flat");
    expect(flavorForItem({ name: "badge" })).toBe("flat");
    expect(flavorForItem({})).toBe("flat");
  });
});

describe("processRegistry pipeline", () => {
  let dir;

  const write = (name, data) =>
    writeFile(join(dir, name), JSON.stringify(data, null, 2));
  const read = async (...segments) =>
    JSON.parse(await readFile(join(dir, ...segments), "utf-8"));
  const exists = (...segments) =>
    access(join(dir, ...segments)).then(
      () => true,
      () => false
    );

  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), "registry-test-"));
    // Simulate `shadcn build` output: a flat index plus per-item files, where
    // dual-flavour items exist as <name>.json (Radix) and <name>-base.json.
    await write("registry.json", {
      items: [
        { name: "dialog", registryDependencies: ["button", "badge", "utils"] },
        { name: "dialog-base", registryDependencies: ["button", "badge", "utils"] },
        { name: "badge", registryDependencies: ["utils"] },
      ],
    });
    await write("dialog.json", {
      name: "dialog",
      registryDependencies: ["button", "badge", "utils"],
    });
    await write("dialog-base.json", {
      name: "dialog-base",
      registryDependencies: ["button", "badge", "utils"],
    });
    await write("badge.json", { name: "badge", registryDependencies: ["utils"] });
    vi.spyOn(console, "log").mockImplementation(() => {});
    await processRegistry(dir);
  });

  afterEach(async () => {
    vi.restoreAllMocks();
    await rm(dir, { recursive: true, force: true });
  });

  it("rewrites the flat file's deps to back-compat URLs", async () => {
    const dialog = await read("dialog.json");
    expect(dialog.registryDependencies).toEqual([
      `${BASE_URL}/button.json`,
      `${BASE_URL}/badge.json`,
      "utils",
    ]);
  });

  it("emits radix/<name>.json for dual-flavour items, with radix URLs", async () => {
    const radix = await read("radix", "dialog.json");
    expect(radix.name).toBe("dialog");
    expect(radix.registryDependencies).toEqual([
      `${BASE_URL}/radix/button.json`,
      `${BASE_URL}/badge.json`,
      "utils",
    ]);
  });

  it("moves <name>-base.json to base/<name>.json, strips the -base suffix, and uses base URLs", async () => {
    expect(await exists("dialog-base.json")).toBe(false);
    const base = await read("base", "dialog.json");
    expect(base.name).toBe("dialog");
    expect(base.registryDependencies).toEqual([
      `${BASE_URL}/base/button.json`,
      `${BASE_URL}/badge.json`,
      "utils",
    ]);
  });

  it("does not emit a radix copy for primitive-agnostic items", async () => {
    expect(await exists("radix", "badge.json")).toBe(false);
    const badge = await read("badge.json");
    expect(badge.registryDependencies).toEqual(["utils"]);
  });

  it("rewrites the index per item flavour: -base entries get base URLs, others back-compat", async () => {
    const index = await read("registry.json");
    const byName = Object.fromEntries(index.items.map((i) => [i.name, i]));
    expect(byName["dialog"].registryDependencies).toEqual([
      `${BASE_URL}/button.json`,
      `${BASE_URL}/badge.json`,
      "utils",
    ]);
    expect(byName["dialog-base"].registryDependencies).toEqual([
      `${BASE_URL}/base/button.json`,
      `${BASE_URL}/badge.json`,
      "utils",
    ]);
  });

  it("leaves already-rewritten URLs alone on a second pass over flat files", async () => {
    const before = await read("dialog.json");
    await processRegistry(dir);
    expect(await read("dialog.json")).toEqual(before);
  });
});
