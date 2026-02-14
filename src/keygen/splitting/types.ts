import type { Trait } from "../../lib/domain/states/types";
import type { HierarchyTaxonNode } from "../hierarchy/types";

export type TaxonGroup = HierarchyTaxonNode[];

/**
 * One "reason" a branch exists, for a single categorical character.
 */
export type CharacterClause = {
  characterId: number;
  featureId: number;
  traits: Trait[];
  /**
   * false: taxa in this branch HAVE these traits
   * true:  taxa in this branch DO NOT have these traits ("not any of …")
   */
  inverted: boolean;
};

export type CharacterDefinitionSplitBranch = {
  taxa: TaxonGroup;
  clauses: CharacterClause[];
};

export type CharacterDefinitionSplitResult = {
  kind: "character-definition";
  score: number;
  branches: CharacterDefinitionSplitBranch[];
};

export type FeaturePresentAbsentSplitBranch = {
  taxa: TaxonGroup;
  status: "present" | "absent";
};

export type FeaturePresentAbsentSplitResult = {
  kind: "feature-present-absent";
  featureId: number;
  score: number;
  branches: FeaturePresentAbsentSplitBranch[];
};

export type SplitResult =
  | CharacterDefinitionSplitResult
  | FeaturePresentAbsentSplitResult;
