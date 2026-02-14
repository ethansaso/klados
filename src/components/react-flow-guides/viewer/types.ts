import type { NodeTypes } from "@xyflow/react";
import CharacterBranchEdgeViewer from "./CharacterBranchEdgeViewer";
import DiffNodeViewer from "./DiffNodeViewer";
import FeatureBranchEdgeViewer from "./FeatureBranchEdgeViewer";
import NullBranchEdgeViewer from "./NullBranchEdgeViewer";
import TaxonNodeViewer from "./TaxonNodeViewer";

export const viewerNodeTypes = {
  taxonNode: TaxonNodeViewer,
  diffNode: DiffNodeViewer,
} satisfies NodeTypes;

export const viewerEdgeTypes = {
  nullBranchEdge: NullBranchEdgeViewer,
  characterBranchEdge: CharacterBranchEdgeViewer,
  featureBranchEdge: FeatureBranchEdgeViewer,
};
