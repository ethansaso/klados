import {
  applyEdgeChanges,
  applyNodeChanges,
  type EdgeChange,
  type NodeChange,
} from "@xyflow/react";
import { create } from "zustand";
import { RFEdge, RFNode } from "../-react-flow/components/types";
import type { KeyTaxonNode } from "../../../../../keygen/key-building/types";
import { buildReactFlowFromKeyTree } from "./buildReactFlow";

type KeyEditorState = {
  rootNode: KeyTaxonNode | null;
  nodes: RFNode[];
  edges: RFEdge[];
  dirty: boolean;

  loadKey: (root: KeyTaxonNode) => void;
  applyTreeUpdate: (updater: (root: KeyTaxonNode) => KeyTaxonNode) => void;

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
