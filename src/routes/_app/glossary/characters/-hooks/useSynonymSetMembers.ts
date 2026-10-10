import { useQuery } from "@tanstack/react-query";
import { traitValuesQueryOptions } from "../../../../../lib/queries/traits";

/** The list endpoint's largest page; sets are far smaller. */
const SET_PAGE_SIZE = 100;

/** A synonym set's members, minus the trait being edited. Idle while `synonymSetId` is null. */
export function useSynonymSetMembers(
  characterId: number,
  synonymSetId: number | null,
  excludeTraitId?: number,
) {
  const query = useQuery(
    traitValuesQueryOptions(characterId, 1, SET_PAGE_SIZE, {
      synonymSetId: synonymSetId ?? undefined,
      enabled: synonymSetId !== null,
    }),
  );

  return {
    members: (query.data?.items ?? []).filter((m) => m.id !== excludeTraitId),
    isLoading: query.isLoading,
    error: query.error,
  };
}
