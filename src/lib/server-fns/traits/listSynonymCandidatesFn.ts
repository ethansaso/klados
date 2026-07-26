import { createServerFn } from "@tanstack/react-start";
import { requireCuratorMiddleware } from "../../auth/serverFnMiddleware";
import { listSynonymCandidates } from "../../domain/traits/service";
import type { SynonymCandidateDTO } from "../../domain/traits/types";
import { listSynonymCandidatesSchema } from "../../domain/traits/validation";

export const listSynonymCandidatesFn = createServerFn({ method: "POST" })
  .middleware([requireCuratorMiddleware])
  .validator(listSynonymCandidatesSchema)
  .handler(async ({ data }): Promise<SynonymCandidateDTO[]> => {
    return listSynonymCandidates(data);
  });
