import type { NodeTypes } from "@xyflow/react";
import DiffNodeViewer from "./DiffNodeViewer";
import NullBranchEdgeViewer from "./NullBranchEdgeViewer";
import RichBranchEdgeViewer from "./RichBranchEdgeViewer";
import TaxonNodeViewer from "./TaxonNodeViewer";

export const viewerNodeTypes = {
  taxonNode: TaxonNodeViewer,
  diffNode: DiffNodeViewer,
} satisfies NodeTypes;

export const viewerEdgeTypes = {
  nullBranchEdge: NullBranchEdgeViewer,
  richBranchEdge: RichBranchEdgeViewer,
};
