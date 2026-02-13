import { Box } from "@radix-ui/themes";
import { ReactFlow } from "@xyflow/react";
import LogoBackground from "./bg/LogoBackground";
import { edgeTypes, nodeTypes } from "./editor/data/types";
import { useGuideEditorStore } from "./editor/data/useGuideEditorStore";

export function GuideEditorCanvas() {
  const nodes = useGuideEditorStore((s) => s.nodes);
  const edges = useGuideEditorStore((s) => s.edges);
  const onNodesChange = useGuideEditorStore((s) => s.onNodesChange);
  const onEdgesChange = useGuideEditorStore((s) => s.onEdgesChange);

  return (
    <Box width="100%">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
        minZoom={0.2}
        proOptions={{ hideAttribution: true }}
      >
        <LogoBackground />
      </ReactFlow>
    </Box>
  );
}
