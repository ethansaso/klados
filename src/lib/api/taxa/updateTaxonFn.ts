import { createServerFn } from "@tanstack/react-start";
import { requireCuratorMiddleware } from "../../auth/serverFnMiddleware";
import { updateTaxon } from "../../domain/taxa/service";
import { updateTaxonInputSchema } from "../../domain/taxa/validation";

export const updateTaxonFn = createServerFn({ method: "POST" })
  .middleware([requireCuratorMiddleware])
  .inputValidator(updateTaxonInputSchema)
  .handler(async ({ data }) => {
    return updateTaxon(data);
  });
