import { absoluteUrl } from "./absoluteUrl";

export type SeoInput = {
  title: string;
  canonicalUrl: string;
  description?: string;
  image?: string;
};

export function rootSeo({ title, description, image, canonicalUrl }: SeoInput) {
  const imageAbs = absoluteUrl(image);

  return {
    meta: [
      { title },
      { name: "description", content: description },
      { name: "theme-color", content: "#FFC53D" },

      // Open Graph
      { property: "og:type", content: "website" },
      { property: "og:site_name", content: "Klados" },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:url", content: absoluteUrl(canonicalUrl) },
      imageAbs ? { property: "og:image", content: imageAbs } : null,

      // Twitter
      {
        name: "twitter:card",
        content: imageAbs ? "summary_large_image" : "summary",
      },
      { name: "twitter:title", content: title },
      { name: "twitter:description", content: description },
      imageAbs ? { name: "twitter:image", content: imageAbs } : null,
    ].filter(Boolean) as (
      | { title: string }
      | { name: string; content?: string }
      | { property: string; content?: string }
    )[],
    links: [{ rel: "canonical", href: absoluteUrl(canonicalUrl) }],
  };
}
