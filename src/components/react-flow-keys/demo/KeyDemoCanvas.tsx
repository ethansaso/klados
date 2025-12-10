import { Flex, Text } from "@radix-ui/themes";
import {
  Controls,
  ReactFlow,
  useEdgesState,
  useNodesState,
} from "@xyflow/react";
import LogoBackground from "../components/LogoBackground";
import { demoEdges, demoNodes } from "./demoData";
import { demoEdgeTypes, demoNodeTypes } from "./demoTypes";

export const KeyDemoCanvas = () => {
  const [nodes, , onNodesChange] = useNodesState(demoNodes);
  const [edges, , onEdgesChange] = useEdgesState(demoEdges);

  return (
    <Flex
      direction="column"
      width="100%"
      height="400px"
      className="rf-demo__wrapper"
    >
      <ReactFlow
        className="rf-demo__canvas"
        nodes={nodes}
        edges={edges}
        nodeTypes={demoNodeTypes}
        edgeTypes={demoEdgeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onBeforeDelete={async () => false}
        fitView
        minZoom={0.2}
        proOptions={{ hideAttribution: true }}
      >
        <LogoBackground />
        <Controls orientation="horizontal" />
      </ReactFlow>
      <Text color="gray" size="1" align="right" mt="2">
        * simplified data for illustrative purposes only
      </Text>
    </Flex>
  );
};
