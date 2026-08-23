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
   * the back stack with an entry per keystroke. Touching a filter resets to the
   * first page, since the old offset no longer means anything.
   */
  const replaceSearch = useCallback(
    (partial: Partial<TaxonSearchParams>) => {
      const touchesFilter = FILTER_KEYS.some((key) => key in partial);

      navigate({
        search: (prev) => ({
          ...prev,
          ...partial,
          page: partial.page ?? (touchesFilter ? 1 : prev.page),
        }),
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
