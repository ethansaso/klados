import type { HierarchyTaxonNode } from "../hierarchy/types";
import type { FeaturePresentAbsentSplitResult } from "./types";

/**
 * Walks up the ancestor chain for a single feature, returning a set of that
 * feature ID plus all ancestor IDs. Memoized to avoid re-walking
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

  // Precompute per-taxon: always vs. sometimes present.
  // Expands unreliability to ancestors (uncertain cap -> uncertain sporocarp)
  const certainByTaxon = new Map<number, Set<number>>();
  const uncertainByTaxon = new Map<number, Set<number>>();
  const allFeatureIds = new Set<number>();

  for (const taxon of taxa) {
    const certain = new Set<number>();
    const uncertain = new Set<number>();

    for (const feature of taxon.states) {
      const expanded = expandWithAncestors(
        feature.featureId,
        featureAncestorMap,
        expandMemo,
      );

      for (const id of expanded) {
        if (feature.unreliable) {
          uncertain.add(id);
        } else {
          certain.add(id);
          // If no taxon definitely bears a feature, it can never yield a split
          allFeatureIds.add(id);
        }
      }
    }

    certainByTaxon.set(taxon.id, certain);
    uncertainByTaxon.set(taxon.id, uncertain);
  }

  const results: FeaturePresentAbsentSplitResult[] = [];

  for (const featureId of allFeatureIds) {
    const present: HierarchyTaxonNode[] = [];
    const absent: HierarchyTaxonNode[] = [];

    // Flag to discard split if at least one taxon only sometimes bears a feature
    let unanswerable = false;

    for (const taxon of taxa) {
      // A taxon w/ no states at all is "undescribed", not "absent".
      // Excluded from keying.
      if (taxon.states.length === 0) continue;

      // Certainty is a 'strong condition' -- if 'annulus' uncertain, but
      // 'gills' certain, then it certainly has their parent feature 'sporocarp'
      if (certainByTaxon.get(taxon.id)!.has(featureId)) {
        present.push(taxon);
        continue;
      }

      if (uncertainByTaxon.get(taxon.id)!.has(featureId)) {
        unanswerable = true;
        break;
      }

      absent.push(taxon);
    }

    if (unanswerable) continue;
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
