import { queryOptions } from "@tanstack/react-query";
import { listUnitFamiliesFn } from "../api/units/listUnitFamiliesFn";
import type { UnitFamilyDTO } from "../domain/units/types";

export const unitFamiliesQueryOptions = (q?: string) =>
  queryOptions<UnitFamilyDTO[]>({
    queryKey: ["unitFamilies", { q }],
    queryFn: () => listUnitFamiliesFn({ data: { q } }),
    staleTime: 60_000,
  });
