import { HierarchyTaxonNode } from "../hierarchy/types";
import { GroupPresentAbsentSplitResult } from "./types";

/**
 * Try to split taxa into two groups based on "has any character in groupId G"
 * vs "has no characters in groupId G".
 *
 * Returns all possible splits along with their scores.
 */
export function resolveGroupPresentAbsentSplits(
  taxa: HierarchyTaxonNode[]
): GroupPresentAbsentSplitResult[] {
  if (taxa.length < 2) return [];

  // Precompute: taxon -> set of groupIds
  const groupsByTaxon = new Map<number, Set<number>>();
  const allGroupIds = new Set<number>();

  for (const taxon of taxa) {
    const set = new Set<number>();
    for (const state of taxon.states) {
      if (state.kind !== "categorical") continue;
      set.add(state.groupId);
      allGroupIds.add(state.groupId);
    }
    groupsByTaxon.set(taxon.id, set);
  }

  const results: GroupPresentAbsentSplitResult[] = [];

  for (const groupId of allGroupIds) {
    const present: HierarchyTaxonNode[] = [];
    const absent: HierarchyTaxonNode[] = [];

    for (const taxon of taxa) {
      const groupSet = groupsByTaxon.get(taxon.id)!;
      if (groupSet.has(groupId)) present.push(taxon);
      else absent.push(taxon);
    }

    if (present.length === 0 || absent.length === 0) continue;

    const score = present.length * absent.length;

    results.push({
      kind: "group-present-absent",
      groupId,
      score,
      branches: [
        {
          taxa: present,
          status: "present",
        },
        {
          taxa: absent,
          status: "absent",
        },
      ],
    });
  }

  // Sort by descending score
  results.sort((a, b) => b.score - a.score);

  return results;
}
