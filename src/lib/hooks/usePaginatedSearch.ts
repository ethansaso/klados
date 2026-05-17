import { useCallback, useState } from "react";

type PaginatedSearchState = {
  page: number;
  pageSize: number;
  q: string;
};

type Opts = {
  pageSize?: number;
};

export function usePaginatedSearch(opts?: Opts) {
  const [search, setSearchState] = useState<PaginatedSearchState>({
    page: 1,
    pageSize: opts?.pageSize ?? 20,
    q: "",
  });

  const setSearch = useCallback((patch: Partial<PaginatedSearchState>) => {
    setSearchState((prev) => ({ ...prev, ...patch }));
  }, []);

  const setQ = useCallback(
    (q: string) => setSearch({ q, page: 1 }),
    [setSearch],
  );

  const setPage = useCallback(
    (page: number) => setSearch({ page }),
    [setSearch],
  );

  const next = useCallback((total: number) => {
    setSearchState((prev) => {
      const max = Math.max(1, Math.ceil(total / prev.pageSize));
      return { ...prev, page: Math.min(prev.page + 1, max) };
    });
  }, []);

  const prev = useCallback(() => {
    setSearchState((s) => ({ ...s, page: Math.max(1, s.page - 1) }));
  }, []);

  return { search, setQ, setPage, next, prev };
}
