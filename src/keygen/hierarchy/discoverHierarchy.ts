import {
  getTaxaCharacterStates,
  getTaxonCharacterStates,
} from "../../lib/domain/character-states/service";
import { TaxonCharacterStateDTO } from "../../lib/domain/character-states/types";
import { getTaxon } from "../../lib/domain/taxa/service";
import { KeyGenOptions } from "../options";
import { HierarchyTaxonMeta, HierarchyTaxonNode } from "./types";

/**
 * Fetches a single taxon and its character states to assemble a KGTaxonNode.
 * Uses per-taxon character state fetch; fine for one-offs, not for bulk traversal.
 */
export const fetchAndAssembleTaxonNode = async (
  taxonId: number
): Promise<HierarchyTaxonNode | null> => {
  const taxon = await getTaxon({ id: taxonId });
  if (!taxon) {
    return null;
  }
  const taxonData = await getTaxonCharacterStates({ taxonId });
  if (!taxonData) {
    return null;
  }

  const taxonNode: HierarchyTaxonNode = {
    id: taxonId,
    name: taxon.acceptedName,
    rank: taxon.rank,
    states: taxonData,
    subtaxonIds: taxon.subtaxa.map((subtaxon) => subtaxon.id),
  };

  return taxonNode;
};

/**
 * BFS over the taxon tree starting at rootTaxonId to discover:
 * - every taxon id in the subtree
 * - each taxon's name, rank, and subtaxonIds
 *
 * BFS will truncate if taxonLimit is reached, stopping further descent
 * and 'retreating' to the lowest rank taxa found so far before returning.
 */
async function discoverTaxonMetaHierarchyBFS(
  rootTaxonId: number,
  options: KeyGenOptions
): Promise<Map<number, HierarchyTaxonMeta>> {
  const { taxonLimit } = options;
  const metaById = new Map<number, HierarchyTaxonMeta>();

  let currentLevelIds: number[] = [rootTaxonId];

  while (currentLevelIds.length > 0) {
    // If limit provided, check whether including this *entire* level
    // would exceed it. If so, stop here and discard lower levels.
    if (
      typeof taxonLimit === "number" &&
      metaById.size + currentLevelIds.length > taxonLimit
    ) {
      console.warn(
        `Taxon limit of ${taxonLimit} reached; truncating hierarchy at current depth.`
      );
      break;
    }

    const nextLevelIds: number[] = [];

    for (const id of currentLevelIds) {
      // Skip already-processed taxa
      // (shouldn't happen, since a taxon cannot have multiple parents)
      if (metaById.has(id)) continue;

      const taxon = await getTaxon({ id });
      if (!taxon) {
        console.warn(`Taxon with ID ${id} not found. Skipping.`);
        continue;
      }

      const subtaxonIds = taxon.subtaxa.map((st) => st.id);

      metaById.set(id, {
        id: taxon.id,
        name: taxon.acceptedName,
        rank: taxon.rank,
        subtaxonIds,
      });

      for (const child of taxon.subtaxa) {
        if (!metaById.has(child.id)) {
          nextLevelIds.push(child.id);
        }
      }
    }

    currentLevelIds = nextLevelIds;
  }

  return metaById;
}

/**
 * Bulk-load character states for all taxa in a discovered tree.
 */
async function loadStatesForHierarchy(
  metaById: Map<number, HierarchyTaxonMeta>
): Promise<Record<number, TaxonCharacterStateDTO[]>> {
  const allIds = Array.from(metaById.keys());
  if (allIds.length === 0) {
    return {};
  }
  return getTaxaCharacterStates({ taxonIds: allIds });
}

/**
 * Combine structure metadata + character states into KGTaxonNodes.
 */
function assembleHierarchyNodes(
  metaById: Map<number, HierarchyTaxonMeta>,
  statesByTaxonId: Record<number, TaxonCharacterStateDTO[]>
): Map<number, HierarchyTaxonNode> {
  const tree = new Map<number, HierarchyTaxonNode>();

  for (const [id, meta] of metaById) {
    const states = statesByTaxonId[id] ?? [];
    const node: HierarchyTaxonNode = {
      id: meta.id,
      name: meta.name,
      rank: meta.rank,
      states,
      subtaxonIds: meta.subtaxonIds,
    };
    tree.set(id, node);
  }

  return tree;
}

/**
 * Build a flat map of KGTaxonNodes for the subtree rooted at `rootTaxonId`.
 *
 * Steps:
 *  1. Discover taxon subtree structure (one getTaxon per taxon).
 *  2. Bulk-load character states for all discovered taxa.
 *  3. Assemble Map<number, KGTaxonNode>.
 */
export const discoverTaxonHierarchyFromRoot = async (
  rootTaxonId: number,
  options: KeyGenOptions
): Promise<Map<number, HierarchyTaxonNode>> => {
  const metaById = await discoverTaxonMetaHierarchyBFS(rootTaxonId, options);
  if (!metaById.size) {
    throw new Error(`No taxa discovered under root ID ${rootTaxonId}.`);
  }

  const statesByTaxonId = await loadStatesForHierarchy(metaById);
  return assembleHierarchyNodes(metaById, statesByTaxonId);
};
