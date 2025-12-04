import { notFound } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getTraitSet } from "../../domain/traits/service";
import type { TraitSetDetailDTO } from "../../domain/traits/types";

export const getTraitSetFn = createServerFn({ method: "GET" })
  .inputValidator(z.object({ id: z.number().int().positive() }))
  .handler(async ({ data }): Promise<TraitSetDetailDTO> => {
    const { id } = data;

    const dto = await getTraitSet({ id });
    if (!dto) {
      throw notFound();
    }

    return dto;
  });
