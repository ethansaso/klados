import type { ModifierClass } from "../../../../db/schema/schema";
import { type UnitDTO } from "../units/types";

export type ModifierStateDTO = {
  id: number;
  value: string;
  affixType: "prefix" | "suffix";
  groupId: number;
  groupLabel: string;
  groupClass: ModifierClass;
};

export type Trait = {
  id: number;
  canonicalId: number;
  label: string;
  hasInfo: boolean;
  hexCode?: string;
};

type CharacterStateBase = {
  characterId: number;
  characterLabel: string;
  characterHasInfo: boolean;
};

type CharacterNumericStateBase = CharacterStateBase & {
  unit: UnitDTO | null;
};

export type CategoricalStateDTO = CharacterStateBase & {
  kind: "categorical";
  trait: Trait;
  modifiers: ModifierStateDTO[];
};
export type NumberStateDTO = CharacterNumericStateBase & {
  kind: "number";
  siBaseValue: number;
  modifiers: ModifierStateDTO[];
};
export type RangeStateDTO = CharacterNumericStateBase & {
  kind: "range";
  siBaseMin: number | null;
  siBaseMax: number | null;
  modifiers: ModifierStateDTO[];
};

export type CharacterStateDTO =
  CategoricalStateDTO | NumberStateDTO | RangeStateDTO;

export type FeatureStateDTO = {
  featureId: number;
  featureLabel: string;
  featureHasInfo: boolean;
  notes: string;
  states: CharacterStateDTO[];
};
