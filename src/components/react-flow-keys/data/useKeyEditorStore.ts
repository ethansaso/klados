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
  // tree-level state
  rootNode: FrontendTaxonNode | null;

  // metadata state
  keyId: number | null;
  name: string;
  description: string;

  // react-flow state
  nodes: RFNode[];
  edges: RFEdge[];
  dirty: boolean;

  /**
   * Partially update key metadata.
   */
  updateMeta: (patch: { name?: string; description?: string }) => void;

  /**
   * Load an existing, saved key (from getKeyFn).
   * Sets metadata, rebuilds RF graph from scratch, and marks dirty = false.
   */
  loadSavedKey: (payload: {
    id: number;
    name: string;
    description: string;
    rootNode: FrontendTaxonNode;
  }) => void;

  /**
   * Initialize a brand-new key from a generated tree (from generateKeyFn).
   * Resets keyId, rebuilds RF graph from scratch, and marks dirty = true.
   */
  initFromGeneratedKey: (payload: { rootNode: FrontendTaxonNode }) => void;

  /**
   * Applies a tree-level update to the hydrated tree, rebuilds RF graph, and marks dirty = true.
   */
  applyTreeUpdate: (
    updater: (root: FrontendTaxonNode) => FrontendTaxonNode
  ) => void;

  /**
   * Marks the current state as saved (dirty = false).
   */
  markSaved: (id?: number) => void;

  /**
   * Fully resets the store to initial state.
   */
  reset: () => void;

  // RF change handlers
  onNodesChange: (changes: NodeChange<RFNode>[]) => void;
  onEdgesChange: (changes: EdgeChange<RFEdge>[]) => void;
};

export const useKeyEditorStore = create<KeyEditorState>((set, get) => ({
  // initial state
  rootNode: null,

  keyId: null,
  name: "",
  description: "",

  nodes: [],
  edges: [],
  dirty: false,

  updateMeta: (patch) =>
    set((state) => ({
      ...state,
      ...patch,
      dirty: true,
    })),

  loadSavedKey: ({ id, name, description, rootNode }) => {
    const { nodes, edges } = buildReactFlowFromKeyTree(rootNode, [], []);

    set({
      keyId: id,
      name,
      description,
      rootNode,
      nodes,
      edges,
      dirty: false,
    });
  },

  initFromGeneratedKey: ({ rootNode }) => {
    // New document from generator: reset meta & layout
    const { nodes, edges } = buildReactFlowFromKeyTree(rootNode, [], []);

    set({
      keyId: null,
      name: "",
      description: "",
      rootNode,
      nodes,
      edges,
      dirty: true,
    });
  },

  applyTreeUpdate: (updater) => {
    const { rootNode, nodes: prevNodes, edges: prevEdges } = get();
    if (!rootNode) return;

    const newRoot = updater(rootNode);

    // Same document: reuse layout where possible
    const { nodes, edges } = buildReactFlowFromKeyTree(
      newRoot,
      prevNodes,
      prevEdges
    );

    set({
      rootNode: newRoot,
      nodes,
      edges,
      dirty: true,
    });
  },

  markSaved: (id) =>
    set((state) => ({
      keyId: id ?? state.keyId,
      dirty: false,
    })),

  reset: () =>
    set({
      rootNode: null,
      keyId: null,
      name: "",
      description: "",
      nodes: [],
      edges: [],
      dirty: false,
    }),

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
