import type {
  HydratedKeyBranch,
  HydratedKeyGraphDTO,
  HydratedKeyNode,
} from "../../../keygen/hydration/types";
import type { RFEdge, RFNode } from "../editor/data/types";

/**
 * Convert React Flow editor state back to HydratedKeyGraphDTO for persistence.
 * This is the inverse of buildReactFlowFromGraph.
 */
export function buildGraphFromReactFlow(
  nodes: RFNode[],
  edges: RFEdge[],
  rootNodeId: string,
): HydratedKeyGraphDTO {
  // Extract hydrated nodes from RF node data
  const hydratedNodes: HydratedKeyNode[] = nodes.map((rfNode) => rfNode.data);

  // Create a map from RF node ID to actual data node ID
  const rfIdToDataId = new Map<string, string>(
    nodes.map((rfNode) => [rfNode.id, rfNode.data.id]),
  );

  // Extract hydrated branches from RF edge data
  const hydratedBranches: HydratedKeyBranch[] = edges.map((rfEdge) => {
    const sourceDataId = rfIdToDataId.get(rfEdge.source);
    const targetDataId = rfIdToDataId.get(rfEdge.target);

    if (!sourceDataId || !targetDataId) {
      throw new Error(
        `Missing node data for edge ${rfEdge.id}: source=${rfEdge.source}, target=${rfEdge.target}`,
      );
    }

    return {
      id: rfEdge.data.branchId,
      sourceId: sourceDataId,
      targetId: targetDataId,
      rationale: rfEdge.data.rationale,
    };
  });

  // The rootNodeId in RF uses the prefix format (e.g., "taxon:123" or "diff:456")
  // We need to extract the actual node ID without the prefix
  const rootRfNode = nodes.find((n) => n.id === rootNodeId);
  if (!rootRfNode) {
    throw new Error(`Root node ${rootNodeId} not found in RF nodes`);
  }

  return {
    rootNodeId: rootRfNode.data.id,
    nodes: hydratedNodes,
    branches: hydratedBranches,
  };
}
