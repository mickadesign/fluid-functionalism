// Process helpers shared by the sweep: every child runs in its own process
// group so a timeout also stops what it spawned (an agent's dev server, a
// stuck npm install), and output is kept to a tail plus an optional log file.
import { spawn, execFileSync } from "node:child_process";
import { createWriteStream } from "node:fs";

const TAIL = 20000;
// Terminal colors stay in the log files and out of the report.
const ANSI = /\u001b\[[0-9;]*[A-Za-z]/g;

/** Runs a command to completion. Resolves with { code, timedOut, ms, out }
 *  where `out` is the last 20k characters of stdout+stderr; never rejects
 *  on a non-zero exit. */
export function run(cmd, args, { cwd, env, timeoutMs = 10 * 60000, logFile, input } = {}) {
  return new Promise((resolve) => {
    const started = Date.now();
    const child = spawn(cmd, args, {
      cwd,
      env: { ...process.env, ...env },
      detached: true,
      stdio: [input === undefined ? "ignore" : "pipe", "pipe", "pipe"],
    });
    const log = logFile ? createWriteStream(logFile) : null;
    let out = "";
    let timedOut = false;
    const onData = (chunk) => {
      log?.write(chunk);
      out = (out + String(chunk).replace(ANSI, "")).slice(-TAIL);
    };
    child.stdout.on("data", onData);
    child.stderr.on("data", onData);
    if (input !== undefined) child.stdin.end(input);
    const timer = setTimeout(() => {
      timedOut = true;
      killGroup(child.pid);
    }, timeoutMs);
    child.on("error", (error) => onData(`\n${error.message}\n`));
    child.on("close", (code) => {
      clearTimeout(timer);
      // Whatever the command left running in the background goes too.
      killGroup(child.pid);
      log?.end();
      resolve({ code: timedOut ? null : code, timedOut, ms: Date.now() - started, out });
    });
  });
}

/** Starts a long-lived process (a `next start` server); call stop() after. */
export function start(cmd, args, { cwd, env } = {}) {
  const child = spawn(cmd, args, { cwd, env: { ...process.env, ...env }, detached: true, stdio: "ignore" });
  return { stop: () => killGroup(child.pid) };
}

export function killGroup(pid) {
  if (!pid) return;
  try {
    process.kill(-pid, "SIGTERM");
  } catch {
    // Already gone.
  }
  setTimeout(() => {
    try {
      process.kill(-pid, "SIGKILL");
    } catch {
      // Already gone.
    }
  }, 5000).unref();
}

/** First of `names` found on PATH, or null. */
export function which(names) {
  for (const name of names) {
    try {
      return execFileSync("sh", ["-c", `command -v ${name}`], { encoding: "utf8" }).trim() || null;
    } catch {
      // Not this one.
    }
  }
  return null;
}

export function versionOf(bin) {
  try {
    return execFileSync(bin, ["--version"], { encoding: "utf8", timeout: 15000 }).trim().split("\n")[0];
  } catch {
    return "unknown";
  }
}

/** Runs async jobs with at most `limit` in flight, results in input order. */
export async function pool(items, limit, job) {
  const results = new Array(items.length);
  let next = 0;
  const worker = async () => {
    while (next < items.length) {
      const i = next++;
      results[i] = await job(items[i], i);
    }
  };
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return results;
}
