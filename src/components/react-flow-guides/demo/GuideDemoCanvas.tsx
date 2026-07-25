import { Flex, Text } from "@radix-ui/themes";
import { useQuery } from "@tanstack/react-query";
import {
  Controls,
  ReactFlow,
  useEdgesState,
  useNodesState,
} from "@xyflow/react";
import { themeQueryOptions } from "../../../lib/queries/theme";
import { DEFAULT_THEME } from "../../../lib/utils/theme";
import LogoBackground from "../bg/LogoBackground";
import { demoEdges, demoNodes } from "./demoData";
import { demoEdgeTypes, demoNodeTypes } from "./demoTypes";

export const GuideDemoCanvas = () => {
  const [nodes, , onNodesChange] = useNodesState(demoNodes);
  const [edges, , onEdgesChange] = useEdgesState(demoEdges);
  const { data: theme } = useQuery(themeQueryOptions());

  return (
    <Flex
      direction="column"
      width="100%"
      height="400px"
      className="rf-demo__wrapper"
    >
      <ReactFlow
        className="rf-demo__canvas"
        colorMode={theme ?? DEFAULT_THEME}
        nodes={nodes}
        edges={edges}
        nodeTypes={demoNodeTypes}
        edgeTypes={demoEdgeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onBeforeDelete={async () => false}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={false}
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
