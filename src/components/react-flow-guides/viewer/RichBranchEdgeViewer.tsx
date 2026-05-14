import { Card, DataList, Separator, Strong, Text } from "@radix-ui/themes";
import {
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
  Position,
  type EdgeProps,
} from "@xyflow/react";
import { memo } from "react";
import { CharacterStateDisplay } from "../../state-formatting/CharacterStateDisplay";
import type { RFRichBranchEdge } from "../editor/data/types";

const RichBranchEdgeViewer = memo((props: EdgeProps<RFRichBranchEdge>) => {
  const {
    id,
    sourceX,
    sourceY,
    targetX,
    targetY,
    markerEnd,
    data: {
      rationale: { features, annotation },
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
  const featureEntries = Object.entries(features);

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
          {featureEntries.map(([featureId, fEntry]) => (
            <div key={featureId}>
              {fEntry.presence === "absent" ? (
                <Text size="1" as="div">
                  <Strong>{fEntry.name}</Strong>: absent
                </Text>
              ) : Object.keys(fEntry.characters).length === 0 ? (
                <Text size="1" as="div">
                  <Strong>{fEntry.name}</Strong>: present
                </Text>
              ) : (
                <>
                  <Text size="1" as="div" color="gray">
                    {fEntry.name}
                  </Text>
                  <DataList.Root size="1">
                    {Object.entries(fEntry.characters).map(
                      ([charId, charEntry]) => (
                        <DataList.Item key={charId}>
                          <DataList.Label minWidth="60" maxWidth="60">
                            {charEntry.name}
                          </DataList.Label>
                          <DataList.Value>
                            {charEntry.inverted ? (
                              "Other"
                            ) : (
                              <CharacterStateDisplay
                                states={charEntry.traits.map((trait) => ({
                                  kind: "categorical",
                                  trait,
                                  modifiers: [],
                                }))}
                              />
                            )}
                          </DataList.Value>
                        </DataList.Item>
                      ),
                    )}
                  </DataList.Root>
                </>
              )}
            </div>
          ))}

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
});

export default RichBranchEdgeViewer;
