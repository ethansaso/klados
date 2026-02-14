import type {
  TaxonCharacterStateDTO,
  Trait,
} from "../../lib/domain/states/types";
import type { UnitDTO } from "../../lib/domain/units/types";

// UI-focused types with optional weight styling.
// Exclude metadata like characterId and featureId.
// This allows simpler usage in contexts where those IDs are
// difficult or impossible to provide.

type Weight = "light" | "regular" | "medium" | "bold";

export type UITrait = Omit<Trait, "description" | "hexCode" | "canonicalId"> & {
  description?: string;
  hexCode?: string | null;
  weight?: Weight;
};

export type UIUnit = Pick<UnitDTO, "symbol" | "scale">;

export type UICategoricalState = Pick<
  Extract<TaxonCharacterStateDTO, { kind: "categorical" }>,
  "kind"
> & {
  traitValues: UITrait[];
};

export type UINumberState = Pick<
  Extract<TaxonCharacterStateDTO, { kind: "number" }>,
  "kind" | "siBaseValue"
> & {
  unit: UIUnit | null;
  weight?: Weight;
};

export type UIRangeState = Pick<
  Extract<TaxonCharacterStateDTO, { kind: "range" }>,
  "kind" | "siBaseMin" | "siBaseMax"
> & {
  unit: UIUnit | null;
  weight?: Weight;
};

export type UICharacterState =
  | UICategoricalState
  | UINumberState
  | UIRangeState;
