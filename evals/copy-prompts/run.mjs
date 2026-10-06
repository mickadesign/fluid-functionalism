#!/usr/bin/env node
// Weekly Copy-prompt sweep: pastes each selected brief into each installed
// coding agent in a fresh shadcn project, grades what it leaves behind, and
// writes a report. See README.md in this folder.
//
//   node evals/copy-prompts/run.mjs              this week's selection
//   node evals/copy-prompts/run.mjs --dry-run    print the selection only
//   node evals/copy-prompts/run.mjs --briefs dropdown@base,badge@base --agents claude
//   node evals/copy-prompts/run.mjs --agents none   registry health only
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { parseArgs } from "node:util";
import { chromium } from "playwright-core";
import { AGENTS, detectAgents, runAgent } from "./agents.mjs";
import { listBriefs, ROOT } from "./briefs.mjs";
import { captureReference, gradeRun, judge, runControl } from "./grade.mjs";
import { cloneProject, makeTemplates } from "./project.mjs";
import { compare, previousResults, reportHtml, summaryMarkdown } from "./report.mjs";
import { fetchInstallRows, isoWeek, rankBriefs, selectWeek } from "./select.mjs";
import { pool } from "./util.mjs";

const { values: opts } = parseArgs({
  options: {
    agents: { type: "string", default: Object.keys(AGENTS).join(",") },
    briefs: { type: "string" },
    top: { type: "string", default: "10" },
    buckets: { type: "string", default: "4" },
    week: { type: "string" },
    concurrency: { type: "string", default: "2" },
    "agent-timeout": { type: "string", default: "15" },
    "judge-model": { type: "string", default: "opus" },
    "no-judge": { type: "boolean", default: false },
    "no-retry": { type: "boolean", default: false },
    "keep-work": { type: "boolean", default: false },
    "dry-run": { type: "boolean", default: false },
    list: { type: "boolean", default: false },
    // Where reports accumulate. The weekly routine runs from a throwaway
    // worktree, so it points this at the main checkout's results folder to
    // keep last week's results.json for the comparison.
    "results-dir": { type: "string" },
  },
});

const log = (...args) => console.log(`[${new Date().toLocaleTimeString()}]`, ...args);
const safe = (id) => id.replace(/[^a-z0-9@.-]+/gi, "_");

const briefs = await listBriefs();
if (opts.list) {
  for (const b of briefs) console.log(b.id);
  process.exit(0);
}

// Selection: named briefs, or the most installed plus this week's rotation.
const week = Number(opts.week ?? isoWeek());
const buckets = Number(opts.buckets);
let selection;
if (opts.briefs) {
  const wanted = opts.briefs.split(",").map((s) => s.trim());
  const unknown = wanted.filter((id) => !briefs.some((b) => b.id === id));
  if (unknown.length) throw new Error(`unknown briefs: ${unknown.join(", ")} (see --list)`);
  selection = { top: [], rotation: [], named: wanted, rankingError: null, buckets };
} else {
  const { rows, error } = fetchInstallRows({ root: ROOT });
  const ranked = rankBriefs(rows ?? [], briefs);
  selection = { ...selectWeek({ briefs, ranked, top: Number(opts.top), buckets, week }), named: [], rankingError: error, buckets };
}
const reasonOf = (id) => (selection.top.includes(id) ? "top" : selection.rotation.includes(id) ? "rotation" : "named");
const chosen = briefs.filter((b) => [...selection.named, ...selection.top, ...selection.rotation].includes(b.id));
// `--agents none` runs only the no-agent installs and builds: a quick
// registry health check.
const agents = detectAgents(opts.agents.split(",").map((s) => s.trim()).filter((s) => s && s !== "none"));

log(`week ${week}: ${chosen.length} briefs`);
for (const b of chosen) log(`  ${b.id} (${reasonOf(b.id)})`);
for (const a of agents) log(`  ${a.label}: ${a.bin ? a.version : `${a.problem}, skipped`}`);
// The judge runs on Claude Code too.
const judgeReady = !opts["no-judge"] && detectAgents(["claude"])[0].bin !== null;
if (!opts["no-judge"] && !judgeReady) log("  screenshot judge: Claude Code is not ready, skipped");
if (selection.rankingError) log(`  install ranking unavailable: ${selection.rankingError}`);
if (opts["dry-run"]) process.exit(0);

const startedAt = Date.now();
const stamp = new Date(startedAt).toISOString().slice(0, 16).replace(/[:T]/g, "-");
const resultsRoot = resolve(opts["results-dir"] ?? join(ROOT, "evals/copy-prompts/results"));
const resultsDir = join(resultsRoot, stamp);
const shotsDir = join(resultsDir, "shots");
// Runs happen outside every repo, in a folder that is deleted afterwards.
const workDir = join(tmpdir(), "ff-evals", stamp);
mkdirSync(shotsDir, { recursive: true });
mkdirSync(workDir, { recursive: true });

const flavors = [...new Set(chosen.map((b) => b.flavor))].sort();
const { templates, shadcnVersion } = await makeTemplates(join(workDir, "templates"), flavors, log);
const browser = await launchBrowser();
let nextPort = 4100;
const port = () => nextPort++;

// Doc briefs compare against the docs demo; preset briefs against their
// own no-agent render, which is captured during the run.
for (const b of chosen.filter((b) => !b.render)) {
  b.reference = await captureReference({ browser, brief: b, shotFile: join(shotsDir, `ref-${safe(b.id)}.jpg`) });
  b.referenceKind = "docs";
}

const attempts = opts["no-retry"] ? 1 : 2;
const agentTimeout = Number(opts["agent-timeout"]) * 60000;

// The one line added to every brief: it gives the screenshot a known page.
// Everything above it is the exact text the site's Copy prompt button gives.
const SHOW_IT = "Show it on the home page (app/page.tsx) so I can see it.";
const taskFor = (brief) => `${brief.prompt}\n\n${SHOW_IT}`;

// Advisory checks (lint) are reported but never fail a run.
const statusOf = (checks) => (checks.some((c) => c.pass === false && !c.advisory) ? "fail" : "pass");

async function sweep(brief) {
  const briefDir = join(workDir, safe(brief.id));
  const logDir = join(resultsDir, "logs", safe(brief.id));
  mkdirSync(logDir, { recursive: true });
  const template = templates[brief.flavor];

  log(`${brief.id}: no-agent run`);
  const controlAttempts = [];
  let control;
  for (let i = 0; i < attempts; i++) {
    const dir = join(briefDir, `control-${i}`);
    control = await runControl({
      brief,
      template,
      dir,
      port: port(),
      browser,
      shotFile: join(shotsDir, `control-${safe(brief.id)}.jpg`),
      logDir,
    });
    controlAttempts.push({ checks: control.checks, ms: control.ms });
    if (!opts["keep-work"]) rmSync(dir, { recursive: true, force: true });
    if (statusOf(control.checks) === "pass") break;
  }
  const controlStatus = statusOf(control.checks);
  if (brief.render) {
    brief.reference = control.shot;
    brief.referenceKind = "control";
  }

  const runs = {};
  await Promise.all(
    agents.map(async (agent) => {
      if (!agent.bin) return (runs[agent.name] = { status: "skipped", attempts: [] });
      if (controlStatus !== "pass") return (runs[agent.name] = { status: "blocked", attempts: [] });
      const tries = [];
      for (let i = 0; i < attempts; i++) {
        const dir = join(briefDir, `${agent.name}-${i}`);
        cloneProject(template.dir, dir);
        log(`${brief.id}: ${agent.label}, attempt ${i + 1}`);
        const result = await runAgent(agent, {
          cwd: dir,
          prompt: taskFor(brief),
          timeoutMs: agentTimeout,
          logFile: join(logDir, `${agent.name}-${i}.jsonl`),
        });
        const graded = await gradeRun({
          brief,
          template,
          dir,
          control,
          port: port(),
          browser,
          shotFile: join(shotsDir, `${agent.name}-${i}-${safe(brief.id)}.jpg`),
          logDir,
          label: `${agent.name}-${i}`,
        });
        if (graded.shot && brief.reference && judgeReady) {
          const verdict = await judge({
            brief,
            shot: graded.shot,
            reference: brief.reference,
            referenceKind: brief.referenceKind,
            model: opts["judge-model"],
            cwd: shotsDir,
          });
          graded.checks.push(verdict.check);
        }
        tries.push({ ...result, checks: graded.checks, shot: graded.shot });
        if (!opts["keep-work"]) rmSync(dir, { recursive: true, force: true });
        if (statusOf(graded.checks) === "pass") break;
      }
      const first = statusOf(tries[0].checks);
      const last = statusOf(tries.at(-1).checks);
      runs[agent.name] = { status: first === "pass" ? "pass" : last === "pass" ? "flaky" : "fail", attempts: tries };
      log(`${brief.id}: ${agent.label} ${runs[agent.name].status}`);
    }),
  );
  if (!opts["keep-work"]) rmSync(briefDir, { recursive: true, force: true });

  return {
    id: brief.id,
    name: brief.name,
    kind: brief.kind,
    flavor: brief.flavor,
    reason: reasonOf(brief.id),
    install: brief.install.command,
    prompt: taskFor(brief),
    reference: brief.reference ?? null,
    referenceKind: brief.referenceKind ?? null,
    control: { status: controlStatus, attempts: controlAttempts },
    runs,
  };
}

// A crash inside one brief (a clone that fails, a browser that dies) is
// reported as that brief's failure instead of ending the sweep.
async function sweepSafely(brief) {
  try {
    return await sweep(brief);
  } catch (error) {
    log(`${brief.id}: harness error: ${error.message.split("\n")[0]}`);
    return {
      id: brief.id,
      name: brief.name,
      kind: brief.kind,
      flavor: brief.flavor,
      reason: reasonOf(brief.id),
      install: brief.install.command,
      prompt: taskFor(brief),
      reference: brief.reference ?? null,
      referenceKind: brief.referenceKind ?? null,
      control: { status: "fail", attempts: [{ checks: [{ id: "harness", pass: false, detail: error.stack ?? String(error) }], ms: 0 }] },
      runs: Object.fromEntries(agents.map((a) => [a.name, { status: a.bin ? "blocked" : "skipped", attempts: [] }])),
    };
  }
}

let swept;
try {
  swept = await pool(chosen, Number(opts.concurrency), sweepSafely);
} finally {
  await browser.close();
  if (!opts["keep-work"]) rmSync(workDir, { recursive: true, force: true });
}

const results = {
  schema: 1,
  week,
  startedAt,
  finishedAt: Date.now(),
  shadcnVersion,
  judgeModel: judgeReady ? opts["judge-model"] : null,
  agents: agents.map(({ name, label, bin, version, problem }) => ({ name, label, bin, version, problem })),
  selection,
  briefs: swept,
};
const changes = compare(results, previousResults(resultsRoot, stamp));
writeFileSync(join(resultsDir, "results.json"), JSON.stringify(results, null, 2));
writeFileSync(join(resultsDir, "summary.md"), summaryMarkdown(results, changes) + "\n");
writeFileSync(join(resultsDir, "report.html"), reportHtml(results, changes));
log(`report: ${join(resultsDir, "report.html")}`);
log(`summary: ${join(resultsDir, "summary.md")}`);

/** Installed Chrome first, then any Chromium playwright downloaded. */
async function launchBrowser() {
  for (const options of [{ channel: "chrome" }, {}]) {
    try {
      return await chromium.launch(options);
    } catch {
      // Try the next one.
    }
  }
  throw new Error("No Chromium to launch: install Chrome or run `npx playwright install chromium`.");
}
