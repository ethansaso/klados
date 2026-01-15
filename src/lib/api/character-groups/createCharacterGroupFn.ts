import { createServerFn } from "@tanstack/react-start";

import { requireCuratorMiddleware } from "../../auth/serverFnMiddleware";
import { createCharacterGroup } from "../../domain/character-groups/service";
import type { CharacterGroupDTO } from "../../domain/character-groups/types";
import { createCharacterGroupSchema } from "../../domain/character-groups/validation";

export const createCharacterGroupFn = createServerFn({ method: "POST" })
  .middleware([requireCuratorMiddleware])
  .inputValidator(createCharacterGroupSchema)
  .handler(async ({ data }): Promise<CharacterGroupDTO> => {
    const dto = await createCharacterGroup({
      key: data.key,
      label: data.label,
      description: data.description,
    });

    if (!dto) {
      throw new Error("Failed to create character group.");
    }

    return dto;
  });
