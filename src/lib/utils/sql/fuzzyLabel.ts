import { ilike, or, type SQL, sql } from "drizzle-orm";
import type { PgColumn } from "drizzle-orm/pg-core";

/** Trigram floor below which a label is not considered a fuzzy match. */
export const SIM_THRESHOLD = 0.2;

/** Pre-computed forms of a search query, shared by every fuzzy label matcher. */
export type FuzzyQuery = {
  /** Trimmed and lowercased. */
  qLower: string;
  /** Escaped `%…%` needle for ILIKE. */
  likeNeedle: string;
  /** Non-alphanumerics collapsed to single spaces ("blue-green" → "blue green"). */
  normalizedQuery: string;
  /** Non-alphanumerics stripped ("blue-green" → "bluegreen"). */
  squashedQuery: string;
};

export function buildFuzzyQuery(q: string): FuzzyQuery {
  const qLower = q.trim().toLowerCase();

  return {
    qLower,
    likeNeedle: `%${qLower.replace(/([%_\\])/g, "\\$1")}%`,
    normalizedQuery: qLower.replace(/[^a-z0-9]+/g, " ").trim(),
    squashedQuery: qLower.replace(/[^a-z0-9]+/g, "").trim(),
  };
}

/**
 * Matches a label three ways: normalised substring (handles hyphens and
 * spaces), trigram similarity (handles typos), and a raw substring fallback.
 */
export function fuzzyLabelPredicate(col: PgColumn, fq: FuzzyQuery): SQL {
  return or(
    sql`regexp_replace(lower(${col}), '[^a-z0-9]+', ' ', 'g') LIKE ${`%${fq.normalizedQuery}%`}`,
    sql`${fuzzySimilarity(col, fq)} >= ${SIM_THRESHOLD}`,
    ilike(col, fq.likeNeedle),
  )!;
}

/** Trigram similarity of a label against the query, for use in a SELECT. */
export function fuzzySimilarity(col: PgColumn, fq: FuzzyQuery): SQL<number> {
  return sql<number>`similarity(lower(${col}), ${fq.qLower})`;
}

/**
 * Score a single candidate label against a pre-computed query breakdown.
 * Higher is a better match; callers may add their own bonuses on top.
 */
export function computeFuzzyScore(
  labelLower: string,
  fq: FuzzyQuery,
  similarityScore: number,
): number {
  const { qLower, normalizedQuery, squashedQuery } = fq;
  const normalizedLabel = labelLower.replace(/[^a-z0-9]+/g, " ").trim();
  const squashedLabel = labelLower.replace(/[^a-z0-9]+/g, "").trim();

  let score = 0;
  // 1) Huge boost: squashed equality ("bluegreen" == "blue-green")
  if (squashedQuery && squashedLabel === squashedQuery) score += 200;
  // 2) Strong: normalised equality ("blue green" == "blue-green")
  if (normalizedQuery && normalizedLabel === normalizedQuery) score += 120;
  // 3) Prefix normalised match
  if (normalizedQuery && normalizedLabel.startsWith(normalizedQuery))
    score += 60;
  // 4) Substring normalised match
  if (normalizedQuery && normalizedLabel.includes(normalizedQuery)) score += 40;
  // 5) Raw prefix / substring on original label
  if (labelLower.startsWith(qLower)) score += 30;
  else if (labelLower.includes(qLower)) score += 20;
  // 6) Trigram similarity as a soft boost
  score += similarityScore * 25;
  return score;
}
