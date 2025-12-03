import { RFBranchEdge, RFEdge, RFNode } from "../-react-flow/components/types";
import {
  KeyBranch,
  KeyBranchRationale,
  KeyNode,
  KeyTaxonNode,
} from "../../../../../keygen/key-building/types";
import { branchToEdgeId, keyNodeToRfId } from "./ids";

type BuildContext = {
  nodes: RFNode[];
  edges: RFEdge[];
  prevNodesById: Map<string, RFNode>;
};

function indexNodes(nodes: RFNode[]): Map<string, RFNode> {
  const map = new Map<string, RFNode>();
  for (const n of nodes) map.set(n.id, n);
  return map;
}

export function buildReactFlowFromKeyTree(
  root: KeyTaxonNode,
  prevNodes: RFNode[] = [],
  prevEdges: RFBranchEdge[] = []
): { nodes: RFNode[]; edges: RFEdge[] } {
  const ctx: BuildContext = {
    nodes: [],
    edges: [],
    prevNodesById: indexNodes(prevNodes),
  };

  function visit(node: KeyNode, parentRfId?: string, viaBranch?: KeyBranch) {
    const rfId = keyNodeToRfId(node);

    const prev = ctx.prevNodesById.get(rfId);
    const position = prev?.position ?? { x: 0, y: 0 };

    ctx.nodes.push({
      id: rfId,
      type: node.kind === "taxon" ? "taxonNode" : "diffNode",
      position,
      data: {
        keyNode: node,
      },
    });

    if (parentRfId && viaBranch) {
      const edge: RFEdge = {
        id: branchToEdgeId(viaBranch.id),
        type: "branchEdge",
        source: parentRfId,
        target: rfId,
        data: {
          branchId: viaBranch.id,
          rationale: viaBranch.rationale as KeyBranchRationale | null,
        },
      };

      ctx.edges.push(edge);
    }

    for (const branch of node.branches) {
      visit(branch.child, rfId, branch);
    }
  }

  visit(root);

  return { nodes: ctx.nodes, edges: ctx.edges };
}
