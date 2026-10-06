import type { ExternalCandidate } from "./types";

/** Stable-sorts matches sharing more of `lineage` first, separating homonyms. */
export function rankByLineage(
  candidates: ExternalCandidate[],
  lineage: string[],
): ExternalCandidate[] {
  if (lineage.length === 0) return candidates;

  const known = new Set(lineage.map((n) => n.toLowerCase()));
  const scores = new Map(
    candidates.map((c) => [
      c,
      c.lineage.filter((n) => known.has(n.toLowerCase())).length,
    ]),
  );
  return [...candidates].sort((a, b) => scores.get(b)! - scores.get(a)!);
}
