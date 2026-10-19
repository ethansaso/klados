type TaxonRef = { id: number; acceptedName: string };

/** URL slugs for a taxon's name, alphanumeric with `-` substitution. */
export function taxonSlug(name: string): string {
  return name.replace(/[^a-zA-Z0-9]+/g, "-").replace(/^-|-$/g, "");
}

/** Route params for linking to a taxon's pages. */
export function taxonParams(taxon: TaxonRef): { id: number; slug: string } {
  return { id: taxon.id, slug: taxonSlug(taxon.acceptedName) };
}

/** Canonical path of a taxon's page, e.g. "/taxa/5-Amanita-muscaria". */
export function taxonPath(taxon: TaxonRef): string {
  return `/taxa/${formatTaxonSegment(taxonParams(taxon))}`;
}

/** "5-Amanita-muscaria" → { id: 5, slug: "Amanita-muscaria" }; null if no leading id. */
export function parseTaxonSegment(
  segment: string,
): { id: number; slug: string } | null {
  const match = /^(\d+)(?:-(.*))?$/.exec(segment);
  return match ? { id: Number(match[1]), slug: match[2] ?? "" } : null;
}

export function formatTaxonSegment({
  id,
  slug,
}: {
  id: number | string;
  slug?: string;
}): string {
  return slug ? `${id}-${slug}` : String(id);
}
