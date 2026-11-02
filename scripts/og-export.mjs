// Screenshots the /og stage into public/metadata/og.png at 2x (2400×1260).
// Needs the dev server: `npm run dev`, then `npm run og` (OG_URL overrides
// the page, CHROMIUM_PATH the browser).
import { chromium } from "playwright-core";

const url = process.env.OG_URL || "http://localhost:3000/og";
const out = process.env.OG_OUT || "public/metadata/og.png";

// Installed Chrome by default, so no Playwright browser download is needed.
const browser = await chromium.launch(
  process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : { channel: "chrome" }
);
const page = await browser.newPage({
  viewport: { width: 1400, height: 800 },
  deviceScaleFactor: 2,
  colorScheme: "light",
  reducedMotion: "reduce",
});
await page.goto(url, { waitUntil: "networkidle" });
await page.evaluate(() => document.fonts.ready);

// The page parks a hover on a checkbox row itself; let the highlight land.
await page.waitForTimeout(1000);

await page.locator("[data-og-stage]").screenshot({ path: out });
await browser.close();
console.log(`Wrote ${out}`);
