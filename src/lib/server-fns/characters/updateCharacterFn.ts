import { createServerFn } from "@tanstack/react-start";
import { requireCuratorMiddleware } from "../../auth/serverFnMiddleware";
import { updateCharacter } from "../../domain/characters/service";
import { updateCharacterSchema } from "../../domain/characters/validation";

export const updateCharacterFn = createServerFn({ method: "POST" })
  .middleware([requireCuratorMiddleware])
  .validator(updateCharacterSchema)
  .handler(async ({ data }) => {
    const updated = await updateCharacter(data);
    return updated;
  });
