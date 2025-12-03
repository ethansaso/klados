import { KeyGenOptions } from "../../options";
import { CharacterDefinitionSplitBranch } from "../types";

/** Small positive boost for extra clauses */
const CLAUSE_BONUS = 10;

/**
 * How strongly the proportion of inverted clauses downweights the structural score.
 * 0 = treat inverted clauses the same as regular (no downweighting).
 * 1 = if all clauses are inverted, the (unclamped) structural modifier goes to 0.
 */
const INVERTED_STRUCTURAL_WEIGHT = 0.5;

/**
 * Minimum fraction of structural score retained even if all clauses are inverted.
 * Prevents structurally good but inverted-heavy splits from being annihilated.
 */
const MIN_STRUCTURAL_MULTIPLIER = 0.2;

/** Compute the structural score for the given branch sizes. */
function computeStructuralScore(
  sizes: number[],
  keyShape: KeyGenOptions["keyShape"]
): number {
  const total = sizes.reduce((acc, n) => acc + n, 0);
  const k = sizes.length;

  if (k === 0 || total === 0) return 0;

  if (keyShape === "lopsided") {
    // Reward big, uneven branches (good when we want to peel small groups off)
    return sizes.reduce((acc, n) => acc + n * n, 0);
  }

  // Balanced: reward many branches and penalize unevenness
  const mean = total / k;
  const imbalance = sizes.reduce((acc, n) => acc + Math.abs(n - mean), 0);
  return total * k - imbalance;
}

/**
 * Count clauses, compute inverted fraction, and return the
 * structural downweighting modifier.
 */
function computeClauseEffects(branches: CharacterDefinitionSplitBranch[]) {
  let totalClauses = 0;
  let invertedClauses = 0;

  for (const branch of branches) {
    for (const clause of branch.clauses) {
      totalClauses += 1;
      if (clause.inverted) invertedClauses += 1;
    }
  }

  const invertedFraction =
    totalClauses > 0 ? invertedClauses / totalClauses : 0;

  const rawModifier = 1 - INVERTED_STRUCTURAL_WEIGHT * invertedFraction;

  const structuralModifier =
    rawModifier < MIN_STRUCTURAL_MULTIPLIER
      ? MIN_STRUCTURAL_MULTIPLIER
      : rawModifier;

  const clauseScore = totalClauses * CLAUSE_BONUS;

  return { structuralModifier, clauseScore };
}

/**
 * Scoring function for a character-definition split:
 *    - "lopsided": reward large branches strongly (sum of n^2).
 *    - "balanced": reward more branches and penalize imbalance.
 *
 * Extra clause count is rewarded; inverted clauses downweight the structural score.
 */
export function scoreCharacterSplit(
  branches: CharacterDefinitionSplitBranch[],
  options: KeyGenOptions
): number {
  const sizes = branches.map((b) => b.taxa.length);

  const structuralScore = computeStructuralScore(sizes, options.keyShape);

  const { structuralModifier, clauseScore } = computeClauseEffects(branches);

  const adjustedStructural = structuralScore * structuralModifier;

  const rawScore = adjustedStructural + clauseScore;

  return Math.max(rawScore, 0);
}
