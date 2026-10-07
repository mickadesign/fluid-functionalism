#!/usr/bin/env node
// Read a project's stack the way the stack audit needs it: fresh, on every run.
//
// Every fact the audit turns on can be read back from the project in well
// under a second: the versions FF needs, the flavor verdict, the two silent
// quality killers (MotionConfig, Inter's opsz axis), and which FF pieces are
// already installed. Reading them again each run means no cached verdict can
// drift from the code, so the skill never has to leave a record in the
// project. This prints what it read, with the file:line it read it from, and
// writes nothing.
//
// It reports facts. What each one costs the interface, and whether it is
// worth raising, lives in references/stack-audit.md.
//
//   node scripts/stack.mjs                 # the current directory
//   node scripts/stack.mjs apps/web --json
//
// No dependencies: plain Node 18+.

import { existsSync, readFileSync, readdirSync, realpathSync, statSync } from "node:fs";
import { basename, dirname, extname, isAbsolute, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

/** Modules only FF ships. A file that is one of these, or imports one, is FF
 *  code (or code written against FF's system); stock shadcn never uses them. */
export const FF_MODULES = [
  "springs",
  "use-fluid-hover",
  "fluid-hover-highlight",
  "font-weight",
  "size-context",
  "type-scale",
  "shape-context",
  "surface-context",
  "surface-classes",
  "elevated",
  "icon-context",
  "use-touch-primary",
  "use-keyboard-nav-gate",
  "use-merge-split",
];

/** Files that install under their own names beside the catalog items: parts
 *  of an item (dropdown brings menu-item, the sidebar blocks bring their
 *  pieces, one folder down) and shared modules too generic a name to
 *  fingerprint FF code by (popup, omit). */
export const FF_PARTS = [
  "popup",
  "omit",
  "menu-item",
  "dropdown-search",
  "dropdown-sub",
  "sidebar-core",
  "sidebar-menu",
  "sidebar-menu-grid",
  "workspace-header",
  "user-footer",
  "search-field",
  "inset-topbar",
  "app-sidebar",
  "nav-data",
  "settings-dialog",
];

/** Single-source items that import @base-ui/react under both flavors, so a
 *  Radix project that installs one gets Base UI code that says nothing
 *  about its flavor. Never flavor evidence. */
export const SHARED_BASE_UI = ["ask-user-questions", "color-picker", "input-group"];

/** Lowest major each requirement accepts. */
export const REQUIRED_MAJOR = { react: 19, tailwindcss: 4, "framer-motion": 12 };

const FF_IMPORT = new RegExp(`(^|/)(${FF_MODULES.join("|")})$`);
const BASE_IMPORT = /^@base-ui(-components)?\/react($|\/)/;
const RADIX_IMPORT = /^(@radix-ui\/react-|radix-ui($|\/))/;

// Product code only: tests and stories are not what people use, and fixtures
// in them (a template that loads Inter, say) would read as the app's own.
const SKIP_DIRS = new Set([
  "node_modules", ".git", ".next", ".turbo", ".vercel", ".output", ".cache",
  ".svelte-kit", ".agents", ".claude", "dist", "build", "out", "coverage",
  "public", "storybook-static", "__tests__", "__mocks__", "tests", "e2e",
]);
const NOT_PRODUCT = /\.(test|spec|stories)\.[cm]?[jt]sx?$/;
const SOURCE_EXT = new Set([".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs", ".css", ".html"]);
const MAX_FILES = 8000;
const MAX_BYTES = 400_000;

/** "^19.1.0" → 19; "workspace:*", "latest" → null. */
export function parseMajor(version) {
  const m = String(version ?? "").match(/(\d+)(?:\.\d+)?/);
  return m ? Number(m[1]) : null;
}

/** Every module specifier a source file imports, re-exports, or requires. */
export function importsOf(text) {
  return [...text.matchAll(/(?:\bfrom\s*|\bimport\s*\(?\s*|\brequire\s*\(\s*)["']([^"'\n]+)["']/g)].map(
    (m) => m[1],
  );
}

export const isFluidFile = (name, imports) =>
  FF_MODULES.includes(name) || imports.some((s) => FF_IMPORT.test(s));

/** The flavor verdict, in order of authority: FF components already
 *  installed (they are what every later install has to match), then the
 *  primitives package.json depends on, then which side the app's own code
 *  imports more. The same project always gets the same verdict, which is
 *  what keeps flavors from mixing across sessions without a cached one.
 *  `shared` lists installed SHARED_BASE_UI files: they bring @base-ui/react
 *  into Radix projects too, so neither they nor that dependency count. */
export function flavorVerdict({ deps, fluid, app, shared = [] }) {
  const list = (files) => files.slice(0, 3).join(", ") + (files.length > 3 ? ` (+${files.length - 3})` : "");
  if (fluid.base.length && fluid.radix.length)
    return {
      flavor: "mixed",
      open: false,
      reason: `installed FF components already use both flavors: Base UI in ${list(fluid.base)}; Radix in ${list(fluid.radix)}`,
    };
  if (fluid.base.length)
    return { flavor: "base", open: false, reason: `installed FF components import @base-ui/react: ${list(fluid.base)}` };
  if (fluid.radix.length)
    return { flavor: "radix", open: false, reason: `installed FF components import Radix: ${list(fluid.radix)}` };

  const baseDep = deps.some((d) => BASE_IMPORT.test(d));
  // With no app code importing it, a Base UI dependency beside a shared item
  // may be there only because that item brought it.
  const sharedOnly = baseDep && !app.base.length && shared.length > 0;
  const hasBase = baseDep && !sharedOnly;
  const hasRadix = deps.some((d) => RADIX_IMPORT.test(d));
  const sharedNote = `@base-ui/react is only imported by ${list(shared)}, which ${shared.length === 1 ? "ships" : "ship"} it under both flavors`;
  if (hasBase && !hasRadix) return { flavor: "base", open: false, reason: "package.json depends on @base-ui/react" };
  if (hasRadix && !hasBase)
    return { flavor: "radix", open: false, reason: `package.json depends on Radix${sharedOnly ? `; ${sharedNote}` : ""}` };
  if (hasBase && hasRadix) {
    const lean = app.base.length > app.radix.length ? "base" : "radix";
    return {
      flavor: lean,
      open: false,
      mixedPrimitives: true,
      reason: `package.json has both; app code imports Base UI in ${app.base.length} file(s), Radix in ${app.radix.length}, so ${lean}. Worth consolidating`,
    };
  }
  if (sharedOnly)
    return { flavor: "radix", open: true, reason: `${sharedNote}: Radix by default, but ask the user before the first flavored install` };
  return { flavor: "radix", open: true, reason: "no primitives yet: Radix by default, open until the first one lands" };
}

// ---------------------------------------------------------------------------

function readText(path) {
  try {
    return readFileSync(path, "utf8");
  } catch {
    return null;
  }
}

function readJsonc(path) {
  const text = readText(path);
  if (text === null) return null;
  let out = "";
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === '"') {
      let j = i + 1;
      while (j < text.length && text[j] !== '"') j += text[j] === "\\" ? 2 : 1;
      out += text.slice(i, j + 1);
      i = j;
    } else if (c === "/" && text[i + 1] === "/") {
      while (i < text.length && text[i] !== "\n") i++;
      out += "\n";
    } else if (c === "/" && text[i + 1] === "*") {
      i = text.indexOf("*/", i + 2);
      if (i === -1) break;
      i++;
    } else out += c;
  }
  try {
    return JSON.parse(out.replace(/,(\s*[}\]])/g, "$1"));
  } catch {
    return null;
  }
}

const lineOf = (text, index) => text.slice(0, index).split("\n").length;

/** The text between a call's parentheses; `open` is the index of "(". */
function callArgs(text, open) {
  let depth = 0;
  for (let i = open; i < text.length; i++) {
    if (text[i] === "(") depth++;
    else if (text[i] === ")" && --depth === 0) return text.slice(open + 1, i);
  }
  return text.slice(open + 1, open + 600);
}

function walk(root) {
  const files = [];
  const visit = (dir) => {
    let entries;
    try {
      entries = readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const e of entries) {
      if (files.length >= MAX_FILES) return;
      const path = join(dir, e.name);
      if (e.isDirectory()) {
        if (!SKIP_DIRS.has(e.name) && !e.name.startsWith(".")) visit(path);
      } else if (SOURCE_EXT.has(extname(e.name)) && !e.name.endsWith(".d.ts") && !NOT_PRODUCT.test(e.name)) {
        try {
          if (statSync(path).size <= MAX_BYTES) files.push(path);
        } catch {}
      }
    }
  };
  visit(root);
  return files;
}

const isFile = (path) => {
  try {
    return statSync(path).isFile();
  } catch {
    return false;
  }
};

/** `dir` and the directories above it, up to the repository root (the one
 *  holding .git) or, outside a repository, the filesystem root. */
function ancestors(dir) {
  const dirs = [];
  for (let d = dir; ; d = dirname(d)) {
    dirs.push(d);
    if (existsSync(join(d, ".git")) || dirname(d) === d) return dirs;
  }
}

/** Where a node_modules package resolved, walking up for hoisted workspaces. */
function installedVersion(root, name) {
  for (const dir of ancestors(root)) {
    const pkg = readJsonc(join(dir, "node_modules", name, "package.json"));
    if (pkg?.version) return pkg.version;
  }
  return null;
}

function packageManager(root, pkg) {
  if (pkg.packageManager) return pkg.packageManager.split("@")[0];
  const locks = [
    ["pnpm-lock.yaml", "pnpm"],
    ["bun.lock", "bun"],
    ["bun.lockb", "bun"],
    ["yarn.lock", "yarn"],
    ["package-lock.json", "npm"],
  ];
  for (const dir of ancestors(root)) {
    const hit = locks.find(([file]) => existsSync(join(dir, file)));
    if (hit) return hit[1];
  }
  return null;
}

/** Where a tsconfig `extends` entry points: a file beside it, or one inside
 *  a package (a shared monorepo config). */
function tsconfigFile(dir, spec) {
  const candidates = (path) => [path, `${path}.json`, join(path, "tsconfig.json")];
  if (spec.startsWith(".") || isAbsolute(spec)) return candidates(resolve(dir, spec)).find(isFile) ?? null;
  for (const d of ancestors(dir)) {
    const hit = candidates(join(d, "node_modules", spec)).find(isFile);
    if (hit) return hit;
  }
  return null;
}

/** A tsconfig's compilerOptions with its `extends` chain applied, the way
 *  tsc reads them: the nearer file's keys win, baseUrl resolves against the
 *  file that sets it, and paths without a baseUrl against the file that
 *  declares them. */
function tsconfigOptions(file, chain = []) {
  if (chain.includes(file)) return null;
  const json = readJsonc(file);
  if (!json) return null;
  const dir = dirname(file);
  const merged = {};
  for (const spec of [json.extends ?? []].flat()) {
    const parent = typeof spec === "string" ? tsconfigFile(dir, spec) : null;
    Object.assign(merged, parent && tsconfigOptions(parent, [...chain, file]));
  }
  const own = json.compilerOptions ?? {};
  if (own.baseUrl) merged.baseUrl = resolve(dir, own.baseUrl);
  if (own.paths) Object.assign(merged, { paths: own.paths, pathsDir: dir });
  return merged;
}

/** Resolves components.json aliases ("@/components/ui") and import
 *  specifiers through tsconfig paths, the way shadcn and the bundler do. */
function resolvers(root) {
  const paths = [];
  for (const name of ["tsconfig.json", "tsconfig.app.json", "jsconfig.json"]) {
    const options = tsconfigOptions(join(root, name));
    if (!options?.paths) continue;
    const base = options.baseUrl ?? options.pathsDir;
    for (const [key, targets] of Object.entries(options.paths)) {
      if (key.endsWith("/*") && targets?.[0])
        paths.push({ prefix: key.slice(0, -1), target: resolve(base, targets[0].replace(/\*$/, "")) });
    }
  }
  const viaPaths = (spec) => {
    const hit = paths.find((p) => spec.startsWith(p.prefix));
    return hit ? join(hit.target, spec.slice(hit.prefix.length)) : null;
  };
  return {
    /** An alias to a directory; without a paths entry, shadcn's src/ guess. */
    alias(alias) {
      const dir = viaPaths(alias);
      if (dir) return { dir, viaPaths: true };
      const rest = alias.replace(/^[^/]*\//, "");
      return { dir: [join(root, "src", rest), join(root, rest)].find((p) => existsSync(p)) ?? join(root, rest), viaPaths: false };
    },
    /** A local import to its file, or null for packages. */
    module(from, spec) {
      const base = spec.startsWith(".") ? resolve(dirname(from), spec) : viaPaths(spec);
      if (!base) return null;
      const exts = [".tsx", ".ts", ".jsx", ".js", ".mjs"];
      return [base, ...exts.map((e) => base + e), ...exts.map((e) => join(base, "index" + e))].find(isFile) ?? null;
    },
  };
}

/** Entry files where an app's providers live, in every extension a
 *  framework accepts for them. */
const ROOT_FILES = [
  ...["app/layout", "src/app/layout", "pages/_app", "src/pages/_app", "app/root", "src/main", "src/App"].flatMap(
    (base) => [".tsx", ".jsx", ".ts", ".js"].map((ext) => base + ext),
  ),
  "index.html",
];

function framework(root, deps) {
  const found = (...paths) => paths.filter((p) => existsSync(join(root, p)));
  const roots = found(...ROOT_FILES);
  let name = "unknown framework";
  if (deps.includes("next")) {
    const app = found("app", "src/app").some((d) => statSync(join(root, d)).isDirectory());
    name = app ? "Next.js app router" : found("pages", "src/pages").length ? "Next.js pages router" : "Next.js";
  } else if (deps.includes("@react-router/dev") || deps.some((d) => d.startsWith("@remix-run/"))) {
    name = "React Router / Remix";
  } else if (deps.includes("astro")) name = "Astro";
  else if (deps.includes("vite")) name = "Vite";
  return { name, roots };
}

const escapeRegExp = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** The names a module's export is called by in this file: `Inter`,
 *  `FontSans` for `{ Inter as FontSans }`, `fonts.Inter` for `* as fonts`.
 *  `name` "default" reads the default import (`import localFont from`). */
export function importedAs(text, module, name) {
  const from = `\\s*from\\s*["']${escapeRegExp(module)}["']`;
  const names = [];
  if (name === "default") {
    for (const m of text.matchAll(new RegExp(`\\bimport\\s+([\\w$]+)\\s*(?:,\\s*{[^}]*})?${from}`, "g"))) names.push(m[1]);
    return names;
  }
  for (const m of text.matchAll(new RegExp(`\\bimport\\s*(?:type\\s+)?{([^}]*)}${from}`, "g"))) {
    for (const spec of m[1].split(",")) {
      const [imported, local] = spec.trim().replace(/^type\s+/, "").split(/\s+as\s+/);
      if (imported === name) names.push(local ?? imported);
    }
  }
  for (const m of text.matchAll(new RegExp(`\\bimport\\s*\\*\\s*as\\s+([\\w$]+)${from}`, "g"))) names.push(`${m[1]}.${name}`);
  return names;
}

/** Every call of `callee` in the text, with the text between its parens. */
function callsOf(text, callee) {
  return [...text.matchAll(new RegExp(`(?<![\\w$.])${escapeRegExp(callee)}\\s*\\(`, "g"))].map((m) => ({
    index: m.index,
    args: callArgs(text, m.index + m[0].length - 1),
  }));
}

/** How Inter is loaded, wherever it is loaded. Statuses: opsz (variable,
 *  optical size addressable), no-opsz (variable, no opsz axis requested),
 *  weight-range (local variable file; opsz depends on the file), static,
 *  no-weight-range (a local variable file with no range: the axis is not
 *  addressable at all). */
export function interFindings(file, text) {
  const out = [];
  const add = (index, via, status) => out.push({ file, line: lineOf(text, index), via, status });
  for (const callee of importedAs(text, "next/font/google", "Inter")) {
    for (const { index, args } of callsOf(text, callee))
      add(index, "next/font/google", /axes\s*:\s*\[[^\]]*["']opsz["']/.test(args) ? "opsz" : "no-opsz");
  }
  for (const callee of importedAs(text, "next/font/local", "default")) {
    for (const { index, args } of callsOf(text, callee)) {
      if (!/inter/i.test(args)) continue;
      add(index, "next/font/local", /weight\s*:\s*["']\s*\d+\s+\d+\s*["']/.test(args) ? "weight-range" : "no-weight-range");
    }
  }
  for (const m of text.matchAll(/["'](@fontsource(?:-variable)?\/inter)(\/[^"']*)?["']/g)) {
    const variable = m[1].endsWith("-variable/inter");
    add(m.index, m[1], !variable ? "static" : /opsz/.test(m[2] ?? "") ? "opsz" : "no-opsz");
  }
  for (const m of text.matchAll(/fonts\.googleapis\.com\/css2?\?[^"'\s)]*?family=Inter[:&"'\s)][^"'\s)]*/g)) {
    add(m.index, "Google Fonts link", /opsz/.test(m[0]) ? "opsz" : /wght@[\d;,.]*\d\.\.\d/.test(m[0]) ? "no-opsz" : "static");
  }
  for (const m of text.matchAll(/rsms\.me\/inter\//g)) add(m.index, "rsms.me (InterVariable 4 carries opsz)", "opsz");
  if (file.endsWith(".css")) {
    for (const m of text.matchAll(/@font-face\s*{([^}]*)}/g)) {
      if (!/font-family\s*:\s*["']?Inter/i.test(m[1])) continue;
      add(m.index, "@font-face", /font-weight\s*:\s*\d+\s+\d+/.test(m[1]) ? "weight-range" : "static");
    }
  }
  return out;
}

/** Every name FF installs a file under: the catalog shipped beside this
 *  script (so the list moves with the skill version reading it), the shared
 *  modules, and the parts. Only the catalog tables' registry-name column
 *  counts: these names also flag a project's own same-named files as
 *  collisions, so a word from a description must never become one. */
export function registryNames() {
  const md = readText(fileURLToPath(new URL("../references/components.md", import.meta.url))) ?? "";
  const names = new Set([...FF_MODULES, ...FF_PARTS]);
  for (const row of md.split("\n").filter((line) => line.startsWith("|"))) {
    const column = row.split("|")[2] ?? "";
    for (const m of column.matchAll(/`((?:base\/)?[a-z][a-z0-9-]*)`/g)) names.add(m[1].replace(/^base\//, ""));
  }
  return names;
}

export function readStack(input = ".") {
  const root = resolve(input);
  const pkg = readJsonc(join(root, "package.json"));
  if (!pkg) throw new Error(`No readable package.json in ${root}. Pass the app's directory.`);
  const rel = (path) => relative(root, path) || ".";
  const declared = { ...pkg.devDependencies, ...pkg.peerDependencies, ...pkg.dependencies };
  const deps = Object.keys(declared);
  const version = (name) => {
    const installed = installedVersion(root, name);
    const range = declared[name];
    if (!installed && !range) return null;
    return { name, version: installed ?? range, major: parseMajor(installed ?? range) };
  };

  const shadcn = readJsonc(join(root, "components.json"));
  const lookup = resolvers(root);
  const aliases = { ui: "@/components/ui", lib: "@/lib", hooks: "@/hooks", components: "@/components", ...shadcn?.aliases };
  const resolved = Object.fromEntries(["ui", "lib", "hooks", "components"].map((k) => [k, lookup.alias(aliases[k])]));
  const dirs = Object.fromEntries(Object.entries(resolved).map(([k, v]) => [k, v.dir]));

  const files = walk(root);
  const texts = new Map(files.map((f) => [f, readText(f) ?? ""]));

  // Entry CSS: components.json names it; otherwise the first file importing Tailwind.
  let entryCss = shadcn?.tailwind?.css ? join(root, shadcn.tailwind.css) : null;
  if (!entryCss || !existsSync(entryCss))
    entryCss = files.find((f) => f.endsWith(".css") && /@import\s+["']tailwindcss["']|@tailwind\s+base/.test(texts.get(f))) ?? null;
  const css = entryCss ? readText(entryCss) ?? "" : "";

  // Inventory of the shadcn target dirs, one level deep, plus the parts a
  // block installs one folder down (components/sidebar-app/…).
  const sources = (dir) => {
    try {
      return readdirSync(dir)
        .filter((n) => /\.(tsx?|jsx?)$/.test(n) && !NOT_PRODUCT.test(n))
        .map((n) => join(dir, n));
    } catch {
      return [];
    }
  };
  const subdirs = (dir) => {
    try {
      return readdirSync(dir, { withFileTypes: true })
        .filter((e) => e.isDirectory())
        .map((e) => join(dir, e.name));
    } catch {
      return [];
    }
  };
  const catalog = registryNames();
  const installed = { fluid: [], builtOnFluid: [], collisions: [], other: [] };
  const ffFiles = new Map(); // installed FF item → its imports
  const seen = new Set();
  for (const [kind, dir] of Object.entries(dirs)) {
    const parts = kind === "components" ? subdirs(dir).flatMap(sources) : [];
    for (const path of [...sources(dir), ...parts.filter((p) => FF_PARTS.includes(basename(p, extname(p))))]) {
      if (seen.has(path)) continue;
      seen.add(path);
      const name = basename(path, extname(path));
      const imports = importsOf(texts.get(path) ?? readText(path) ?? "");
      if (isFluidFile(name, imports)) {
        if (!catalog.has(name)) installed.builtOnFluid.push(name);
        else {
          installed.fluid.push(name);
          ffFiles.set(path, imports);
        }
      } else if (kind === "ui" && catalog.has(name)) installed.collisions.push(rel(path));
      else if (kind === "ui") installed.other.push(name);
    }
  }

  // Primitive imports. Installed FF items are flavor evidence, minus the
  // shared ones that import Base UI under both flavors; every other file,
  // code built on FF included, is the app's own.
  const fluid = { base: [], radix: [] };
  const app = { base: [], radix: [] };
  const shared = [];
  const split = (file, imports, side) => {
    if (imports.some((s) => BASE_IMPORT.test(s))) side.base.push(rel(file));
    if (imports.some((s) => RADIX_IMPORT.test(s))) side.radix.push(rel(file));
  };
  for (const [file, imports] of ffFiles)
    split(file, imports, SHARED_BASE_UI.includes(basename(file, extname(file))) ? { base: shared, radix: [] } : fluid);
  const motionConfig = [];
  const inter = [];
  for (const [file, text] of texts) {
    const r = rel(file);
    if (!ffFiles.has(file)) split(file, importsOf(text), app);
    for (const m of text.matchAll(/<MotionConfig\b([^>]*)>/g)) {
      const value = m[1].match(/reducedMotion\s*=\s*{?\s*["'](\w+)["']/);
      motionConfig.push({ file: r, line: lineOf(text, m.index), reducedMotion: value?.[1] ?? null });
    }
    inter.push(...interFindings(r, text));
  }

  const react = version("react");
  const tailwind = version("tailwindcss");
  const fm = version("framer-motion");
  // Declared only: a copy some dependency pulled in is not the project's pick.
  const motion = declared.motion ? version("motion") : null;
  const v4Import = /@import\s+["']tailwindcss["']/.test(css);
  const check = (ok, text) => ({ ok, text });
  const requirements = [
    react
      ? check(react.major >= REQUIRED_MAJOR.react, `react ${react.version}`)
      : check(false, "react not found in package.json"),
    tailwind
      ? check(tailwind.major >= REQUIRED_MAJOR.tailwindcss && (v4Import || !entryCss),
          `tailwindcss ${tailwind.version}${entryCss ? `; ${rel(entryCss)} ${v4Import ? 'imports "tailwindcss"' : "has no v4 @import"}` : ""}`)
      : check(false, "tailwindcss not found in package.json"),
    fm
      ? check(fm.major >= REQUIRED_MAJOR["framer-motion"], `framer-motion ${fm.version}`)
      : check(null, "framer-motion not installed yet; arrives with the first component"),
    ...(motion ? [check(false, `motion ${motion.version} is a dependency: an FF install adds framer-motion beside it, 2 copies of 1 library`)] : []),
    !shadcn
      ? check(false, "no components.json: run shadcn init first")
      : check(resolved.ui.viaPaths,
          `components.json; ui alias ${aliases.ui} → ${rel(dirs.ui)}${resolved.ui.viaPaths ? "" : " (guessed: no tsconfig paths entry matches it)"}`),
    check(/--background\s*:/.test(css), entryCss ? `theme tokens (--background) in ${rel(entryCss)}` : "no Tailwind entry CSS found"),
  ];

  // A MotionConfig only covers the app from the root or a provider it
  // renders, so count the root files and what they import, two hops deep.
  const fw = framework(root, deps);
  const nearRoot = new Set();
  let frontier = fw.roots.map((r) => join(root, r));
  for (let hop = 0; hop < 3 && frontier.length; hop++) {
    const next = [];
    for (const file of frontier) {
      if (nearRoot.has(rel(file))) continue;
      nearRoot.add(rel(file));
      if (hop < 2) for (const spec of importsOf(texts.get(file) ?? readText(file) ?? "")) {
        const target = lookup.module(file, spec);
        if (target) next.push(target);
      }
    }
    frontier = next;
  }
  // Inter loaded by the root wins; loads elsewhere (a mockup, a showcase)
  // only matter when the root loads none.
  const rootInter = inter.filter((f) => nearRoot.has(f.file));
  const interShown = rootInter.length ? rootInter : inter;
  const interElsewhere = inter.length - interShown.length;
  const userMotion = motionConfig.find((m) => m.reducedMotion === "user" && nearRoot.has(m.file));
  const userElsewhere = motionConfig.filter((m) => m.reducedMotion === "user" && !nearRoot.has(m.file));
  const rootMotion = motionConfig.filter((m) => nearRoot.has(m.file));
  const interOk = interShown.some((f) => f.status === "opsz")
    ? true
    : interShown.some((f) => f.status === "weight-range") || !interShown.length
      ? null
      : false;
  const wiring = [
    userMotion
      ? check(true, `MotionConfig reducedMotion="user" at ${userMotion.file}:${userMotion.line}`)
      : userElsewhere.length
        ? check(null, `MotionConfig reducedMotion="user" only at ${userElsewhere.map((m) => `${m.file}:${m.line}`).join(", ")}: check it wraps the whole app`)
        : rootMotion.length
          ? check(false, `MotionConfig without reducedMotion="user" at ${rootMotion.map((m) => `${m.file}:${m.line}`).join(", ")}`)
          : check(false, "no MotionConfig around the app: OS reduced motion is ignored by transform and layout animations"),
    inter.length
      ? check(interOk, `Inter: ${interShown.slice(0, 3).map((f) => `${f.status} via ${f.via} at ${f.file}:${f.line}`).join("; ")}${interElsewhere ? ` (+${interElsewhere} outside the root)` : ""}`)
      : check(null, "Inter not found: weight changes depend on whatever font the app loads (audit.mjs FONT measures it)"),
    check(/--hover\s*:/.test(css) ? true : null,
      /--hover\s*:/.test(css) ? "interaction tokens (--hover, --active) present" : "interaction tokens not installed yet; arrive with the first component"),
  ];

  // Decisions are the one thing code cannot show; the skill keeps them, with
  // consent, under a "Fluid Functionalism" heading in the project's agent notes.
  // In a monorepo those notes (and an earlier audit file) usually sit at the
  // repository root, above the app directory this reads.
  const above = ancestors(root);
  const noteDirs = existsSync(join(above.at(-1), ".git")) ? above : [root];
  const decisions = [];
  const legacy = [];
  for (const dir of noteDirs) {
    for (const name of ["AGENTS.md", "CLAUDE.md", ".github/copilot-instructions.md"]) {
      const text = readText(join(dir, name));
      const m = text?.match(/^#+\s*Fluid Functionalism\b.*$/m);
      if (m) decisions.push(`${rel(join(dir, name))}:${lineOf(text, m.index)}`);
    }
    for (const name of [".agents/fluid-functionalism.md", ".claude/fluid-functionalism.md"])
      if (existsSync(join(dir, name))) legacy.push(rel(join(dir, name)));
  }

  return {
    root,
    framework: fw,
    packageManager: packageManager(root, pkg),
    typescript: existsSync(join(root, "tsconfig.json")),
    flavor: flavorVerdict({ deps, fluid, app, shared }),
    requirements,
    wiring,
    motionConfig,
    inter,
    installed,
    decisions,
    legacy,
  };
}

function report(s) {
  const mark = (ok) => (ok === true ? "ok  " : ok === false ? "MISS" : "--  ");
  const rows = (label, items) => items.map((c, i) => `${(i ? "" : label).padEnd(10)}${mark(c.ok)} ${c.text}`);
  const names = (list) => (list.length ? list.join(", ") : "none");
  const lines = [
    `Fluid Functionalism stack: ${s.root}`,
    "Read fresh from the files cited. Nothing is cached or written.",
    "",
    `PROJECT   ${s.framework.name}; ${s.packageManager ?? "package manager unknown"}${s.typescript ? "; TypeScript" : ""}`,
    `          root files: ${names(s.framework.roots)}`,
    `FLAVOR    ${s.flavor.flavor}${s.flavor.open ? " (open)" : ""}: ${s.flavor.reason}`,
    ...rows("REQUIRE", s.requirements),
    ...rows("WIRING", s.wiring),
    `INSTALLED FF: ${names(s.installed.fluid)}`,
  ];
  if (s.installed.builtOnFluid.length) lines.push(`          built on FF: ${s.installed.builtOnFluid.join(", ")}`);
  if (s.installed.collisions.length)
    lines.push(`          same name as an FF item but not FF code (diff before any --overwrite): ${s.installed.collisions.join(", ")}`);
  if (s.installed.other.length) lines.push(`          other ui files: ${s.installed.other.length} (${s.installed.other.slice(0, 8).join(", ")}${s.installed.other.length > 8 ? ", …" : ""})`);
  lines.push(`DECISIONS ${s.decisions.length ? `read ${s.decisions.join(", ")}` : "none recorded"}`);
  if (s.legacy.length)
    lines.push(`          legacy audit file ${s.legacy.join(", ")}: honor its decisions, re-derive its facts (references/stack-audit.md#earlier-audit-files)`);
  lines.push("", "Facts, not advice: references/stack-audit.md says what each one costs and when it is worth raising.");
  return lines.join("\n");
}

/** Whether Node was started on this file. Both sides go through realpath: a
 *  skill installed globally is usually a symlink (~/.claude/skills/… →
 *  ~/.agents/skills/…), and Node reports the main module by its real path. */
function isMain() {
  try {
    return realpathSync(process.argv[1]) === realpathSync(fileURLToPath(import.meta.url));
  } catch {
    return false;
  }
}

if (process.argv[1] && isMain()) {
  const args = process.argv.slice(2);
  try {
    const stack = readStack(args.find((a) => !a.startsWith("--")) ?? ".");
    console.log(args.includes("--json") ? JSON.stringify(stack, null, 2) : report(stack));
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
}
