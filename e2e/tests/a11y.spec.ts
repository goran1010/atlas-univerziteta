import { test, expect } from "@playwright/test";
import { AxeBuilder } from "@axe-core/playwright";
import type { Page, Locator } from "@playwright/test";

const WCAG_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"];

type Violations = Awaited<ReturnType<AxeBuilder["analyze"]>>["violations"];

function formatViolations(violations: Violations): string {
  return violations
    .map((v) => {
      const nodes = v.nodes
        .map((n) => `    - ${n.target.join(" ")}`)
        .join("\n");
      return `${v.id} (impact: ${v.impact ?? "unknown"})\n  ${v.help}\n  ${v.helpUrl}\n  failing nodes:\n${nodes}`;
    })
    .join("\n\n");
}

async function expectNoViolations(page: Page) {
  const results = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze();
  expect(formatViolations(results.violations)).toBe("");
}

const ROUTES: { path: string; ready: (page: Page) => Locator }[] = [
  {
    path: "/search",
    ready: (p) =>
      p.getByRole("heading", { name: "Find programs and universities" }),
  },
  {
    path: "/browse",
    ready: (p) => p.getByRole("main").getByRole("listitem").first(),
  },
  {
    path: "/about",
    ready: (p) =>
      p.getByRole("heading", {
        name: "Universities and Study Programs in Bosnia and Herzegovina",
      }),
  },
  {
    path: "/api-docs",
    ready: (p) => p.getByRole("heading", { name: "REST API" }),
  },
  {
    path: "/login",
    ready: (p) => p.getByRole("heading", { name: "Log in" }),
  },
  {
    path: "/signup",
    ready: (p) => p.getByRole("heading", { name: "Create your account" }),
  },
];

for (const { path, ready } of ROUTES) {
  test(`${path} has no detectable a11y violations`, async ({ page }) => {
    await page.goto(path);
    await expect(ready(page)).toBeVisible();
    await expectNoViolations(page);
  });
}

test("search results have no detectable a11y violations", async ({ page }) => {
  await page.goto("/search");
  await page.getByRole("searchbox", { name: "Search" }).fill("univerzitet");
  await page.getByRole("button", { name: "Search", exact: true }).click();
  await expect(
    page.getByRole("main").getByRole("listitem").first(),
  ).toBeVisible();
  await expectNoViolations(page);
});
