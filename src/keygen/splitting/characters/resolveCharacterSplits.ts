import type {
  CategoricalStateDTO,
  Trait,
} from "../../../lib/domain/states/types";
import type { HierarchyTaxonNode } from "../../hierarchy/types";
import type { KeyGenOptions } from "../../options";
import type {
  CharacterDefinitionSplitBranch,
  CharacterDefinitionSplitResult,
} from "../types";
import { scoreCharacterSplit } from "./scoreCharacterSplit";

type CharEntry = {
  taxon: HierarchyTaxonNode;
  states: CategoricalStateDTO[];
  featureId: number;
};

type ByCharacter = Map<string, Map<number, CharEntry>>;

type SharedTraitGroup = {
  traits: Trait[];
  taxa: HierarchyTaxonNode[];
};

/** Post-normalization index of trait sets by taxon, with feature annotation */
type NormalizedCharacterTraitSets = {
  traitSetsByTaxon: Map<number, Trait[]>;
  featureId: number;
};

type GroupsResult = {
  groups: SharedTraitGroup[];
  notTaxa: Set<HierarchyTaxonNode>;
  featureId: number;
};

/**
 * Build index: characterId -> (taxonId -> {taxon, states})
 */
function buildCharacterIndex(taxa: HierarchyTaxonNode[]): ByCharacter {
  const byCharacter = new Map<string, Map<number, CharEntry>>();

  for (const taxon of taxa) {
    for (const group of taxon.states) {
      for (const state of group.states) {
        if (state.kind !== "categorical") continue;

        // Key by (featureId, characterId) so that the same character scoped
        // under different features (e.g. Cap > Color vs. Gill > Color) is
        // treated as a distinct split candidate rather than overwriting.
        const key = `${group.featureId}:${state.characterId}`;
        let byTaxon = byCharacter.get(key);
        if (!byTaxon) {
          byTaxon = new Map<number, CharEntry>();
          byCharacter.set(key, byTaxon);
        }

        const existing = byTaxon.get(taxon.id);
        if (existing) {
          existing.states.push(state);
        } else {
          byTaxon.set(taxon.id, {
            taxon,
            states: [state],
            featureId: group.featureId,
          });
        }
      }
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
  byTaxon: Map<number, CharEntry>,
): NormalizedCharacterTraitSets | null {
  const traitSetsByTaxon = new Map<number, Trait[]>();
  let featureId: number | null = null;

  for (const taxon of taxa) {
    const entry = byTaxon.get(taxon.id);
    if (!entry) return null;

    const { states, featureId: entryFeatureId } = entry;
    const traits = states.map((s) => s.trait);
    if (traits.length === 0) return null;

    // Record featureId once for downstream clause construction.
    // Structural invariants guarantee consistency.
    if (featureId === null) {
      featureId = entryFeatureId;
    }

    traitSetsByTaxon.set(taxon.id, traits);
  }

  if (featureId === null) return null;

  return { traitSetsByTaxon, featureId };
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
  normalized: NormalizedCharacterTraitSets,
): GroupsResult | null {
  const { traitSetsByTaxon, featureId } = normalized;

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

    // ! Bucket by synonym set so interchangeable traits count as one.
    const traitIds = new Set<number>(traits.map((t) => t.synonymSetId));

    // If this trait-set uses any dead trait, it is automatically ambiguous.
    let usesDead = false;
    for (const trait of traits) {
      if (deadTraitIds.has(trait.synonymSetId)) {
        usesDead = true;
        break;
      }
    }

    if (usesDead) {
      notTaxa.add(taxon);
      for (const trait of traits) {
        deadTraitIds.add(trait.synonymSetId);
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
      a.synonymSetId === b.synonymSetId
        ? 0
        : a.synonymSetId < b.synonymSetId
          ? -1
          : 1,
    );
    const key = sortedTraits.map((t) => t.synonymSetId).join("|");

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
    console.log(
      `[KEYGEN]   buildGroups null: groups=${groups.length}, notTaxa=[${Array.from(
        notTaxa,
      )
        .map((t) => `${t.id}(${t.acceptedName})`)
        .join(", ")}]`,
      `deadTraits=[${Array.from(deadTraitIds).join(", ")}]`,
    );
    for (const [key, g] of groupMap) {
      console.log(
        `[KEYGEN]   remaining group key=${key}: taxa=[${g.taxa.map((t) => t.id).join(", ")}] traits=[${g.traits.map((t) => `${t.id}/${t.synonymSetId}:${t.label}`).join(", ")}]`,
      );
    }
    // Log each taxon's full trait set for this character
    for (const taxon of [...notTaxa, ...groups.flatMap((g) => g.taxa)]) {
      const traits = traitSetsByTaxon.get(taxon.id) ?? [];
      console.log(
        `[KEYGEN]   taxon ${taxon.id}(${taxon.acceptedName}) traits: [${traits.map((t) => `${t.id}/${t.synonymSetId}:${t.label}`).join(", ")}]`,
      );
    }
    return null;
  }

  return { groups, notTaxa, featureId };
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
  maxBranches: number,
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
  featureId: number,
  groups: SharedTraitGroup[],
  notTaxa: Set<HierarchyTaxonNode>,
): { branches: CharacterDefinitionSplitBranch[]; hasInvertedBranch: boolean } {
  const branches: CharacterDefinitionSplitBranch[] = [];

  for (const g of groups) {
    branches.push({
      taxa: g.taxa,
      clauses: [
        {
          characterId,
          featureId,
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
        if (!traitMap.has(t.synonymSetId)) {
          traitMap.set(t.synonymSetId, t);
        }
      }
    }

    const unionTraits = Array.from(traitMap.values());

    branches.push({
      taxa: Array.from(notTaxa),
      clauses: [
        {
          characterId,
          featureId,
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
  options: KeyGenOptions,
): CharacterDefinitionSplitResult[] {
  const { maxBranches } = options;
  if (taxa.length < 2 || maxBranches < 2) return [];

  const morphDescribedTaxa = taxa.filter((t) => t.states.length > 0);
  const byCharacter = buildCharacterIndex(taxa);
  const results: CharacterDefinitionSplitResult[] = [];

  for (const [_key, byTaxon] of byCharacter) {
    void _key;
    const firstEntry = byTaxon.values().next().value!;
    const characterId = firstEntry.states[0]!.characterId;

    // Only fully undescribed taxa may be left out of a character split.
    // If a taxon has some morphology at this node, it must participate in the
    // character candidate or the candidate is invalid for the sibling set.
    const describedTaxa = morphDescribedTaxa.filter((t) => byTaxon.has(t.id));
    if (
      describedTaxa.length < 2 ||
      describedTaxa.length !== morphDescribedTaxa.length
    ) {
      const missing = morphDescribedTaxa
        .filter((t) => !byTaxon.has(t.id))
        .map((t) => `${t.id}(${t.acceptedName})`);
      const charLabel = firstEntry.states[0]!.characterLabel;
      console.log(
        `[KEYGEN] char ${characterId}(${charLabel}): skipped before normalize — morph-described taxa missing character data: [${missing.join(", ")}]`,
      );
      continue;
    }

    // 1) normalize trait-sets for the described subset
    const normalized = normalizeTraitSetsForCharacter(describedTaxa, byTaxon);
    if (!normalized) {
      const charLabel = firstEntry.states[0]!.characterLabel;
      console.log(
        `[KEYGEN] char ${characterId}(${charLabel}): skipped at normalize (empty traits)`,
      );
      continue;
    }

    // 2) build disjoint groups + notTaxa
    const groupsResult = buildGroupsWithDeadTags(describedTaxa, normalized);
    if (!groupsResult) {
      const charLabel = firstEntry.states[0]!.characterLabel;
      console.log(
        `[KEYGEN] char ${characterId}(${charLabel}): skipped at buildGroups`,
      );
      continue;
    }

    // 3) respect maxBranches (trim into inverted if needed)
    const limited = enforceBranchLimit(
      groupsResult.groups,
      groupsResult.notTaxa,
      maxBranches,
    );
    if (!limited) continue;

    const { groups, notTaxa } = limited;

    // 4) turn groups + notTaxa into branches, note inversion
    const { branches } = createBranches(
      characterId,
      groupsResult.featureId,
      groups,
      notTaxa,
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
