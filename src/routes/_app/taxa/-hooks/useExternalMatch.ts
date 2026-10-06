import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { useDebounce } from "use-debounce";
import type { TaxonRank } from "../../../../../db/schema/schema";
import type { ExternalCandidatesQueryOptions } from "../../../../lib/queries/externalTaxa";
import { rankByLineage } from "../-external/rankByLineage";
import type { ExternalCandidate } from "../-external/types";

export type ExternalMatch = ReturnType<typeof useExternalMatch>;

const DEBOUNCE_MS = 500;
const MIN_QUERY_LENGTH = 2;

/** Picks the top-ranked match by default; skipping stops searching until relinked. */
export function useExternalMatch(
  candidatesQueryOptions: ExternalCandidatesQueryOptions,
  name: string,
  rank: TaxonRank,
  lineage: string[],
) {
  const [skipped, setSkipped] = useState(false);
  const trimmed = name.trim();
  const [debouncedName] = useDebounce(trimmed, DEBOUNCE_MS);
  const enabled = !skipped && debouncedName.length >= MIN_QUERY_LENGTH;

  const query = useQuery({
    ...candidatesQueryOptions(debouncedName, rank),
    enabled,
  });

  const candidates = useMemo(
    () => rankByLineage(query.data ?? [], lineage),
    [query.data, lineage],
  );

  // Resets to the default pick whenever the candidates change
  const [pick, setPick] = useState<{
    candidates: ExternalCandidate[];
    index: number;
  } | null>(null);

  const index = skipped
    ? null
    : pick?.candidates === candidates
      ? pick.index
      : candidates.length > 0
        ? 0
        : null;
  const selected = index === null ? null : (candidates[index] ?? null);

  const step = (delta: number) => {
    if (candidates.length === 0 || index === null) return;
    const next = (index + delta + candidates.length) % candidates.length;
    setPick({ candidates, index: next });
  };

  const isIdle = trimmed.length < MIN_QUERY_LENGTH;
  // Includes the debounce wait, so results never read as empty early
  const isSearching =
    !skipped && !isIdle && (trimmed !== debouncedName || query.isFetching);

  return {
    candidates: skipped ? [] : candidates,
    index,
    selected,
    searchTitle: debouncedName,
    isIdle,
    isSkipped: skipped,
    isSearching,
    error: skipped ? null : query.error,
    isSettled: skipped || (trimmed === debouncedName && !query.isFetching),
    next: () => step(1),
    prev: () => step(-1),
    skip: () => setSkipped(true),
    link: () => {
      setSkipped(false);
      setPick(null);
    },
  };
}
