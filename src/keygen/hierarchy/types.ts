import { TAXON_RANKS_DESCENDING } from "../../db/schema/schema";
import { TaxonCharacterStateDTO } from "../../lib/domain/character-states/types";

export type KGTaxonMeta = {
  id: number;
  name: string;
  rank: KGTaxonNode["rank"];
  subtaxonIds: number[];
};

export type KGTaxonNode = {
  id: number;
  name: string;
  rank: (typeof TAXON_RANKS_DESCENDING)[number];
  states: TaxonCharacterStateDTO[];
  subtaxonIds: number[];
};

export type KGKeyNode = {
  todo: never;
};
