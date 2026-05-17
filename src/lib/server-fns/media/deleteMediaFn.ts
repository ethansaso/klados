import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireCuratorMiddleware } from "../../auth/serverFnMiddleware";
import { deleteMedia } from "../../domain/media/service";

export const deleteMediaFn = createServerFn({ method: "POST" })
  .middleware([requireCuratorMiddleware])
  .inputValidator(
    z.object({
      id: z.int().positive(),
    }),
  )
  .handler(async ({ data }): Promise<boolean> => {
    return deleteMedia(data.id);
  });
