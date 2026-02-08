import { absoluteUrl } from "./absoluteUrl";

export type RouteSeoInput = {
  title: string;
  description?: string;
  canonicalUrl?: string;
  links?: { rel: string; as?: string; href: string }[];
};

/**
 * Generates SEO metadata and link elements for a route.
 *
 * ! Important: When used in a route.tsx, the canonicalUrl will be applied to all routes nested under such a route.
 */
export function routeSeo({
  title,
  description,
  canonicalUrl,
  links,
}: RouteSeoInput) {
  const canonicalAbs = absoluteUrl(canonicalUrl);

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
    links: [
      ...(links ?? []),
      ...(canonicalAbs ? [{ rel: "canonical", href: canonicalAbs }] : []),
    ],
  };
}
