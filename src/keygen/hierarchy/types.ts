import { TAXON_RANKS_DESCENDING } from "../../db/schema/schema";
import { TaxonCharacterStateDTO } from "../../lib/domain/character-states/types";

export type HierarchyTaxonMeta = {
  id: number;
  name: string;
  rank: (typeof TAXON_RANKS_DESCENDING)[number];
  subtaxonIds: number[];
};

export type HierarchyTaxonNode = HierarchyTaxonMeta & {
  states: TaxonCharacterStateDTO[];
};
