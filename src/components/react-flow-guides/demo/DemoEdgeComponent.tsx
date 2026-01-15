import { Card, DataList, Flex, Text } from "@radix-ui/themes";
import {
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
  Position,
  type EdgeProps,
} from "@xyflow/react";
import { memo } from "react";
import { ColorBubble } from "../../trait-tokens/ColorBubble";
import { DemoEdge } from "./demoTypes";

const DemoEdgeComponent = memo((props: EdgeProps<DemoEdge>) => {
  const {
    id,
    sourceX,
    sourceY,
    targetX,
    targetY,
    markerEnd,
    data: { charStates },
  } = props;

  const [path, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition: Position.Right,
    targetX,
    targetY,
    targetPosition: Position.Left,
  });

  return (
    <>
      <BaseEdge id={id} path={path} markerEnd={markerEnd} />

      <EdgeLabelRenderer>
        <Card
          style={{
            position: "absolute",
            transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
            maxWidth: "250px",
            pointerEvents: "all",
          }}
        >
          <DataList.Root size="1">
            {Object.entries(charStates).map(([charName, states]) => (
              <DataList.Item key={charName}>
                <DataList.Label minWidth="60" maxWidth="60">
                  {charName}
                </DataList.Label>
                <DataList.Value>
                  <Flex wrap="wrap" gap="1">
                    {states.map((s, idx) => (
                      <Flex
                        key={s.label}
                        display="inline-flex"
                        align="center"
                        gap="1"
                      >
                        {s.hexCode && (
                          <ColorBubble size={8} hexColor={s.hexCode} />
                        )}
                        <Text>
                          {s.label}
                          {idx !== states.length - 1 && ","}
                        </Text>
                      </Flex>
                    ))}
                  </Flex>
                </DataList.Value>
              </DataList.Item>
            ))}
          </DataList.Root>
        </Card>
      </EdgeLabelRenderer>
    </>
  );
});

export default DemoEdgeComponent;
