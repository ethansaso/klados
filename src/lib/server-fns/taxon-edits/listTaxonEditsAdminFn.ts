import { createServerFn } from "@tanstack/react-start";
import { requireAdminMiddleware } from "../../auth/serverFnMiddleware";
import { getTaxonEditLogPage } from "../../domain/taxon-edits/service";
import type { TaxonEditLogPaginatedResult } from "../../domain/taxon-edits/types";
import { PaginationSchema } from "../../validation/pagination";

export const listTaxonEditsAdminFn = createServerFn({ method: "GET" })
  .middleware([requireAdminMiddleware])
  .validator(PaginationSchema)
  .handler(async ({ data }): Promise<TaxonEditLogPaginatedResult> =>
    getTaxonEditLogPage(data),
  );
