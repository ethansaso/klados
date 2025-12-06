import { v4 as uuidv4 } from "uuid";
import { HierarchyTaxonNode } from "../hierarchy/types";
import { KeyGenOptions } from "../options";
import { mergeCharacterDefinitionSplits } from "../splitting/characters/mergeCompatibleCharacterSplits";
import { resolveCharacterSplits } from "../splitting/characters/resolveCharacterSplits";
import { resolveGroupPresentAbsentSplits } from "../splitting/resolveGroupPresentAbsentSplits";
import {
  CharacterDefinitionSplitResult,
  GroupPresentAbsentSplitResult,
  SplitResult,
  TaxonGroup,
} from "../splitting/types";
import {
  KeyBranch,
  KeyBranchRationale,
  KeyCharRationale,
  KeyDiffNode,
  KeyNode,
  KeyTaxonNode,
} from "./types";

function makeDiffNode(): KeyDiffNode {
  return {
    kind: "diff",
    id: uuidv4(),
    branches: [],
  };
}

function makeTaxonNode(taxonId: number): KeyTaxonNode {
  return {
    kind: "taxon",
    id: taxonId,
    branches: [],
  };
}

function makeBranch(rationale: KeyBranchRationale, child: KeyNode): KeyBranch {
  return {
    id: uuidv4(),
    rationale,
    child,
  };
}

function getChildrenForTaxon(
  taxonId: number,
  hierarchy: Map<number, HierarchyTaxonNode>
): TaxonGroup {
  const meta = hierarchy.get(taxonId);
  if (!meta) return [];
  return (
    meta.subtaxonIds
      .map((id) => hierarchy.get(id))
      .filter((n): n is HierarchyTaxonNode => n !== undefined) ?? []
  );
}

/**
 * Convert a character-definition split branch into a KeyBranchRationale.
 */
function buildCharacterDefinitionRationale(
  split: CharacterDefinitionSplitResult,
  branchIndex: number
): KeyCharRationale {
  const branch = split.branches[branchIndex];

  const characters: KeyCharRationale["characters"] = {};

  for (const clause of branch.clauses) {
    const traitIds = clause.traits.map((t) => t.id);

    characters[clause.characterId] = {
      traits: traitIds,
      inverted: clause.inverted,
    };
  }

  return {
    kind: "character-definition",
    characters,
  };
}

/**
 * Convert a group-present-absent split branch into a KeyBranchRationale.
 */
function buildGroupPresentAbsentRationale(
  split: GroupPresentAbsentSplitResult,
  branchIndex: number
): KeyBranchRationale {
  const branch = split.branches[branchIndex];

  return {
    kind: "group-present-absent",
    groups: {
      [split.groupId]: {
        groupId: split.groupId,
        status: branch.status,
      },
    },
  };
}

function buildRationaleForBranch(
  split: SplitResult,
  branchIndex: number
): KeyBranchRationale {
  if (split.kind === "character-definition") {
    return buildCharacterDefinitionRationale(
      split as CharacterDefinitionSplitResult,
      branchIndex
    );
  }

  return buildGroupPresentAbsentRationale(
    split as GroupPresentAbsentSplitResult,
    branchIndex
  );
}

/**
 * Differentiates a group of sibling taxa under `parent` using character/group splits,
 * then for any resulting taxon nodes, continues down the hierarchy.
 *
 * Operates only on the passed 'siblings' group (same hierarchical level, even if different rank).
 */
function buildKeyForSiblings(
  parent: KeyNode,
  siblings: TaxonGroup,
  hierarchy: Map<number, HierarchyTaxonNode>,
  options: KeyGenOptions
): void {
  if (siblings.length === 0) return;

  // Single sibling: attach as taxon leaf with null rationale, then descend
  // hierarchically beneath it.
  if (siblings.length === 1) {
    const only = siblings[0];
    const childNode = makeTaxonNode(only.id);
    const branch = makeBranch(null, childNode);
    parent.branches.push(branch);

    buildKeySubtreeForTaxon(childNode, hierarchy, options);
    return;
  }

  // Multiple siblings: try to find an informative split.
  const rawCharacterSplits = resolveCharacterSplits(siblings, options);
  const characterSplits = mergeCharacterDefinitionSplits(
    rawCharacterSplits,
    options
  );
  const groupSplits = resolveGroupPresentAbsentSplits(siblings);
  const candidates: SplitResult[] = [...characterSplits, ...groupSplits];

  // If no valid splits, attach all siblings directly and recurse hierarchically
  // under each.
  if (candidates.length === 0) {
    for (const sib of siblings) {
      const childNode = makeTaxonNode(sib.id);
      const branch = makeBranch(null, childNode);
      parent.branches.push(branch);

      buildKeySubtreeForTaxon(childNode, hierarchy, options);
    }
    return;
  }

  // Otherwise, select best split by score
  candidates.sort((a, b) => b.score - a.score);
  const best = candidates[0];

  // For each split branch, attach a KeyBranch with rationale and either:
  // - a taxon node (size 1)
  // - a diff node (size > 1, which will be further split)
  best.branches.forEach((splitBranch, idx) => {
    const taxaInBranch = splitBranch.taxa;
    if (!taxaInBranch || taxaInBranch.length === 0) return;

    const rationale = buildRationaleForBranch(best, idx);

    if (taxaInBranch.length === 1) {
      const only = taxaInBranch[0];
      const childTaxonNode = makeTaxonNode(only.id);
      const branch = makeBranch(rationale, childTaxonNode);
      parent.branches.push(branch);

      // Differentiate this single taxon further down the hierarchy
      buildKeySubtreeForTaxon(childTaxonNode, hierarchy, options);
    } else {
      const diffNode = makeDiffNode();
      const branch = makeBranch(rationale, diffNode);
      parent.branches.push(branch);

      // Differentiate multiple siblings recursively
      buildKeyForSiblings(diffNode, taxaInBranch, hierarchy, options);
    }
  });
}

/**
 * Recursively build the key *subtree* for a given taxon KeyTaxonNode.
 * Used as an entry-point for building keys under any taxon node.
 *
 * To limit depth, see `maxDepthFromRoot` in {@link KeyGenOptions},
 * handled during hierarchy discovery.
 */
export function buildKeySubtreeForTaxon(
  taxonNode: KeyTaxonNode,
  hierarchy: Map<number, HierarchyTaxonNode>,
  options: KeyGenOptions
): void {
  const children: TaxonGroup = getChildrenForTaxon(taxonNode.id, hierarchy);

  if (children.length === 0) {
    // No subtaxa to key further.
    return;
  }

  if (children.length === 1) {
    // Single child: attach with null rationale, then continue down hierarchy.
    const only = children[0];
    const childTaxonNode = makeTaxonNode(only.id);
    const branch = makeBranch(null, childTaxonNode);
    taxonNode.branches.push(branch);

    buildKeySubtreeForTaxon(childTaxonNode, hierarchy, options);
    return;
  }

  // Multiple children: differentiate this sibling group under the current taxon.
  buildKeyForSiblings(taxonNode, children, hierarchy, options);
}
