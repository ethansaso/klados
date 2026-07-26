import { useCallback } from "react";
import { type TaxonSearchParams } from "../../../../lib/domain/taxa/search";
import { Route } from "../index";

/** Changing any of these invalidates the current page offset. */
const FILTER_KEYS = [
  "q",
  "status",
  "highRank",
  "lowRank",
  "hasMedia",
  "hasMorphology",
  "hasEcology",
] as const satisfies readonly (keyof TaxonSearchParams)[];

export function useTaxonSearchControls() {
  const search: TaxonSearchParams = Route.useSearch();
  const navigate = Route.useNavigate();

  const setSearch = useCallback(
    (partial: Partial<TaxonSearchParams>) => {
      const touchesFilter = FILTER_KEYS.some((key) => key in partial);

      navigate({
        search: (prev: Record<string, unknown>) => ({
          ...prev,
          ...partial,
          page: partial.page ?? (touchesFilter ? 1 : prev.page),
        }),
        replace: true,
      });
    },
    [navigate],
  );

  return { search, setSearch };
}
