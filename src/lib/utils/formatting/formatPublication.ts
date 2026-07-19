import { type SourceDTO } from "../../domain/sources/types";
import { type TaxonSourceDTO } from "../../domain/taxon-sources/types";

// note: title is always nonempty, only included in .filter() calls for convenience

interface PublicationComponents {
  title: string;
  authorAndYear: string;
  publisher: string;
}

export function parseSourceFields(source: SourceDTO): PublicationComponents {
  const author = source.authors.trim();
  const year = source.publicationYear;

  return {
    title: source.name.trim(),
    authorAndYear: author && year ? `${author} (${year})` : author,
    publisher: source.publisher.trim(),
  };
}

export function formatPublication(source: SourceDTO): string {
  const { title, authorAndYear, publisher } = parseSourceFields(source);
  const parts = [authorAndYear, title, publisher].filter(Boolean);

  return parts.join(". ") + (parts.length ? "." : "");
}

export function formatPublicationUsage(ts: TaxonSourceDTO): string {
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
