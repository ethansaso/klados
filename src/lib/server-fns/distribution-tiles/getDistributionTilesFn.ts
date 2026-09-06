import { createServerFn } from "@tanstack/react-start";
import z from "zod";
import { getDistributionTiles } from "../../domain/distribution-tiles/service";

export const getDistributionTilesFn = createServerFn({ method: "GET" })
  .validator(
    z.object({
      taxonId: z.coerce.number().int().positive(),
    }),
  )
  .handler(async ({ data }): Promise<string[] | null> => {
    return getDistributionTiles(data.taxonId);
  });
