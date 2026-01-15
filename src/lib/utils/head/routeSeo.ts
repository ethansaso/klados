import { SITE_URL } from "./rootSeo";

export type RouteSeoInput = {
  title: string;
  description?: string;
  canonicalUrl?: string;
};

export function absoluteUrl(pathOrUrl?: string) {
  if (!pathOrUrl) return undefined;
  try {
    return new URL(pathOrUrl, SITE_URL).toString();
  } catch {
    return undefined;
  }
}

export function routeSeo({ title, description, canonicalUrl }: RouteSeoInput) {
  const canonicalAbs = canonicalUrl ? absoluteUrl(canonicalUrl) : undefined;

  return {
    meta: [
      { title },
      description ? { name: "description", content: description } : null,
      // Optional but useful for embeds if route overrides root intent
      { property: "og:title", content: title },
      description ? { property: "og:description", content: description } : null,
      { name: "twitter:title", content: title },
      description
        ? { name: "twitter:description", content: description }
        : null,
    ].filter(Boolean) as (
      | { title: string }
      | { name: string; content: string }
      | { property: string; content: string }
    )[],
    links: canonicalAbs ? [{ rel: "canonical", href: canonicalAbs }] : [],
  };
}
