import {
  KeyBranch,
  KeyBranchRationale,
  KeyCharRationale,
  KeyDiffNode,
  KeyNode,
  KeyPAGroupRationale,
  KeyTaxonNode,
} from "../key-building/types";
import {
  HydratedBranchRationale,
  HydratedKeyBranch,
  HydratedKeyGraphDTO,
  HydratedKeyNode,
} from "./types";

function dehydrateBranchRationale(
  rationale: HydratedBranchRationale
): KeyBranchRationale {
  if (!rationale) return null;

  switch (rationale.kind) {
    case "character-definition": {
      const characters: KeyCharRationale["characters"] = {};

      for (const [charIdStr, info] of Object.entries(rationale.characters)) {
        const charId = Number(charIdStr);
        characters[charId] = {
          traits: info.traits.map((t) => t.id),
          inverted: info.inverted,
        };
      }

      return {
        kind: "character-definition",
        characters,
        annotation: rationale.annotation,
      };
    }

    case "group-present-absent": {
      const groups: KeyPAGroupRationale["groups"] = {};

      for (const [groupIdStr, info] of Object.entries(rationale.groups)) {
        const groupId = Number(groupIdStr);
        groups[groupId] = {
          groupId,
          status: info.status,
        };
      }

      return {
        kind: "group-present-absent",
        groups,
        annotation: rationale.annotation,
      };
    }

    default:
      return null;
  }
}

export function dehydrateKeyGraph(dto: HydratedKeyGraphDTO): KeyTaxonNode {
  const nodesById = new Map<string, HydratedKeyNode>(
    dto.nodes.map((n) => [n.id, n])
  );

  const branchesBySource = new Map<string, HydratedKeyBranch[]>();
  for (const br of dto.branches) {
    const arr = branchesBySource.get(br.sourceId) ?? [];
    arr.push(br);
    branchesBySource.set(br.sourceId, arr);
  }

  function buildNode(id: string): KeyNode {
    const node = nodesById.get(id);
    if (!node) {
      throw new Error(`Missing hydrated node with id ${id} in graph`);
    }

    const outgoing = branchesBySource.get(id) ?? [];

    const branches: KeyBranch[] = outgoing.map((br) => ({
      id: br.id,
      rationale: dehydrateBranchRationale(br.rationale),
      child: buildNode(br.targetId),
    }));

    if (node.kind === "taxon") {
      const taxonNode: KeyTaxonNode = {
        kind: "taxon",
        id: node.id,
        branches,
      };
      return taxonNode;
    }

    const diffNode: KeyDiffNode = {
      kind: "diff",
      id: node.id,
      branches,
    };
    return diffNode;
  }

  const root = buildNode(dto.rootNodeId);
  if (root.kind !== "taxon") {
    throw new Error("Root of key must be a taxon node");
  }

  return root;
}
