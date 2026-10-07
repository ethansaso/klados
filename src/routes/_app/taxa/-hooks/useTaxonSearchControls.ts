import { deepEqual } from "@tanstack/react-router";
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
  "filters",
] as const satisfies readonly (keyof TaxonSearchParams)[];

export function useTaxonSearchControls() {
  const search: TaxonSearchParams = Route.useSearch();
  const navigate = Route.useNavigate();

  /**
   * Replaces the current history entry: debounced typing would otherwise flood
   * the back stack with an entry per keystroke. Changing a filter resets to the
   * first page, since the old offset no longer means anything. Re-setting a
   * filter to its current value (e.g. the search box syncing on mount) doesn't.
   */
  const replaceSearch = useCallback(
    (partial: Partial<TaxonSearchParams>) => {
      navigate({
        search: (prev) => {
          const changesFilter = FILTER_KEYS.some(
            (key) => key in partial && !deepEqual(partial[key], prev[key]),
          );

          return {
            ...prev,
            ...partial,
            page: partial.page ?? (changesFilter ? 1 : prev.page),
          };
        },
        replace: true,
      });
    },
    [navigate],
  );

  /** Pushes an entry, so Back returns to the previous page of results. */
  const goToPage = useCallback(
    (page: number) => {
      navigate({ search: (prev) => ({ ...prev, page }), replace: false });
    },
    [navigate],
  );

  return { search, replaceSearch, goToPage };
}
