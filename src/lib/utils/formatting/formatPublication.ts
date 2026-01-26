import { type SourceDTO } from "../../domain/sources/types";
import { type TaxonSourceDTO } from "../../domain/taxon-sources/types";

export function formatPublication(source: SourceDTO): string {
  const author = source.authors?.trim();
  const year = source.publicationYear;

  const authorAndYear = author && year ? `${author} (${year})` : author;

  const title = source.name?.trim();
  const publisher = source.publisher?.trim();

  const parts = [authorAndYear, title, publisher].filter(Boolean);

  return parts.join(". ") + (parts.length ? "." : "");
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
