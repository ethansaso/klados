import { queryOptions } from "@tanstack/react-query";
import { getDistributionTilesFn } from "../server-fns/distribution-tiles/getDistributionTilesFn";

export const distributionTilesQueryOptions = (taxonId: number) =>
  queryOptions<string[] | null>({
    queryKey: ["distributionTiles", taxonId] as const,
    queryFn: () => getDistributionTilesFn({ data: { taxonId } }),
  });
