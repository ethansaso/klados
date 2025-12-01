import { createServerFn } from "@tanstack/react-start";
import z from "zod";
import { generateKeyForTaxon } from "../../../keygen/generateKey";
import { KeyGenerationResult } from "../../../keygen/ioTypes";

const KeygenInputSchema = z.object({
  taxonId: z.number().int().nonnegative(),
  options: z.any(), // TODO: refine
});

// TODO: This should run in a worker thread and be WebSocket-based.
export const generateKeyFn = createServerFn({
  method: "POST",
})
  .inputValidator(KeygenInputSchema)
  .handler(async ({ data }): Promise<KeyGenerationResult> => {
    const result = await generateKeyForTaxon(data.taxonId, data.options);
    return result;
  });
