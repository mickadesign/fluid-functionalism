// Grading looks only at the project a run leaves behind, so it works the
// same for every agent. The no-agent run comes first: it runs the brief's
// install command by script, and its result is the reference for what an
// agent's install should have produced.
import { existsSync, mkdirSync, readFileSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { basename, join, relative } from "node:path";
import { changedFiles, cloneProject } from "./project.mjs";
import { run, start } from "./util.mjs";

const BUILD_ENV = { NEXT_TELEMETRY_DISABLED: "1", NO_COLOR: "1", FORCE_COLOR: "0" };
const SOURCE = /\.(t|j)sx?$/;
const INSTALLED = /^(src\/)?(components|hooks|lib)\//;

function check(id, pass, detail = "", advisory = false) {
  return advisory ? { id, pass, detail, advisory } : { id, pass, detail };
}

function deps(dir) {
  const pkg = JSON.parse(readFileSync(join(dir, "package.json"), "utf8"));
  return new Set(Object.keys({ ...pkg.dependencies, ...pkg.devDependencies }));
}

/** Runs the brief's install command in a fresh copy, then typechecks and
 *  builds it. A preset brief also gets rendered: its block exports one
 *  component, and the brief says to import and render it, so the no-agent
 *  run can do exactly that and its screenshot becomes the reference. */
export async function runControl({ brief, template, dir, port, browser, shotFile, logDir }) {
  cloneProject(template.dir, dir);
  const checks = [];
  const install = await run("sh", ["-c", brief.install.command], {
    cwd: dir,
    timeoutMs: 5 * 60000,
    logFile: join(logDir, "control-install.log"),
  });
  checks.push(check("install", install.code === 0, install.code === 0 ? "" : tail(install.out)));

  const installedPaths = changedFiles(dir, template.sha).filter((p) => INSTALLED.test(p));
  checks.push(check("files", installedPaths.length > 0, installedPaths.length ? "" : "the install wrote no files"));
  const before = deps(template.dir);
  const addedDeps = [...deps(dir)].filter((d) => !before.has(d)).sort();

  if (brief.render?.importPath) {
    const { importPath, exportName, isDefault } = brief.render;
    const binding = isDefault ? exportName : `{ ${exportName} }`;
    writeFileSync(
      join(dir, "app/page.tsx"),
      `import ${binding} from "${importPath}"\n\nexport default function Page() {\n  return (\n    <main className="flex min-h-svh items-start justify-center p-10">\n      <${exportName} />\n    </main>\n  )\n}\n`,
    );
  }

  checks.push(...(await buildChecks(dir, logDir, "control")));
  if (installedPaths.length) checks.push(await lintCheck(dir, installedPaths, logDir));
  let shot = null;
  if (brief.render && checks.every((c) => c.pass || c.advisory)) {
    const rendered = await renderPage({ dir, port, browser, shotFile, path: brief.render.route ?? "/" });
    checks.push(rendered.check);
    shot = rendered.shot;
  }
  const installed = new Map(installedPaths.map((p) => [p, readFileSync(join(dir, p), "utf8")]));
  return { checks, installed, own: await ownFiles(brief, installedPaths), addedDeps, shot, ms: install.ms };
}

/** The installed paths that belong to the brief's own item rather than to
 *  its dependencies, matched by file name against its registry payload. */
async function ownFiles(brief, installedPaths) {
  try {
    const item = await (await fetch(brief.install.url)).json();
    const names = new Set(item.files.map((f) => basename(f.target ?? f.path)));
    const own = installedPaths.filter((p) => names.has(basename(p)));
    return own.length ? own : installedPaths;
  } catch {
    return installedPaths;
  }
}

async function buildChecks(dir, logDir, label) {
  // A dev server or build the agent ran leaves generated route types in
  // .next that tsc would read. They are build output, not the agent's work.
  rmSync(join(dir, ".next"), { recursive: true, force: true });
  const tsc = await run(join(dir, "node_modules/.bin/tsc"), ["--noEmit", "--pretty", "false"], {
    cwd: dir,
    timeoutMs: 5 * 60000,
    logFile: join(logDir, `${label}-tsc.log`),
  });
  const build = await run(join(dir, "node_modules/.bin/next"), ["build"], {
    cwd: dir,
    env: BUILD_ENV,
    timeoutMs: 10 * 60000,
    logFile: join(logDir, `${label}-build.log`),
  });
  return [
    check("typecheck", tsc.code === 0, tsc.code === 0 ? "" : firstErrors(tsc.out)),
    check("build", build.code === 0, build.code === 0 ? "" : buildError(build.out)),
  ];
}

/** The stock Next app's own ESLint config over the installed files. A
 *  problem here doesn't stop anything working, so it never fails the brief,
 *  but everyone who runs `npm run lint` after installing sees it. */
async function lintCheck(dir, paths, logDir) {
  const report = join(logDir, "control-lint.json");
  const res = await run(join(dir, "node_modules/.bin/eslint"), ["--format", "json", "--output-file", report, ...paths], {
    cwd: dir,
    timeoutMs: 5 * 60000,
  });
  let problems;
  try {
    problems = JSON.parse(readFileSync(report, "utf8")).flatMap((file) =>
      file.messages.map((m) => `${relative(realpathSync(dir), file.filePath)}:${m.line}  ${m.message.split("\n")[0]}  (${m.ruleId ?? "parse"})`),
    );
  } catch {
    return check("lint", null, `eslint gave no report: ${tail(res.out, 300)}`, true);
  }
  return check(
    "lint",
    problems.length === 0,
    problems.length ? `${problems.length} problems from the project's eslint config:\n${problems.slice(0, 8).join("\n")}` : "",
    true,
  );
}

/** Grades one agent run against the no-agent reference. */
export async function gradeRun({ brief, template, dir, control, port, browser, shotFile, logDir, label }) {
  const checks = [];
  const changed = changedFiles(dir, template.sha);

  const missing = [...control.installed.keys()].filter((p) => !existsSync(join(dir, p)));
  checks.push(check("installed", missing.length === 0, missing.length ? `missing: ${missing.join(", ")}` : ""));

  // The brief says to compose with props and className, not to edit the
  // installed files. An agent that edits one to get the build through is
  // usually working around a broken brief or payload.
  const edited = [...control.installed.entries()]
    .filter(([p, content]) => existsSync(join(dir, p)) && readFileSync(join(dir, p), "utf8") !== content)
    .map(([p]) => p);
  checks.push(check("untouched", edited.length === 0, edited.length ? `edited: ${edited.join(", ")}` : ""));
  const otherFlavor = flavorLeak(dir, changed, brief.flavor);
  if (otherFlavor) checks.at(-1).detail += `${checks.at(-1).detail ? "; " : ""}${otherFlavor}`;

  const have = deps(dir);
  const missingDeps = control.addedDeps.filter((d) => !have.has(d));
  checks.push(check("deps", missingDeps.length === 0, missingDeps.length ? `missing: ${missingDeps.join(", ")}` : ""));

  // Something outside the installed files has to import the brief's own
  // component (not just a shared lib it pulled in).
  const specifiers = brief.render?.importPath
    ? [brief.render.importPath]
    : control.own.map((p) => "@/" + p.replace(/^src\//, "").replace(SOURCE, ""));
  const users = changed.filter((p) => SOURCE.test(p) && !control.installed.has(p) && existsSync(join(dir, p)));
  const using = users.filter((p) => {
    const text = readFileSync(join(dir, p), "utf8");
    return specifiers.some((s) => text.includes(`"${s}"`) || text.includes(`'${s}'`));
  });
  checks.push(check("used", using.length > 0, using.length ? using.join(", ") : "no app file imports the installed component"));

  const builds = await buildChecks(dir, logDir, label);
  checks.push(...builds);

  let shot = null;
  if (builds.every((c) => c.pass)) {
    const rendered = await renderPage({ dir, port, browser, shotFile });
    checks.push(rendered.check);
    shot = rendered.shot;
  } else {
    checks.push(check("render", null, "skipped: typecheck or build failed"));
  }
  return { checks, shot, changed };
}

/** Flags imports of the other flavor's primitives in files the run added. */
function flavorLeak(dir, changed, flavor) {
  const other = flavor === "base" ? /from ["'](@radix-ui\/|radix-ui["'])/ : /from ["']@base-ui\//;
  const hits = changed.filter(
    (p) => SOURCE.test(p) && existsSync(join(dir, p)) && other.test(readFileSync(join(dir, p), "utf8")),
  );
  return hits.length ? `other flavor imported in ${hits.join(", ")}` : "";
}

/** Serves the production build and screenshots `/`. Fails on uncaught
 *  errors, console errors, a non-200 page, or Next's client crash text. */
export async function renderPage({ dir, port, browser, shotFile, path = "/" }) {
  const server = start(join(dir, "node_modules/.bin/next"), ["start", "-p", String(port)], { cwd: dir, env: BUILD_ENV });
  const url = `http://localhost:${port}${path}`;
  try {
    const up = await waitForServer(`http://localhost:${port}/`, 45000);
    if (!up) return { check: check("render", false, "next start never answered"), shot: null };
    const context = await browser.newContext({ viewport: { width: 1280, height: 800 }, colorScheme: "light" });
    const page = await context.newPage();
    const errors = [];
    page.on("console", (msg) => msg.type() === "error" && errors.push(msg.text().slice(0, 300)));
    page.on("pageerror", (error) => errors.push(`uncaught: ${String(error.message).slice(0, 300)}`));
    const response = await page.goto(url, { waitUntil: "networkidle", timeout: 45000 }).catch((e) => {
      errors.push(`navigation: ${e.message.split("\n")[0]}`);
      return null;
    });
    await page.waitForTimeout(800);
    const text = await page.evaluate(() => document.body?.innerText ?? "").catch(() => "");
    if (/Application error: a (client|server)-side exception/.test(text)) errors.push("Next.js application error page");
    mkdirSync(join(shotFile, ".."), { recursive: true });
    await page.screenshot({ path: shotFile, type: "jpeg", quality: 70, fullPage: true }).catch(() => {});
    await context.close();
    const status = response?.status();
    const pass = status === 200 && errors.length === 0;
    const detail = [status && status !== 200 ? `HTTP ${status}` : "", ...errors].filter(Boolean).join(" | ");
    return { check: check("render", pass, detail), shot: existsSync(shotFile) ? shotFile : null };
  } finally {
    server.stop();
  }
}

async function waitForServer(url, timeoutMs) {
  const until = Date.now() + timeoutMs;
  while (Date.now() < until) {
    try {
      const res = await fetch(url);
      if (res.status) return true;
    } catch {
      // Not listening yet.
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  return false;
}

/** The docs demo in the brief's flavor: the first preview frame on the
 *  page, which is the component as the site shows it. */
export async function captureReference({ browser, brief, shotFile }) {
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 }, colorScheme: "light" });
  await context.addInitScript((flavor) => {
    try {
      localStorage.setItem("ff:base", flavor);
    } catch {
      // Storage blocked: the page shows its default flavor.
    }
  }, brief.flavor);
  const page = await context.newPage();
  try {
    await page.goto(brief.docsUrl, { waitUntil: "networkidle", timeout: 45000 });
    const frame = page.locator("[data-component-preview], div.relative.isolate.flex-col.w-full").first();
    await frame.scrollIntoViewIfNeeded({ timeout: 10000 });
    await page.waitForTimeout(800);
    await frame.screenshot({ path: shotFile, type: "jpeg", quality: 70 });
    return shotFile;
  } catch {
    await page.screenshot({ path: shotFile, type: "jpeg", quality: 70 }).catch(() => {});
    return existsSync(shotFile) ? shotFile : null;
  } finally {
    await context.close();
  }
}

const JUDGE_SCHEMA = {
  type: "object",
  properties: {
    verdict: { type: "string", enum: ["pass", "fail"] },
    problems: { type: "array", items: { type: "string" } },
    notes: { type: "string" },
  },
  required: ["verdict", "problems", "notes"],
};

/** Asks Claude to compare the run's screenshot with the reference. The
 *  rubric separates "styled differently" (expected in a stock shadcn app)
 *  from "broken". */
export async function judge({ brief, shot, reference, referenceKind, model, cwd }) {
  const name = (p) => p.split("/").pop();
  const refLine =
    referenceKind === "control"
      ? `${name(reference)} is the same block rendered by a script in an identical fresh app. The two should look essentially the same; small differences in surrounding page content are fine.`
      : `${name(reference)} is the ${brief.name} demo on fluidfunctionalism.com, the reference for what the component looks like. The test app uses stock shadcn theming (Geist font, its own colors and radius), so differences in font, color, corner radius, spacing, demo content, and surrounding page are EXPECTED and are not problems.`;
  const prompt = [
    `Read the two screenshots in this folder: ${name(shot)} and ${name(reference)}.`,
    `${name(shot)} is the home page of a fresh Next.js app after an AI coding agent added the ${brief.name} from Fluid Functionalism by following a written brief.`,
    refLine,
    "Fail only when the agent's page is broken: the component is missing or is not recognizably the same component; it renders unstyled (raw browser defaults), with invisible or transparent surfaces, overlapping or collapsed layout, clipped or overflowing text, or icons missing; an error message shows; or the page is blank.",
    "A static screenshot shows popups closed: a trigger alone is fine for menus, selects, dialogs, tooltips and command menus.",
    "Answer with the verdict, each problem as one short sentence, and a one-line note.",
  ].join("\n\n");
  const res = await run(
    "claude",
    [
      "-p",
      prompt,
      "--output-format",
      "json",
      "--json-schema",
      JSON.stringify(JUDGE_SCHEMA),
      "--allowedTools",
      "Read",
      "--permission-mode",
      "dontAsk",
      "--disable-slash-commands",
      "--strict-mcp-config",
      "--setting-sources",
      "project",
      "--no-session-persistence",
      ...(model ? ["--model", model] : []),
    ],
    { cwd, timeoutMs: 5 * 60000 },
  );
  const line = res.out.split("\n").reverse().find((l) => l.startsWith("{"));
  try {
    const result = JSON.parse(line);
    const verdict = result.structured_output;
    if (!verdict?.verdict) throw new Error("no structured output");
    return {
      check: check(
        "looks",
        verdict.verdict === "pass",
        [verdict.problems.join(" "), verdict.notes].filter(Boolean).join(" | "),
      ),
      costUsd: result.total_cost_usd ?? null,
    };
  } catch {
    return { check: check("looks", null, `judge gave no verdict: ${tail(res.out, 300)}`), costUsd: null };
  }
}

function tail(text, n = 1200) {
  return text.trim().slice(-n);
}

/** From the first error line on, so the excerpt starts at the cause. */
function buildError(text) {
  const lines = text.split("\n");
  const at = lines.findIndex((l) => /Failed to compile|Type error|error TS\d+|Error:|Module not found/.test(l));
  return at === -1 ? tail(text) : lines.slice(at).join("\n").trim().slice(0, 1200);
}

function firstErrors(text) {
  return text
    .split("\n")
    .filter((l) => /error TS\d+/.test(l))
    .slice(0, 6)
    .join("\n") || tail(text);
}
