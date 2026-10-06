// The coding agents the sweep drives, each in its headless mode, with the
// brief as the whole prompt. Each runs in a throwaway copy of the project
// with permission to edit files and run commands, since that is how people
// use a pasted brief. None of them gets the Fluid Functionalism skill: this
// sweep measures the brief on its own.
import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join } from "node:path";
import { run, versionOf, which } from "./util.mjs";

export const AGENTS = {
  claude: {
    label: "Claude Code",
    bins: ["claude"],
    loggedIn: (bin) => JSON.parse(capture(bin, ["auth", "status"]) ?? "{}").loggedIn === true,
    args: (prompt, { model }) => [
      "-p",
      prompt,
      "--output-format",
      "stream-json",
      "--verbose",
      "--dangerously-skip-permissions",
      // The user's own setup stays out: no skills (the FF skill is
      // installed globally on this machine), no MCP servers, no user
      // settings or plugins. The project's own files still load, the way
      // they would for anyone.
      "--disable-slash-commands",
      "--strict-mcp-config",
      "--setting-sources",
      "project,local",
      "--no-session-persistence",
      ...(model ? ["--model", model] : []),
    ],
  },
  cursor: {
    label: "Cursor",
    // The CLI installs as `agent`; older installs named it `cursor-agent`.
    bins: ["cursor-agent", "agent"],
    loggedIn: (bin) => !/not (logged|authenticated)/i.test(capture(bin, ["status"]) ?? ""),
    args: (prompt, { model }) => [
      "-p",
      "--force",
      "--trust",
      "--output-format",
      "stream-json",
      ...(model ? ["--model", model] : []),
      prompt,
    ],
  },
  codex: {
    label: "Codex",
    bins: ["codex"],
    loggedIn: (bin) => capture(bin, ["login", "status"]) !== null,
    // Codex is the one agent with a sandbox that still allows installs:
    // writes stay inside the project, network stays on for npm and the
    // registry, and npm's cache moves next to the project because ~/.npm is
    // outside the writable area. Memories are off: they carry notes from
    // the maintainer's own Codex sessions on this library.
    args: (prompt, { model }) => [
      "exec",
      "--json",
      "--skip-git-repo-check",
      "--ephemeral",
      "--disable",
      "memories",
      "--sandbox",
      "workspace-write",
      "-c",
      "sandbox_workspace_write.network_access=true",
      ...(model ? ["--model", model] : []),
      prompt,
    ],
    env: (cwd) => ({ npm_config_cache: join(dirname(cwd), "npm-cache") }),
    // Its JSON events never name the model, so report the configured one.
    configuredModel: () =>
      /^model\s*=\s*"([^"]+)"/m.exec(readFileSync(join(homedir(), ".codex/config.toml"), "utf8"))?.[1] ?? null,
  },
};

/** Output of a quick command, or null when it fails. */
function capture(bin, args) {
  try {
    return execFileSync(bin, args, { encoding: "utf8", timeout: 20000, stdio: ["ignore", "pipe", "pipe"] });
  } catch {
    return null;
  }
}

/** Which agents can run on this machine: installed, logged in, and which
 *  version. A CLI that is installed but logged out would fail every run in
 *  a second, so it is reported as such instead of as failing briefs. */
export function detectAgents(names) {
  return names.map((name) => {
    const agent = AGENTS[name];
    if (!agent) throw new Error(`unknown agent "${name}" (known: ${Object.keys(AGENTS).join(", ")})`);
    const found = which(agent.bins);
    if (!found) return { name, label: agent.label, bin: null, version: null, problem: "not installed" };
    let loggedIn = true;
    try {
      loggedIn = agent.loggedIn(found);
    } catch {
      // The status command changed shape: run it and let the runs tell.
    }
    return {
      name,
      label: agent.label,
      bin: loggedIn ? found : null,
      version: versionOf(found),
      problem: loggedIn ? null : "not logged in",
    };
  });
}

/** Reads the model and cost out of a JSON-lines transcript. The three CLIs
 *  print different events, so this only looks for fields they share in
 *  spirit: a `model` string and a cost or usage total. */
export function readTranscript(text) {
  let model = null;
  let costUsd = null;
  let turns = null;
  for (const line of text.split("\n")) {
    if (!line.startsWith("{")) continue;
    let event;
    try {
      event = JSON.parse(line);
    } catch {
      continue;
    }
    model ??= typeof event.model === "string" ? event.model : (event.message?.model ?? null);
    if (typeof event.total_cost_usd === "number") costUsd = event.total_cost_usd;
    if (typeof event.num_turns === "number") turns = event.num_turns;
  }
  return { model, costUsd, turns };
}

export async function runAgent(agent, { cwd, prompt, model, timeoutMs, logFile }) {
  mkdirSync(dirname(logFile), { recursive: true });
  const spec = AGENTS[agent.name];
  const res = await run(agent.bin, spec.args(prompt, { model }), {
    cwd,
    env: spec.env?.(cwd),
    timeoutMs,
    logFile,
  });
  // Agents start dev servers in their own process groups; anything still
  // running from this project goes now, before the graders need the port
  // range and the CPU.
  try {
    execFileSync("pkill", ["-f", cwd]);
  } catch {
    // Nothing left running.
  }
  const transcript = readTranscript(readFileSync(logFile, "utf8"));
  if (!transcript.model && !model) {
    try {
      transcript.model = spec.configuredModel?.() ?? null;
    } catch {
      // No config file: the CLI's own default ran.
    }
  }
  return { exitCode: res.code, timedOut: res.timedOut, ms: res.ms, ...transcript, tail: res.out.slice(-1500) };
}
