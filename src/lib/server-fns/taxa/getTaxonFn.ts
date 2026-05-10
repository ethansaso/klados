import { notFound } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { getTaxon } from "../../domain/taxa/service";
import type { TaxonDetailDTO } from "../../domain/taxa/types";

export const getTaxonFn = createServerFn({ method: "GET" })
  .inputValidator(
    z.object({
      id: z.number(),
    })
  )
  .handler(async ({ data }): Promise<TaxonDetailDTO> => {
    const detail = await getTaxon({ id: data.id });

    if (!detail) {
      throw notFound();
    }

    return detail;
  });
