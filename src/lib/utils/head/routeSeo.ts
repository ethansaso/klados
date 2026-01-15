export type RouteSeoInput = {
  title: string;
  description?: string;
};

export function routeSeo({ title, description }: RouteSeoInput) {
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
  };
}
