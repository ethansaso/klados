import { useMatches, useNavigate } from "@tanstack/react-router";
import { useCallback } from "react";

type SectionSearch = {
  page?: number;
  pageSize?: number;
  q?: string;
};

export function usePaginatedSearch() {
  const navigate = useNavigate();
  const matches = useMatches();

  const deepestMatch = matches[matches.length - 1];
  if (!deepestMatch) {
    throw new Error(
      "usePaginatedSearch must be used within a routing context.",
    );
  }

  const raw = (deepestMatch.search ?? {}) as SectionSearch;

  const search = {
    page: raw.page ?? 1,
    pageSize: raw.pageSize ?? 20,
    q: raw.q ?? "",
  };

  const setSearch = useCallback(
    (patch: Partial<typeof search>, replace = false) => {
      navigate({
        from: deepestMatch.fullPath || "/",
        to: ".",
        search: (prev) => ({
          ...prev,
          ...patch,
        }),
        replace,
      });
    },
    [navigate, deepestMatch],
  );

  const setQ = useCallback(
    (q: string, replace = true) => setSearch({ q, page: 1 }, replace),
    [setSearch],
  );

  const setPage = useCallback(
    (page: number, replace = false) => setSearch({ page }, replace),
    [setSearch],
  );

  const next = useCallback(
    (total: number) => {
      const max = Math.max(1, Math.ceil(total / search.pageSize));
      setSearch({ page: Math.min(search.page + 1, max) });
    },
    [setSearch, search.page, search.pageSize],
  );

  const prev = useCallback(
    () => setSearch({ page: Math.max(1, search.page - 1) }),
    [setSearch, search.page],
  );

  return { search, setQ, setPage, next, prev };
}
