// What the weekly dependency watch looks at, in 4 tiers:
//
//   shipped   packages the registry installs into people's apps. Installers
//             get the newest version the registry range allows, whatever the
//             site's lockfile says, so these matter most.
//   env       what `shadcn@latest init -t next` gives installers to run them
//             in: the shadcn CLI, Next, React, Tailwind, TypeScript.
//   site      the site's other runtime packages.
//   tooling   the site's other dev packages.
//
// For each package: the site's locked version, the registry range, the latest
// release, every release since the locked one (with dates, flagging the ones
// from the last --days days), and where its release notes live. Shipped
// packages also get a usage map: which registry files import them, and which
// subpaths and names.
//
//   node scripts/deps-watch/inventory.mjs [--days 8] [--json out.json] [--md out.md]
import { execFile } from "node:child_process";
import { readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";

// fileURLToPath, not .pathname: a checkout path with a space stays a path.
const ROOT = fileURLToPath(new URL("../..", import.meta.url));
const { values: opts } = parseArgs({
  options: {
    days: { type: "string", default: "8" },
    json: { type: "string" },
    md: { type: "string" },
  },
});
const days = Number(opts.days);
const since = Date.now() - days * 86400000;

const ENV = ["shadcn", "next", "react", "react-dom", "tailwindcss", "typescript"];

const readJson = (path) => JSON.parse(readFileSync(join(ROOT, path), "utf8"));
const registry = readJson("registry.json");
const pkg = readJson("package.json");
const lock = readJson("package-lock.json");

/** "@scope/name@^1.2.0" -> { name: "@scope/name", range: "^1.2.0" } */
function splitSpec(spec) {
  const at = spec.lastIndexOf("@");
  return at > 0 ? { name: spec.slice(0, at), range: spec.slice(at + 1) } : { name: spec, range: null };
}

// Shipped packages, with the range and the items that list them.
const shipped = new Map();
for (const item of registry.items) {
  for (const spec of item.dependencies ?? []) {
    const { name, range } = splitSpec(spec);
    const entry = shipped.get(name) ?? { ranges: new Set(), items: [] };
    entry.ranges.add(range ?? "latest");
    entry.items.push(item.name);
    shipped.set(name, entry);
  }
}

function tierOf(name) {
  if (shipped.has(name)) return "shipped";
  if (ENV.includes(name)) return "env";
  if (pkg.dependencies?.[name]) return "site";
  return "tooling";
}

const names = [
  ...new Set([...shipped.keys(), ...ENV, ...Object.keys(pkg.dependencies ?? {}), ...Object.keys(pkg.devDependencies ?? {})]),
];

// Usage map: every import of a shipped package under registry/.
function walk(dir) {
  return readdirSync(dir).flatMap((entry) => {
    const path = join(dir, entry);
    return statSync(path).isDirectory() ? walk(path) : /\.(tsx?|mjs)$/.test(entry) ? [path] : [];
  });
}
const IMPORT = /import\s+(type\s+)?([\s\S]*?)\s+from\s+["']([^"']+)["']/g;
const usage = new Map();
for (const file of walk(join(ROOT, "registry"))) {
  const source = readFileSync(file, "utf8");
  for (const [, , what, from] of source.matchAll(IMPORT)) {
    const name = from.startsWith("@") ? from.split("/").slice(0, 2).join("/") : from.split("/")[0];
    if (!shipped.has(name)) continue;
    const entry = usage.get(name) ?? new Map();
    const key = from === name ? "." : from.slice(name.length + 1);
    const imported = what
      .replace(/[{}\n]/g, " ")
      .split(",")
      .map((s) => s.trim().replace(/^type\s+/, "").split(/\s+as\s+/)[0])
      .filter(Boolean);
    const sub = entry.get(key) ?? { files: new Set(), names: new Set() };
    sub.files.add(relative(ROOT, file));
    imported.forEach((n) => sub.names.add(n));
    entry.set(key, sub);
    usage.set(name, entry);
  }
}

function npmView(name) {
  return new Promise((resolve) => {
    execFile("npm", ["view", name, "time", "version", "repository.url", "--json"], { maxBuffer: 32 * 1024 * 1024 }, (error, stdout) => {
      if (error) return resolve({ error: error.message.split("\n")[0] });
      try {
        resolve(JSON.parse(stdout));
      } catch {
        resolve({ error: "unreadable npm view output" });
      }
    });
  });
}

const parse = (v) => v.split("-")[0].split(".").map(Number);
function gap(from, to) {
  if (!from || !to) return null;
  const [a, b] = [parse(from), parse(to)];
  if (a[0] !== b[0] || (a[0] === 0 && a[1] !== b[1])) return "major";
  if (a[1] !== b[1]) return "minor";
  if (a[2] !== b[2]) return "patch";
  return null;
}
function newer(a, b) {
  const [x, y] = [parse(a), parse(b)];
  for (let i = 0; i < 3; i++) if (x[i] !== y[i]) return x[i] > y[i];
  return false;
}
function notesUrl(repo) {
  const m = /github\.com[/:]([^/]+)\/([^/.#]+)/.exec(repo ?? "");
  return m ? `https://github.com/${m[1]}/${m[2]}/releases` : null;
}

async function inspect(name) {
  const site = lock.packages?.[`node_modules/${name}`]?.version ?? null;
  const view = await npmView(name);
  const entry = shipped.get(name);
  const base = {
    name,
    tier: tierOf(name),
    site,
    range: entry ? [...entry.ranges].join(" ") : null,
    shippedBy: entry ? entry.items.length : 0,
    usage: usage.has(name)
      ? Object.fromEntries(
          [...usage.get(name)].map(([sub, { files, names }]) => [sub, { files: [...files].sort(), names: [...names].sort() }]),
        )
      : undefined,
  };
  if (view.error) return { ...base, error: view.error };
  const latest = view.version;
  const releases = Object.entries(view.time ?? {})
    .filter(([v]) => /^\d+\.\d+\.\d+$/.test(v) && (!site || newer(v, site)))
    .map(([version, date]) => ({ version, date: date.slice(0, 10), thisWeek: Date.parse(date) >= since }))
    .sort((a, b) => (newer(a.version, b.version) ? 1 : -1));
  return { ...base, latest, gap: gap(site, latest), releases, notes: notesUrl(view["repository.url"]) };
}

// npm view, 8 at a time.
const results = [];
for (let i = 0; i < names.length; i += 8) {
  results.push(...(await Promise.all(names.slice(i, i + 8).map(inspect))));
}
const order = ["shipped", "env", "site", "tooling"];
results.sort((a, b) => order.indexOf(a.tier) - order.indexOf(b.tier) || a.name.localeCompare(b.name));

const report = {
  generatedAt: new Date().toISOString(),
  days,
  packages: results,
};

const row = (p) => {
  const week = (p.releases ?? []).filter((r) => r.thisWeek).map((r) => r.version);
  const range = p.tier === "shipped" && p.range === "latest" ? "unpinned" : (p.range ?? "");
  return `| ${p.name} | ${p.tier} | ${p.site ?? "-"} | ${range} | ${p.error ? `error: ${p.error}` : p.latest} | ${p.gap ?? ""} | ${(p.releases ?? []).length || ""} | ${week.join(", ")} | ${p.shippedBy || ""} |`;
};
const behind = results.filter((p) => p.gap);
const fresh = results.filter((p) => (p.releases ?? []).some((r) => r.thisWeek));
const md = [
  `# Dependency inventory, ${report.generatedAt.slice(0, 10)}`,
  "",
  `${results.length} packages, ${behind.length} behind latest, ${fresh.length} with a release in the last ${days} days. "unpinned" means installers get whatever is newest.`,
  "",
  "| Package | Tier | Site | Registry range | Latest | Gap | Releases since site | New this week | Items shipping it |",
  "|---|---|---|---|---|---|---|---|---|",
  ...results.map(row),
  "",
].join("\n");

if (opts.json) writeFileSync(opts.json, JSON.stringify(report, null, 2));
if (opts.md) writeFileSync(opts.md, md);
if (!opts.json && !opts.md) process.stdout.write(md);
