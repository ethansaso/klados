import type { TaxonRank } from "../../../../db/schema/schema";
import type {
  CategoricalStateDTO,
  NumberStateDTO,
  RangeStateDTO,
} from "../states/types";
import type { TaxonDTO } from "../taxa/types";
import type { MediaItem } from "../taxa/validation";

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

type OverlapAnnotation = {
  isOverlapping: boolean;
};

export type LookalikeComparisonAnnotatedCategoricalState =
  CategoricalStateDTO & OverlapAnnotation;

export type LookalikeComparisonAnnotatedNumberState = NumberStateDTO &
  OverlapAnnotation;

export type LookalikeComparisonAnnotatedRangeState = RangeStateDTO &
  OverlapAnnotation;

export type LookalikeComparisonAnnotatedState =
  | LookalikeComparisonAnnotatedCategoricalState
  | LookalikeComparisonAnnotatedNumberState
  | LookalikeComparisonAnnotatedRangeState;

export type LookalikeComparisonCharacter = {
  characterId: number;
  characterLabel: string;
  states: LookalikeComparisonAnnotatedState[];
};

export type LookalikeComparisonGroup = {
  groupId: number;
  groupLabel: string;

  /** When null, taxon lacks group altogether */
  aCharacters: LookalikeComparisonCharacter[] | null;
  /** When null, taxon lacks group altogether */
  bCharacters: LookalikeComparisonCharacter[] | null;
};

export type LookalikeComparisonDetailDTO = {
  a: TaxonDTO;
  b: TaxonDTO;
  groupedStates: LookalikeComparisonGroup[];
};
