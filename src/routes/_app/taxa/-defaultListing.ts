import {
  DEFAULT_TAXON_STATUSES,
  type TaxonFilters,
} from "../../../lib/domain/taxa/search";

/** Nothing searched or filtered: the landing view, ordered by completeness. */
export function isDefaultTaxonListing(search: TaxonFilters): boolean {
  return (
    !search.q?.trim() &&
    !search.filters.length &&
    !search.highRank &&
    !search.lowRank &&
    !search.hasMedia &&
    !search.hasMorphology &&
    !search.hasEcology &&
    search.status.length === DEFAULT_TAXON_STATUSES.length &&
    DEFAULT_TAXON_STATUSES.every((s) => search.status.includes(s))
  );
}
