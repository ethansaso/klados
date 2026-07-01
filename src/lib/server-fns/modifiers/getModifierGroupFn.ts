import { notFound } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import z from "zod";
import { getModifierGroup } from "../../domain/modifiers/service";

export const getModifierGroupFn = createServerFn({ method: "GET" })
  .validator(
    z.object({
      id: z.int().positive(),
    }),
  )
  .handler(async ({ data }) => {
    const { id } = data;

    const dto = await getModifierGroup(id);
    if (!dto) {
      throw notFound();
    }

    return dto;
  });
