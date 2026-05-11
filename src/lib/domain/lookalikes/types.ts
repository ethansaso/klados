import type { TaxonRank } from "../../../../db/schema/schema";
import type { Prettify } from "../../utils/types/prettify";
import type {
  CategoricalStateDTO,
  ModifierStateDTO,
  NumberStateDTO,
  RangeStateDTO,
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
  Pick<CategoricalStateDTO, "kind"> & {
    traits: LookalikeComparisonAnnotatedCategoricalTrait[];
  }
>;

export type LookalikeComparisonAnnotatedNumberEntry = Pick<
  NumberStateDTO,
  "siBaseValue" | "unit" | "modifiers"
> &
  OverlapAnnotation;

export type LookalikeComparisonAnnotatedRangeEntry = Pick<
  RangeStateDTO,
  "siBaseMin" | "siBaseMax" | "unit" | "modifiers"
> &
  OverlapAnnotation;

export type LookalikeComparisonAnnotatedNumberState = Prettify<{
  kind: "number";
  entries: LookalikeComparisonAnnotatedNumberEntry[];
}>;

export type LookalikeComparisonAnnotatedRangeState = Prettify<{
  kind: "range";
  entries: LookalikeComparisonAnnotatedRangeEntry[];
}>;

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
