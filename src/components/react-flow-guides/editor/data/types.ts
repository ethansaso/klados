import type { Node, NodeTypes } from "@xyflow/react";
import type {
  HydratedDiffNode,
  HydratedRichRationale,
  HydratedTaxonNode,
} from "../../../../keygen/hydration/types";
import type { AssertedEdge } from "../../util/assertedEdge";
import DiffNodeComponent from "../components/DiffNodeComponent";
import NullBranchEdgeComponent from "../components/NullBranchEdgeComponent";
import RichBranchEdgeComponent from "../components/RichBranchEdgeComponent";
import TaxonNodeComponent from "../components/TaxonNodeComponent";

export type GuideEditorTaxonNodeData = HydratedTaxonNode;
export type GuideEditorDiffNodeData = HydratedDiffNode;

export type RFTaxonNode = Node<GuideEditorTaxonNodeData, "taxonNode">;
export type RFDiffNode = Node<GuideEditorDiffNodeData, "diffNode">;

type BaseBranchEdgeData = {
  branchId: string;
};
export type GuideEditorRichBranchEdgeData = BaseBranchEdgeData & {
  rationale: HydratedRichRationale;
};
export type GuideEditorNullBranchEdgeData = BaseBranchEdgeData & {
  rationale: null;
};

export type RFRichBranchEdge = AssertedEdge<
  GuideEditorRichBranchEdgeData,
  "richBranchEdge"
>;
export type RFNullBranchEdge = AssertedEdge<
  GuideEditorNullBranchEdgeData,
  "nullBranchEdge"
>;

export type RFNode = RFTaxonNode | RFDiffNode;
export type RFEdge = RFRichBranchEdge | RFNullBranchEdge;

export const nodeTypes = {
  taxonNode: TaxonNodeComponent,
  diffNode: DiffNodeComponent,
} satisfies NodeTypes;

export const edgeTypes = {
  nullBranchEdge: NullBranchEdgeComponent,
  richBranchEdge: RichBranchEdgeComponent,
};
