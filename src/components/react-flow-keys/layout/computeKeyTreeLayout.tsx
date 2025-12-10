import dagre from "@dagrejs/dagre";
import { RFDiffNode, RFEdge, RFNode } from "../data/types";

// Approximate visual sizes
const NODE_WIDTH = 192;
const NODE_HEIGHT = 246;

// Diff nodes are smaller circles
const DIFF_NODE_WIDTH = 32; // 2rem
const DIFF_NODE_HEIGHT = 32;

// Layout spacing
const H_SPACING = 400; // horizontal spacing between columns
const V_SPACING = 64; // vertical spacing between nodes in same column

// These define the "virtual" node size Dagre sees.
// Columns are based on these, not on the actual rendered node size.
const DAGRE_NODE_WIDTH = NODE_WIDTH;
const DAGRE_NODE_HEIGHT = NODE_HEIGHT;

function isDiffNode(node: RFNode): node is RFDiffNode {
  return node.type === "diffNode";
}

function getActualNodeSize(node: RFNode): { width: number; height: number } {
  if (isDiffNode(node)) {
    return { width: DIFF_NODE_WIDTH, height: DIFF_NODE_HEIGHT };
  }
  // Taxon or generic node
  return { width: NODE_WIDTH, height: NODE_HEIGHT };
}

/**
 * Compute positions for all RF nodes using Dagre.
 *
 * - The graph is laid out left to right (rankdir = "LR") in columns.
 * - For layout, all nodes are treated as if they had the same size
 *   (DAGRE_NODE_WIDTH x DAGRE_NODE_HEIGHT) so columns line up nicely.
 * - When converting Dagre's center positions to React Flow's top left
 *   positions, we subtract half of the actual node size so that:
 *     - taxon nodes fill the column width
 *     - diff nodes are centered within the column.
 */
export function computeKeyTreeLayout(
  nodes: RFNode[],
  edges: RFEdge[]
): Map<string, { x: number; y: number }> {
  const positions = new Map<string, { x: number; y: number }>();
  if (!nodes.length) return positions;

  const dagreGraph = new dagre.graphlib.Graph({ directed: true });
  dagreGraph.setDefaultEdgeLabel(() => ({}));

  // Left to right tree with spacing for edge labels
  dagreGraph.setGraph({
    rankdir: "LR",
    ranksep: H_SPACING,
    nodesep: V_SPACING,
  });

  // Register nodes with Dagre, treating them all as the same size
  for (const node of nodes) {
    dagreGraph.setNode(node.id, {
      width: DAGRE_NODE_WIDTH,
      height: DAGRE_NODE_HEIGHT,
    });
  }

  // Register edges
  for (const e of edges) {
    if (!dagreGraph.node(e.source) || !dagreGraph.node(e.target)) continue;
    dagreGraph.setEdge(e.source, e.target);
  }

  // Let Dagre compute the layout (positions are center center)
  dagre.layout(dagreGraph);

  // Convert Dagre's center positions to RF's top left coordinates
  for (const node of nodes) {
    const dagreNode = dagreGraph.node(node.id);
    if (!dagreNode) continue;

    const { width: actualWidth, height: actualHeight } =
      getActualNodeSize(node);

    const x = dagreNode.x - actualWidth / 2;
    const y = dagreNode.y - actualHeight / 2;

    positions.set(node.id, { x, y });
  }

  return positions;
}

export function layoutKeyTree(nodes: RFNode[], edges: RFEdge[]): RFNode[] {
  const positions = computeKeyTreeLayout(nodes, edges);

  const laidOutNodes = nodes.map((n) => {
    const pos = positions.get(n.id);
    if (!pos) return n;
    return {
      ...n,
      position: pos,
    };
  });

  return laidOutNodes;
}
