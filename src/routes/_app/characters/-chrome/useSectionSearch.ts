import { useCallback } from "react";

export function useSectionSearch<
  RouteObj extends { useSearch: any; useNavigate: any },
>(RouteObj: RouteObj) {
  const raw = RouteObj.useSearch();
  const navigate = RouteObj.useNavigate();

  const search = {
    page: raw.page ?? 1,
    pageSize: raw.pageSize ?? 20,
    q: raw.q ?? "",
  };

  const setSearch = useCallback(
    (patch: Partial<typeof search>, replace = false) =>
      navigate({
        to: ".",
        search: (prev: typeof raw) => ({ ...prev, ...patch }),
        replace,
      }),
    [navigate] // prev comes from router; no stale closure issues
  );

  const setQ = useCallback(
    (q: string, replace = true) => setSearch({ q, page: 1 }, replace),
    [setSearch]
  );

  const setPage = useCallback(
    (page: number, replace = false) => setSearch({ page }, replace),
    [setSearch]
  );

  const next = useCallback(
    (total: number) => {
      const max = Math.max(1, Math.ceil(total / search.pageSize));
      setSearch({ page: Math.min(search.page + 1, max) });
    },
    [setSearch, search.page, search.pageSize]
  );

  const prev = useCallback(
    () => setSearch({ page: Math.max(1, search.page - 1) }),
    [setSearch, search.page]
  );

  return { search, setQ, setPage, next, prev };
}
