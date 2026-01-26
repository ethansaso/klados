import type { TaxonRank } from "../../../../db/schema/schema";
import type {
  TaxonCategoricalStateDTO,
  TaxonNumberStateDTO,
  TaxonRangeStateDTO,
  Trait,
} from "../character-states/types";
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

export type LookalikeComparisonAnnotatedCategoricalTrait = Trait &
  OverlapAnnotation;

export type LookalikeComparisonAnnotatedCategoricalState = Pick<
  TaxonCategoricalStateDTO,
  "kind"
> & {
  traits: LookalikeComparisonAnnotatedCategoricalTrait[];
};

export type LookalikeComparisonAnnotatedNumberState = Pick<
  TaxonNumberStateDTO,
  "kind" | "siBaseValue" | "unit"
> &
  OverlapAnnotation;

export type LookalikeComparisonAnnotatedRangeState = Pick<
  TaxonRangeStateDTO,
  "kind" | "siBaseMin" | "siBaseMax" | "unit"
> &
  OverlapAnnotation;

export type LookalikeComparisonAnnotatedState =
  | LookalikeComparisonAnnotatedCategoricalState
  | LookalikeComparisonAnnotatedNumberState
  | LookalikeComparisonAnnotatedRangeState;

export type LookalikeComparisonCharacter = {
  characterId: number;
  characterLabel: string;
  state: LookalikeComparisonAnnotatedState | null;
};

export type LookalikeComparisonGroup = {
  groupId: number;
  groupLabel: string;
  aCharacters: LookalikeComparisonCharacter[];
  bCharacters: LookalikeComparisonCharacter[];
};

export type LookalikeComparisonDetailDTO = {
  a: TaxonDTO;
  b: TaxonDTO;
  groupedStates: LookalikeComparisonGroup[];
};
