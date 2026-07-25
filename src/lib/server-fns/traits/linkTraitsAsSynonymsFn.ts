import { createServerFn } from "@tanstack/react-start";
import { requireCuratorMiddleware } from "../../auth/serverFnMiddleware";
import { linkTraitsAsSynonyms } from "../../domain/traits/service";
import { linkTraitsAsSynonymsSchema } from "../../domain/traits/validation";

export const linkTraitsAsSynonymsFn = createServerFn({ method: "POST" })
  .middleware([requireCuratorMiddleware])
  .validator(linkTraitsAsSynonymsSchema)
  .handler(async ({ data }): Promise<{ synonymSetId: number }> => {
    return linkTraitsAsSynonyms(data);
  });
