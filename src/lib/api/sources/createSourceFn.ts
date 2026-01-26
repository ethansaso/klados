import { notFound } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { requireCuratorMiddleware } from "../../auth/serverFnMiddleware";
import { createSource } from "../../domain/sources/service";
import type { SourceDTO } from "../../domain/sources/types";
import { sourceItemSchema } from "../../domain/sources/validation";

export const createSourceFn = createServerFn({ method: "POST" })
  .middleware([requireCuratorMiddleware])
  .inputValidator(sourceItemSchema)
  .handler(async ({ data }): Promise<SourceDTO> => {
    const dto = await createSource(data);

    if (!dto) {
      throw notFound();
    }

    return dto;
  });
