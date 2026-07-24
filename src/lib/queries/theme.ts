import { queryOptions } from "@tanstack/react-query";
import { getThemeFn } from "../server-fns/theme/getThemeFn";

export const themeQueryOptions = () =>
  queryOptions({
    queryKey: ["theme"],
    queryFn: () => getThemeFn(),
    staleTime: Infinity,
  });
