// Fresh test projects. Each sweep scaffolds one stock shadcn Next app per
// flavor with `shadcn@latest`, the version the briefs tell people to run, so
// upstream CLI changes show up here first. Every run then gets its own copy:
// an APFS clone on macOS, which takes seconds even with node_modules.
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { run } from "./util.mjs";

/** Scaffolds `<dir>/<flavor>` for each flavor. The `nova` preset is the
 *  first one the CLI offers (Lucide icons, Geist). */
export async function makeTemplates(dir, flavors, log) {
  mkdirSync(dir, { recursive: true });
  const templates = {};
  for (const flavor of flavors) {
    log(`scaffolding the ${flavor} template`);
    const res = await run(
      "npx",
      ["-y", "shadcn@latest", "init", "-t", "next", "-b", flavor, "-p", "nova", "-n", flavor, "--no-monorepo", "-y"],
      { cwd: dir, timeoutMs: 10 * 60000 },
    );
    const project = join(dir, flavor);
    if (res.code !== 0 || !existsSync(join(project, "components.json"))) {
      throw new Error(`shadcn init failed for ${flavor}:\n${res.out.slice(-2000)}`);
    }
    // create-next-app commits the scaffold; make sure there is a commit to
    // diff against either way.
    const git = (...args) => execFileSync("git", args, { cwd: project, encoding: "utf8" }).trim();
    try {
      git("rev-parse", "HEAD");
    } catch {
      git("init", "-q");
      git("add", "-A");
      git("-c", "user.name=ff-evals", "-c", "user.email=evals@localhost", "commit", "-qm", "scaffold");
    }
    templates[flavor] = { dir: project, sha: git("rev-parse", "HEAD") };
  }
  const shadcnVersion = JSON.parse(
    readFileSync(join(templates[flavors[0]].dir, "node_modules/shadcn/package.json"), "utf8"),
  ).version;
  return { templates, shadcnVersion };
}

export function cloneProject(src, dest) {
  mkdirSync(dirname(dest), { recursive: true });
  const flags = process.platform === "darwin" ? ["-cR"] : ["-R"];
  execFileSync("cp", [...flags, src, dest]);
}

/** Paths that differ from the scaffold commit, committed or not, minus what
 *  .gitignore hides (node_modules, .next). An agent that commits its work
 *  still shows up. */
export function changedFiles(dir, sha) {
  const git = (...args) =>
    execFileSync("git", args, { cwd: dir, encoding: "utf8", maxBuffer: 64 * 1024 * 1024 })
      .split("\n")
      .filter(Boolean);
  return [...new Set([...git("diff", "--name-only", sha), ...git("ls-files", "--others", "--exclude-standard")])].sort();
}
