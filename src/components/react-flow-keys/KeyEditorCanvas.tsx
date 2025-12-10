import { Box } from "@radix-ui/themes";
import { ReactFlow } from "@xyflow/react";
import LogoBackground from "./components/LogoBackground";
import { edgeTypes, nodeTypes } from "./data/types";
import { useKeyEditorStore } from "./data/useKeyEditorStore";

export function KeyEditorCanvas() {
  const nodes = useKeyEditorStore((s) => s.nodes);
  const edges = useKeyEditorStore((s) => s.edges);
  const onNodesChange = useKeyEditorStore((s) => s.onNodesChange);
  const onEdgesChange = useKeyEditorStore((s) => s.onEdgesChange);

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
