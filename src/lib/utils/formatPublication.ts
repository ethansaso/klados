import { SourceDTO } from "../domain/sources/types";
import { TaxonSourceDTO } from "../domain/taxon-sources/types";

export function formatPublication(source: SourceDTO): string {
  const authors = source.authors?.trim();
  const year = source.publicationYear
    ? `(${source.publicationYear}).`
    : undefined;
  const title = source.name?.trim();
  const publisher = source.publisher?.trim();

  const parts = [
    authors,
    year,
    title ? `${title}.` : undefined,
    publisher ? `${publisher}.` : undefined,
  ].filter(Boolean);

  return parts.join(" ");
}

export function formatPublicationForTaxon(ts: TaxonSourceDTO): string {
  const publication = formatPublication(ts.source);

  const locator = ts.locator ? ts.locator.trim() : undefined;

  const accessed = ts.accessedAt
    ? `Accessed ${ts.accessedAt.toISOString().slice(0, 10)}.`
    : undefined;

  const parts = [
    publication,
    locator ? `${locator}.` : undefined,
    accessed,
  ].filter(Boolean);

  return parts.join(" ");
}
