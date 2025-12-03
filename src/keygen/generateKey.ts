import { discoverTaxonHierarchyFromRoot } from "./hierarchy/discoverHierarchy";
import { buildKeySubtreeForTaxon } from "./key-building/buildKeyForChildren";
import { KeyTaxonNode } from "./key-building/types";
import { DEFAULT_KEYGEN_OPTIONS, KeyGenOptions } from "./options";
import { TaxonGroup } from "./splitting/types";

/**
 * Given a taxon id (and options), generates a full key
 * for the taxon and its subtaxa as a nested KeyTaxonNode tree.
 */
export async function generateKeyForTaxon(
  taxonId: number,
  options: KeyGenOptions = DEFAULT_KEYGEN_OPTIONS
): Promise<{ rootNode: KeyTaxonNode }> {
  const hierarchy = await discoverTaxonHierarchyFromRoot(taxonId, options);

  const root = hierarchy.get(taxonId);
  if (!root) {
    throw new Error(`Root taxon ${taxonId} not found in hierarchy`);
  }

  // One level down: siblings under the root
  const children: TaxonGroup = root.subtaxonIds
    .map((id) => hierarchy.get(id))
    .filter((n): n is NonNullable<typeof n> => n !== undefined);

  const rootNode: KeyTaxonNode = {
    kind: "taxon",
    id: taxonId,
    branches: [],
  };

  // Populate the key recursively
  buildKeySubtreeForTaxon(rootNode, hierarchy, options);

  return { rootNode };
}
