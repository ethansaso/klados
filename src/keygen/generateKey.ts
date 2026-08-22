import { getTaxaStates } from "../lib/domain/states/service";
import { getTaxon } from "../lib/domain/taxa/service";
import { discoverTaxonHierarchyFromRoot } from "./hierarchy/discoverHierarchy";
import { buildKeySubtreeForTaxon } from "./key-building/buildKeyForChildren";
import type { KeyTaxonNode } from "./key-building/types";
import type { KeyGenOptions } from "./options";
import {
  extendInheritedStatements,
  type InheritedFeatureStatements,
} from "./splitting/resolveFeaturePresentAbsentSplits";

/**
 * Given a taxon id (and options), generates a full key
 * for the taxon and its subtaxa as a nested KeyTaxonNode tree.
 */
export async function generateKeyForTaxon(
  taxonId: number,
  options: KeyGenOptions,
): Promise<{ rootNode: KeyTaxonNode }> {
  const { hierarchy, featureAncestorMap } =
    await discoverTaxonHierarchyFromRoot(taxonId, options);

  const root = hierarchy.get(taxonId);
  if (!root) {
    throw new Error(`Root taxon ${taxonId} not found in hierarchy`);
  }

  const rootNode: KeyTaxonNode = {
    kind: "taxon",
    id: String(taxonId),
    branches: [],
  };

  // Features bound above the root still apply inside it: keying Amanita's
  // species must respect what Agaricales reliably bears.
  const inheritedFromAncestors = await collectAncestorStatements(taxonId);

  // Populate the key recursively
  buildKeySubtreeForTaxon(
    rootNode,
    hierarchy,
    options,
    featureAncestorMap,
    inheritedFromAncestors,
  );

  return { rootNode };
}

/**
 * Feature statements from taxa above the key's root, which bind everything
 * inside it but which hierarchy discovery never visits.
 */
async function collectAncestorStatements(
  taxonId: number,
): Promise<InheritedFeatureStatements> {
  const taxon = await getTaxon({ id: taxonId });
  // Ancestors arrive root-first, so nearer statements overwrite broader ones.
  const ancestorIds = (taxon?.ancestors ?? []).map((ancestor) => ancestor.id);
  if (ancestorIds.length === 0) return new Map();

  const statesById = await getTaxaStates({ taxonIds: ancestorIds });

  let inherited: InheritedFeatureStatements = new Map<number, boolean>();
  for (const ancestorId of ancestorIds) {
    inherited = extendInheritedStatements(inherited, statesById[ancestorId]);
  }
  return inherited;
}
