import { createFileRoute } from "@tanstack/react-router";
import { getTaxaSitemapEntries } from "../../lib/domain/taxa/service";
import { renderSitemapXml } from "./-renderSitemapXml";

export const Route = createFileRoute("/_sitemaps/sitemap-taxa.xml")({
  server: {
    handlers: {
      GET: async () => {
        const entries = await getTaxaSitemapEntries();
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
