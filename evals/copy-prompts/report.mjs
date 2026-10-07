// The weekly report: a self-contained HTML page (screenshots of anything
// that failed are embedded, so the file can be sent as is) and a short
// Markdown summary for the chat message that carries it.
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const MARK = { pass: "✓", flaky: "~", fail: "✗", unverified: "?", blocked: "○", skipped: "–" };

/** Most recent earlier results.json in the results folder, if any. */
export function previousResults(resultsRoot, currentStamp) {
  if (!existsSync(resultsRoot)) return null;
  const stamps = readdirSync(resultsRoot)
    .filter((d) => d < currentStamp && existsSync(join(resultsRoot, d, "results.json")))
    .sort();
  const last = stamps.at(-1);
  return last ? JSON.parse(readFileSync(join(resultsRoot, last, "results.json"), "utf8")) : null;
}

/** Cells whose status changed since the previous sweep, for briefs both
 *  sweeps ran. An unverified cell is neither broken nor fixed: nobody knows. */
export function compare(results, previous) {
  const changes = { broke: [], fixed: [] };
  if (!previous) return changes;
  const before = new Map(previous.briefs.map((b) => [b.id, b]));
  const unknown = (s) => !s || s === "skipped" || s === "unverified";
  for (const brief of results.briefs) {
    const old = before.get(brief.id);
    if (!old) continue;
    for (const col of ["control", ...results.agents.map((a) => a.name)]) {
      const now = cellStatus(brief, col);
      const then = cellStatus(old, col);
      if (unknown(now) || unknown(then)) continue;
      const bad = (s) => s === "fail" || s === "blocked";
      if (bad(now) && !bad(then)) changes.broke.push(`${brief.id} (${col})`);
      if (!bad(now) && bad(then)) changes.fixed.push(`${brief.id} (${col})`);
    }
  }
  return changes;
}

function cellStatus(brief, col) {
  return col === "control" ? brief.control?.status : brief.runs?.[col]?.status;
}

/** The check that left a run unverified: not advisory, and no answer. */
function unansweredCheck(run) {
  return run?.attempts?.at(-1)?.checks.find((c) => !c.advisory && c.pass !== true && c.pass !== false);
}

export function tally(results) {
  const cols = ["control", ...results.agents.map((a) => a.name)];
  return Object.fromEntries(
    cols.map((col) => {
      const counts = { pass: 0, flaky: 0, fail: 0, unverified: 0, blocked: 0, skipped: 0 };
      for (const b of results.briefs) {
        const s = cellStatus(b, col);
        if (s) counts[s]++;
      }
      return [col, counts];
    }),
  );
}

/** Passing runs that took an agent far longer than its usual pass. A brief
 *  that makes agents work around it (a wrong import path they have to find
 *  and fix) still passes, and its time is the only sign. */
export function slowPasses(results, { ratio = 1.75, minRuns = 3 } = {}) {
  const slow = [];
  for (const a of results.agents) {
    const passes = results.briefs
      .map((b) => ({ id: b.id, run: b.runs[a.name] }))
      .filter(({ run }) => run?.status === "pass")
      .map(({ id, run }) => ({ id, ms: run.attempts[0].ms }));
    if (passes.length < minRuns) continue;
    const sorted = passes.map((p) => p.ms).sort((x, y) => x - y);
    const median = sorted[Math.floor(sorted.length / 2)];
    for (const p of passes) {
      if (p.ms >= ratio * median) slow.push({ id: p.id, agent: a.label, s: Math.round(p.ms / 1000), median: Math.round(median / 1000) });
    }
  }
  return slow;
}

/** What needs looking at, most actionable first: a broken install or build
 *  with no agent involved is ours to fix; a brief two or more agents fail
 *  is probably unclear; a single agent failing may be that agent, and an
 *  unverified run may hide a broken page; a slow pass may hide a brief the
 *  agent had to work around. */
export function attention(results) {
  const items = slowPasses(results).map((p) => ({
    level: 3,
    id: p.id,
    text: `Passes on ${p.agent} but took ${p.s}s against a typical ${p.median}s: read the transcript for a workaround`,
  }));
  for (const b of results.briefs) {
    const lint = b.control.attempts.at(-1)?.checks.find((c) => c.id === "lint" && c.pass === false);
    if (lint) items.push({ level: 4, id: b.id, text: `Installed files fail the stock ESLint config: ${lint.detail.split(" problems")[0]} problems` });
    if (b.control.status === "fail") {
      const failed = b.control.attempts.at(-1).checks.filter((c) => c.pass === false && !c.advisory);
      items.push({ level: 0, id: b.id, text: `Fails with no agent: ${failed.map((c) => c.id).join(", ")}` });
      continue;
    }
    const failing = results.agents.filter((a) => b.runs[a.name]?.status === "fail").map((a) => a.label);
    if (failing.length >= 2) items.push({ level: 1, id: b.id, text: `Fails on ${failing.join(", ")}` });
    else if (failing.length === 1) items.push({ level: 2, id: b.id, text: `Fails on ${failing[0]} only` });
    const unverified = results.agents.filter((a) => b.runs[a.name]?.status === "unverified");
    if (unverified.length) {
      const why = unansweredCheck(b.runs[unverified[0].name])?.detail ?? "";
      const reason = why.startsWith("judge gave no verdict") ? "the screenshot judge gave no verdict" : why || "no screenshot verdict";
      items.push({
        level: 2,
        id: b.id,
        text: `Unverified on ${unverified.map((a) => a.label).join(", ")}: ${reason}, so nothing checked the page`,
      });
    }
  }
  return items.sort((a, b) => a.level - b.level || a.id.localeCompare(b.id));
}

export function summaryMarkdown(results, changes) {
  const counts = tally(results);
  const agentLine = results.agents
    .map((a) =>
      a.bin
        ? `${a.label} ${counts[a.name].pass + counts[a.name].flaky}/${results.briefs.length - counts[a.name].blocked}${
            counts[a.name].unverified ? ` (${counts[a.name].unverified} unverified)` : ""
          }`
        : `${a.label} ${a.problem ?? "not installed"}`,
    )
    .join(", ");
  const passing = [`no agent ${counts.control.pass}/${results.briefs.length}`, agentLine].filter(Boolean).join(", ");
  const lines = [`**Copy-prompt sweep, week ${results.week}:** ${results.briefs.length} ${results.briefs.length === 1 ? "brief" : "briefs"}. Passing: ${passing}.`];
  const items = attention(results);
  if (items.length) {
    lines.push("", "Needs a look:");
    for (const item of items.slice(0, 8)) lines.push(`- \`${item.id}\`: ${item.text}`);
    if (items.length > 8) lines.push(`- and ${items.length - 8} more in the report`);
  } else {
    lines.push("", "Nothing failed.");
  }
  if (changes.broke.length) lines.push("", `Newly failing since last week: ${changes.broke.join(", ")}.`);
  if (changes.fixed.length) lines.push("", `Fixed since last week: ${changes.fixed.join(", ")}.`);
  const flaky = results.briefs.flatMap((b) =>
    results.agents.filter((a) => b.runs[a.name]?.status === "flaky").map((a) => `${b.id} (${a.label})`),
  );
  if (flaky.length) lines.push("", `Passed on the retry: ${flaky.join(", ")}.`);
  return lines.join("\n");
}

const esc = (s) =>
  String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

function img(path, alt) {
  if (!path || !existsSync(path)) return `<div class="noshot">No screenshot</div>`;
  const data = readFileSync(path).toString("base64");
  return `<img alt="${esc(alt)}" src="data:image/jpeg;base64,${data}">`;
}

/** ✓ passed, ✗ failed, ! an advisory failure or a check with no answer, –
 *  skipped because an earlier check failed. */
function checkClass(c) {
  if (c.pass === true) return "ok";
  if (c.pass === false) return c.advisory ? "warn" : "bad";
  return c.advisory || c.detail?.startsWith("skipped") ? "skip" : "warn";
}

function checksList(checks) {
  return `<ul class="checks">${checks
    .map(
      (c) =>
        `<li class="${checkClass(c)}"><b>${esc(c.id)}</b>${c.advisory ? " (advisory)" : ""}${
          c.detail ? `<pre>${esc(c.detail)}</pre>` : ""
        }</li>`,
    )
    .join("")}</ul>`;
}

export function reportHtml(results, changes) {
  const counts = tally(results);
  const cols = [{ name: "control", label: "No agent" }, ...results.agents];
  const items = attention(results);
  const head = cols
    .map((c) => {
      const n = counts[c.name];
      const sub =
        c.name !== "control" && !c.bin
          ? (c.problem ?? "not installed")
          : `${n.pass + n.flaky} pass · ${n.fail} fail${n.unverified ? ` · ${n.unverified} unverified` : ""}`;
      return `<th>${esc(c.label)}<span>${esc(sub)}</span></th>`;
    })
    .join("");
  const rows = results.briefs
    .map((b) => {
      const cells = cols
        .map((c) => {
          const s = cellStatus(b, c.name) ?? "skipped";
          const linked = s === "fail" || s === "flaky" || s === "unverified";
          const mark = `<span class="m ${s}" title="${s}">${MARK[s]}</span>`;
          return `<td>${linked ? `<a href="#${esc(b.id)}-${c.name}">${mark}</a>` : mark}</td>`;
        })
        .join("");
      return `<tr><th scope="row"><code>${esc(b.id)}</code><span class="why">${esc(b.reason)}</span></th>${cells}</tr>`;
    })
    .join("");

  const details = results.briefs
    .flatMap((b) => {
      const blocks = [];
      const lint = b.control.attempts.at(-1)?.checks.find((c) => c.id === "lint" && c.pass === false);
      if (b.control.status !== "fail" && lint) {
        blocks.push(`<section id="${esc(b.id)}-lint"><h3><code>${esc(b.id)}</code> lint</h3>
          <p class="meta">The installed files, checked with the fresh project's own <code>eslint.config.mjs</code>. Advisory: it never fails the brief.</p>
          ${checksList([lint])}</section>`);
      }
      if (b.control.status === "fail") {
        blocks.push(`<section id="${esc(b.id)}-control"><h3><code>${esc(b.id)}</code> with no agent</h3>
          <p class="meta">Ran <code>${esc(b.install)}</code> in a fresh ${esc(b.flavor)} project.</p>
          ${checksList(b.control.attempts.at(-1).checks)}</section>`);
      }
      for (const a of results.agents) {
        const r = b.runs[a.name];
        if (!r || !["fail", "flaky", "unverified"].includes(r.status)) continue;
        const last = r.attempts.at(-1);
        const shown = r.status === "flaky" ? r.attempts[0] : last;
        const retried =
          r.attempts.length < 2
            ? ""
            : r.status === "flaky"
              ? "first attempt shown; the retry passed"
              : r.status === "unverified"
                ? "the first attempt failed; the retry is shown"
                : "failed twice; last attempt shown";
        blocks.push(`<section id="${esc(b.id)}-${a.name}"><h3><code>${esc(b.id)}</code> on ${esc(a.label)} <span class="m ${r.status}">${r.status}</span></h3>
          <p class="meta">${[shown.model, `${Math.round(shown.ms / 1000)}s`, shown.turns ? `${shown.turns} turns` : "", shown.costUsd != null ? `$${shown.costUsd.toFixed(2)}` : "", shown.timedOut ? "timed out" : "", retried].filter(Boolean).map(esc).join(" · ")}</p>
          ${checksList(shown.checks)}
          <div class="shots"><figure>${img(shown.shot, "Agent's page")}<figcaption>Agent's page</figcaption></figure><figure>${img(b.reference, "Reference")}<figcaption>Reference${b.referenceKind === "control" ? " (no-agent render)" : " (docs demo)"}</figcaption></figure></div>
          ${shown.tail ? `<details><summary>End of the agent's output</summary><pre>${esc(shown.tail)}</pre></details>` : ""}
        </section>`);
      }
      return blocks;
    })
    .join("");

  const attentionHtml = items.length
    ? `<ul class="attention">${items.map((i) => `<li class="l${i.level}"><code>${esc(i.id)}</code> ${esc(i.text)}</li>`).join("")}</ul>`
    : `<p>Nothing failed this week.</p>`;
  const changeHtml = [
    changes.broke.length ? `<p><b>Newly failing:</b> ${changes.broke.map(esc).join(", ")}</p>` : "",
    changes.fixed.length ? `<p><b>Fixed:</b> ${changes.fixed.map(esc).join(", ")}</p>` : "",
  ].join("");
  const agentsMeta = results.agents
    .map((a) => (a.bin ? `${a.label} ${a.version}` : `${a.label} (${a.problem ?? "not installed"})`))
    .join(" · ");

  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Copy-Prompt Sweep</title>
<style>
:root{--bg:#fff;--fg:#18181b;--muted:#71717a;--line:#e4e4e7;--card:#fafafa;--ok:#15803d;--bad:#b91c1c;--warn:#b45309;--skip:#a1a1aa;color-scheme:light dark}
@media (prefers-color-scheme:dark){:root:not([data-theme="light"]){--bg:#0b0b0c;--fg:#f4f4f5;--muted:#a1a1aa;--line:#27272a;--card:#141416;--ok:#4ade80;--bad:#f87171;--warn:#fbbf24;--skip:#52525b}}
:root[data-theme="dark"]{--bg:#0b0b0c;--fg:#f4f4f5;--muted:#a1a1aa;--line:#27272a;--card:#141416;--ok:#4ade80;--bad:#f87171;--warn:#fbbf24;--skip:#52525b}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--fg);font:14px/1.5 ui-sans-serif,system-ui,-apple-system,"Inter",sans-serif}
main{max-width:1040px;margin:0 auto;padding:32px 16px 64px}h1{font-size:22px;margin:0 0 4px}h2{font-size:16px;margin:32px 0 8px}h3{font-size:14px;margin:0 0 4px}
.meta{color:var(--muted);margin:0 0 8px}code{font:12px ui-monospace,SFMono-Regular,Menlo,monospace}
.wrap{overflow-x:auto;border:1px solid var(--line);border-radius:10px}table{border-collapse:collapse;width:100%;min-width:520px}
th,td{padding:6px 10px;border-bottom:1px solid var(--line);text-align:center}thead th{font-weight:600;font-size:13px;vertical-align:bottom}thead th span{display:block;color:var(--muted);font-weight:400;font-size:12px}
tbody th{text-align:left;font-weight:400}tbody tr:last-child>*{border-bottom:0}.why{color:var(--muted);font-size:12px;margin-left:8px}
.m{font-weight:700}.m.pass{color:var(--ok)}.m.fail{color:var(--bad)}.m.flaky,.m.unverified{color:var(--warn)}.m.blocked,.m.skipped{color:var(--skip)}a{color:inherit}
.attention{padding-left:18px}.attention .l0::marker{color:var(--bad)}section{border:1px solid var(--line);border-radius:10px;padding:16px;margin:12px 0;background:var(--card)}
.checks{list-style:none;padding:0;margin:8px 0}.checks li{padding:2px 0}.checks li::before{display:inline-block;width:18px;font-weight:700}
.checks .ok::before{content:"✓";color:var(--ok)}.checks .bad::before{content:"✗";color:var(--bad)}.checks .skip::before{content:"–";color:var(--skip)}.checks .warn::before{content:"!";color:var(--warn)}
pre{white-space:pre-wrap;word-break:break-word;font:12px/1.45 ui-monospace,Menlo,monospace;color:var(--muted);margin:2px 0 6px 18px;max-height:240px;overflow:auto}
.shots{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:12px;margin-top:8px}figure{margin:0}figure img{width:100%;border:1px solid var(--line);border-radius:6px;display:block}
figcaption{color:var(--muted);font-size:12px;margin-top:4px}.noshot{border:1px dashed var(--line);border-radius:6px;padding:24px;text-align:center;color:var(--muted)}
details summary{cursor:pointer;color:var(--muted);margin-top:8px}
</style></head><body><main>
<h1>Copy-prompt sweep, week ${results.week}</h1>
<p class="meta">${esc(new Date(results.startedAt).toDateString())} · ${results.briefs.length} briefs · ${Math.round((results.finishedAt - results.startedAt) / 60000)} min · shadcn ${esc(results.shadcnVersion)} · ${esc(agentsMeta)}${results.judgeModel ? ` · judge: ${esc(results.judgeModel)}` : " · no screenshot judge"}${results.selection.rankingError ? ` · install ranking unavailable (${esc(results.selection.rankingError)}), rotation only` : ""}</p>
<h2>Needs a look</h2>${attentionHtml}${changeHtml}
<h2>All runs</h2>
<p class="meta">✓ pass · ~ passed on the retry · ✗ failed twice · ○ not run, the no-agent run failed · – agent not available. Top: most installed, every week. Rotation: the rest, once every ${results.selection.buckets} weeks.</p>
<div class="wrap"><table><thead><tr><th></th>${head}</tr></thead><tbody>${rows}</tbody></table></div>
${details ? `<h2>Details</h2>${details}` : ""}
</main></body></html>`;
}
