import { notFound } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { setResponseStatus } from "@tanstack/react-start/server";
import { z } from "zod";
import { requireCuratorMiddleware } from "../../auth/serverFnMiddleware";
import { deleteCharacter } from "../../domain/characters/service";
import { InUseError } from "../../utils/InUseError";

export const deleteCharacterFn = createServerFn({ method: "POST" })
  .middleware([requireCuratorMiddleware])
  .validator(z.object({ id: z.number().int().positive() }))
  .handler(async ({ data }): Promise<{ id: number }> => {
    const { id } = data;

    try {
      const deleted = await deleteCharacter({ id });

      if (!deleted) {
        throw notFound();
      }

      return deleted;
    } catch (err) {
      if (err instanceof InUseError) {
        setResponseStatus(400);
        throw err;
      }
      throw err;
    }
  });
