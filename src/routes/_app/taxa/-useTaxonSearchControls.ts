import { useCallback } from "react";
import { TaxonSearchParams } from "../../../lib/domain/taxa/search";
import { Route } from "./index";

export function useTaxonSearchControls() {
  const search: TaxonSearchParams = Route.useSearch();
  const navigate = Route.useNavigate();

  const setSearch = useCallback(
    (partial: Partial<TaxonSearchParams>) => {
      navigate({
        search: (prev) => ({
          ...prev,
          ...partial,
          page:
            partial.q !== undefined ||
            partial.highRank !== undefined ||
            partial.lowRank !== undefined
              ? 1
              : prev.page,
        }),
        replace: true,
      });
    },
    [navigate]
  );

  return { search, setSearch };
}
