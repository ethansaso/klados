/**
 * Low-level ID-based types.
 */

import { type UnitDTO } from "../units/types";

export type Trait = {
  id: number;
  canonicalId: number;
  label: string;
  description: string;
  hexCode?: string;
};

type TaxonStateBase = {
  characterId: number;
  characterLabel: string;
  characterDescription: string;
};

type TaxonNumericStateBase = TaxonStateBase & {
  unit: UnitDTO | null;
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

export type TaxonCharacterGroupStateDTO = {
  groupId: number;
  groupLabel: string;
  groupDescription: string;
  states: TaxonCharacterStateDTO[];
};
