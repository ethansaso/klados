import { Edge, Node, NodeTypes } from "@xyflow/react";
import {
  KeyBranchRationale,
  KeyNode,
} from "../../../../../../keygen/key-building/types";
import BranchEdgeComponent from "./BranchEdgeComponent";
import DiffNodeComponent from "./DiffNodeComponent";
import TaxonNodeComponent from "./TaxonNodeComponent";

export type KeyEditorNodeData = {
  keyNode: KeyNode;
};

export type RFTaxonNode = Node<KeyEditorNodeData, "taxonNode">;
export type RFDiffNode = Node<KeyEditorNodeData, "diffNode">;

export type KeyEditorEdgeData = {
  branchId: string;
  rationale: KeyBranchRationale | null;
};

export type RFBranchEdge = Edge<KeyEditorEdgeData, "branchEdge">;

export type RFNode = RFTaxonNode | RFDiffNode;
export type RFEdge = RFBranchEdge;

export const nodeTypes = {
  taxonNode: TaxonNodeComponent,
  diffNode: DiffNodeComponent,
} satisfies NodeTypes;

export const edgeTypes = {
  branchEdge: BranchEdgeComponent,
};
