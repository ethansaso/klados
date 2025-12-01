import { TaxonGroup } from "./grouping/types";
import { discoverTaxonHierarchyFromRoot } from "./hierarchy/discoverHierarchy";
import { buildKeyForGroup } from "./key-building/recursiveBuilder";
import { DEFAULT_KEYGEN_OPTIONS, KeyGenOptions } from "./options";

export const generateKeyForTaxon = async (
  rootTaxonId: number,
  options: KeyGenOptions = DEFAULT_KEYGEN_OPTIONS
) => {
  const hierarchy = await discoverTaxonHierarchyFromRoot(rootTaxonId, options);

  const rootNode = hierarchy.get(rootTaxonId);
  if (!rootNode) {
    throw new Error(`Root taxon ${rootTaxonId} not found in hierarchy`);
  }

  // Immediate children only: *true siblings*, same parent.
  // TODO: Rank limiting (e.g. user asks to regenerate key for just genera under Rosaceae)
  const initialGroup: TaxonGroup =
    rootNode.subtaxonIds
      ?.map((id) => hierarchy.get(id))
      .filter((n): n is NonNullable<typeof n> => n != null) ?? [];
  if (initialGroup.length === 0) {
    // Nothing to key; trivial leaf
    return {
      rootTaxonId,
      root: {
        kind: "leaf",
        taxa: [],
      } as const,
    };
  }

  const rootKeyNode = buildKeyForGroup(initialGroup, options);

  return {
    rootTaxonId,
    root: rootKeyNode,
  };
};
