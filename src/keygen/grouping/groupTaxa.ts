import { KGTaxonNode } from "../hierarchy/types";
import { KeyGenOptions } from "../options";

/**
 * Recursively groups taxa starting from the root of the hierarchy.
 */
export const groupTaxaFromRoot = async (
  rootTaxonId: number,
  hierarchy: Map<number, KGTaxonNode>,
  options: KeyGenOptions
) => {
  const rootNode = hierarchy.get(rootTaxonId);
  if (!rootNode) {
    throw new Error(`Root taxon ID ${rootTaxonId} not found in hierarchy.`);
  }
};
