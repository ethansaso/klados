import { createServerFn } from "@tanstack/react-start";
import z from "zod";
import {
  extractStates,
  type ExtractionOutput,
} from "../../domain/extraction/service";

export const extractStatesFn = createServerFn({ method: "POST" })
  .validator(
    z.object({
      description: z.string().min(1, "Description text is required."),
    }),
  )
  .handler(async ({ data }): Promise<ExtractionOutput> => {
    return extractStates(data.description);
  });
