import { notFound } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { requireCuratorMiddleware } from "../../auth/serverFnMiddleware";
import { updateModifier } from "../../domain/modifiers/service";
import type { ModifierDTO } from "../../domain/modifiers/types";
import { updateModifierSchema } from "../../domain/modifiers/validation";

export const updateModifierFn = createServerFn({ method: "POST" })
  .middleware([requireCuratorMiddleware])
  .inputValidator(updateModifierSchema)
  .handler(async ({ data }): Promise<ModifierDTO> => {
    try {
      return await updateModifier(data);
    } catch (err) {
      if (err instanceof Error && err.message === "Modifier not found.") {
        throw notFound();
      }
      throw err;
    }
  });
