import { TAXON_RANKS_DESCENDING } from "../../db/schema/schema";
import { capitalizeWord } from "./casing";

/**
 * Prefixes a given string with a taxon rank if > species.
 */
export function prefixWithRank(
  rank: (typeof TAXON_RANKS_DESCENDING)[number],
  name: string
): string {
  const ranksToPrefix = TAXON_RANKS_DESCENDING.slice(
    0,
    TAXON_RANKS_DESCENDING.indexOf("species")
  );
  if (ranksToPrefix.includes(rank)) {
    return `${capitalizeWord(rank)} ${name}`;
  }
  return name;
}
