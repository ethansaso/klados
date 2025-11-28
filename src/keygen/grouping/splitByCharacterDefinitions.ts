import { TaxonCategoricalStateDTO } from "../../lib/domain/character-states/types";
import { KGTaxonNode } from "../hierarchy/types";
import { KeyGenOptions } from "../options";
import { SplitBranch, SplitResult } from "./types";

type CharEntry = {
  taxon: KGTaxonNode;
  state: TaxonCategoricalStateDTO;
};

type ByCharacter = Map<number, Map<number, CharEntry>>;

type Trait = {
  id: number;
  label: string;
};

type SharedTraitGroup = {
  traits: Trait[];
  taxa: KGTaxonNode[];
};

/** Post-normalization index of trait sets by taxon, with group annotation */
type NormalizedCharacterTraitSets = {
  traitSetsByTaxon: Map<number, Trait[]>;
  groupId: number;
};

type GroupsResult = {
  groups: SharedTraitGroup[];
  notTaxa: Set<KGTaxonNode>;
  groupId: number;
};

// Heavily penalize any split that needs an inverted branch.
const INVERTED_PENALTY_FACTOR = 0.25;

/**
 * Build index: characterId -> (taxonId -> {taxon, states})
 */
function buildCharacterIndex(taxa: KGTaxonNode[]): ByCharacter {
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
  taxa: KGTaxonNode[],
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
 * Apply "dead tag" semantics and build:
 *   - disjoint trait-set groups (candidate positive branches)
 *   - notTaxa = ambiguous taxa, destined for inverted branch
 *
 * Returns null if this character cannot produce >= 2 clean groups.
 *
 * ! This is the "A∩B = ∅" enforcement step.
 */
function buildGroupsWithDeadTags(
  taxa: KGTaxonNode[],
  normalized: NormalizedCharacterTraitSets
): GroupsResult | null {
  const { traitSetsByTaxon, groupId } = normalized;

  const groupMap = new Map<string, SharedTraitGroup>();
  const groupTraitIdsByKey = new Map<string, Set<number>>();
  const deadTraitIds = new Set<number>();
  const notTaxa = new Set<KGTaxonNode>();

  for (const taxon of taxa) {
    const traits = traitSetsByTaxon.get(taxon.id);
    if (!traits) {
      // Should not happen; normalizeTraitSetsForCharacter enforces presence.
      return null;
    }

    if (traits.length === 0) {
      return null;
    }

    const traitIds = new Set<number>(traits.map((t) => t.id));

    // 1) If this trait-set uses any dead trait, it is automatically ambiguous.
    let usesDead = false;
    for (const trait of traits) {
      if (deadTraitIds.has(trait.id)) {
        usesDead = true;
        break;
      }
    }

    if (usesDead) {
      notTaxa.add(taxon);
      for (const trait of traits) {
        deadTraitIds.add(trait.id);
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

    // 2) Check collisions with existing groups (partial overlaps).
    let collided = false;
    for (const [key, g] of Array.from(groupMap.entries())) {
      const gTraitIds = groupTraitIdsByKey.get(key)!;
      if (!hasIntersection(traitIds, gTraitIds)) continue;

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
      groupMap.delete(key);
      groupTraitIdsByKey.delete(key);
    }

    if (collided) {
      continue;
    }

    // 3) This trait-set is clean; add or extend a group.
    const sortedTraits = [...traits].sort((a, b) =>
      a.id === b.id ? 0 : a.id < b.id ? -1 : 1
    );
    const key = sortedTraits.map((t) => t.id).join("|");

    let group = groupMap.get(key);
    if (!group) {
      group = { traits: sortedTraits, taxa: [] };
      groupMap.set(key, group);
      groupTraitIdsByKey.set(key, new Set<number>(traitIds));
    }
    group.taxa.push(taxon);
  }

  const groups = Array.from(groupMap.values());
  const hasNotTaxa = notTaxa.size > 0;

  if ((hasNotTaxa && groups.length === 0) || groups.length < 2) {
    // Either everyone is ambiguous, or no real split.
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
  notTaxa: Set<KGTaxonNode>,
  maxBranches: number
): { groups: SharedTraitGroup[]; notTaxa: Set<KGTaxonNode> } {
  const hasNotTaxaInitially = notTaxa.size > 0;

  // If we're already within the allowed branch count, do nothing.
  if (groups.length + (hasNotTaxaInitially ? 1 : 0) <= maxBranches) {
    return { groups, notTaxa };
  }

  // Too many positive groups: keep the largest, send the rest to inverted.
  groups.sort((a, b) => b.taxa.length - a.taxa.length);

  // If we already have an inverted bucket, reserve 1 slot for it.
  const allowedPositive = hasNotTaxaInitially ? maxBranches - 1 : maxBranches;

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
  notTaxa: Set<KGTaxonNode>
): { branches: SplitBranch[]; hasInvertedBranch: boolean } {
  const branches: SplitBranch[] = [];

  for (const g of groups) {
    branches.push({
      taxa: g.taxa,
      rationale: {
        kind: "character-values",
        characterId,
        groupId,
        traits: g.traits,
        inverted: false,
      },
    });
  }

  let hasInvertedBranch = false;

  if (notTaxa.size > 0) {
    hasInvertedBranch = true;

    const traitMap = new Map<number, Trait>();
    for (const g of groups) {
      for (const t of g.traits) {
        if (!traitMap.has(t.id)) {
          traitMap.set(t.id, t);
        }
      }
    }

    const unionTraits = Array.from(traitMap.values());

    branches.push({
      taxa: Array.from(notTaxa),
      rationale: {
        kind: "character-values",
        characterId,
        groupId,
        traits: unionTraits,
        inverted: true,
      },
    });
  }

  return { branches, hasInvertedBranch };
}

/**
 * Scoring function for a candidate split:
 *   - "lopsided": reward large branches strongly.
 *   - "balanced": reward more branches and penalize imbalance.
 *   - Inverted branch applies a heavy penalty.
 */
function scoreSplit(
  branches: SplitBranch[],
  hasInverted: boolean,
  options: KeyGenOptions
): number {
  const sizes = branches.map((b) => b.taxa.length);
  const total = sizes.reduce((acc, n) => acc + n, 0);
  const k = sizes.length;
  if (k === 0 || total === 0) return 0;

  let baseScore: number;

  if (options.keyShape === "lopsided") {
    baseScore = sizes.reduce((acc, n) => acc + n * n, 0);
  } else {
    const mean = total / k;
    const imbalance = sizes.reduce((acc, n) => acc + Math.abs(n - mean), 0);
    baseScore = total * k - imbalance;
  }

  if (hasInverted) {
    baseScore *= INVERTED_PENALTY_FACTOR;
  }

  return baseScore;
}

/**
 * For a set of sibling taxa, compute all candidate splits by categorical characters.
 * Each result is one possible resolution at this node, with branches and a score.
 */
export function splitByCharacterDefinitions(
  taxa: KGTaxonNode[],
  options: KeyGenOptions
): SplitResult[] {
  const { maxBranches } = options;
  if (taxa.length < 2 || maxBranches < 2) return [];

  const byCharacter = buildCharacterIndex(taxa);
  const results: SplitResult[] = [];

  for (const [characterId, byTaxon] of byCharacter) {
    // 1) enforce all taxa have this character + normalize
    const normalized = normalizeTraitSetsForCharacter(taxa, byTaxon);
    if (!normalized) continue;

    // 2) dead-tag logic: build disjoint groups + notTaxa
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

    // 4) turn groups + notTaxa into branches, track inverted usage
    const { branches, hasInvertedBranch } = createBranches(
      characterId,
      groupsResult.groupId,
      groups,
      notTaxa
    );

    // 5) score based on keyShape + inverted penalty
    const score = scoreSplit(branches, hasInvertedBranch, options);
    if (score > 0) {
      results.push({ branches, score });
    }
  }

  results.sort((a, b) => b.score - a.score);
  return results;
}
