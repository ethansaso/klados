import { mergeCharacterDefinitionSplits } from "../grouping/characters/mergeCompatibleCharacterSplits";
import { resolveCharacterSplits } from "../grouping/characters/resolveCharacterSplits";
import { resolveGroupPresentAbsentSplits } from "../grouping/resolveGroupPresentAbsentSplits";
import { SplitResult, TaxonGroup } from "../grouping/types";
import { KeyGenOptions } from "../options";
import { KeyBranch, KeyLeafNode, KeyNode, KeySplitNode } from "./types";

function makeLeaf(taxa: TaxonGroup): KeyLeafNode {
  return {
    kind: "leaf",
    taxa,
  };
}

/**
 * Recursively build the best split node for this group of taxa, or a leaf if no useful split exists.
 */
export function buildKeyForGroup(
  taxa: TaxonGroup,
  options: KeyGenOptions,
  depth = 0
): KeyNode {
  // Base case: single taxon (or empty, defensively)
  if (taxa.length <= 1) {
    return makeLeaf(taxa);
  }

  // TODO: depth limit?

  // Generate candidate splits, then merge character splits containing the same taxon partitions.
  const rawCharacterSplits = resolveCharacterSplits(taxa, options);
  const characterSplits = mergeCharacterDefinitionSplits(
    rawCharacterSplits,
    options
  );
  // Seek group-present-absent splits as well.
  const groupSplits = resolveGroupPresentAbsentSplits(taxa);
  // Finally, combine.
  const candidates: SplitResult[] = [...characterSplits, ...groupSplits];

  if (candidates.length === 0) {
    // No valid split resolved. Treat as unresolved leaf.
    return makeLeaf(taxa);
  }

  // Pick the best split by score.
  // (Character + group splits are each sorted internally; we sort the union to be safe.)
  candidates.sort((a, b) => b.score - a.score);
  const best = candidates[0];

  // Build child branches and recurse.
  const branches: KeyBranch[] = best.branches.map((edge) => {
    const childTaxa = edge.taxa;

    const childNode = buildKeyForGroup(childTaxa, options, depth + 1);

    return {
      taxa: childTaxa,
      edge,
      child: childNode,
    };
  });

  const splitNode: KeySplitNode = {
    kind: "split",
    split: best,
    branches,
  };

  return splitNode;
}
