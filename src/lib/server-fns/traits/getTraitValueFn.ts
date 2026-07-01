import { notFound } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getTraitValue } from "../../domain/traits/service";
import type { TraitValueDTO } from "../../domain/traits/types";

export const getTraitValueFn = createServerFn({ method: "GET" })
  .validator(
    z.object({
      id: z.coerce.number().int().positive(),
    }),
  )
  .handler(async ({ data }): Promise<TraitValueDTO> => {
    const dto = await getTraitValue({ id: data.id });
    if (!dto) throw notFound();
    return dto;
  });
