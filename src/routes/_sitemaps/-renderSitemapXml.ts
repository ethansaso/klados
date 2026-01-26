export function renderSitemapXml(entries: { loc: string; lastmod?: string }[]) {
  const urls = entries
    .map(
      (e) => `
  <url>
    <loc>${e.loc}</loc>
    ${e.lastmod ? `<lastmod>${e.lastmod}</lastmod>` : ""}
  </url>`,
    )
    .join("");

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`;
}
