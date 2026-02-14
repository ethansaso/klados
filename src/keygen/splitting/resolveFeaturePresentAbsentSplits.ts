import type { HierarchyTaxonNode } from "../hierarchy/types";
import type { FeaturePresentAbsentSplitResult } from "./types";

/**
 * Try to split taxa into two groups based on
 * "taxon has feature G" vs "taxon does not have feature G".
 *
 * Returns all possible splits along with their scores.
 */
export function resolveFeaturePresentAbsentSplits(
  taxa: HierarchyTaxonNode[],
): FeaturePresentAbsentSplitResult[] {
  if (taxa.length < 2) return [];

  // Precompute: taxon -> set of featureIds
  const featuresByTaxon = new Map<number, Set<number>>();
  const allFeatureIds = new Set<number>();

  for (const taxon of taxa) {
    const set = new Set<number>();

    for (const feature of taxon.states) {
      set.add(feature.featureId);
      allFeatureIds.add(feature.featureId);
    }

    featuresByTaxon.set(taxon.id, set);
  }

  const results: FeaturePresentAbsentSplitResult[] = [];

  for (const featureId of allFeatureIds) {
    const present: HierarchyTaxonNode[] = [];
    const absent: HierarchyTaxonNode[] = [];

    for (const taxon of taxa) {
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
