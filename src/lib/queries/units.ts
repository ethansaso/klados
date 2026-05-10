import { queryOptions } from "@tanstack/react-query";
import type { UnitFamilyDTO } from "../domain/units/types";
import { listUnitFamiliesFn } from "../server-fns/units/listUnitFamiliesFn";

export const unitFamiliesQueryOptions = (q?: string) =>
  queryOptions<UnitFamilyDTO[]>({
    queryKey: ["unitFamilies", { q }],
    queryFn: () => listUnitFamiliesFn({ data: { q } }),
    staleTime: 60_000,
  });
