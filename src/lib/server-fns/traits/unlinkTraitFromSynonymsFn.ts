import { createServerFn } from "@tanstack/react-start";
import { requireCuratorMiddleware } from "../../auth/serverFnMiddleware";
import { unlinkTraitFromSynonyms } from "../../domain/traits/service";
import { unlinkTraitFromSynonymsSchema } from "../../domain/traits/validation";

export const unlinkTraitFromSynonymsFn = createServerFn({ method: "POST" })
  .middleware([requireCuratorMiddleware])
  .validator(unlinkTraitFromSynonymsSchema)
  .handler(async ({ data }): Promise<{ synonymSetId: number }> => {
    return unlinkTraitFromSynonyms(data);
  });
