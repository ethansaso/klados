// src/lib/api/taxa/listTaxaFn.ts

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { listTaxa } from "../../domain/taxa/service";
import type { TaxonPaginatedResult } from "../../domain/taxa/types";
import { PaginationSchema } from "../../validation/pagination";

export const listTaxaFn = createServerFn({ method: "GET" })
  .inputValidator(
    PaginationSchema.extend({
      q: z.string().optional(),
      status: z.enum(["active", "draft", "deprecated"]).optional(),
      ids: z.array(z.number()).optional(),
    })
  )
  .handler(async ({ data }): Promise<TaxonPaginatedResult> => {
    const { q, ids, page, pageSize, status } = data;

    return listTaxa({
      q,
      ids,
      page,
      pageSize,
      status,
    });
  });
