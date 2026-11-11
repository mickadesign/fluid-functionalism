import { readFileSync } from "node:fs";
import { join } from "node:path";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Sites whose CSP blocks jsDelivr self-host the pdf.js worker. The setting has
// to win over the CDN default whether it lands before or after pdfjs loads.
vi.mock("pdfjs-dist", () => ({
  version: "9.9.9",
  GlobalWorkerOptions: { workerSrc: "" },
}));

const CDN = "https://cdn.jsdelivr.net/npm/pdfjs-dist@9.9.9/build/pdf.worker.min.mjs";

describe("FileThumbnail pdf.js worker", () => {
  beforeEach(async () => {
    vi.resetModules();
    const pdfjs = await import("pdfjs-dist");
    pdfjs.GlobalWorkerOptions.workerSrc = "";
  });

  it("defaults to the matching jsDelivr build", async () => {
    const { loadPdfjs } = await import("@/registry/default/file-thumbnail");
    const mod = await loadPdfjs();
    expect(mod.GlobalWorkerOptions.workerSrc).toBe(CDN);
  });

  it("uses a worker set before the first PDF", async () => {
    const { loadPdfjs, setPdfWorkerSrc } = await import("@/registry/default/file-thumbnail");
    setPdfWorkerSrc("/pdf.worker.min.mjs");
    const mod = await loadPdfjs();
    expect(mod.GlobalWorkerOptions.workerSrc).toBe("/pdf.worker.min.mjs");
  });

  it("retargets a worker set after pdfjs loaded", async () => {
    const { loadPdfjs, setPdfWorkerSrc } = await import("@/registry/default/file-thumbnail");
    const mod = await loadPdfjs();
    setPdfWorkerSrc("/pdf.worker.min.mjs");
    await loadPdfjs();
    expect(mod.GlobalWorkerOptions.workerSrc).toBe("/pdf.worker.min.mjs");
  });
});

describe("FileThumbnail pdf.js version floor", () => {
  // Versions before 6.2.108 could run script from a crafted PDF.
  it("requires pdfjs-dist@^6.2.108 or later", () => {
    const registry = JSON.parse(readFileSync(join(process.cwd(), "registry.json"), "utf-8"));
    const item = registry.items.find((i: { name: string }) => i.name === "file-thumbnail");
    const dep = (item.dependencies as string[]).find((d) => d.startsWith("pdfjs-dist@^"));
    expect(dep).toBeDefined();
    const [major, minor, patch] = dep!.slice("pdfjs-dist@^".length).split(".").map(Number);
    const at = major * 1e12 + minor * 1e6 + patch;
    expect(major).toBeGreaterThanOrEqual(6);
    expect(at).toBeGreaterThanOrEqual(6 * 1e12 + 2 * 1e6 + 108);
  });
});
