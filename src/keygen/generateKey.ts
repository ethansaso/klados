import { TaxonGroup } from "./grouping/types";
import { discoverTaxonHierarchyFromRoot } from "./hierarchy/discoverHierarchy";
import { buildKeyForGroup } from "./key-building/recursiveBuilder";
import { DEFAULT_KEYGEN_OPTIONS, KeyGenOptions } from "./options";

export const generateKeyForTaxon = async (
  rootTaxonId: number,
  options: KeyGenOptions = DEFAULT_KEYGEN_OPTIONS
) => {
  const hierarchy = await discoverTaxonHierarchyFromRoot(rootTaxonId, options);

  // Identify initial sibling group
  // TODO: Rank limiting (e.g. user asks to regenerate key for just genera under Rosaceae)
  const allNodes = Array.from(hierarchy.values());
  const initialGroup: TaxonGroup = allNodes.filter(
    (node) => node.id !== rootTaxonId
  );

  if (initialGroup.length === 0) {
    // Nothing to key; treat as trivial leaf.
    return {
      rootTaxonId,
      root: {
        kind: "leaf",
        taxa: [],
      },
    };
  }

  // Build the key tree from that sibling set.
  const rootKeyNode = buildKeyForGroup(initialGroup, options);

  return {
    rootTaxonId,
    root: rootKeyNode,
  };
};
