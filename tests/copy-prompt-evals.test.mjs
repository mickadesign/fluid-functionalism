// The weekly Copy-prompt sweep (evals/copy-prompts) runs on a schedule, not
// in CI, so a page it silently stops covering or a rotation that skips a
// brief would go unnoticed for weeks. These keep its selection honest.
import { describe, it, expect } from "vitest";
import { docPages, listBriefs, parseInstallCommand } from "../evals/copy-prompts/briefs.mjs";
import { rankBriefs, rotationSlice, selectWeek } from "../evals/copy-prompts/select.mjs";
import { attention, compare, summaryMarkdown } from "../evals/copy-prompts/report.mjs";
import { readTranscript } from "../evals/copy-prompts/agents.mjs";

const briefs = await listBriefs();
const ids = briefs.map((b) => b.id);

describe("the sweep's briefs", () => {
  it("cover every doc page with an install block", () => {
    for (const { slug } of docPages()) {
      expect(briefs.some((b) => b.kind === "doc" && b.slug === slug), slug).toBe(true);
    }
  });

  it("each carry an install command for the live registry", () => {
    for (const b of briefs) {
      expect(b.install, b.id).not.toBeNull();
      expect(b.install.url, b.id).toMatch(/^https:\/\/www\.fluidfunctionalism\.com\/r\//);
      expect(b.install.command, b.id).toContain("--overwrite");
    }
  });

  it("install the Base UI payload in a Base UI project and the flat one otherwise", () => {
    for (const b of briefs.filter((b) => b.kind === "doc" && ids.includes(`${b.slug}@radix`))) {
      if (b.flavor === "base") expect(b.install.url, b.id).toContain("/r/base/");
      else expect(b.install.url, b.id).not.toContain("/r/base/");
    }
  });

  it("give every preset a component or a route to render", () => {
    for (const b of briefs.filter((b) => b.kind === "preset")) {
      if (b.render?.route) continue;
      expect(b.render?.exportName, b.id).toBeTruthy();
      expect(b.prompt, b.id).toContain(b.render.importPath.replace("@/", ""));
    }
  });

  it("reads the install line out of a brief", () => {
    expect(parseInstallCommand("Install:\nnpx shadcn@latest add https://www.fluidfunctionalism.com/r/badge.json --overwrite\nmore")).toEqual({
      command: "npx shadcn@latest add https://www.fluidfunctionalism.com/r/badge.json --overwrite",
      url: "https://www.fluidfunctionalism.com/r/badge.json",
    });
  });
});

describe("weekly selection", () => {
  it("runs every brief exactly once per rotation cycle", () => {
    const seen = new Map();
    for (let week = 0; week < 4; week++) {
      for (const id of rotationSlice(ids, { buckets: 4, week })) seen.set(id, (seen.get(id) ?? 0) + 1);
    }
    expect(seen.size).toBe(ids.length);
    expect([...seen.values()].every((n) => n === 1)).toBe(true);
  });

  it("maps registry items onto briefs by flavor", () => {
    const ranked = rankBriefs(
      [
        { item: "button", visitors: 50 },
        { item: "radix/dialog", visitors: 40 },
        { item: "base/combobox", visitors: 30 },
        { item: "badge", visitors: 20 },
        { item: "springs", visitors: 999 },
        { item: "not-a-thing", visitors: 5 },
      ],
      briefs,
    );
    expect(ranked).toEqual([
      ["button@radix", 50],
      ["dialog@radix", 40],
      ["combobox@base", 30],
      ["badge@base", 20],
    ]);
  });

  it("never runs a top brief twice in one week", () => {
    const ranked = briefs.slice(0, 10).map((b, i) => [b.id, 100 - i]);
    for (let week = 0; week < 4; week++) {
      const { top, rotation } = selectWeek({ briefs, ranked, top: 10, buckets: 4, week });
      expect(top).toHaveLength(10);
      expect(rotation.filter((id) => top.includes(id))).toEqual([]);
    }
  });
});

describe("the report", () => {
  const agents = [{ name: "claude", label: "Claude Code", bin: "claude" }];
  const brief = (id, control, claude) => ({
    id,
    control: { status: control, attempts: [{ checks: [{ id: "install", pass: control === "pass" }] }] },
    runs: { claude: { status: claude, attempts: [] } },
  });

  it("names what broke and what got fixed since last week", () => {
    const now = { agents, briefs: [brief("a@base", "pass", "fail"), brief("b@base", "pass", "pass")] };
    const then = { agents, briefs: [brief("a@base", "pass", "pass"), brief("b@base", "pass", "fail")] };
    expect(compare(now, then)).toEqual({ broke: ["a@base (claude)"], fixed: ["b@base (claude)"] });
  });

  it("puts a brief that fails with no agent first", () => {
    const results = {
      week: 41,
      agents,
      briefs: [brief("a@base", "pass", "fail"), brief("b@base", "fail", "blocked")],
    };
    const summary = summaryMarkdown(results, { broke: [], fixed: [] });
    expect(summary.indexOf("b@base")).toBeLessThan(summary.indexOf("a@base"));
    expect(summary).toContain("Fails with no agent: install");
  });

  it("flags a pass that took far longer than the agent's usual pass", () => {
    const run = (ms) => ({ status: "pass", attempts: [{ ms }] });
    const results = {
      week: 41,
      agents,
      briefs: ["a", "b", "c", "d"].map((id, i) => ({
        id,
        control: { status: "pass", attempts: [] },
        runs: { claude: run([110000, 120000, 130000, 350000][i]) },
      })),
    };
    expect(attention(results)).toEqual([
      { level: 3, id: "d", text: "Passes on Claude Code but took 350s against a typical 130s: read the transcript for a workaround" },
    ]);
  });

  it("reads model and cost from a Claude transcript", () => {
    const text = [
      JSON.stringify({ type: "system", subtype: "init", model: "claude-opus-5-5" }),
      JSON.stringify({ type: "result", total_cost_usd: 0.42, num_turns: 9 }),
    ].join("\n");
    expect(readTranscript(text)).toEqual({ model: "claude-opus-5-5", costUsd: 0.42, turns: 9 });
  });
});
