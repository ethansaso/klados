import { getCharacterGroupsByIds } from "../../lib/domain/character-groups/service";
import { Trait } from "../../lib/domain/character-states/types";
import { getCharactersByIds } from "../../lib/domain/characters/service";
import { getTaxaByIds } from "../../lib/domain/taxa/service";
import { MediaItem } from "../../lib/domain/taxa/validation";
import { getTraitValuesByIds } from "../../lib/domain/traits/service";
import {
  KeyBranch,
  KeyBranchRationale,
  KeyNode,
  KeyTaxonNode,
} from "../key-building/types";
import {
  HydratedBranchRationale,
  HydratedCharRationale,
  HydratedKeyBranch,
  HydratedKeyGraphDTO,
  HydratedKeyNode,
  HydratedPAGroupRationale,
  HydratedTaxonNode,
} from "./types";

type IdCollections = {
  taxonIds: Set<number>;
  characterIds: Set<number>;
  traitIds: Set<number>;
  groupIds: Set<number>;
};

type TaxonMeta = {
  id: number;
  sciName: string;
  commonName?: string;
  primaryMedia?: MediaItem;
};

type HydrationMeta = {
  taxonById: Map<number, TaxonMeta>;
  characterById: Map<
    number,
    {
      id: number;
      label: string;
      groupId: number;
    }
  >;
  traitById: Map<number, Trait>;
  groupById: Map<
    number,
    {
      id: number;
      label: string;
    }
  >;
};

type RawBranchRef = {
  branch: KeyBranch;
  sourceId: string;
  targetId: string;
};

function collectIdsFromTree(root: KeyTaxonNode): IdCollections {
  const ids: IdCollections = {
    taxonIds: new Set(),
    characterIds: new Set(),
    traitIds: new Set(),
    groupIds: new Set(),
  };

  function visit(node: KeyNode) {
    if (node.kind === "taxon") {
      // node.id is string; DB ids are numeric
      const taxonId = Number(node.id);
      if (!Number.isNaN(taxonId)) {
        ids.taxonIds.add(taxonId);
      }
    }

    for (const branch of node.branches) {
      const rationale = branch.rationale as KeyBranchRationale | null;

      if (rationale?.kind === "character-definition") {
        for (const [charIdStr, info] of Object.entries(rationale.characters)) {
          const charId = Number(charIdStr);
          if (!Number.isNaN(charId)) {
            ids.characterIds.add(charId);
          }
          info.traits.forEach((traitId) => ids.traitIds.add(traitId));
        }
      } else if (rationale?.kind === "group-present-absent") {
        Object.values(rationale.groups).forEach((g) => {
          ids.groupIds.add(g.groupId);
        });
      }

      visit(branch.child);
    }
  }

  visit(root);
  return ids;
}

async function loadHydrationMeta(ids: IdCollections): Promise<HydrationMeta> {
  const [taxa, characters, traits, groups] = await Promise.all([
    getTaxaByIds([...ids.taxonIds]),
    getCharactersByIds([...ids.characterIds]),
    getTraitValuesByIds([...ids.traitIds]),
    getCharacterGroupsByIds([...ids.groupIds]),
  ]);

  const taxonById = new Map<number, TaxonMeta>();
  for (const t of taxa) {
    taxonById.set(t.id, {
      id: t.id,
      sciName: t.acceptedName,
      commonName: t.preferredCommonName ?? undefined,
      primaryMedia: t.media.length > 0 ? t.media[0] : undefined,
    });
  }

  const characterById = new Map<
    number,
    { id: number; label: string; groupId: number }
  >();
  for (const c of characters) {
    characterById.set(c.id, {
      id: c.id,
      label: c.label,
      groupId: c.group.id,
    });
  }

  const traitById = new Map<number, Trait>();
  for (const tr of traits) {
    traitById.set(tr.id, {
      id: tr.id,
      label: tr.label,
      canonicalId: tr.aliasTarget?.id ?? tr.id,
      hexCode: tr.hexCode ?? undefined,
    });
  }

  const groupById = new Map<number, { id: number; label: string }>();
  for (const g of groups) {
    groupById.set(g.id, { id: g.id, label: g.label });
  }

  return { taxonById, characterById, traitById, groupById };
}

function hydrateBranchRationale(
  raw: KeyBranchRationale | null,
  meta: HydrationMeta
): HydratedBranchRationale {
  if (!raw) return null;

  if (raw.kind === "character-definition") {
    const characters: HydratedCharRationale["characters"] = {};

    for (const [charIdStr, info] of Object.entries(raw.characters)) {
      const charId = Number(charIdStr);
      const charMeta = meta.characterById.get(charId);
      if (!charMeta) continue;

      const traits = info.traits
        .map((traitId) => meta.traitById.get(traitId))
        .filter((t): t is Trait => !!t);

      characters[charId] = {
        name: charMeta.label,
        traits,
        inverted: info.inverted,
      };
    }

    return {
      kind: "character-definition",
      characters,
      annotation: raw.annotation,
    };
  }

  if (raw.kind === "group-present-absent") {
    const groups: HydratedPAGroupRationale["groups"] = {};

    for (const [groupIdStr, gInfo] of Object.entries(raw.groups)) {
      const groupId = Number(groupIdStr);
      const metaGroup = meta.groupById.get(groupId);
      groups[groupId] = {
        groupId,
        name: metaGroup?.label ?? `Group ${groupId}`,
        status: gInfo.status,
      };
    }

    return {
      kind: "group-present-absent",
      groups,
      annotation: raw.annotation,
    };
  }

  return null;
}

function hydrateNode(node: KeyNode, meta: HydrationMeta): HydratedKeyNode {
  if (node.kind === "taxon") {
    const numericId = Number(node.id);
    const tMeta = meta.taxonById.get(numericId);

    const sciName = tMeta?.sciName ?? `Taxon ${node.id}`;
    const commonName = tMeta?.commonName;
    const primaryMedia = tMeta?.primaryMedia;

    const hydrated: HydratedTaxonNode = {
      kind: "taxon",
      id: node.id, // stays string
      sciName,
      commonName,
      primaryMedia,
    };

    return hydrated;
  }

  const diff: HydratedKeyNode = {
    kind: "diff",
    id: node.id,
  };

  return diff;
}

export async function hydrateKeyFromRoot(
  root: KeyTaxonNode
): Promise<HydratedKeyGraphDTO> {
  const ids = collectIdsFromTree(root);
  const meta = await loadHydrationMeta(ids);

  const nodesById = new Map<string, HydratedKeyNode>();
  const rawBranches: RawBranchRef[] = [];

  function visit(node: KeyNode) {
    // node
    if (!nodesById.has(node.id)) {
      nodesById.set(node.id, hydrateNode(node, meta));
    }

    // outgoing branches
    for (const branch of node.branches) {
      rawBranches.push({
        branch,
        sourceId: node.id,
        targetId: branch.child.id,
      });
      visit(branch.child);
    }
  }

  visit(root);

  const branches: HydratedKeyBranch[] = rawBranches.map(
    ({ branch, sourceId, targetId }) => ({
      id: branch.id,
      sourceId,
      targetId,
      rationale: hydrateBranchRationale(branch.rationale, meta),
    })
  );

  return {
    rootNodeId: root.id,
    nodes: Array.from(nodesById.values()),
    branches,
  };
}
