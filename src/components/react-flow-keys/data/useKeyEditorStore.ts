import {
  applyEdgeChanges,
  applyNodeChanges,
  type EdgeChange,
  type NodeChange,
} from "@xyflow/react";
import { create } from "zustand";
import type { FrontendTaxonNode } from "../../../keygen/hydration/types";
import { RFEdge, RFNode } from "../components/types";
import { buildReactFlowFromKeyTree } from "./buildReactFlow";

type KeyEditorState = {
  rootNode: FrontendTaxonNode | null;
  nodes: RFNode[];
  edges: RFEdge[];
  dirty: boolean;

  // sync from backend (hydrated tree)
  loadKey: (root: FrontendTaxonNode) => void;

  // tree-level updates (operate on hydrated tree)
  applyTreeUpdate: (
    updater: (root: FrontendTaxonNode) => FrontendTaxonNode
  ) => void;

  // RF change handlers
  onNodesChange: (changes: NodeChange<RFNode>[]) => void;
  onEdgesChange: (changes: EdgeChange<RFEdge>[]) => void;
};

export const useKeyEditorStore = create<KeyEditorState>((set, get) => ({
  rootNode: null,
  nodes: [],
  edges: [],
  dirty: false,

  loadKey: (root) => {
    const { nodes: prevNodes, edges: prevEdges } = get();
    const { nodes, edges } = buildReactFlowFromKeyTree(
      root,
      prevNodes,
      prevEdges
    );
    set({ rootNode: root, nodes, edges, dirty: false });
  },

  applyTreeUpdate: (updater) => {
    const { rootNode, nodes: prevNodes, edges: prevEdges } = get();
    if (!rootNode) return;

    const newRoot = updater(rootNode);
    const { nodes, edges } = buildReactFlowFromKeyTree(
      newRoot,
      prevNodes,
      prevEdges
    );

    set({ rootNode: newRoot, nodes, edges, dirty: true });
  },

  onNodesChange: (changes) => {
    set({
      nodes: applyNodeChanges<RFNode>(changes, get().nodes),
    });
  },

  onEdgesChange: (changes) => {
    set({
      edges: applyEdgeChanges<RFEdge>(changes, get().edges),
    });
  },
}));
