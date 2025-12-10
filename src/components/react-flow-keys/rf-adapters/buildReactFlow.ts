import {
  HydratedKeyBranch,
  HydratedKeyGraphDTO,
  HydratedKeyNode,
} from "../../../keygen/hydration/types";
import {
  RFCharacterBranchEdge,
  RFDiffNode,
  RFEdge,
  RFGroupBranchEdge,
  RFNode,
  RFNullBranchEdge,
  RFTaxonNode,
} from "../data/types";
import { branchToEdgeId, keyNodeToRfId } from "./ids";

function buildEdge(
  parentRfId: string,
  childRfId: string,
  viaBranch: HydratedKeyBranch
): RFEdge {
  const rationale = viaBranch.rationale;

  if (!rationale) {
    const e: RFNullBranchEdge = {
      id: branchToEdgeId(viaBranch.id),
      type: "nullBranchEdge",
      source: parentRfId,
      target: childRfId,
      data: {
        branchId: viaBranch.id,
        rationale: null,
      },
    };
    return e;
  }

  switch (rationale.kind) {
    case "character-definition": {
      const e: RFCharacterBranchEdge = {
        id: branchToEdgeId(viaBranch.id),
        type: "characterBranchEdge",
        source: parentRfId,
        target: childRfId,
        data: {
          branchId: viaBranch.id,
          rationale,
        },
      };
      return e;
    }

    case "group-present-absent": {
      const e: RFGroupBranchEdge = {
        id: branchToEdgeId(viaBranch.id),
        type: "groupBranchEdge",
        source: parentRfId,
        target: childRfId,
        data: {
          branchId: viaBranch.id,
          rationale,
        },
      };
      return e;
    }

    default:
      throw new Error(`Unhandled rationale kind.`);
  }
}

function buildNode(
  node: HydratedKeyNode,
  position: { x: number; y: number }
): RFNode {
  const rfId = keyNodeToRfId(node);

  if (node.kind === "taxon") {
    const rfNode: RFTaxonNode = {
      id: rfId,
      type: "taxonNode",
      position,
      data: node,
    };
    return rfNode;
  }

  const rfNode: RFDiffNode = {
    id: rfId,
    type: "diffNode",
    position,
    data: node,
  };
  return rfNode;
}

/**
 * Build a complete set of RF nodes/edges from the hydrated key graph.
 * Returns without layout; layout should be applied afterwards.
 */
export function buildReactFlowFromGraph(graph: HydratedKeyGraphDTO): {
  nodes: RFNode[];
  edges: RFEdge[];
  rootRfId: string;
} {
  const nodeById = new Map<string, HydratedKeyNode>(
    graph.nodes.map((n) => [n.id, n])
  );

  const rootDomainNode = nodeById.get(graph.rootNodeId);
  if (!rootDomainNode) {
    throw new Error(`Root node ${graph.rootNodeId} not found in graph.nodes`);
  }
  const rootRfId = keyNodeToRfId(rootDomainNode);

  const nodes: RFNode[] = graph.nodes.map((node) => {
    return buildNode(node, { x: 0, y: 0 });
  });

  const edges: RFEdge[] = graph.branches.flatMap((br) => {
    const parent = nodeById.get(br.sourceId);
    const child = nodeById.get(br.targetId);
    if (!parent || !child) return [];

    const parentRfId = keyNodeToRfId(parent);
    const childRfId = keyNodeToRfId(child);

    return [buildEdge(parentRfId, childRfId, br)];
  });

  return { nodes, edges, rootRfId };
}
