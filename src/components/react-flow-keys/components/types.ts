import { Node, NodeTypes } from "@xyflow/react";
import {
  FrontendBranchRationale,
  FrontendCharRationale,
  FrontendKeyNode,
  FrontendTaxonNode,
} from "../../../keygen/hydration/types";
import { AssertedEdge } from "../util/assertedEdge";
import CharacterBranchEdgeComponent from "./CharacterBranchEdgeComponent";
import DiffNodeComponent from "./DiffNodeComponent";
import GroupBranchEdgeComponent from "./GroupBranchEdgeComponent";
import NullBranchEdgeComponent from "./NullBranchEdgeComponent";
import TaxonNodeComponent from "./TaxonNodeComponent";

export type KeyEditorTaxonNodeData = {
  keyNode: FrontendTaxonNode;
};
export type KeyEditorDiffNodeData = {
  keyNode: FrontendKeyNode;
};

export type RFTaxonNode = Node<KeyEditorTaxonNodeData, "taxonNode">;
export type RFDiffNode = Node<KeyEditorDiffNodeData, "diffNode">;

type BaseBranchEdgeData = {
  branchId: string;
};
export type KeyEditorCharacterBranchEdgeData = BaseBranchEdgeData & {
  rationale: FrontendCharRationale;
};
export type KeyEditorGroupBranchEdgeData = BaseBranchEdgeData & {
  rationale: FrontendBranchRationale;
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
