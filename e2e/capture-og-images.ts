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

const WIDTH = 1200;
const HEIGHT = 630;

const PAGES: { path: string; name: string }[] = [
  { path: "/", name: "home" },
  { path: "/search", name: "search" },
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
    viewport: { width: WIDTH, height: HEIGHT },
    deviceScaleFactor: 2,
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

  // BCS screenshots: set language via localStorage before navigating
  console.log("Capturing BCS OG images");
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
