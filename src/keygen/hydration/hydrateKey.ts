import { getCharacterGroupsByIds } from "../../lib/domain/character-groups/service";
import { Trait } from "../../lib/domain/character-states/types";
import { getCharactersByIds } from "../../lib/domain/characters/service";
import { getTaxaByIds } from "../../lib/domain/taxa/service";
import { getTraitValuesByIds } from "../../lib/domain/traits/service";
import {
  KeyBranch,
  KeyBranchRationale,
  KeyNode,
  KeyTaxonNode,
} from "../key-building/types";
import {
  FrontendBranchRationale,
  FrontendCharRationale,
  FrontendKeyBranch,
  FrontendKeyNode,
  FrontendPAGroupRationale,
  FrontendTaxonNode,
} from "./types";

type IdCollections = {
  taxonIds: Set<number>;
  characterIds: Set<number>;
  traitIds: Set<number>;
  groupIds: Set<number>;
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
      ids.taxonIds.add(node.id);
    }

    for (const branch of node.branches) {
      const rationale = branch.rationale as KeyBranchRationale | null;

      if (rationale?.kind === "character-definition") {
        for (const [charIdStr, info] of Object.entries(rationale.characters)) {
          const charId = Number(charIdStr);
          ids.characterIds.add(charId);
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

type HydrationMeta = {
  taxonById: Map<
    number,
    {
      id: number;
      sciName: string;
      commonName?: string;
      imgUrl?: string;
    }
  >;
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

async function loadHydrationMeta(ids: IdCollections): Promise<HydrationMeta> {
  const [taxa, characters, traits, groups] = await Promise.all([
    getTaxaByIds([...ids.taxonIds]),
    getCharactersByIds([...ids.characterIds]),
    getTraitValuesByIds([...ids.traitIds]),
    getCharacterGroupsByIds([...ids.groupIds]),
  ]);

  const taxonById = new Map<
    number,
    { id: number; sciName: string; commonName?: string; imgUrl?: string }
  >();
  for (const t of taxa) {
    taxonById.set(t.id, {
      id: t.id,
      sciName: t.acceptedName,
      commonName: t.preferredCommonName ?? undefined,
      imgUrl: t.media[0]?.url ?? undefined,
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
    traitById.set(tr.id, { ...tr, hexCode: tr.hexCode ?? undefined });
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
): FrontendBranchRationale {
  if (!raw) return null;

  if (raw.kind === "character-definition") {
    const characters: FrontendCharRationale["characters"] = {};

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
    };
  }

  if (raw.kind === "group-present-absent") {
    const groups: FrontendPAGroupRationale["groups"] = {};

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
    };
  }

  return null;
}

function hydrateBranch(
  branch: KeyBranch,
  meta: HydrationMeta
): FrontendKeyBranch {
  const rationale = hydrateBranchRationale(branch.rationale, meta);
  const child = hydrateNode(branch.child, meta);

  return {
    id: branch.id,
    rationale,
    child,
  };
}

function hydrateNode(node: KeyNode, meta: HydrationMeta): FrontendKeyNode {
  if (node.kind === "taxon") {
    const tMeta = meta.taxonById.get(node.id);
    const sciName = tMeta?.sciName ?? `Taxon ${node.id}`;
    const commonName = tMeta?.commonName;
    const imgUrl = tMeta?.imgUrl;

    const branches = node.branches.map((b) => hydrateBranch(b, meta));

    const frontendNode: FrontendTaxonNode = {
      kind: "taxon",
      id: node.id,
      sciName,
      commonName,
      imgUrl,
      branches,
    };

    return frontendNode;
  }

  // diff node
  return {
    kind: "diff",
    id: node.id,
    branches: node.branches.map((b) => hydrateBranch(b, meta)),
  };
}

export async function hydrateKeyFromRoot(
  root: KeyTaxonNode
): Promise<FrontendTaxonNode> {
  const ids = collectIdsFromTree(root);
  const meta = await loadHydrationMeta(ids);
  const hydrated = hydrateNode(root, meta);

  if (hydrated.kind !== "taxon") {
    throw new Error("Root of key must be a taxon node");
  }

  return hydrated;
}
