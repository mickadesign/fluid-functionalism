// The weekly Copy-prompt sweep (evals/copy-prompts) runs on a schedule, not
// in CI, so a page it silently stops covering or a rotation that skips a
// brief would go unnoticed for weeks. These keep its selection honest.
import { describe, it, expect } from "vitest";
import { docPages, listBriefs, parseInstallCommand } from "../evals/copy-prompts/briefs.mjs";
import { rankBriefs, rotationSlice, selectWeek } from "../evals/copy-prompts/select.mjs";
import { attention, compare, reportHtml, summaryMarkdown } from "../evals/copy-prompts/report.mjs";
import { readTranscript } from "../evals/copy-prompts/agents.mjs";
import { flavorLeaks, readVerdict, runStatus, statusOf } from "../evals/copy-prompts/grade.mjs";

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

  it("calls an unverified run neither broken nor fixed", () => {
    const now = { agents, briefs: [brief("a@base", "pass", "unverified"), brief("b@base", "pass", "fail")] };
    const then = { agents, briefs: [brief("a@base", "pass", "fail"), brief("b@base", "pass", "unverified")] };
    expect(compare(now, then)).toEqual({ broke: [], fixed: [] });
  });

  it("doesn't count an unverified run as a pass, and says why it needs a look", () => {
    const looks = { id: "looks", pass: null, detail: "judge gave no verdict: timed out" };
    const results = {
      week: 41,
      startedAt: 0,
      finishedAt: 60000,
      shadcnVersion: "4.21.3",
      judgeModel: "opus",
      selection: { rankingError: null },
      agents,
      briefs: [
        {
          ...brief("a@base", "pass", "unverified"),
          runs: { claude: { status: "unverified", attempts: [{ ms: 1000, checks: [{ id: "build", pass: true }, looks] }] } },
        },
      ],
    };
    const summary = summaryMarkdown(results, { broke: [], fixed: [] });
    expect(summary).toContain("Claude Code 0/1 (1 unverified)");
    expect(summary).toContain("Unverified on Claude Code: the screenshot judge gave no verdict");
    expect(summary).not.toContain("Nothing failed");
    const html = reportHtml(results, { broke: [], fixed: [] });
    expect(html).toContain('<a href="#a@base-claude"><span class="m unverified" title="unverified">?</span></a>');
    expect(html).toContain('<li class="warn"><b>looks</b>');
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

describe("grading", () => {
  const ok = (id) => ({ id, pass: true, detail: "" });
  const rendered = [ok("installed"), ok("untouched"), ok("flavor"), ok("build"), ok("render")];

  it("reads the judge's verdict", () => {
    const out = [
      "some log line",
      JSON.stringify({ structured_output: { verdict: "fail", problems: ["Text overflows."], notes: "Broken." }, total_cost_usd: 0.1 }),
    ].join("\n");
    expect(readVerdict(out)).toEqual({ check: { id: "looks", pass: false, detail: "Text overflows. | Broken." }, costUsd: 0.1 });
  });

  it.each([
    ["a timeout", ""],
    ["a usage limit", "Claude AI usage limit reached|1791400000"],
    ["malformed JSON", '{"structured_output": {"verdict": "pa'],
    ["no structured output", JSON.stringify({ result: "Looks fine to me." })],
    ["a verdict outside the schema", JSON.stringify({ structured_output: { verdict: "unsure", problems: [], notes: "" } })],
  ])("never passes a run the judge gave no verdict on: %s", (_, out) => {
    expect(readVerdict(out)).toBeNull();
    const looks = { id: "looks", pass: null, detail: "judge gave no verdict" };
    expect(statusOf([...rendered, looks])).toBe("unverified");
  });

  it("fails on a failed check, and advisory checks never decide", () => {
    expect(statusOf(rendered)).toBe("pass");
    expect(statusOf([...rendered, { id: "lint", pass: false, detail: "", advisory: true }])).toBe("pass");
    expect(statusOf([...rendered, { id: "lint", pass: null, detail: "", advisory: true }])).toBe("pass");
    expect(statusOf([{ id: "build", pass: false }, { id: "render", pass: null, detail: "skipped: typecheck or build failed" }])).toBe(
      "fail",
    );
  });

  it("lets the last attempt decide an agent's status", () => {
    expect(runStatus(["pass"])).toBe("pass");
    expect(runStatus(["fail", "pass"])).toBe("flaky");
    expect(runStatus(["fail", "fail"])).toBe("fail");
    expect(runStatus(["unverified"])).toBe("unverified");
    expect(runStatus(["fail", "unverified"])).toBe("unverified");
  });

  it("fails a run that imports the other flavor in its own files", () => {
    const sources = new Map([
      ["app/page.tsx", 'import * as Dialog from "@radix-ui/react-dialog";'],
      ["components/menu.tsx", 'import { DropdownMenu } from "radix-ui";'],
      ["components/ui/button.tsx", 'import { Button } from "@base-ui/react/button";'],
    ]);
    expect(flavorLeaks(sources, "base", new Map())).toEqual(["app/page.tsx", "components/menu.tsx"]);
    expect(flavorLeaks(sources, "radix", new Map())).toEqual(["components/ui/button.tsx"]);
  });

  it("leaves the payload's own cross-flavor imports alone, unless the agent edited them", () => {
    // color-picker's Radix payload imports Base UI on purpose.
    const picker = 'import { Popover } from "@base-ui/react/popover";';
    const installed = new Map([["components/ui/color-picker.tsx", picker]]);
    expect(flavorLeaks(new Map([["components/ui/color-picker.tsx", picker]]), "radix", installed)).toEqual([]);
    expect(flavorLeaks(new Map([["components/ui/color-picker.tsx", `${picker}\n// edited`]]), "radix", installed)).toEqual([
      "components/ui/color-picker.tsx",
    ]);
  });
});
