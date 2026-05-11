import type { CharacterStateDTO, Trait } from "../../lib/domain/states/types";
import type { UnitDTO } from "../../lib/domain/units/types";

// UI-focused types with optional weight styling.
// Exclude metadata like characterId and featureId.
// This allows simpler usage in contexts where those IDs are
// difficult or impossible to provide.

type Weight = "light" | "regular" | "medium" | "bold";

export type UITrait = Omit<
  Trait,
  "description" | "hexCode" | "canonicalId"
> & {
  description?: string;
  hexCode?: string | null;
  weight?: Weight;
};

export type UIUnit = Pick<UnitDTO, "symbol" | "scale">;

/**
 * A modifier token for display purposes — just the fields needed to render
 * prefix/suffix text around a state badge.
 */
export type UIModifier = {
  id: number;
  value: string;
  affixType: "prefix" | "suffix";
  groupId: number;
};

export type UICategoricalState = Pick<
  Extract<CharacterStateDTO, { kind: "categorical" }>,
  "kind"
> & {
  trait: UITrait;
  modifiers: UIModifier[];
};

export type UINumberState = Pick<
  Extract<CharacterStateDTO, { kind: "number" }>,
  "kind" | "siBaseValue"
> & {
  unit: UIUnit | null;
  weight?: Weight;
  modifiers?: UIModifier[];
};

export type UIRangeState = Pick<
  Extract<CharacterStateDTO, { kind: "range" }>,
  "kind" | "siBaseMin" | "siBaseMax"
> & {
  unit: UIUnit | null;
  weight?: Weight;
  modifiers?: UIModifier[];
};

export type UICharacterState =
  | UICategoricalState
  | UINumberState
  | UIRangeState;
