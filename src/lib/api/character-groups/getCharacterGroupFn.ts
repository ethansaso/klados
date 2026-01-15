import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getCharacterGroup } from "../../domain/character-groups/service";
import type { CharacterGroupDetailDTO } from "../../domain/character-groups/types";

export const getCharacterGroupFn = createServerFn({ method: "GET" })
  .inputValidator(
    z.object({
      id: z.number().int().nonnegative(),
    })
  )
  .handler(async ({ data }): Promise<CharacterGroupDetailDTO | null> => {
    const { id } = data;

    const group = await getCharacterGroup({ id });
    return group;
  });
