import { createServerFn } from "@tanstack/react-start";
import z from "zod";
import { generateKeyForTaxon } from "../../../keygen/generateKey";
import { hydrateKeyFromRoot } from "../../../keygen/hydration/hydrateKey";
import { KeyGenerationResult } from "../../../keygen/ioTypes";
import { KeyGenOptionsSchema } from "../../../keygen/options";

const KeygenInputSchema = z.object({
  taxonId: z.number().int().nonnegative(),
  options: KeyGenOptionsSchema,
});

// TODO: This should run in a worker thread and be WebSocket-based.
export const generateKeyFn = createServerFn({
  method: "POST",
})
  .inputValidator(KeygenInputSchema)
  .handler(async ({ data }): Promise<KeyGenerationResult> => {
    // Initial keygen
    const { rootNode } = await generateKeyForTaxon(data.taxonId, data.options);
    // Hydrate with names, traits, groups, etc.
    const hydratedRoot = await hydrateKeyFromRoot(rootNode);

    return { rootNode: hydratedRoot };
  });
