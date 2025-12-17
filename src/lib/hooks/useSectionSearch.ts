import { useCallback } from "react";

type SectionSearch = {
  page?: number;
  pageSize?: number;
  q?: string;
};

type RouteLike = {
  useSearch: () => unknown;
  useNavigate: () => unknown;
};

export function useSectionSearch<TRoute extends RouteLike>(Route: TRoute) {
  const raw = Route.useSearch() as SectionSearch;

  // Keep TanStack's real navigate type (don't try to re-type it)
  const navigate = Route.useNavigate() as ReturnType<TRoute["useNavigate"]>;

  const search = {
    page: raw.page ?? 1,
    pageSize: raw.pageSize ?? 20,
    q: raw.q ?? "",
  };

  const setSearch = useCallback(
    (patch: Partial<typeof search>, replace = false) => {
      const opts = {
        to: ".",
        search: (prev: unknown) => ({
          ...(prev as Record<string, unknown>),
          ...patch,
        }),
        replace,
      };

      // Cast through unknown into the *actual* parameter type TanStack expects
      return (navigate as unknown as (o: unknown) => unknown)(
        opts as unknown as Parameters<
          ReturnType<TRoute["useNavigate"]> extends (
            ...args: infer A
          ) => unknown
            ? (...args: A) => unknown
            : never
        >[0]
      );
    },
    [navigate]
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
