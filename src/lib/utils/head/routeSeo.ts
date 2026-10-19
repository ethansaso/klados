import { absoluteUrl } from "./absoluteUrl";

export type RouteSeoInput = {
  title: string;
  description?: string;
  canonicalUrl?: string;
  /** Link preview image; the root's default card is used when omitted. */
  image?: string;
  links?: { rel: string; as?: string; href: string }[];
};

/**
 * Generates SEO metadata and link elements for a route. Tags here replace the
 * root's tags of the same name or property.
 *
 * ! Important: When used in a route.tsx, the canonicalUrl will be applied to all routes nested under such a route.
 */
export function routeSeo({
  title,
  description,
  canonicalUrl,
  image,
  links,
}: RouteSeoInput) {
  const canonicalAbs = absoluteUrl(canonicalUrl);
  const imageAbs = absoluteUrl(image);

  return {
    meta: [
      { title },
      description ? { name: "description", content: description } : null,
      { property: "og:title", content: title },
      description ? { property: "og:description", content: description } : null,
      canonicalAbs ? { property: "og:url", content: canonicalAbs } : null,
      imageAbs ? { property: "og:image", content: imageAbs } : null,
      { name: "twitter:title", content: title },
      description
        ? { name: "twitter:description", content: description }
        : null,
      imageAbs ? { name: "twitter:image", content: imageAbs } : null,
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
