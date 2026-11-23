/* eslint-disable no-console -- CLI script: console output is its interface */
import { chromium } from "playwright";
import { join } from "node:path";

const BASE_URL = process.argv[2] ?? "https://atlasuniverziteta.com";
const OUT_DIR = join(
  import.meta.dirname,
  "..",
  "webapp",
  "public",
  "images",
  "og-images",
);

const OG_WIDTH = 1200;
const OG_HEIGHT = 630;
// Tailwind's xl breakpoint, the narrowest width where the navbar shows the
// site name; the scale still saves each file at twice the share size
const VIEWPORT_WIDTH = 1280;
const VIEWPORT_HEIGHT = (VIEWPORT_WIDTH * OG_HEIGHT) / OG_WIDTH;
const SCALE = (2 * OG_WIDTH) / VIEWPORT_WIDTH;

const PAGES: { path: string; name: string }[] = [
  { path: "/", name: "home" },
  { path: "/about", name: "about" },
  { path: "/api-docs", name: "api-docs" },
  { path: "/login", name: "login" },
  { path: "/signup", name: "signup" },
];

import type { BrowserContext } from "playwright";

async function capturePage(
  context: BrowserContext,
  path: string,
  filename: string,
) {
  const page = await context.newPage();
  await page.goto(`${BASE_URL}${path}`, { waitUntil: "networkidle" });
  await page.screenshot({ path: join(OUT_DIR, filename) });
  console.log(`  ${filename}`);
  await page.close();
}

async function main() {
  const browser = await chromium.launch();

  const contextOptions = {
    viewport: { width: VIEWPORT_WIDTH, height: VIEWPORT_HEIGHT },
    deviceScaleFactor: SCALE,
    colorScheme: "dark" as const,
  };

  // English screenshots
  console.log(`Capturing English OG images from ${BASE_URL}`);
  const enContext = await browser.newContext({
    ...contextOptions,
    locale: "en-US",
  });
  for (const { path, name } of PAGES) {
    await capturePage(enContext, path, `og-image-${name}.png`);
  }
  await enContext.close();

  // Serbian screenshots: set language via localStorage before navigating
  console.log("Capturing Serbian OG images");
  const srContext = await browser.newContext({
    ...contextOptions,
    locale: "en-US",
    storageState: {
      cookies: [],
      origins: [
        {
          origin: BASE_URL,
          localStorage: [{ name: "language", value: "sr" }],
        },
      ],
    },
  });
  for (const { path, name } of PAGES) {
    await capturePage(srContext, path, `og-image-${name}-sr.png`);
  }
  await srContext.close();

  await browser.close();
  console.log(`Done - ${String(PAGES.length * 2)} images saved to ${OUT_DIR}`);
}

await main();
