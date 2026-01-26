import { createServerFn } from "@tanstack/react-start";
import { requireCuratorMiddleware } from "../../auth/serverFnMiddleware";
import { createModifierGroup } from "../../domain/modifiers/service";
import { ModifierGroupDTO } from "../../domain/modifiers/types";
import { createModifierGroupSchema } from "../../domain/modifiers/validation";

export const createModifierGroupFn = createServerFn({ method: "POST" })
  .middleware([requireCuratorMiddleware])
  .inputValidator(createModifierGroupSchema)
  .handler(async ({ data }): Promise<ModifierGroupDTO> => {
    const dto = await createModifierGroup({
      key: data.key,
      label: data.label,
      description: data.description,
      class: data.class,
    });

    if (!dto) {
      throw new Error("Failed to create modifier group.");
    }

    return dto;
  });
