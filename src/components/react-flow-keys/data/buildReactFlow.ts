import {
  FrontendKeyBranch,
  FrontendKeyNode,
  FrontendTaxonNode,
} from "../../../keygen/hydration/types";
import {
  RFCharacterBranchEdge,
  RFDiffNode,
  RFEdge,
  RFGroupBranchEdge,
  RFNode,
  RFNullBranchEdge,
  RFTaxonNode,
} from "../components/types";
import { branchToEdgeId, keyNodeToRfId } from "./ids";

type BuildContext = {
  nodes: RFNode[];
  edges: RFEdge[];
  prevNodesById: Map<string, RFNode>;
};

const POS_MIN = 0;
const POS_MAX = 750;

function randomPosition(): { x: number; y: number } {
  const span = POS_MAX - POS_MIN;
  return {
    x: POS_MIN + Math.random() * span,
    y: POS_MIN + Math.random() * span,
  };
}

function indexNodes(nodes: RFNode[]): Map<string, RFNode> {
  const map = new Map<string, RFNode>();
  for (const n of nodes) map.set(n.id, n);
  return map;
}

function buildEdge(
  parentRfId: string,
  childRfId: string,
  viaBranch: FrontendKeyBranch
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
  node: FrontendKeyNode,
  position: { x: number; y: number }
): RFNode {
  const rfId = keyNodeToRfId(node);

  if (node.kind === "taxon") {
    const rfNode: RFTaxonNode = {
      id: rfId,
      type: "taxonNode",
      position,
      data: { keyNode: node },
    };
    return rfNode;
  }

  const rfNode: RFDiffNode = {
    id: rfId,
    type: "diffNode",
    position,
    data: { keyNode: node },
  };
  return rfNode;
}

export function buildReactFlowFromKeyTree(
  root: FrontendTaxonNode,
  prevNodes: RFNode[] = [],
  prevEdges: RFEdge[] = []
): { nodes: RFNode[]; edges: RFEdge[] } {
  const ctx: BuildContext = {
    nodes: [],
    edges: [],
    prevNodesById: indexNodes(prevNodes),
  };

  function visit(
    node: FrontendKeyNode,
    parentRfId?: string,
    viaBranch?: FrontendKeyBranch
  ) {
    const rfId = keyNodeToRfId(node);
    const prev = ctx.prevNodesById.get(rfId);
    const position = prev?.position ?? randomPosition();

    // Build + append node
    ctx.nodes.push(buildNode(node, position));

    // Build + append edge
    if (parentRfId && viaBranch) {
      ctx.edges.push(buildEdge(parentRfId, rfId, viaBranch));
    }

    // Recurse branches
    for (const branch of node.branches) {
      visit(branch.child, rfId, branch);
    }
  }

  visit(root);

  return { nodes: ctx.nodes, edges: ctx.edges };
}
