import { Card, DataList, Separator, Text } from "@radix-ui/themes";
import {
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
  Position,
  type EdgeProps,
} from "@xyflow/react";
import { memo } from "react";
import { CharacterStateDisplay } from "../../state-formatting/displays/CharacterStateDisplay";
import type { RFCharacterBranchEdge } from "../editor/data/types";

const CharacterBranchEdgeViewer = memo(
  (props: EdgeProps<RFCharacterBranchEdge>) => {
    const {
      id,
      sourceX,
      sourceY,
      targetX,
      targetY,
      markerEnd,
      data: {
        rationale: { characters, annotation },
      },
    } = props;

    const [path, labelX, labelY] = getBezierPath({
      sourceX,
      sourceY,
      sourcePosition: Position.Right,
      targetX,
      targetY,
      targetPosition: Position.Left,
    });

    const hasAnnotation = !!annotation && annotation.trim().length > 0;

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
              {Object.entries(characters).map(([charId, meta]) => (
                <DataList.Item key={charId}>
                  <DataList.Label minWidth="60" maxWidth="60">
                    {meta.name}
                  </DataList.Label>
                  <DataList.Value>
                    {meta.inverted ? (
                      "Other"
                    ) : (
                      <CharacterStateDisplay
                        state={{
                          kind: "categorical",
                          traitValues: meta.traits,
                        }}
                      />
                    )}
                  </DataList.Value>
                </DataList.Item>
              ))}
            </DataList.Root>

            {hasAnnotation && (
              <>
                <Separator my="2" size="4" />
                <Text as="div" size="1" color="gray">
                  {annotation}
                </Text>
              </>
            )}
          </Card>
        </EdgeLabelRenderer>
      </>
    );
  },
);

export default CharacterBranchEdgeViewer;
