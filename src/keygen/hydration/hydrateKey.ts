import { getCharactersByIds } from "../../lib/domain/characters/service";
import { getFeaturesByIds } from "../../lib/domain/features/service";
import type { Trait } from "../../lib/domain/states/types";
import { getTaxaByIds } from "../../lib/domain/taxa/service";
import type { MediaItem } from "../../lib/domain/taxa/validation";
import { getTraitValuesByIds } from "../../lib/domain/traits/service";
import type {
  KeyBranch,
  KeyBranchRationale,
  KeyNode,
  KeyTaxonNode,
} from "../key-building/types";
import type {
  HydratedBranchRationale,
  HydratedCharRationale,
  HydratedKeyBranch,
  HydratedKeyGraphDTO,
  HydratedKeyNode,
  HydratedPAFeatureRationale,
  HydratedTaxonNode,
} from "./types";

type IdCollections = {
  taxonIds: Set<number>;
  characterIds: Set<number>;
  traitIds: Set<number>;
  featureIds: Set<number>;
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
      featureIds: number[];
    }
  >;
  traitById: Map<number, Omit<Trait, "modifiers">>;
  featureById: Map<
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
    featureIds: new Set(),
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
      } else if (rationale?.kind === "feature-present-absent") {
        Object.values(rationale.features).forEach((f) => {
          ids.featureIds.add(f.featureId);
        });
      }

      visit(branch.child);
    }
  }

  visit(root);
  return ids;
}

async function loadHydrationMeta(ids: IdCollections): Promise<HydrationMeta> {
  const [taxa, characters, traits, features] = await Promise.all([
    getTaxaByIds([...ids.taxonIds]),
    getCharactersByIds([...ids.characterIds]),
    getTraitValuesByIds([...ids.traitIds]),
    getFeaturesByIds([...ids.featureIds]),
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
    { id: number; label: string; featureIds: number[] }
  >();
  for (const c of characters) {
    characterById.set(c.id, {
      id: c.id,
      label: c.label,
      featureIds: c.features.map((f) => f.id),
    });
  }

  const traitById = new Map<number, Omit<Trait, "modifiers">>();
  for (const tr of traits) {
    traitById.set(tr.id, {
      id: tr.id,
      label: tr.label,
      description: tr.aliasOf?.description ?? tr.description,
      canonicalId: tr.aliasOf?.id ?? tr.id,
      hexCode: tr.aliasOf?.hexCode ?? tr.hexCode ?? undefined,
    });
  }

  const featureById = new Map<number, { id: number; label: string }>();
  for (const f of features) {
    featureById.set(f.id, { id: f.id, label: f.label });
  }

  return { taxonById, characterById, traitById, featureById };
}

function hydrateBranchRationale(
  raw: KeyBranchRationale | null,
  meta: HydrationMeta,
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
        .filter((t): t is Omit<Trait, "modifiers"> => !!t);

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

  if (raw.kind === "feature-present-absent") {
    const features: HydratedPAFeatureRationale["features"] = {};

    for (const [featureIdStr, fInfo] of Object.entries(raw.features)) {
      const featureId = Number(featureIdStr);
      const metaFeature = meta.featureById.get(featureId);
      features[featureId] = {
        featureId,
        name: metaFeature?.label ?? `Feature ${featureId}`,
        status: fInfo.status,
      };
    }

    return {
      kind: "feature-present-absent",
      features,
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
  root: KeyTaxonNode,
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
    }),
  );

  return {
    rootNodeId: root.id,
    nodes: Array.from(nodesById.values()),
    branches,
  };
}
