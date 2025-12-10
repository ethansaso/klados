import { Node, NodeTypes } from "@xyflow/react";
import {
  HydratedBranchRationale,
  HydratedCharRationale,
  HydratedDiffNode,
  HydratedTaxonNode,
} from "../../../keygen/hydration/types";
import CharacterBranchEdgeComponent from "../components/CharacterBranchEdgeComponent";
import DiffNodeComponent from "../components/DiffNodeComponent";
import GroupBranchEdgeComponent from "../components/GroupBranchEdgeComponent";
import NullBranchEdgeComponent from "../components/NullBranchEdgeComponent";
import TaxonNodeComponent from "../components/TaxonNodeComponent";
import { AssertedEdge } from "../util/assertedEdge";

export type KeyEditorTaxonNodeData = HydratedTaxonNode;
export type KeyEditorDiffNodeData = HydratedDiffNode;

export type RFTaxonNode = Node<KeyEditorTaxonNodeData, "taxonNode">;
export type RFDiffNode = Node<KeyEditorDiffNodeData, "diffNode">;

type BaseBranchEdgeData = {
  branchId: string;
};
export type KeyEditorCharacterBranchEdgeData = BaseBranchEdgeData & {
  rationale: HydratedCharRationale;
};
export type KeyEditorGroupBranchEdgeData = BaseBranchEdgeData & {
  rationale: HydratedBranchRationale;
};
export type KeyEditorNullBranchEdgeData = BaseBranchEdgeData & {
  rationale: null;
};

export type RFCharacterBranchEdge = AssertedEdge<
  KeyEditorCharacterBranchEdgeData,
  "characterBranchEdge"
>;
export type RFGroupBranchEdge = AssertedEdge<
  KeyEditorGroupBranchEdgeData,
  "groupBranchEdge"
>;
export type RFNullBranchEdge = AssertedEdge<
  KeyEditorNullBranchEdgeData,
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
