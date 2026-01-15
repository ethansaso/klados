export type SeoInput = {
  title: string;
  description?: string;
  image?: string;
  keywords?: string;
};

export const SITE_URL =
  import.meta.env.VITE_SITE_URL ||
  (typeof window !== "undefined" ? window.location.origin : undefined);
export const GA_ID = import.meta.env.VITE_GA_ID;

export function absoluteUrl(pathOrUrl?: string) {
  if (!pathOrUrl) return undefined;
  try {
    return new URL(pathOrUrl, SITE_URL).toString();
  } catch {
    return undefined;
  }
}

export function rootSeo({ title, description, keywords, image }: SeoInput) {
  const imageAbs = absoluteUrl(image);

  return {
    meta: [
      { title },
      { name: "description", content: description },
      { name: "keywords", content: keywords },
      { name: "theme-color", content: "#FFC53D" },

      // Open Graph
      { property: "og:type", content: "website" },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
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
  };
}
