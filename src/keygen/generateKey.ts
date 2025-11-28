import { splitByCharacterDefinitions } from "./grouping/splitByCharacterDefinitions";
import { discoverTaxonHierarchyFromRoot } from "./hierarchy/discoverHierarchy";
import { DEFAULT_KEYGEN_OPTIONS, KeyGenOptions } from "./options";

export const generateKeyForTaxon = async (
  id: number,
  options: KeyGenOptions = DEFAULT_KEYGEN_OPTIONS
) => {
  const map = await discoverTaxonHierarchyFromRoot(id, options);
  const testResult = splitByCharacterDefinitions(
    Array.from(map.values()).filter((node) => node.id !== id),
    options
  );
  return testResult;
};
