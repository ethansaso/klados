import {
  TaxonCategoricalStateDTO,
  Trait,
} from "../../../lib/domain/character-states/types";
import { HierarchyTaxonNode } from "../../hierarchy/types";
import { KeyGenOptions } from "../../options";
import {
  CharacterDefinitionSplitBranch,
  CharacterDefinitionSplitResult,
} from "../types";
import { scoreCharacterSplit } from "./scoreCharacterSplit";

type CharEntry = {
  taxon: HierarchyTaxonNode;
  state: TaxonCategoricalStateDTO;
};

type ByCharacter = Map<number, Map<number, CharEntry>>;

type SharedTraitGroup = {
  traits: Trait[];
  taxa: HierarchyTaxonNode[];
};

/** Post-normalization index of trait sets by taxon, with group annotation */
type NormalizedCharacterTraitSets = {
  traitSetsByTaxon: Map<number, Trait[]>;
  groupId: number;
};

type GroupsResult = {
  groups: SharedTraitGroup[];
  notTaxa: Set<HierarchyTaxonNode>;
  groupId: number;
};

/**
 * Build index: characterId -> (taxonId -> {taxon, states})
 */
function buildCharacterIndex(taxa: HierarchyTaxonNode[]): ByCharacter {
  const byCharacter = new Map<number, Map<number, CharEntry>>();

  for (const taxon of taxa) {
    for (const state of taxon.states) {
      if (state.kind !== "categorical") continue;

      let byTaxon = byCharacter.get(state.characterId);
      if (!byTaxon) {
        byTaxon = new Map<number, CharEntry>();
        byCharacter.set(state.characterId, byTaxon);
      }

      byTaxon.set(taxon.id, { taxon, state });
    }
  }

  return byCharacter;
}

/**
 * For a given character, normalize trait-sets across all taxa.
 * Returns null if any taxon lacks this character or has empty trait-set.
 *
 * ! This is the "all defined" step.
 */
function normalizeTraitSetsForCharacter(
  taxa: HierarchyTaxonNode[],
  byTaxon: Map<number, CharEntry>
): NormalizedCharacterTraitSets | null {
  const traitSetsByTaxon = new Map<number, Trait[]>();

  let groupId: number | null = null;

  for (const taxon of taxa) {
    const entry = byTaxon.get(taxon.id);
    if (!entry) {
      // Reject if any taxon lacks this character.
      return null;
    }

    const { state } = entry;
    const traits = state.traitValues ?? [];
    if (!traits.length) {
      // Reject empty trait-sets.
      return null;
    }

    if (groupId === null) {
      groupId = state.groupId;
    } else if (groupId !== state.groupId) {
      // Reject if groupIds differ (should not happen).
      return null;
    }

    traitSetsByTaxon.set(taxon.id, traits);
  }

  // Return null if groupId was never set (should not happen)
  if (groupId === null) return null;

  return { traitSetsByTaxon, groupId };
}

/** Simple set intersection */
function hasIntersection(a: Set<number>, b: Set<number>): boolean {
  for (const x of a) {
    if (b.has(x)) return true;
  }
  return false;
}

/**
 * Builds disjoint trait-set groups (candidate positive branches).
 *
 * When collisions occur (e.g. "yellow" and "yellow, green"),
 * marks all involved taxa as ambiguous (notTaxa) and their traits as dead,
 * returning them as the "notTaxa" outgroup.
 *
 * Returns null if this character cannot produce >= 2 clean groups.
 *
 * ! This is the "A∩B = ∅" enforcement step.
 */
function buildGroupsWithDeadTags(
  taxa: HierarchyTaxonNode[],
  normalized: NormalizedCharacterTraitSets
): GroupsResult | null {
  const { traitSetsByTaxon, groupId } = normalized;

  const groupMap = new Map<string, SharedTraitGroup>();
  const groupTraitIdsByKey = new Map<string, Set<number>>();
  const deadTraitIds = new Set<number>();
  const notTaxa = new Set<HierarchyTaxonNode>();

  for (const taxon of taxa) {
    const traits = traitSetsByTaxon.get(taxon.id);
    if (!traits) {
      // Should not happen; normalizeTraitSetsForCharacter enforces presence.
      return null;
    }

    if (traits.length === 0) {
      return null;
    }

    // ! Use canonical IDs to resolve aliases.
    const traitIds = new Set<number>(traits.map((t) => t.canonicalId));

    // If this trait-set uses any dead trait, it is automatically ambiguous.
    let usesDead = false;
    for (const trait of traits) {
      if (deadTraitIds.has(trait.canonicalId)) {
        usesDead = true;
        break;
      }
    }

    if (usesDead) {
      notTaxa.add(taxon);
      for (const trait of traits) {
        deadTraitIds.add(trait.canonicalId);
      }

      // Any existing group overlapping this trait-set becomes dead too.
      for (const [key, g] of Array.from(groupMap.entries())) {
        const gTraitIds = groupTraitIdsByKey.get(key)!;
        if (hasIntersection(traitIds, gTraitIds)) {
          for (const t of g.taxa) {
            notTaxa.add(t);
          }
          for (const id of gTraitIds) {
            deadTraitIds.add(id);
          }
          groupMap.delete(key);
          groupTraitIdsByKey.delete(key);
        }
      }

      continue;
    }

    // Precompute sorted traits + key for this exact trait-set.
    const sortedTraits = [...traits].sort((a, b) =>
      a.canonicalId === b.canonicalId
        ? 0
        : a.canonicalId < b.canonicalId
          ? -1
          : 1
    );
    const key = sortedTraits.map((t) => t.canonicalId).join("|");

    // Join to existing group if exact match.
    const existingExactGroup = groupMap.get(key);
    if (existingExactGroup) {
      existingExactGroup.taxa.push(taxon);
      continue;
    }

    // Otherwise, this is a new signature; check for collisions (partial overlaps).
    let collided = false;
    for (const [existingKey, g] of Array.from(groupMap.entries())) {
      const gTraitIds = groupTraitIdsByKey.get(existingKey)!;
      if (!hasIntersection(traitIds, gTraitIds)) continue;

      // Collision (partial overlap) -> send both sides to notTaxa.
      collided = true;
      notTaxa.add(taxon);
      for (const t of g.taxa) {
        notTaxa.add(t);
      }
      for (const id of gTraitIds) {
        deadTraitIds.add(id);
      }
      for (const id of traitIds) {
        deadTraitIds.add(id);
      }

      groupMap.delete(existingKey);
      groupTraitIdsByKey.delete(existingKey);
    }

    if (collided) {
      continue;
    }

    // At this point, this trait-set is clean and new; create a new group.
    const newTraitIds = new Set<number>(traitIds);
    const group: SharedTraitGroup = {
      traits: sortedTraits,
      taxa: [taxon],
    };
    groupMap.set(key, group);
    groupTraitIdsByKey.set(key, newTraitIds);
  }

  const groups = Array.from(groupMap.values());
  const hasNotTaxa = notTaxa.size > 0;

  if ((hasNotTaxa && groups.length === 0) || groups.length < 2) {
    // Either everyone is ambiguous, or there's no real split.
    return null;
  }

  return { groups, notTaxa, groupId };
}

/**
 * Enforce maxBranches by trimming smaller groups into the inverted pool.
 * Assumes maxBranches >= 2 & groups.length >= 2 (enforced by previous steps).
 *
 *  Always returns a configuration with:
 *  - at least one explicit (non-inverted) branch
 *  - an inverted branch only if needed
 */
function enforceBranchLimit(
  groups: SharedTraitGroup[],
  notTaxa: Set<HierarchyTaxonNode>,
  maxBranches: number
): { groups: SharedTraitGroup[]; notTaxa: Set<HierarchyTaxonNode> } {
  const hasNotTaxaInitially = notTaxa.size > 0;

  // If we're already within the allowed *total* branch count, do nothing.
  if (groups.length + (hasNotTaxaInitially ? 1 : 0) <= maxBranches) {
    return { groups, notTaxa };
  }

  // We are going to need an inverted bucket after trimming.
  // Reserve 1 slot for it and only keep (maxBranches - 1) positive groups.
  groups.sort((a, b) => b.taxa.length - a.taxa.length);

  const allowedPositive = maxBranches - 1; // maxBranches >= 2 guaranteed upstream
  const kept = groups.slice(0, allowedPositive);
  const trimmed = groups.slice(allowedPositive);

  for (const g of trimmed) {
    for (const t of g.taxa) {
      notTaxa.add(t);
    }
  }

  return { groups: kept, notTaxa };
}

/**
 * Turn groups + notTaxa into actual SplitBranch objects, including optional inverted branch.
 * Also returns whether an inverted branch was created.
 */
function createBranches(
  characterId: number,
  groupId: number,
  groups: SharedTraitGroup[],
  notTaxa: Set<HierarchyTaxonNode>
): { branches: CharacterDefinitionSplitBranch[]; hasInvertedBranch: boolean } {
  const branches: CharacterDefinitionSplitBranch[] = [];

  for (const g of groups) {
    branches.push({
      taxa: g.taxa,
      clauses: [
        {
          characterId,
          groupId,
          traits: g.traits,
          inverted: false,
        },
      ],
    });
  }

  let hasInvertedBranch = false;

  if (notTaxa.size > 0) {
    hasInvertedBranch = true;

    const traitMap = new Map<number, Trait>();
    for (const g of groups) {
      for (const t of g.traits) {
        if (!traitMap.has(t.canonicalId)) {
          traitMap.set(t.canonicalId, t);
        }
      }
    }

    const unionTraits = Array.from(traitMap.values());

    branches.push({
      taxa: Array.from(notTaxa),
      clauses: [
        {
          characterId,
          groupId,
          traits: unionTraits,
          inverted: true,
        },
      ],
    });
  }
  return { branches, hasInvertedBranch };
}

/**
 * For a set of sibling taxa, compute all candidate splits by categorical characters.
 * Each result is one possible resolution at this node, with branches and a score.
 */
export function resolveCharacterSplits(
  taxa: HierarchyTaxonNode[],
  options: KeyGenOptions
): CharacterDefinitionSplitResult[] {
  const { maxBranches } = options;
  if (taxa.length < 2 || maxBranches < 2) return [];

  const byCharacter = buildCharacterIndex(taxa);
  const results: CharacterDefinitionSplitResult[] = [];

  for (const [characterId, byTaxon] of byCharacter) {
    // 1) enforce all taxa have this character + normalize
    const normalized = normalizeTraitSetsForCharacter(taxa, byTaxon);
    if (!normalized) continue;

    // 2) build disjoint groups + notTaxa
    const groupsResult = buildGroupsWithDeadTags(taxa, normalized);
    if (!groupsResult) continue;

    // 3) respect maxBranches (trim into inverted if needed)
    const limited = enforceBranchLimit(
      groupsResult.groups,
      groupsResult.notTaxa,
      maxBranches
    );
    if (!limited) continue;

    const { groups, notTaxa } = limited;

    // 4) turn groups + notTaxa into branches, note inversion
    const { branches } = createBranches(
      characterId,
      groupsResult.groupId,
      groups,
      notTaxa
    );

    // 5) score based on keyShape + inverted penalty
    const score = scoreCharacterSplit(branches, options);
    if (score > 0) {
      results.push({
        kind: "character-definition",
        branches,
        score,
      });
    }
  }

  results.sort((a, b) => b.score - a.score);
  return results;
}
