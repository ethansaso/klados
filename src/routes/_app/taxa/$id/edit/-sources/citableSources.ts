import type { SourceDTO } from "../../../../../../lib/domain/sources/types";
import type { TaxonSourceDTO } from "../../../../../../lib/domain/taxon-sources/types";
import type { SetTaxonSourcesInput } from "../../../../../../lib/domain/taxon-sources/validation";

/** A taxon source paired with its footnote number. */
export type NumberedFeatureCitation = {
  number: number;
  source: Pick<
    TaxonSourceDTO,
    "sourceId" | "source" | "locator" | "accessedAt"
  >;
};

/**
 * The editor's sources in the taxon page's order (by name), so numbers here
 * match its footnotes.
 */
export function getCitableSources(
  sources: SetTaxonSourcesInput,
  sourcesById: Map<number, SourceDTO>,
): NumberedFeatureCitation[] {
  return sources
    .flatMap((item) => {
      const source = sourcesById.get(item.sourceId);
      return source ? { ...item, source } : [];
    })
    .sort(
      (a, b) =>
        a.source.name.localeCompare(b.source.name) || a.sourceId - b.sourceId,
    )
    .map((source, i) => ({ number: i + 1, source }));
}
