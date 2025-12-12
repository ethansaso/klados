import { TaxonRank } from "../../../db/schema/schema";
import { TaxonCharacterStateDTO } from "../character-states/types";
import { MediaItem } from "../taxa/validation";

export type TaxonLookalikeDTO = {
  id: number;
  rank: TaxonRank;
  acceptedName: string;
  preferredCommonName: string | null;
  media: MediaItem[];

  sharedCount: number;
  jaccard: number;
  pctOfTargetMatched: number;

  // optional debugging / UI
  targetCount: number;
  otherCount: number;
};

export type LookalikeCompareDTO = {
  a: { taxonId: number; states: TaxonCharacterStateDTO[] };
  b: { taxonId: number; states: TaxonCharacterStateDTO[] };
  diff: {
    shared: TaxonCharacterStateDTO[];
    onlyA: TaxonCharacterStateDTO[];
    onlyB: TaxonCharacterStateDTO[];
  };
};
