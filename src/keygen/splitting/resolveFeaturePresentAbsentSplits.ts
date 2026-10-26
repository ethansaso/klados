import type { FeatureTreeNode } from "../../lib/domain/features/types";
import { resolvePresence } from "../../lib/domain/states/resolvePresence";
import type { FeatureStateDTO } from "../../lib/domain/states/types";
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
 * What ancestor taxa have said about a feature, nearest statement winning.
 * `true` means reliably borne, so descendants bear it too.
 */
export type InheritedFeatureStatements = ReadonlyMap<number, boolean>;

/**
 * Folds a taxon's own statements over what it inherited, nearest wins.
 *
 * Closest taxon calling feature variable/absent withdraws ancestor's claim,
 * e.g. family annulate, genus annulus varies, don't key species.
 */
export function extendInheritedStatements(
  inherited: InheritedFeatureStatements,
  states: FeatureStateDTO[] | undefined,
): InheritedFeatureStatements {
  if (!states?.length) return inherited;

  const next = new Map(inherited);
  for (const state of states) {
    next.set(state.featureId, state.presence === "present");
  }
  return next;
}

/**
 * The features descendants can be assumed to bear. Their ancestors follow via
 * {@link resolvePresence}.
 */
export function reliablyBorneFeatures(
  inherited: InheritedFeatureStatements,
): ReadonlySet<number> {
  const borne = new Set<number>();
  for (const [featureId, reliable] of inherited) {
    if (reliable) borne.add(featureId);
  }
  return borne;
}

/**
 * Try to split taxa into two groups based on
 * "taxon has feature G" vs "taxon does not have feature G".
 *
 * Each taxon's presence comes from {@link resolvePresence}. A taxon it can't
 * call present or absent can't be placed, so the split is dropped.
 *
 * `inheritedFeatureIds` are features an ancestor taxon reliably bears, so every
 * taxon here bears them too whether or not anyone wrote it down.
 *
 * Returns all possible splits along with their scores.
 */
export function resolveFeaturePresentAbsentSplits(
  taxa: HierarchyTaxonNode[],
  featureTree: FeatureTreeNode[],
  inheritedFeatureIds: ReadonlySet<number> = new Set(),
): FeaturePresentAbsentSplitResult[] {
  if (taxa.length < 2) return [];

  // A taxon w/ no states at all is "undescribed", not "absent".
  // Excluded from keying.
  const described = taxa.filter((taxon) => taxon.states.length > 0);
  const presenceByTaxon = new Map(
    described.map((taxon) => [
      taxon.id,
      resolvePresence(featureTree, taxon.allStates, {
        inferExplicitAbsence: true,
        inheritedPresent: inheritedFeatureIds,
      }),
    ]),
  );

  // Candidates in the order taxa state them (then their ancestors), so ties
  // between equal-scoring splits resolve as they always have.
  const parentMap = new Map(featureTree.map((f) => [f.id, f.parentId]));
  const expandMemo = new Map<number, Set<number>>();
  const candidateIds = new Set<number>();
  for (const taxon of described) {
    const presence = presenceByTaxon.get(taxon.id)!;
    for (const feature of taxon.states) {
      for (const id of expandWithAncestors(
        feature.featureId,
        parentMap,
        expandMemo,
      )) {
        if (presence.get(id) === "present") candidateIds.add(id);
      }
    }
  }

  const results: FeaturePresentAbsentSplitResult[] = [];

  for (const featureId of candidateIds) {
    const present: HierarchyTaxonNode[] = [];
    const absent: HierarchyTaxonNode[] = [];

    // Flag to discard split if at least one taxon can't be placed
    let unanswerable = false;

    for (const taxon of described) {
      const status = presenceByTaxon.get(taxon.id)!.get(featureId);
      if (status === "present") {
        present.push(taxon);
      } else if (status === "absent") {
        absent.push(taxon);
      } else {
        unanswerable = true;
        break;
      }
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
