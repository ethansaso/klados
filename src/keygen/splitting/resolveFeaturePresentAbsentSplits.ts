import type { HierarchyTaxonNode } from "../hierarchy/types";
import type { FeaturePresentAbsentSplitResult } from "./types";

/**
 * Walks up the ancestor chain for a single feature, returning a set of that
 * feature ID plus all ancestor IDs. Memoized via `memo`.
 */
function expandWithAncestors(
  featureId: number,
  parentMap: Map<number, number | null>,
  memo: Map<number, Set<number>>,
): Set<number> {
  const cached = memo.get(featureId);
  if (cached) return cached;

  const result = new Set<number>([featureId]);
  const parentId = parentMap.get(featureId) ?? null;
  if (parentId !== null) {
    for (const id of expandWithAncestors(parentId, parentMap, memo)) {
      result.add(id);
    }
  }

  memo.set(featureId, result);
  return result;
}

/**
 * Try to split taxa into two groups based on
 * "taxon has feature G" vs "taxon does not have feature G".
 *
 * A taxon is considered to have an ancestor feature if any of its explicitly
 * stated features is a descendant of that ancestor (implicit presence).
 *
 * Returns all possible splits along with their scores.
 */
export function resolveFeaturePresentAbsentSplits(
  taxa: HierarchyTaxonNode[],
  featureAncestorMap: Map<number, number | null>,
): FeaturePresentAbsentSplitResult[] {
  if (taxa.length < 2) return [];

  const expandMemo = new Map<number, Set<number>>();

  // Precompute: taxon -> expanded set of featureIds (explicit + all ancestors)
  const featuresByTaxon = new Map<number, Set<number>>();
  const allFeatureIds = new Set<number>();

  for (const taxon of taxa) {
    const expanded = new Set<number>();

    for (const feature of taxon.states) {
      for (const id of expandWithAncestors(
        feature.featureId,
        featureAncestorMap,
        expandMemo,
      )) {
        expanded.add(id);
        allFeatureIds.add(id);
      }
    }

    featuresByTaxon.set(taxon.id, expanded);
  }

  const results: FeaturePresentAbsentSplitResult[] = [];

  for (const featureId of allFeatureIds) {
    const present: HierarchyTaxonNode[] = [];
    const absent: HierarchyTaxonNode[] = [];

    for (const taxon of taxa) {
      // A taxon with no states at all is "undescribed", not "absent".
      // Exclude it from both sides so it falls into the unplaced-taxa bucket
      // rather than being incorrectly classified as feature-absent.
      if (taxon.states.length === 0) continue;
      const featureSet = featuresByTaxon.get(taxon.id)!;
      if (featureSet.has(featureId)) present.push(taxon);
      else absent.push(taxon);
    }

    if (present.length === 0 || absent.length === 0) continue;

    const score = present.length * absent.length;

    results.push({
      kind: "feature-present-absent",
      featureId,
      score,
      branches: [
        { taxa: present, status: "present" },
        { taxa: absent, status: "absent" },
      ],
    });
  }

  results.sort((a, b) => b.score - a.score);
  return results;
}
