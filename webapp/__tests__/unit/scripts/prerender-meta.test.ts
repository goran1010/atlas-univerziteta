import {
  escapeHtml,
  renderRouteHtml,
  addSitemapEntries,
} from "../../../scripts/prerender-meta-lib.ts";

// mirrors the tag shapes in index.html, including multi-line attributes
const FIXTURE = `<!doctype html>
<html lang="en">
  <head>
    <title>Atlas Univerziteta</title>
    <meta
      name="description"
      content="Default description"
    />
    <meta property="og:type" content="website" />
    <meta property="og:title" content="Atlas Univerziteta" />
    <meta
      property="og:description"
      content="Default description"
    />
    <meta property="og:url" content="https://atlasuniverziteta.com/" />
    <meta
      property="og:image"
      content="https://atlasuniverziteta.com/images/og-images/og-image-home.png"
    />
    <meta name="twitter:title" content="Atlas Univerziteta" />
    <meta
      name="twitter:description"
      content="Default description"
    />
    <meta
      name="twitter:image"
      content="https://atlasuniverziteta.com/images/og-images/og-image-home.png"
    />
  </head>
  <body>
    <div id="root">BODY-SENTINEL</div>
  </body>
</html>
`;

function countOccurrences(haystack: string, needle: string) {
  return haystack.split(needle).length - 1;
}

describe("escapeHtml", () => {
  test("escapes HTML special characters", () => {
    expect(escapeHtml(`Uni & "Co" <script>`)).toBe(
      "Uni &amp; &quot;Co&quot; &lt;script&gt;",
    );
  });

  test("leaves $ untouched - replacer functions make it safe", () => {
    expect(escapeHtml("Uni $& $' $1")).toBe("Uni $&amp; $' $1");
  });
});

describe("renderRouteHtml", () => {
  const route = {
    title: "Pretraga | Atlas Univerziteta",
    description: "Pretraga univerziteta",
    url: "/search",
  };

  test("replaces title, description, and og/twitter meta tags", () => {
    const html = renderRouteHtml(FIXTURE, route);

    expect(html).toContain("<title>Pretraga | Atlas Univerziteta</title>");
    expect(
      countOccurrences(html, 'content="Pretraga | Atlas Univerziteta"'),
    ).toBe(2);
    expect(countOccurrences(html, 'content="Pretraga univerziteta"')).toBe(3);
    expect(html).toContain(
      '<meta property="og:url" content="https://atlasuniverziteta.com/search/"',
    );
  });

  test("escapes HTML in entity-derived values", () => {
    const html = renderRouteHtml(FIXTURE, {
      ...route,
      title: `</title><script>alert(1)</script> | Atlas Univerziteta`,
      description: `"><script>alert(2)</script>`,
    });

    expect(html).not.toContain("<script>");
    expect(html).toContain("&lt;script&gt;alert(1)&lt;/script&gt;");
    expect(html).toContain("&quot;&gt;&lt;script&gt;alert(2)&lt;/script&gt;");
  });

  test("does not interpret $-patterns in values", () => {
    const html = renderRouteHtml(FIXTURE, {
      ...route,
      title: "Uni $' $& $1 | Atlas Univerziteta",
      description: "Opis $' $& $1",
    });

    // $' would splice everything after the match into the tag, duplicating
    // the rest of the document; $& would duplicate the matched tag itself
    expect(html).toContain(
      "<title>Uni $' $&amp; $1 | Atlas Univerziteta</title>",
    );
    expect(countOccurrences(html, "BODY-SENTINEL")).toBe(1);
    expect(countOccurrences(html, "<title>")).toBe(1);
  });

  test("swaps the og image only when one is passed", () => {
    const withImage = renderRouteHtml(FIXTURE, {
      ...route,
      image: "og-image-search.png",
    });
    const withoutImage = renderRouteHtml(FIXTURE, route);

    expect(withImage).not.toContain("og-image-home.png");
    expect(countOccurrences(withImage, "og-image-search.png")).toBe(2);
    expect(countOccurrences(withoutImage, "og-image-home.png")).toBe(2);
  });
});

describe("addSitemapEntries", () => {
  const SITEMAP = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://atlasuniverziteta.com/</loc>
  </url>
</urlset>`;

  test("appends entries with trailing-slash locs", () => {
    const xml = addSitemapEntries(SITEMAP, ["/universities/1"], "2026-10-25");

    expect(xml).toContain(
      "<loc>https://atlasuniverziteta.com/universities/1/</loc>",
    );
    expect(xml).toContain("<lastmod>2026-10-25</lastmod>");
    expect(xml.trimEnd().endsWith("</urlset>")).toBe(true);
  });

  test("rerunning with the same urls does not duplicate entries", () => {
    const once = addSitemapEntries(SITEMAP, ["/universities/1"], "2026-10-25");
    const twice = addSitemapEntries(once, ["/universities/1"], "2026-10-25");

    expect(
      countOccurrences(
        twice,
        "<loc>https://atlasuniverziteta.com/universities/1/</loc>",
      ),
    ).toBe(1);
  });
});
