import {
  applyEdgeChanges,
  applyNodeChanges,
  type EdgeChange,
  type NodeChange,
} from "@xyflow/react";
import { create } from "zustand";
import type { HydratedKeyGraphDTO } from "../../../keygen/hydration/types";
import { RFEdge, RFNode } from "../components/types";
import {
  computeKeyTreeLayout,
  layoutKeyTree,
} from "../layout/computeKeyTreeLayout";
import { buildReactFlowFromGraph } from "../rf-adapters/buildReactFlow";

type KeyEditorState = {
  // Minimal structural metadata
  rootNodeId: string | null;

  // metadata state
  keyId: number | null;
  name: string;
  description: string;

  // react-flow state (canonical in the editor)
  nodes: RFNode[];
  edges: RFEdge[];
  dirty: boolean;

  /**
   * Partially update key metadata.
   */
  updateMeta: (patch: { name?: string; description?: string }) => void;

  /**
   * Load an existing, saved key (from getKeyFn).
   * Builds RF graph from the persisted graph DTO and marks dirty = false.
   */
  loadSavedKey: (payload: {
    id: number;
    name: string;
    description: string;
    graph: HydratedKeyGraphDTO;
  }) => void;

  /**
   * Initialize a brand-new key from a generated graph (from generateKeyFn).
   * Builds RF graph from DTO and marks dirty = true.
   */
  initFromGeneratedKey: (payload: { graph: HydratedKeyGraphDTO }) => void;

  /**
   * Delete branches by branchId (used for both UI and RF-driven deletions).
   */
  deleteBranches: (branchIds: string[]) => void;

  /**
   * Update the annotation for a given branch ID (edge data only).
   */
  updateBranchAnnotation: (branchId: string, annotation: string | null) => void;

  /**
   * Recompute node positions from the current RF graph using tree layout.
   */
  autoLayout: () => void;

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
  rootNodeId: null,

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

  loadSavedKey: ({ id, name, description, graph }) => {
    const { nodes, edges, rootRfId } = buildReactFlowFromGraph(graph);
    const laidOutNodes = layoutKeyTree(nodes, edges);

    set({
      keyId: id,
      name,
      description,
      rootNodeId: rootRfId,
      nodes: laidOutNodes,
      edges,
      dirty: false,
    });
  },

  initFromGeneratedKey: ({ graph }) => {
    const { nodes, edges, rootRfId } = buildReactFlowFromGraph(graph);
    const laidOutNodes = layoutKeyTree(nodes, edges);

    set({
      keyId: null,
      name: "",
      description: "",
      rootNodeId: rootRfId,
      nodes: laidOutNodes,
      edges,
      dirty: true,
    });
  },

  deleteBranches: (branchIds) => {
    if (!branchIds.length) return;

    const toDelete = new Set(branchIds);

    set((state) => {
      const nextEdges = state.edges.filter((edge) => {
        const edgeBranchId = edge.data?.branchId;
        if (!edgeBranchId) return true;
        return !toDelete.has(edgeBranchId);
      });

      return {
        ...state,
        edges: nextEdges,
        dirty: true,
      };
    });
  },

  updateBranchAnnotation: (branchId, annotation) =>
    set((state) => {
      const nextEdges = state.edges.map((edge) => {
        if (edge.data?.branchId !== branchId || !edge.data?.rationale) {
          return edge;
        }

        return {
          ...edge,
          data: {
            ...edge.data,
            rationale: {
              ...edge.data.rationale,
              annotation,
            },
          },
        };
      }) as RFEdge[];

      return {
        ...state,
        edges: nextEdges,
        dirty: true,
      };
    }),

  autoLayout: () => {
    const { nodes, edges, rootNodeId } = get();
    if (!nodes.length || !rootNodeId) return;

    const layoutPositions = computeKeyTreeLayout(nodes, edges);

    const nextNodes = nodes.map((node) => {
      const pos = layoutPositions.get(node.id);
      if (!pos) return node;
      return {
        ...node,
        position: pos,
      };
    });

    set({ nodes: nextNodes });
  },

  markSaved: (id) =>
    set((state) => ({
      keyId: id ?? state.keyId,
      dirty: false,
    })),

  reset: () =>
    set({
      rootNodeId: null,
      keyId: null,
      name: "",
      description: "",
      nodes: [],
      edges: [],
      dirty: false,
    }),

  // TODO: dirtiness logic could be improved to track actual changes
  onNodesChange: (changes) => {
    set({
      nodes: applyNodeChanges<RFNode>(changes, get().nodes),
      dirty: true,
    });
  },
  onEdgesChange: (changes) => {
    set({
      edges: applyEdgeChanges<RFEdge>(changes, get().edges),
      dirty: true,
    });
  },
}));
