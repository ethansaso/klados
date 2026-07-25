import { Box } from "@radix-ui/themes";
import { useQuery } from "@tanstack/react-query";
import { ReactFlow } from "@xyflow/react";
import { useMemo } from "react";
import type { HydratedKeyGraphDTO } from "../../keygen/hydration/types";
import { themeQueryOptions } from "../../lib/queries/theme";
import { DEFAULT_THEME } from "../../lib/utils/theme";
import LogoBackground from "./bg/LogoBackground";
import { layoutGuideTree } from "./layout/computeGuideTreeLayout";
import { buildReactFlowFromGraph } from "./rf-adapters/buildReactFlow";
import { viewerEdgeTypes, viewerNodeTypes } from "./viewer/types";

type GuideViewerCanvasProps = {
  graph: HydratedKeyGraphDTO;
};

export function GuideViewerCanvas({ graph }: GuideViewerCanvasProps) {
  const { data: theme } = useQuery(themeQueryOptions());
  const { nodes, edges } = useMemo(() => {
    const { nodes: rfNodes, edges: rfEdges } = buildReactFlowFromGraph(graph);
    const laidOutNodes = layoutGuideTree(rfNodes, rfEdges);
    return { nodes: laidOutNodes, edges: rfEdges };
  }, [graph]);

  return (
    <Box asChild width="100%" flexGrow="1">
      <ReactFlow
        colorMode={theme ?? DEFAULT_THEME}
        nodes={nodes}
        edges={edges}
        nodeTypes={viewerNodeTypes}
        edgeTypes={viewerEdgeTypes}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={false}
        fitView
        minZoom={0.2}
        proOptions={{ hideAttribution: true }}
      >
        <LogoBackground />
      </ReactFlow>
    </Box>
  );
}
