import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { parseEnv } from "node:util";
import { renderRouteHtml, addSitemapEntries } from "./prerender-meta-lib.ts";
import type { MetaRoute } from "./prerender-meta-lib.ts";

const distDir = join(import.meta.dirname, "..", "dist");

interface LocaleTree {
  [key: string]: string | LocaleTree;
}

const localeFile = join(import.meta.dirname, "..", "src", "locales", "en.json");
const locale = JSON.parse(readFileSync(localeFile, "utf-8")) as LocaleTree;

function t(path: string): string {
  let node: string | LocaleTree | undefined = locale;
  for (const key of path.split(".")) {
    if (typeof node !== "object") {
      node = undefined;
      break;
    }
    node = node[key];
  }
  if (typeof node !== "string") {
    throw new Error(`Missing locale key: ${path}`);
  }
  return node;
}

const APP_NAME = t("title.app");

interface Route extends MetaRoute {
  path: string;
}

// every title follows "Page | App"; image names refer to
// public/images/og-images/<name> and fall back to the default og image when the
// screenshot has not been added yet
const routes: Route[] = [
  {
    path: "search",
    title: `${t("title.universities")} | ${APP_NAME}`,
    description: t("meta.universities"),
    url: "/search",
    image: "og-image-search.png",
  },
  {
    path: "about",
    title: `${t("title.about")} | ${APP_NAME}`,
    description: t("meta.home"),
    url: "/about",
    image: "og-image-about.png",
  },
  {
    path: "api-docs",
    title: `${t("title.api")} | ${APP_NAME}`,
    description: t("meta.api"),
    url: "/api-docs",
    image: "og-image-api-docs.png",
  },
  {
    path: "login",
    title: `${t("title.login")} | ${APP_NAME}`,
    description: t("meta.login"),
    url: "/login",
    image: "og-image-login.png",
  },
  {
    path: "signup",
    title: `${t("title.signup")} | ${APP_NAME}`,
    description: t("meta.signup"),
    url: "/signup",
    image: "og-image-signup.png",
  },
];

const imagesDir = join(
  import.meta.dirname,
  "..",
  "public",
  "images",
  "og-images",
);

const indexHtml = readFileSync(join(distDir, "index.html"), "utf-8");

function renderRoute(route: Route) {
  const image =
    route.image && existsSync(join(imagesDir, route.image))
      ? route.image
      : undefined;

  const html = renderRouteHtml(indexHtml, { ...route, image });

  const outDir = join(distDir, route.path);
  mkdirSync(outDir, { recursive: true });
  writeFileSync(join(outDir, "index.html"), html);
}

let generated = 0;

for (const route of routes) {
  renderRoute(route);
  generated++;
}

console.log(`Pre-rendered meta tags for ${String(generated)} static routes.`);

// ---- per-entity pages + sitemap --------------------------------------------
// The build fetches the catalog and writes a static page per university and
// faculty so shared links get entity-specific previews (crawlers do not run
// the SPA). Meta freshness equals deploy freshness. VITE_API_URL is an
// absolute URL in production and is used directly.

function apiBaseUrl(): string | null {
  const candidates: (string | undefined)[] = [process.env["VITE_API_URL"]];
  const envFile = join(import.meta.dirname, "..", ".env");
  if (existsSync(envFile)) {
    const parsed = parseEnv(readFileSync(envFile, "utf-8")) as Record<
      string,
      string | undefined
    >;
    candidates.push(parsed["VITE_API_URL"]);
  }
  const absolute = candidates.find(
    (value) =>
      typeof value === "string" &&
      (value.startsWith("http://") || value.startsWith("https://")),
  );
  return absolute ? absolute.replace(/\/+$/, "") : null;
}

async function fetchJson(url: string): Promise<unknown> {
  const response = await fetch(url, { signal: AbortSignal.timeout(15_000) });
  if (!response.ok) {
    throw new Error(`${url} responded ${String(response.status)}`);
  }
  return response.json();
}

// the list endpoints paginate (max 100 per page) - walk every page
async function fetchAllPages<T>(baseUrl: string): Promise<T[]> {
  const items: T[] = [];
  let page = 1;
  let totalPages = 1;
  while (page <= totalPages) {
    const body = (await fetchJson(
      `${baseUrl}?limit=100&page=${String(page)}`,
    )) as { data: T[]; totalPages?: number };
    items.push(...body.data);
    totalPages = body.totalPages ?? 1;
    page += 1;
  }
  return items;
}

function appendToSitemap(urls: string[]) {
  const sitemapFile = join(distDir, "sitemap.xml");
  if (!existsSync(sitemapFile)) return;
  const xml = readFileSync(sitemapFile, "utf-8");
  const today = new Date().toISOString().slice(0, 10);
  writeFileSync(sitemapFile, addSitemapEntries(xml, urls, today));
}

interface UniversityListItem {
  id: number;
  name: string;
  city: string;
  entity: string;
}

interface FacultyListItem {
  id: number;
  name: string;
  university: { name: string };
}

const apiUrl = apiBaseUrl();
if (!apiUrl) {
  console.warn(
    "prerender-meta: no absolute API URL (VITE_API_URL) - skipping per-entity pages.",
  );
} else {
  try {
    const [universities, faculties] = await Promise.all([
      fetchAllPages<UniversityListItem>(`${apiUrl}/api/v1/universities`),
      fetchAllPages<FacultyListItem>(`${apiUrl}/api/v1/faculties`),
    ]);

    const entityUrls: string[] = [];
    let entityPages = 0;

    for (const university of universities) {
      const url = `/universities/${String(university.id)}`;
      const entityLabel = t(`universitiesPage.entities.${university.entity}`);
      renderRoute({
        path: url.slice(1),
        title: `${university.name} | ${APP_NAME}`,
        description: `${university.name} - ${university.city}, ${entityLabel}`,
        url,
      });
      entityUrls.push(url);
      entityPages++;
    }

    for (const faculty of faculties) {
      const url = `/faculties/${String(faculty.id)}`;
      renderRoute({
        path: url.slice(1),
        title: `${faculty.name} | ${APP_NAME}`,
        description: `${faculty.name} - ${faculty.university.name}`,
        url,
      });
      entityUrls.push(url);
      entityPages++;
    }

    appendToSitemap(entityUrls);
    console.log(
      `Pre-rendered meta tags for ${String(entityPages)} entity pages (sitemap updated).`,
    );
  } catch (error) {
    // never fail the deploy over this - previews just fall back to defaults
    console.warn("prerender-meta: per-entity stage skipped:", error);
  }
}
