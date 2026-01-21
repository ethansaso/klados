/**
 * Low-level ID-based types.
 */

import { UnitDTO } from "../units/types";

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
  groupId: number;
  groupLabel: string;
  groupDescription: string;
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
