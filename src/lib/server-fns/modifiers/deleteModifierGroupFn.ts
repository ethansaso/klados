import { createServerFn } from "@tanstack/react-start";
import z from "zod";
import { requireCuratorMiddleware } from "../../auth/serverFnMiddleware";
import { deleteModifierGroup } from "../../domain/modifiers/service";

export const deleteModifierGroupFn = createServerFn({ method: "POST" })
  .middleware([requireCuratorMiddleware])
  .inputValidator(
    z.object({
      id: z.number().int().positive(),
    }),
  )
  .handler(async ({ data }) => {
    await deleteModifierGroup(data.id);
    return { success: true };
  });
