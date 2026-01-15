import { createServerFn } from "@tanstack/react-start";
import z from "zod";
import { generateKeyForTaxon } from "../../../keygen/generateKey";
import { hydrateKeyFromRoot } from "../../../keygen/hydration/hydrateKey";
import { KeyGenerationResult } from "../../../keygen/ioTypes";
import { KeyGenOptionsSchema } from "../../../keygen/options";

const GuideGenInputSchema = z.object({
  taxonId: z.number().int().nonnegative(),
  options: KeyGenOptionsSchema,
});

// TODO: This should run in a worker thread and be WebSocket-based.
export const generateGuideFn = createServerFn({
  method: "POST",
})
  .inputValidator(GuideGenInputSchema)
  .handler(async ({ data }): Promise<KeyGenerationResult> => {
    // Initial keygen (produces a tree)
    const { rootNode } = await generateKeyForTaxon(data.taxonId, data.options);

    // Hydrate + convert to adjacency-list graph DTO
    const graph = await hydrateKeyFromRoot(rootNode);

    return { graph };
  });
