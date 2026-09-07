import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const distDir = join(__dirname, "..", "dist");

const localeFile = join(__dirname, "..", "src", "locales", "en.json");
const locale = JSON.parse(readFileSync(localeFile, "utf-8"));

function t(path) {
  return path.split(".").reduce((obj, key) => obj[key], locale);
}

const APP_NAME = t("title.app");

const routes = [
  {
    path: "search",
    title: `${t("title.universities")} | ${APP_NAME}`,
    description: t("meta.universities"),
    url: "/",
  },
  {
    path: "browse",
    title: `${t("title.universities")} | ${APP_NAME}`,
    description: t("meta.universities"),
    url: "/",
  },
  {
    path: "about",
    title: `${t("home.title")} | ${APP_NAME}`,
    description: t("meta.home"),
    url: "/about",
  },
  {
    path: "api-docs",
    title: `${t("title.api")} | ${APP_NAME}`,
    description: t("meta.api"),
    url: "/api-docs",
  },
  {
    path: "login",
    title: `${t("title.login")} | ${APP_NAME}`,
    description: t("meta.login"),
    url: "/login",
  },
  {
    path: "signup",
    title: `${t("title.signup")} | ${APP_NAME}`,
    description: t("meta.signup"),
    url: "/signup",
  },
];

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

let generated = 0;

for (const route of routes) {
  let html = indexHtml;

  html = replaceTitle(html, route.title);
  html = replaceDescription(html, route.description);

  html = replaceMetaContent(html, "og:title", route.title);
  html = replaceMetaContent(html, "og:description", route.description);
  html = replaceMetaContent(html, "twitter:title", route.title);
  html = replaceMetaContent(html, "twitter:description", route.description);

  // og:url is already an absolute URL in the built HTML - replace the path
  html = html.replace(
    /(<meta\s+property="og:url"\s+content=")(https?:\/\/[^/]+)(\/?)(")/,
    `$1$2${route.url}$4`,
  );

  const outDir = join(distDir, route.path);
  mkdirSync(outDir, { recursive: true });
  writeFileSync(join(outDir, "index.html"), html);
  generated++;
}

console.log(`Pre-rendered meta tags for ${String(generated)} routes.`);
