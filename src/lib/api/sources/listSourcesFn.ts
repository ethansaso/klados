import { createServerFn } from "@tanstack/react-start";
import { SourceSearchSchema } from "../../domain/sources/search";
import { listSources } from "../../domain/sources/service";
import { SourcePaginatedResult } from "../../domain/sources/types";

export const listSourcesFn = createServerFn({ method: "GET" })
  .inputValidator(SourceSearchSchema)
  .handler(async ({ data }): Promise<SourcePaginatedResult> => {
    return listSources(data);
  });
