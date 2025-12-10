import z from "zod";
import { HydratedKeyGraphDTO } from "./hydration/types";
import { KeyGenOptionsInputSchema } from "./options";

export const KeyGenerationInputSchema = z.object({
  /**
   * The ID of the taxon to generate a key for.
   */
  taxonId: z.number("Please specify a root taxon.").int().nonnegative(),
  /**
   * Options for key generation.
   */
  options: KeyGenOptionsInputSchema,
});

export type KeyGenerationInput = z.infer<typeof KeyGenerationInputSchema>;

export type KeyGenerationResult = {
  graph: HydratedKeyGraphDTO;
};
