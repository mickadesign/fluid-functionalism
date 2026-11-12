// Code coloring for the browser: a worker does it, so the page keeps its
// frames while Shiki starts up (over 100ms the first time) and while a long
// sample is colored. Where a worker can't start, the same code runs on the
// main thread instead.

type Reply = { id: number; html?: string; error?: string };

let worker: Worker | null | undefined;
let nextId = 0;
const waiting = new Map<number, { code: string; resolve: (html: string) => void; reject: (error: unknown) => void }>();

const onMainThread = (code: string) => import("./highlight").then(({ highlight }) => highlight(code));

function start(): Worker | null {
  if (typeof Worker === "undefined") return null;
  try {
    const started = new Worker(new URL("./highlight.worker.ts", import.meta.url), { type: "module" });
    started.onmessage = (event: MessageEvent<Reply>) => {
      const job = waiting.get(event.data.id);
      if (!job) return;
      waiting.delete(event.data.id);
      if (event.data.html !== undefined) job.resolve(event.data.html);
      else job.reject(new Error(event.data.error));
    };
    // The worker failed to load or crashed: everything asked of it so far,
    // and everything after, is colored here instead.
    started.onerror = () => {
      worker = null;
      const jobs = [...waiting.values()];
      waiting.clear();
      for (const job of jobs) onMainThread(job.code).then(job.resolve, job.reject);
    };
    return started;
  } catch {
    return null;
  }
}

/** A TSX sample as highlighted HTML, colored off the main thread. */
export function highlightCode(code: string): Promise<string> {
  if (worker === undefined) worker = start();
  if (!worker) return onMainThread(code);
  const id = nextId++;
  return new Promise<string>((resolve, reject) => {
    waiting.set(id, { code, resolve, reject });
    worker!.postMessage({ id, code });
  });
}
