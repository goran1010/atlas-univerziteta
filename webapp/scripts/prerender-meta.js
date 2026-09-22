import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";

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

  if (route.image && existsSync(join(imagesDir, route.image))) {
    html = html.replaceAll("og-image-home.png", route.image);
  }

  const outDir = join(distDir, route.path);
  mkdirSync(outDir, { recursive: true });
  writeFileSync(join(outDir, "index.html"), html);
  generated++;
}

console.log(`Pre-rendered meta tags for ${String(generated)} routes.`);
