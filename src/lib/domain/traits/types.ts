import { categoricalTraitValue } from "../../../../db/schema/schema";
import type { PaginatedResult } from "../../validation/pagination";

export type TraitValueRow = typeof categoricalTraitValue.$inferSelect;

/** For use as siblings in a synonym set. */
export type TraitSynonymDTO = Pick<TraitValueRow, "id" | "label">;

export type TraitValueDTO = Pick<
  TraitValueRow,
  "id" | "characterId" | "synonymSetId" | "label" | "hexCode" | "description"
> & {
  /** States referencing this trait */
  usageCount: number;
  /** Other labels in the same set. Excludes self. Sorted by label. */
  synonyms: TraitSynonymDTO[];
};

export type TraitValuePaginatedResult = PaginatedResult<TraitValueDTO>;

/** A set of synonyms returned as suggestions for a query. */
export type SynonymCandidateDTO = {
  synonymSetId: number;
  /** Trait to link against: the set's best match for the query. */
  headTraitId: number;
  /** Every label in the set, best match first. */
  labels: string[];
};
