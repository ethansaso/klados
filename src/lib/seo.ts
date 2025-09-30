export const SITE_URL = "https://taxokeys.org";

export type SeoInput = {
  title: string;
  description?: string;
  image?: string;
  keywords?: string;
  canonicalPath?: string;
};

export function absoluteUrl(pathOrUrl?: string) {
  if (!pathOrUrl) return undefined;
  try {
    return new URL(pathOrUrl, SITE_URL).toString();
  } catch {
    return undefined;
  }
}

export function seo({
  title,
  description,
  keywords,
  image,
  canonicalPath,
}: SeoInput) {
  const imageAbs = absoluteUrl(image);
  const canonical = absoluteUrl(canonicalPath ?? "/");

  return {
    meta: [
      { title },
      { name: "description", content: description },
      { name: "keywords", content: keywords },
      { name: "theme-color", content: "#FFC53D" },

      // Open Graph
      { name: "og:type", content: "website" },
      { name: "og:title", content: title },
      { name: "og:description", content: description },
      canonical ? { name: "og:url", content: canonical } : null,
      imageAbs ? { name: "og:image", content: imageAbs } : null,

      // Twitter
      {
        name: "twitter:card",
        content: imageAbs ? "summary_large_image" : "summary",
      },
      { name: "twitter:title", content: title },
      { name: "twitter:description", content: description },
      imageAbs ? { name: "twitter:image", content: imageAbs } : null,
    ].filter(Boolean) as { name?: string; content?: string; title?: string }[],

    links: [canonical ? { rel: "canonical", href: canonical } : null].filter(
      Boolean
    ) as { rel: string; href: string }[],
  };
}
