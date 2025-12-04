import { notFound } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { requireCuratorMiddleware } from "../../auth/serverFnMiddleware";
import { createCharacter } from "../../domain/characters/service";
import type { CharacterDTO } from "../../domain/characters/types";
import { createCharacterSchema } from "../../domain/characters/validation";

export const createCharacterFn = createServerFn({ method: "POST" })
  .middleware([requireCuratorMiddleware])
  .inputValidator(createCharacterSchema)
  .handler(async ({ data }): Promise<CharacterDTO> => {
    const dto = await createCharacter({
      key: data.key,
      label: data.label,
      description: data.description,
      groupId: data.group_id,
      traitSetId: data.trait_set_id,
      isMultiSelect: data.is_multi_select,
    });

    if (!dto) {
      throw notFound();
    }

    return dto;
  });
