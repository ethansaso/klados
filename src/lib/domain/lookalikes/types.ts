import { TaxonRank } from "../../../db/schema/schema";
import { Trait } from "../character-states/types";
import { TaxonDTO } from "../taxa/types";
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

export type LookalikeComparisonAnnotatedStateGroup = {
  groupId: number;
  groupLabel: string;
  aCharacters: LookalikeComparisonAnnotatedCharacterStates[];
  bCharacters: LookalikeComparisonAnnotatedCharacterStates[];
};

export type LookalikeComparisonAnnotatedCharacterStates = {
  characterId: number;
  characterLabel: string;
  traits: LookalikeComparisonAnnotatedTrait[];
};

export type LookalikeComparisonAnnotatedTrait = Trait & { isShared: boolean };

export type LookalikeComparisonDetailDTO = {
  a: TaxonDTO;
  b: TaxonDTO;
  groupedStates: LookalikeComparisonAnnotatedStateGroup[];
};
