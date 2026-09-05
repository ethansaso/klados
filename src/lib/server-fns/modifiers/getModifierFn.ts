import { notFound } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getModifier } from "../../domain/modifiers/service";
import type { ModifierDTO } from "../../domain/modifiers/types";

export const getModifierFn = createServerFn({ method: "GET" })
  .validator(
    z.object({
      id: z.coerce.number().int().positive(),
    }),
  )
  .handler(async ({ data }): Promise<ModifierDTO> => {
    const dto = await getModifier(data.id);
    if (!dto) throw notFound();
    return dto;
  });
