import { HierarchyTaxonNode } from "../../hierarchy/types";
import { KeyGenOptions } from "../../options";
import {
  CharacterDefinitionSplitBranch,
  CharacterDefinitionSplitResult,
} from "../types";
import { scoreCharacterSplit } from "./scoreCharacterSplit";

/** Generates a stable key for a taxon group */
function keyTaxonGroup(taxa: HierarchyTaxonNode[]): string {
  const ids = taxa.map((t) => t.id).sort((a, b) => a - b);
  return ids.join(",");
}

/** Generates a stable key for an entire partition (original split result) */
function keyPartition(split: CharacterDefinitionSplitResult): string {
  const branchKeys = split.branches.map((b) => keyTaxonGroup(b.taxa));
  branchKeys.sort();
  return branchKeys.join("||");
}

/** Returns whether an inverted clause exists in any branch. */
function hasAnyInvertedClause(
  branches: CharacterDefinitionSplitBranch[]
): boolean {
  for (const b of branches) {
    for (const clause of b.clauses) {
      if (clause.inverted) return true;
    }
  }
  return false;
}

/** Merges post-resolution splits' clauses within a single partition and rescores them. */
function mergeSplitsForPartition(
  splits: CharacterDefinitionSplitResult[],
  options: KeyGenOptions
): CharacterDefinitionSplitResult {
  if (splits.length === 1) {
    // Nothing to merge; return as-is
    return splits[0];
  }

  // Build taxonKey -> merged branch
  const mergedByKey = new Map<string, CharacterDefinitionSplitBranch>();

  const [first, ...rest] = splits;

  // Seed from first split
  for (const branch of first.branches) {
    const key = keyTaxonGroup(branch.taxa);
    // Defensive copy so we don't mutate original
    mergedByKey.set(key, {
      taxa: branch.taxa,
      clauses: [...branch.clauses],
    });
  }

  // Fold in remaining splits
  for (const split of rest) {
    for (const branch of split.branches) {
      const key = keyTaxonGroup(branch.taxa);
      const existing = mergedByKey.get(key);
      if (!existing) {
        // Shouldn't happen -- if observed, means partitions weren't actually identical
        throw new Error(
          "Inconsistent partition: branch taxa not found in merged map"
        );
      }
      existing.clauses.push(...branch.clauses);
    }
  }

  const mergedBranches = Array.from(mergedByKey.values());
  const hasInverted = hasAnyInvertedClause(mergedBranches);
  // Rescore after merging
  const score = scoreCharacterSplit(mergedBranches, options);

  return {
    kind: "character-definition",
    branches: mergedBranches,
    score,
  };
}

/** Merge compatible character-definition splits into single splits and rescore them. */
export function mergeCharacterDefinitionSplits(
  splits: CharacterDefinitionSplitResult[],
  options: KeyGenOptions
): CharacterDefinitionSplitResult[] {
  if (splits.length === 0) return [];

  // Group by partition key
  const buckets = new Map<string, CharacterDefinitionSplitResult[]>();
  for (const split of splits) {
    const pKey = keyPartition(split);
    let arr = buckets.get(pKey);
    if (!arr) {
      arr = [];
      buckets.set(pKey, arr);
    }
    arr.push(split);
  }

  // Merge each bucket by partition key
  const merged: CharacterDefinitionSplitResult[] = [];
  for (const [, bucket] of buckets) {
    const mergedSplit = mergeSplitsForPartition(bucket, options);
    if (mergedSplit.score > 0) {
      merged.push(mergedSplit);
    }
  }

  // Sort by descending score
  merged.sort((a, b) => b.score - a.score);
  return merged;
}
