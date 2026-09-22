import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { parseEnv } from "node:util";

const distDir = join(import.meta.dirname, "..", "dist");

const localeFile = join(import.meta.dirname, "..", "src", "locales", "en.json");
const locale = JSON.parse(readFileSync(localeFile, "utf-8"));

function t(path) {
  return path.split(".").reduce((obj, key) => obj[key], locale);
}

const APP_NAME = t("title.app");

// every title follows "Page | App"; image names refer to
// public/images/<name> and fall back to the default og image when the
// screenshot has not been added yet
const routes = [
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

const imagesDir = join(import.meta.dirname, "..", "public", "images");

const indexHtml = readFileSync(join(distDir, "index.html"), "utf-8");

function replaceMetaContent(html, property, content) {
  const ogPattern = new RegExp(
    `(<meta\\s+property="${property}"\\s+content=")([^"]*)(")`,
  );
  const twitterPattern = new RegExp(
    `(<meta\\s+name="${property}"\\s+content=")([^"]*)(")`,
  );
  html = html.replace(ogPattern, `$1${content}$3`);
  html = html.replace(twitterPattern, `$1${content}$3`);
  return html;
}

function replaceTitle(html, title) {
  return html.replace(/<title>[^<]*<\/title>/, `<title>${title}</title>`);
}

function replaceDescription(html, description) {
  return html.replace(
    /(<meta\s+name="description"\s+content=")([^"]*)(")/,
    `$1${description}$3`,
  );
}

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function renderRoute(route) {
  let html = indexHtml;

  const title = escapeHtml(route.title);
  const description = escapeHtml(route.description);

  html = replaceTitle(html, title);
  html = replaceDescription(html, description);

  html = replaceMetaContent(html, "og:title", title);
  html = replaceMetaContent(html, "og:description", description);
  html = replaceMetaContent(html, "twitter:title", title);
  html = replaceMetaContent(html, "twitter:description", description);

  // og:url is already an absolute URL in the built HTML - replace the path
  html = html.replace(
    /(<meta\s+property="og:url"\s+content=")(https?:\/\/[^/]+)(\/?)(")/,
    `$1$2${route.url}$4`,
  );

  if (route.image && existsSync(join(imagesDir, route.image))) {
    html = html.replaceAll("og-image-home.png", route.image);
  }

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
// the SPA). Meta freshness equals deploy freshness. Netlify's runtime
// VITE_SERVER_URL is the /server proxy path, which does not exist at build
// time - set PRERENDER_API_URL there (absolute URL) to enable this stage.

function apiBaseUrl() {
  const candidates = [
    process.env.PRERENDER_API_URL,
    process.env.VITE_SERVER_URL,
  ];
  const envFile = join(import.meta.dirname, "..", ".env");
  if (existsSync(envFile)) {
    const parsed = parseEnv(readFileSync(envFile, "utf-8"));
    candidates.push(parsed.PRERENDER_API_URL, parsed.VITE_SERVER_URL);
  }
  const absolute = candidates.find(
    (value) => typeof value === "string" && /^https?:\/\//.test(value),
  );
  return absolute ? absolute.replace(/\/+$/, "") : null;
}

async function fetchJson(url) {
  const response = await fetch(url, { signal: AbortSignal.timeout(15_000) });
  if (!response.ok) {
    throw new Error(`${url} responded ${String(response.status)}`);
  }
  return response.json();
}

function appendToSitemap(urls) {
  const sitemapFile = join(distDir, "sitemap.xml");
  if (!existsSync(sitemapFile)) return;
  let xml = readFileSync(sitemapFile, "utf-8");
  const today = new Date().toISOString().slice(0, 10);
  // rerunning against the same dist must not duplicate entries
  const newUrls = urls.filter(
    (url) => !xml.includes(`<loc>https://atlasuniverziteta.com${url}</loc>`),
  );
  const entries = newUrls
    .map(
      (url) => `  <url>
    <loc>https://atlasuniverziteta.com${url}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>
`,
    )
    .join("");
  xml = xml.replace("</urlset>", `${entries}</urlset>`);
  writeFileSync(sitemapFile, xml);
}

const apiUrl = apiBaseUrl();
if (!apiUrl) {
  console.warn(
    "prerender-meta: no absolute API URL (PRERENDER_API_URL) - skipping per-entity pages.",
  );
} else {
  try {
    const [universities, faculties] = await Promise.all([
      fetchJson(`${apiUrl}/api/v1/universities`),
      fetchJson(`${apiUrl}/api/v1/faculties`),
    ]);

    const entityUrls = [];
    let entityPages = 0;

    for (const university of universities.data) {
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

    for (const faculty of faculties.data) {
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
