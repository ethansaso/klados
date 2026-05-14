import { getCharactersByIds } from "../../lib/domain/characters/service";
import { getFeaturesByIds } from "../../lib/domain/features/service";
import type { MediaDTO } from "../../lib/domain/media/types";
import type { Trait } from "../../lib/domain/states/types";
import { getTaxaByIds } from "../../lib/domain/taxa/service";
import { getTraitValuesByIds } from "../../lib/domain/traits/service";
import type {
  KeyBranch,
  KeyBranchRationale,
  KeyNode,
  KeyTaxonNode,
} from "../key-building/types";
import type {
  HydratedBranchRationale,
  HydratedKeyBranch,
  HydratedKeyGraphDTO,
  HydratedKeyNode,
  HydratedPresentFeatureEntry,
  HydratedRichRationale,
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
  primaryMedia?: MediaDTO;
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
      description: string;
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

      if (rationale?.kind === "rich") {
        for (const [featureIdStr, fEntry] of Object.entries(
          rationale.features,
        )) {
          const featureId = Number(featureIdStr);
          if (!Number.isNaN(featureId)) {
            ids.featureIds.add(featureId);
          }
          if (fEntry.presence === "present") {
            for (const [charIdStr, charEntry] of Object.entries(
              fEntry.characters,
            )) {
              const charId = Number(charIdStr);
              if (!Number.isNaN(charId)) {
                ids.characterIds.add(charId);
              }
              charEntry.traits.forEach((traitId) => ids.traitIds.add(traitId));
            }
          }
        }
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

  const featureById = new Map<
    number,
    { id: number; label: string; description: string }
  >();
  for (const f of features) {
    featureById.set(f.id, {
      id: f.id,
      label: f.label,
      description: f.description,
    });
  }

  return { taxonById, characterById, traitById, featureById };
}

function hydrateBranchRationale(
  raw: KeyBranchRationale | null,
  meta: HydrationMeta,
): HydratedBranchRationale {
  if (!raw) return null;

  if (raw.kind === "written") {
    return { kind: "written", text: raw.text };
  }

  if (raw.kind === "rich") {
    const features: HydratedRichRationale["features"] = {};

    for (const [featureIdStr, fEntry] of Object.entries(raw.features)) {
      const featureId = Number(featureIdStr);
      const featureMeta = meta.featureById.get(featureId);
      const name = featureMeta?.label ?? `Feature ${featureId}`;

      const description = featureMeta?.description || null;

      if (fEntry.presence === "absent") {
        features[featureId] = { presence: "absent", name, description };
      } else {
        const characters: HydratedPresentFeatureEntry["characters"] = {};

        for (const [charIdStr, charEntry] of Object.entries(
          fEntry.characters,
        )) {
          const charId = Number(charIdStr);
          const charMeta = meta.characterById.get(charId);
          if (!charMeta) continue;

          const traits = charEntry.traits
            .map((traitId) => meta.traitById.get(traitId))
            .filter((t): t is Omit<Trait, "modifiers"> => !!t);

          characters[charId] = {
            name: charMeta.label,
            traits,
            inverted: charEntry.inverted,
          };
        }

        features[featureId] = {
          presence: "present",
          name,
          description,
          characters,
        };
      }
    }

    return {
      kind: "rich",
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
