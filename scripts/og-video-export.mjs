// Records one loop of the /og/video stage into public/metadata/og.webm (and
// og.mp4 when a system ffmpeg is installed). Needs the dev server:
// `npm run dev`, then `npm run og:video`. OG_VIDEO_URL overrides the page,
// CHROMIUM_PATH the browser, OG_FRAMES_DIR keeps the sampled JPEG frames.
//
// The loop runs in real time (its springs are the components' own), so this
// captures a Chrome screencast at 2x, resamples it to a steady 30fps from the
// frames' timestamps, and encodes with the ffmpeg Playwright ships (VP8 only).
import { spawn, spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readdirSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { chromium } from "playwright-core";

const url = process.env.OG_VIDEO_URL || "http://localhost:3000/og/video?record";
const outWebm = "public/metadata/og.webm";
const outMp4 = "public/metadata/og.mp4";
const framesDir = process.env.OG_FRAMES_DIR;
const FPS = 30;
const W = 1200;
const H = 630;

function playwrightFfmpeg() {
  const cache = join(homedir(), process.platform === "darwin" ? "Library/Caches/ms-playwright" : ".cache/ms-playwright");
  const dir = existsSync(cache) && readdirSync(cache).find((d) => d.startsWith("ffmpeg"));
  if (!dir) throw new Error("No Playwright ffmpeg found: run `npx playwright install ffmpeg`.");
  const bin = readdirSync(join(cache, dir)).find((f) => f.startsWith("ffmpeg"));
  return join(cache, dir, bin);
}

const browser = await chromium.launch(
  process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : { channel: "chrome" }
);
const page = await browser.newPage({
  viewport: { width: W, height: H },
  deviceScaleFactor: 2,
  colorScheme: "light",
});
await page.goto(url, { waitUntil: "networkidle" });
await page.evaluate(() => document.fonts.ready);
// The dev server's Next.js badge would land in the bottom-left corner.
await page.addStyleTag({ content: "nextjs-portal { display: none !important; }" });
// Let the hover hooks measure their rows before the cursor arrives.
await page.waitForTimeout(1500);
const duration = await page.evaluate(() => window.__ogVideo.duration);

const cdp = await page.context().newCDPSession(page);
const frames = [];
cdp.on("Page.screencastFrame", ({ data, metadata, sessionId }) => {
  frames.push({ data, ts: metadata.timestamp });
  cdp.send("Page.screencastFrameAck", { sessionId }).catch(() => {});
});
await cdp.send("Page.startScreencast", { format: "jpeg", quality: 95, everyNthFrame: 1 });
await page.waitForTimeout(300);
const startedAt = Date.now() / 1000;
await page.evaluate(() => window.__ogVideo.start());
await page.waitForTimeout(duration * 1000 + 300);
await cdp.send("Page.stopScreencast");
await browser.close();

// The screencast only emits frames when something changes, so each output
// frame takes the latest capture at or before its time.
const sampled = [];
for (let k = 0; k < duration * FPS; k++) {
  const at = startedAt + k / FPS;
  let pick = frames[0];
  for (const f of frames) {
    if (f.ts <= at) pick = f;
    else break;
  }
  sampled.push(Buffer.from(pick.data, "base64"));
}
console.log(`Captured ${frames.length} frames, wrote ${sampled.length} at ${FPS}fps`);

if (framesDir) {
  mkdirSync(framesDir, { recursive: true });
  sampled.forEach((buf, k) => writeFileSync(join(framesDir, `${String(k).padStart(4, "0")}.jpg`), buf));
}

function encode(bin, filter, args) {
  return new Promise((resolve, reject) => {
    const ff = spawn(bin, ["-y", "-loglevel", "error", "-f", "image2pipe", "-c:v", "mjpeg", "-framerate", String(FPS), "-i", "pipe:0", "-vf", filter, ...args]);
    ff.on("error", reject);
    ff.on("close", (code) => (code === 0 ? resolve() : reject(new Error(`ffmpeg exited ${code}`))));
    for (const buf of sampled) ff.stdin.write(buf);
    ff.stdin.end();
  });
}

await encode(playwrightFfmpeg(), `scale=${W}:${H}`, ["-c:v", "libvpx", "-b:v", "3M", "-crf", "8", "-auto-alt-ref", "0", outWebm]);
console.log(`Wrote ${outWebm}`);

if (spawnSync("ffmpeg", ["-version"]).status === 0) {
  // Screencast JPEGs are full range; tag them as such and convert to the
  // limited-range yuv420p every player expects, or ffmpeg keeps yuvj420p.
  const toTv = `scale=${W}:${H}:in_range=pc:out_range=tv,format=yuv420p`;
  await encode("ffmpeg", toTv, ["-c:v", "libx264", "-pix_fmt", "yuv420p", "-color_range", "tv", "-crf", "20", "-preset", "slow", "-movflags", "+faststart", outMp4]);
  console.log(`Wrote ${outMp4}`);
} else {
  console.log("No system ffmpeg, skipped og.mp4 (brew install ffmpeg)");
}
