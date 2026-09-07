import { createServerFn } from "@tanstack/react-start";
import { requireCuratorMiddleware } from "../../auth/serverFnMiddleware";
import { updateMedia } from "../../domain/media/service";
import type { MediaDTO } from "../../domain/media/types";
import { updateMediaSchema } from "../../domain/media/validation";

export const updateMediaFn = createServerFn({ method: "POST" })
  .middleware([requireCuratorMiddleware])
  .validator(updateMediaSchema)
  .handler(async ({ data }): Promise<MediaDTO> => {
    const updated = await updateMedia(data);
    if (!updated) throw new Error("Media item not found.");
    return updated;
  });
