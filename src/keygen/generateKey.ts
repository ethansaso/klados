import { discoverTaxonHierarchyFromRoot } from "./hierarchy/discoverHierarchy";
import { buildKeySubtreeForTaxon } from "./key-building/buildKeyForChildren";
import { KeyTaxonNode } from "./key-building/types";
import { KeyGenOptions } from "./options";

/**
 * Given a taxon id (and options), generates a full key
 * for the taxon and its subtaxa as a nested KeyTaxonNode tree.
 */
export async function generateKeyForTaxon(
  taxonId: number,
  options: KeyGenOptions
): Promise<{ rootNode: KeyTaxonNode }> {
  const hierarchy = await discoverTaxonHierarchyFromRoot(taxonId, options);

  const root = hierarchy.get(taxonId);
  if (!root) {
    throw new Error(`Root taxon ${taxonId} not found in hierarchy`);
  }

  const rootNode: KeyTaxonNode = {
    kind: "taxon",
    id: String(taxonId),
    branches: [],
  };

  // Populate the key recursively
  buildKeySubtreeForTaxon(rootNode, hierarchy, options);

  return { rootNode };
}
