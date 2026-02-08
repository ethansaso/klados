import type { TaxonRank } from "../../../../db/schema/schema";
import type { Prettify } from "../../utils/types/prettify";
import type {
  TaxonCategoricalStateDTO,
  TaxonNumberStateDTO,
  TaxonRangeStateDTO,
  Trait,
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

export type LookalikeComparisonAnnotatedCategoricalTrait = Trait &
  OverlapAnnotation;

export type LookalikeComparisonAnnotatedCategoricalState = Prettify<
  Pick<TaxonCategoricalStateDTO, "kind"> & {
    traits: LookalikeComparisonAnnotatedCategoricalTrait[];
  }
>;

export type LookalikeComparisonAnnotatedNumberState = Prettify<
  Pick<TaxonNumberStateDTO, "kind" | "siBaseValue" | "unit">
> &
  OverlapAnnotation;

export type LookalikeComparisonAnnotatedRangeState = Prettify<
  Pick<TaxonRangeStateDTO, "kind" | "siBaseMin" | "siBaseMax" | "unit">
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
