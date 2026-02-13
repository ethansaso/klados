import {
  applyEdgeChanges,
  applyNodeChanges,
  type EdgeChange,
  type NodeChange,
} from "@xyflow/react";
import { create } from "zustand";
import type { HydratedKeyGraphDTO } from "../../../../keygen/hydration/types";
import {
  computeGuideTreeLayout,
  layoutGuideTree,
} from "../../layout/computeGuideTreeLayout";
import { buildGraphFromReactFlow } from "../../rf-adapters/buildGraphFromReactFlow";
import { buildReactFlowFromGraph } from "../../rf-adapters/buildReactFlow";
import type { RFEdge, RFNode } from "./types";

type GuideEditorState = {
  // Minimal structural metadata
  rootNodeId: string | null;
  rootTaxonId: number | null;

  // metadata state
  guideId: number | null;
  name: string;
  description: string;

  // react-flow state (canonical in the editor)
  nodes: RFNode[];
  edges: RFEdge[];
  dirty: boolean;

  /**
   * Partially update guide metadata.
   */
  updateMeta: (patch: { name?: string; description?: string }) => void;

  /**
   * Load an existing, saved guide (from getGuideFn).
   * Builds RF graph from the persisted graph DTO and marks dirty = false.
   */
  loadSavedGuide: (payload: {
    id: number;
    rootTaxonId: number;
    name: string;
    description: string;
    graph: HydratedKeyGraphDTO;
  }) => void;

  /**
   * Initialize a brand-new guide from a generated graph (from generateGuideFn).
   * Builds RF graph from DTO and marks dirty = true.
   */
  initFromGeneratedGuide: (payload: {
    rootTaxonId: number;
    graph: HydratedKeyGraphDTO;
  }) => void;

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

  /**
   * Export the current editor state as a HydratedKeyGraphDTO for saving.
   * Returns null if there's no valid guide to save.
   */
  toSavePayload: () => {
    id: number | undefined;
    rootTaxonId: number;
    name: string;
    description: string;
    graph: HydratedKeyGraphDTO;
  } | null;

  // RF change handlers
  onNodesChange: (changes: NodeChange<RFNode>[]) => void;
  onEdgesChange: (changes: EdgeChange<RFEdge>[]) => void;
};

export const useGuideEditorStore = create<GuideEditorState>((set, get) => ({
  rootNodeId: null,
  rootTaxonId: null,

  guideId: null,
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

  loadSavedGuide: ({ id, rootTaxonId, name, description, graph }) => {
    const { nodes, edges, rootRfId } = buildReactFlowFromGraph(graph);
    const laidOutNodes = layoutGuideTree(nodes, edges);

    set({
      guideId: id,
      rootTaxonId,
      name,
      description,
      rootNodeId: rootRfId,
      nodes: laidOutNodes,
      edges,
      dirty: false,
    });
  },

  initFromGeneratedGuide: ({ rootTaxonId, graph }) => {
    const { nodes, edges, rootRfId } = buildReactFlowFromGraph(graph);
    const laidOutNodes = layoutGuideTree(nodes, edges);

    set({
      guideId: null,
      rootTaxonId,
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

    const layoutPositions = computeGuideTreeLayout(nodes, edges);

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
      guideId: id ?? state.guideId,
      dirty: false,
    })),

  reset: () =>
    set({
      rootNodeId: null,
      rootTaxonId: null,
      guideId: null,
      name: "",
      description: "",
      nodes: [],
      edges: [],
      dirty: false,
    }),

  toSavePayload: () => {
    const {
      nodes,
      edges,
      rootNodeId,
      rootTaxonId,
      guideId,
      name,
      description,
    } = get();

    if (!rootNodeId || !rootTaxonId || nodes.length === 0) {
      return null;
    }

    const graph = buildGraphFromReactFlow(nodes, edges, rootNodeId);

    return {
      id: guideId ?? undefined,
      rootTaxonId,
      name: name || "Untitled",
      description: description || "",
      graph,
    };
  },

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
