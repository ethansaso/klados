/**
 * Low-level ID-based types.
 */

import { UnitDTO } from "../units/types";

export type Trait = {
  id: number;
  canonicalId: number;
  label: string;
  hexCode?: string;
};

type TaxonStateBase = {
  characterId: number;
  groupId: number;
};

type TaxonNumericStateBase = TaxonStateBase & {
  unit: UnitDTO;
};

export type TaxonCategoricalStateDTO = TaxonStateBase & {
  kind: "categorical";
  traitValues: Trait[];
};
export type TaxonNumberStateDTO = TaxonNumericStateBase & {
  kind: "number";
  siBaseValue: number;
};
export type TaxonRangeStateDTO = TaxonNumericStateBase & {
  kind: "range";
  siBaseMin: number;
  siBaseMax: number;
};

export type TaxonCharacterStateDTO =
  | TaxonCategoricalStateDTO
  | TaxonNumberStateDTO
  | TaxonRangeStateDTO;

/**
 * Display-oriented types for viewing/editing types.
 */

type DisplayStateNumericalBase = {
  unit: UnitDTO;
};

export type DisplayCategoricalState = {
  kind: "categorical";
  traitValues: Trait[];
};
export type DisplayNumberState = DisplayStateNumericalBase & {
  kind: "number";
  displayValue: number;
};
export type DisplayRangeState = DisplayStateNumericalBase & {
  kind: "range";
  displayMin: number;
  displayMax: number;
};

export type DisplayCharacterState =
  | DisplayCategoricalState
  | DisplayNumberState
  | DisplayRangeState;

export type TaxonCharacterInGroup = {
  id: number;
  label: string;
  description: string;
  state: DisplayCharacterState | null;
};

export type TaxonCharacterDisplayGroupDTO = {
  id: number;
  label: string;
  description: string;
  characters: TaxonCharacterInGroup[];
};
