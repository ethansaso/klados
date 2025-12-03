import { KeyTaxonNode } from "./key-building/types";
import { KeyGenOptions } from "./options";

export type KeyGenerationInput = {
  /**
   * The ID of the taxon to generate a key for.
   */
  taxonId: number;
  /**
   * Options for key generation.
   */
  options: KeyGenOptions;
};

export type KeyGenerationResult = {
  rootNode: KeyTaxonNode;
};
