import { createServerFn } from "@tanstack/react-start";
import { requireCuratorMiddleware } from "../../auth/serverFnMiddleware";
import { createModifier } from "../../domain/modifiers/service";
import { type ModifierDTO } from "../../domain/modifiers/types";
import { createModifierSchema } from "../../domain/modifiers/validation";

export const createModifierFn = createServerFn({ method: "POST" })
  .middleware([requireCuratorMiddleware])
  .inputValidator(createModifierSchema)
  .handler(async ({ data }): Promise<ModifierDTO> => {
    const dto = await createModifier({
      groupId: data.groupId,
      value: data.value,
      description: data.description,
      affixType: data.affixType,
    });

    if (!dto) {
      throw new Error("Failed to create modifier.");
    }

    return dto;
  });
