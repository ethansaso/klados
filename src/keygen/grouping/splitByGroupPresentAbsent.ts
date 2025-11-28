import { KGTaxonNode } from "../hierarchy/types";
import { SplitResult } from "./types";

/**
 * Try to split taxa into two groups based on "has any character in groupId G"
 * vs "has no characters in groupId G".
 *
 * Returns all possible splits along with their scores.
 */
export function splitByGroupPresentAbsent(taxa: KGTaxonNode[]): SplitResult[] {
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

  const results: SplitResult[] = [];

  for (const groupId of allGroupIds) {
    const present: KGTaxonNode[] = [];
    const absent: KGTaxonNode[] = [];

    for (const taxon of taxa) {
      const groupSet = groupsByTaxon.get(taxon.id)!;
      if (groupSet.has(groupId)) present.push(taxon);
      else absent.push(taxon);
    }

    if (present.length === 0 || absent.length === 0) continue;

    const score = present.length * absent.length;

    results.push({
      score,
      branches: [
        {
          taxa: present,
          rationale: {
            kind: "group-present-absent",
            groupId,
            status: "present",
          },
        },
        {
          taxa: absent,
          rationale: {
            kind: "group-present-absent",
            groupId,
            status: "absent",
          },
        },
      ],
    });
  }

  // Sort by descending score
  results.sort((a, b) => b.score - a.score);

  return results;
}
