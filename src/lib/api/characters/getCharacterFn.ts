import { notFound } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getCharacter } from "../../domain/characters/service";
import type { CharacterDetailDTO } from "../../domain/characters/types";

export const getCharacterFn = createServerFn({ method: "GET" })
  .inputValidator(
    z.object({
      id: z.coerce.number().int().positive(),
    })
  )
  .handler(async ({ data }): Promise<CharacterDetailDTO> => {
    const { id } = data;

    const dto = await getCharacter({ id });
    if (!dto) {
      throw notFound();
    }

    return dto;
  });
