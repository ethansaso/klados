import { createServerFn } from "@tanstack/react-start";
import z from "zod";
import { listMedia } from "../../domain/media/service";
import type { MediaPaginatedResult } from "../../domain/media/types";
import { PaginationSchema } from "../../validation/pagination";

export const listMediaFn = createServerFn({ method: "GET" })
  .inputValidator(
    PaginationSchema.extend({
      q: z.string().optional(),
    }),
  )
  .handler(async ({ data }): Promise<MediaPaginatedResult> => {
    return listMedia(data);
  });
