import {
  TAXON_RANKS_DESCENDING,
  type TaxonRank,
} from "../../../../db/schema/schema";
import {
  infraspecificMarker,
  isRankMarker,
  isSubgenericRank,
  sciNameWords,
} from "../../domain/taxon-names/scientificName";
import { capitalizeFirstLetter } from "./casing";

/**
 * When to prefix the rank (e.g. "Section Phalloideae"); only applies above species.
 *  - "auto": only for ranks whose bare name doesn't convey the rank
 *    (sub-generic ranks and complexes).
 *  - "always": every rank above species (e.g. breadcrumbs).
 *  - "never": rank is shown alongside the name already.
 */
export type RankPrefixMode = "always" | "never";
type TaxonNamePart = { text: string; italic: boolean };

const rankIndex = (rank: TaxonRank) => TAXON_RANKS_DESCENDING.indexOf(rank);
const GENUS_IDX = rankIndex("genus");
const SPECIES_IDX = rankIndex("species");

function showsRankPrefix(rank: TaxonRank, mode: RankPrefixMode): boolean {
  if (mode === "never" || rankIndex(rank) >= SPECIES_IDX) return false;
  return mode === "always" || isSubgenericRank(rank) || rank === "complex";
}

/**
 * Split an accepted scientific name into display parts: names at genus and below
 * are italic, while rank prefixes and markers ("var.") are not.
 */
export function formatTaxonNameParts(
  rank: TaxonRank,
  name: string,
  prefixMode: RankPrefixMode = "always",
): TaxonNamePart[] {
  const italic = rankIndex(rank) >= GENUS_IDX;
  const words = sciNameWords(name);

  const parts = words.map((text) => ({
    text,
    italic: italic && !isRankMarker(text),
  }));

  // Only insert into conventional trinomials; legacy names may already carry a marker
  const marker = infraspecificMarker(rank);
  if (marker && words.length === 3) {
    parts.splice(parts.length - 1, 0, { text: marker, italic: false });
  }

  if (showsRankPrefix(rank, prefixMode)) {
    parts.unshift({ text: capitalizeFirstLetter(rank), italic: false });
  }

  return parts;
}

/** Plain-text display form of an accepted scientific name. */
export function formatTaxonName(
  rank: TaxonRank,
  name: string,
  rankPrefix: RankPrefixMode = "always",
): string {
  return formatTaxonNameParts(rank, name, rankPrefix)
    .map((p) => p.text)
    .join(" ");
}
