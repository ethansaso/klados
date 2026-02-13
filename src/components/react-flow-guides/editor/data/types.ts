import type { Node, NodeTypes } from "@xyflow/react";
import type {
  HydratedBranchRationale,
  HydratedCharRationale,
  HydratedDiffNode,
  HydratedTaxonNode,
} from "../../../../keygen/hydration/types";
import type { AssertedEdge } from "../../util/assertedEdge";
import CharacterBranchEdgeComponent from "../components/CharacterBranchEdgeComponent";
import DiffNodeComponent from "../components/DiffNodeComponent";
import GroupBranchEdgeComponent from "../components/GroupBranchEdgeComponent";
import NullBranchEdgeComponent from "../components/NullBranchEdgeComponent";
import TaxonNodeComponent from "../components/TaxonNodeComponent";

export type GuideEditorTaxonNodeData = HydratedTaxonNode;
export type GuideEditorDiffNodeData = HydratedDiffNode;

export type RFTaxonNode = Node<GuideEditorTaxonNodeData, "taxonNode">;
export type RFDiffNode = Node<GuideEditorDiffNodeData, "diffNode">;

type BaseBranchEdgeData = {
  branchId: string;
};
export type GuideEditorCharacterBranchEdgeData = BaseBranchEdgeData & {
  rationale: HydratedCharRationale;
};
export type GuideEditorGroupBranchEdgeData = BaseBranchEdgeData & {
  rationale: HydratedBranchRationale;
};
export type GuideEditorNullBranchEdgeData = BaseBranchEdgeData & {
  rationale: null;
};

export type RFCharacterBranchEdge = AssertedEdge<
  GuideEditorCharacterBranchEdgeData,
  "characterBranchEdge"
>;
export type RFGroupBranchEdge = AssertedEdge<
  GuideEditorGroupBranchEdgeData,
  "groupBranchEdge"
>;
export type RFNullBranchEdge = AssertedEdge<
  GuideEditorNullBranchEdgeData,
  "nullBranchEdge"
>;

export type RFNode = RFTaxonNode | RFDiffNode;
export type RFEdge =
  | RFCharacterBranchEdge
  | RFGroupBranchEdge
  | RFNullBranchEdge;

export const nodeTypes = {
  taxonNode: TaxonNodeComponent,
  diffNode: DiffNodeComponent,
} satisfies NodeTypes;

export const edgeTypes = {
  nullBranchEdge: NullBranchEdgeComponent,
  characterBranchEdge: CharacterBranchEdgeComponent,
  groupBranchEdge: GroupBranchEdgeComponent,
};
