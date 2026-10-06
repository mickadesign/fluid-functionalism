// Which briefs run this week: the most-installed ones every week, the rest
// in a fixed rotation so every brief runs at least once per cycle.
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";

/** ISO 8601 week number, so the rotation turns over on Mondays. */
export function isoWeek(date = new Date()) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const day = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
}

/** Interleaved buckets over the sorted ids: brief i runs in the weeks where
 *  week % buckets === i % buckets. */
export function rotationSlice(ids, { buckets, week }) {
  const bucket = week % buckets;
  return [...ids].sort().filter((_, i) => i % buckets === bucket);
}

/** Maps "Registry fetch" rows ({ item, visitors }) onto brief ids. The flat
 *  URL is the Radix flavor (`button`), `base/x` and `radix/x` are explicit,
 *  and an item with one payload maps to its only brief. Systems and presets
 *  are left out: every component install fetches springs, use-fluid-hover
 *  and friends as dependencies, so their counts say nothing about how often
 *  anyone copies their page's prompt. */
export function rankBriefs(rows, briefs) {
  const byInstall = new Map();
  for (const brief of briefs) {
    if (brief.kind !== "doc" || brief.system) continue;
    byInstall.set(`${brief.installSlug}@${brief.flavor}`, brief.id);
  }
  const totals = new Map();
  for (const { item, visitors } of rows) {
    const [, prefix, name] = /^(?:(base|radix)\/)?(.+)$/.exec(item) ?? [];
    if (!name) continue;
    const id =
      prefix === "base"
        ? byInstall.get(`${name}@base`)
        : (byInstall.get(`${name}@radix`) ?? (prefix ? undefined : byInstall.get(`${name}@base`)));
    if (id) totals.set(id, (totals.get(id) ?? 0) + visitors);
  }
  return [...totals.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
}

export function selectWeek({ briefs, ranked, top, buckets, week }) {
  const topIds = ranked.slice(0, top).map(([id]) => id);
  const taken = new Set(topIds);
  const rotation = rotationSlice(
    briefs.map((b) => b.id),
    { buckets, week },
  ).filter((id) => !taken.has(id));
  return { top: topIds, rotation };
}

/** The linked Vercel project, read from `.vercel/project.json` in this
 *  checkout or the main one (worktrees don't carry it), so no ids live in
 *  the repo. */
function vercelProject(root) {
  const candidates = [join(root, ".vercel/project.json")];
  try {
    const common = execFileSync("git", ["rev-parse", "--git-common-dir"], { cwd: root, encoding: "utf8" }).trim();
    candidates.push(join(dirname(resolve(root, common)), ".vercel/project.json"));
  } catch {
    // Not a git checkout: only the local link counts.
  }
  const file = candidates.find((f) => existsSync(f));
  if (!file) return null;
  const { projectId, orgId } = JSON.parse(readFileSync(file, "utf8"));
  return { projectId, teamId: orgId };
}

/** Unique CLI installers per registry item over the last `days`, from the
 *  "Registry fetch" event middleware.ts records. Needs a logged-in `vercel`
 *  CLI. Returns null when the numbers can't be read. */
export function fetchInstallRows({ root, days = 28 }) {
  const project = vercelProject(root);
  if (!project) return { rows: null, error: "no linked Vercel project (.vercel/project.json)" };
  const until = Date.now();
  const since = until - days * 86400000;
  const filter = encodeURIComponent("eventName eq 'Registry fetch' and eventData/client eq 'cli'");
  const path =
    `/v1/query/web-analytics/events/aggregate?projectId=${project.projectId}&teamId=${project.teamId}` +
    `&by=eventData/item&since=${since}&until=${until}&limit=100&filter=${filter}`;
  try {
    const out = execFileSync("vercel", ["api", path, "--raw"], {
      cwd: root,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
      timeout: 60000,
    });
    const json = JSON.parse(out.slice(out.indexOf("{")));
    return {
      rows: json.data.map((row) => ({ item: row["eventData/item"], visitors: row.visitors })),
      error: null,
    };
  } catch (error) {
    // The CLI prints a beta banner first; the useful line starts with Error.
    const lines = String(error.stderr || error.message).split("\n").filter(Boolean);
    return { rows: null, error: lines.find((l) => l.startsWith("Error")) ?? lines.at(-1) };
  }
}
