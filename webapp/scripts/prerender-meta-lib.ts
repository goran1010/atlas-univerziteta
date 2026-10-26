// Pure string transforms for prerender-meta.ts, split out so they can be
// unit tested. Every interpolated value goes through a replacer function -
// in a plain replacement string, $-patterns ($&, $', $1...) inside a
// university or faculty name would splice document text into the tag.

interface MetaRoute {
  title: string;
  description: string;
  url: string;
  image?: string;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function replaceTitle(html: string, title: string): string {
  return html.replace(/<title>[^<]*<\/title>/, () => `<title>${title}</title>`);
}

function replaceDescription(html: string, description: string): string {
  return html.replace(
    /(<meta\s+name="description"\s+content=")([^"]*)(")/,
    (_match, open: string, _old, close: string) =>
      `${open}${description}${close}`,
  );
}

function replaceMetaContent(
  html: string,
  property: string,
  content: string,
): string {
  const ogPattern = new RegExp(
    `(<meta\\s+property="${property}"\\s+content=")([^"]*)(")`,
  );
  const twitterPattern = new RegExp(
    `(<meta\\s+name="${property}"\\s+content=")([^"]*)(")`,
  );
  const replacer = (
    _match: string,
    open: string,
    _old: string,
    close: string,
  ) => `${open}${content}${close}`;
  html = html.replace(ogPattern, replacer);
  html = html.replace(twitterPattern, replacer);
  return html;
}

// og:url is already an absolute URL in the built HTML - replace the path
function replaceOgUrlPath(html: string, url: string): string {
  return html.replace(
    /(<meta\s+property="og:url"\s+content=")(https?:\/\/[^/]+)\/?(")/,
    (_match, open: string, origin: string, close: string) =>
      `${open}${origin}${url}/${close}`,
  );
}

// route.image is the og image filename, only passed when the caller
// confirmed the file exists
function renderRouteHtml(indexHtml: string, route: MetaRoute): string {
  let html = indexHtml;

  const title = escapeHtml(route.title);
  const description = escapeHtml(route.description);

  html = replaceTitle(html, title);
  html = replaceDescription(html, description);

  html = replaceMetaContent(html, "og:title", title);
  html = replaceMetaContent(html, "og:description", description);
  html = replaceMetaContent(html, "twitter:title", title);
  html = replaceMetaContent(html, "twitter:description", description);

  html = replaceOgUrlPath(html, route.url);

  const { image } = route;
  if (image) {
    html = html.replaceAll("og-image-home.png", () => image);
  }

  return html;
}

// each page is a <path>/index.html directory, which Netlify serves at
// <path>/ and reaches from <path> only through a 301;
// rerunning against the same sitemap must not duplicate entries
function addSitemapEntries(xml: string, urls: string[], today: string): string {
  const locs = urls.map((url) => `https://atlasuniverziteta.com${url}/`);
  const newLocs = locs.filter((loc) => !xml.includes(`<loc>${loc}</loc>`));
  const entries = newLocs
    .map(
      (loc) => `  <url>
    <loc>${loc}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>
`,
    )
    .join("");
  return xml.replace("</urlset>", () => `${entries}</urlset>`);
}

export {
  escapeHtml,
  replaceTitle,
  replaceDescription,
  replaceMetaContent,
  replaceOgUrlPath,
  renderRouteHtml,
  addSitemapEntries,
};

export type { MetaRoute };
