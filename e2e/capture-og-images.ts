/* eslint-disable no-console -- CLI script: console output is its interface */
import { chromium } from "playwright";
import { join } from "node:path";

const BASE_URL = process.argv[2] ?? "https://atlasuniverziteta.com";
const OUT_DIR = join(import.meta.dirname, "..", "webapp", "public", "images", "og-images");

const WIDTH = 1200;
const HEIGHT = 630;

const PAGES: { path: string; filename: string }[] = [
  { path: "/", filename: "og-image-home.png" },
  { path: "/search", filename: "og-image-search.png" },
  { path: "/about", filename: "og-image-about.png" },
  { path: "/api-docs", filename: "og-image-api-docs.png" },
  { path: "/login", filename: "og-image-login.png" },
  { path: "/signup", filename: "og-image-signup.png" },
];

async function main() {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: WIDTH, height: HEIGHT },
    deviceScaleFactor: 2,
  });

  console.log(`Capturing OG images from ${BASE_URL}`);

  for (const { path, filename } of PAGES) {
    const page = await context.newPage();
    await page.goto(`${BASE_URL}${path}`, { waitUntil: "networkidle" });
    await page.screenshot({ path: join(OUT_DIR, filename) });
    console.log(`  ${filename}`);
    await page.close();
  }

  await browser.close();
  console.log(`Done - ${String(PAGES.length)} images saved to ${OUT_DIR}`);
}

await main();
