import { Trait } from "../../lib/domain/character-states/types";
import { HierarchyTaxonNode } from "../hierarchy/types";

export type TaxonGroup = HierarchyTaxonNode[];

/**
 * One "reason" a branch exists, for a single categorical character.
 */
export type CharacterClause = {
  characterId: number;
  groupId: number;
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

export type GroupPresentAbsentSplitBranch = {
  taxa: TaxonGroup;
  status: "present" | "absent";
};

export type GroupPresentAbsentSplitResult = {
  kind: "group-present-absent";
  groupId: number;
  score: number;
  branches: GroupPresentAbsentSplitBranch[];
};

export type SplitResult =
  | CharacterDefinitionSplitResult
  | GroupPresentAbsentSplitResult;
