import { describe, expect, it } from "vitest";
import { acceptQuality, prefersMarkdown } from "@/lib/accept";

// /changelog serves Markdown at the same URL when the request ranks it above
// HTML (middleware.ts). Browsers must always get the page.

describe("acceptQuality", () => {
  it("takes the most specific matching range", () => {
    expect(acceptQuality("text/*;q=0.5, text/markdown;q=0.9", "text/markdown")).toBe(0.9);
    expect(acceptQuality("text/*;q=0.5, */*;q=0.1", "text/markdown")).toBe(0.5);
    expect(acceptQuality("*/*;q=0.1", "text/markdown")).toBe(0.1);
    expect(acceptQuality("application/json", "text/markdown")).toBe(0);
  });

  it("reads q=0 as a refusal and a bad q as 0", () => {
    expect(acceptQuality("text/html;q=0", "text/html")).toBe(0);
    expect(acceptQuality("text/html;q=abc", "text/html")).toBe(0);
  });
});

describe("prefersMarkdown", () => {
  it.each([
    ["text/markdown", true],
    ["text/markdown, text/html;q=0.9", true],
    ["text/markdown;q=0.1, application/xhtml+xml", false],
    ["text/html, text/markdown", false],
    ["text/html;q=0, text/markdown", true],
    ["text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8", false],
    ["*/*", false],
    ["", false],
  ])("%j → %s", (accept, expected) => {
    expect(prefersMarkdown(accept)).toBe(expected);
  });
});
