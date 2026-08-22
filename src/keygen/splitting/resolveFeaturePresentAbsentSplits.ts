import type { FeatureStateDTO } from "../../lib/domain/states/types";
import type { HierarchyTaxonNode } from "../hierarchy/types";
import type { FeaturePresentAbsentSplitResult } from "./types";

/**
 * Walks up the ancestor chain for a single feature, returning a set of that
 * feature ID plus all ancestor IDs. Memoized to avoid re-walking
 */
export function expandWithAncestors(
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
 * What ancestor taxa have said about a feature, nearest statement winning.
 * `true` means reliably borne, so descendants bear it too.
 */
export type InheritedFeatureStatements = ReadonlyMap<number, boolean>;

/**
 * Folds a taxon's own statements over what it inherited, nearest wins.
 *
 * A nearer taxon marking a feature unreliable withdraws the ancestor's claim
 * rather than being ignored: a family described as annulate, refined by a genus
 * whose annulus varies, must leave its species keyable on annulus again.
 */
export function extendInheritedStatements(
  inherited: InheritedFeatureStatements,
  states: FeatureStateDTO[] | undefined,
): InheritedFeatureStatements {
  if (!states?.length) return inherited;

  const next = new Map(inherited);
  for (const state of states) {
    next.set(state.featureId, !state.unreliable);
  }
  return next;
}

/**
 * The features descendants can be assumed to bear, expanded through the feature
 * hierarchy at the point of use rather than as statements accumulate.
 */
export function expandInheritedStatements(
  inherited: InheritedFeatureStatements,
  featureAncestorMap: Map<number, number | null>,
): ReadonlySet<number> {
  const memo = new Map<number, Set<number>>();
  const certain = new Set<number>();

  for (const [featureId, reliable] of inherited) {
    if (!reliable) continue;
    for (const id of expandWithAncestors(featureId, featureAncestorMap, memo)) {
      certain.add(id);
    }
  }
  return certain;
}

/**
 * Try to split taxa into two groups based on
 * "taxon has feature G" vs "taxon does not have feature G".
 *
 * A taxon is considered to have an ancestor feature if any of its explicitly
 * stated features is a descendant of that ancestor (implicit presence).
 *
 * `inheritedFeatureIds` are features an ancestor taxon reliably bears, so every
 * taxon here bears them too whether or not anyone wrote it down.
 *
 * Returns all possible splits along with their scores.
 */
export function resolveFeaturePresentAbsentSplits(
  taxa: HierarchyTaxonNode[],
  featureAncestorMap: Map<number, number | null>,
  inheritedFeatureIds: ReadonlySet<number> = new Set(),
): FeaturePresentAbsentSplitResult[] {
  if (taxa.length < 2) return [];

  const expandMemo = new Map<number, Set<number>>();

  // Precompute per-taxon: always vs. sometimes present.
  // Expands unreliability to ancestors (uncertain cap -> uncertain sporocarp)
  const certainByTaxon = new Map<number, Set<number>>();
  const uncertainByTaxon = new Map<number, Set<number>>();
  const allFeatureIds = new Set<number>();

  for (const taxon of taxa) {
    // Seeded with what an ancestor reliably bears: certain for every taxon in
    // the group, which collapses the "absent" branch and drops the split.
    const certain = new Set<number>(inheritedFeatureIds);
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
