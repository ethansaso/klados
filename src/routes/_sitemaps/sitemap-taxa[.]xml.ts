import { createFileRoute } from "@tanstack/react-router";
import { getTaxaSitemapEntriesFn } from "../../lib/server-fns/sitemap/getTaxaSitemapEntriesFn";
import { renderSitemapXml } from "./-renderSitemapXml";

export const Route = createFileRoute("/_sitemaps/sitemap-taxa.xml")({
  server: {
    handlers: {
      GET: async () => {
        const entries = await getTaxaSitemapEntriesFn();
        const xml = renderSitemapXml(entries);

        return new Response(xml, {
          headers: {
            "Content-Type": "application/xml",
            "Cache-Control":
              "public, max-age=300, stale-while-revalidate=86400",
          },
        });
      },
    },
  },
});
