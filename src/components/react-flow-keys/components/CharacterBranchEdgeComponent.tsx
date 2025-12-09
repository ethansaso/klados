import { Card, ContextMenu, DataList } from "@radix-ui/themes";
import {
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
  Position,
  type EdgeProps,
} from "@xyflow/react";
import { memo } from "react";
import { TraitTokenList } from "../../trait-tokens/TraitTokenList";
import { RFCharacterBranchEdge } from "./types";

const CharacterBranchEdgeComponent = memo(
  (props: EdgeProps<RFCharacterBranchEdge>) => {
    const { id, sourceX, sourceY, targetX, targetY, markerEnd, data } = props;
    const {
      rationale: { characters },
    } = data;

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
        <ContextMenu.Root>
          <ContextMenu.Trigger>
            <g>
              <BaseEdge id={id} path={path} markerEnd={markerEnd} />
            </g>
          </ContextMenu.Trigger>

          <ContextMenu.Content>
            <ContextMenu.Item disabled>Character Branch Edge</ContextMenu.Item>
          </ContextMenu.Content>
        </ContextMenu.Root>

        <EdgeLabelRenderer>
          <Card
            style={{
              position: "absolute",
              transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
              maxWidth: "250px",
            }}
          >
            <DataList.Root size="1">
              {Object.entries(characters).map(([charId, meta]) => (
                <DataList.Item key={charId}>
                  <DataList.Label minWidth="60" maxWidth="60">
                    {meta.name}
                  </DataList.Label>
                  <DataList.Value>
                    <TraitTokenList traits={meta.traits} />
                  </DataList.Value>
                </DataList.Item>
              ))}
            </DataList.Root>
          </Card>
        </EdgeLabelRenderer>
      </>
    );
  }
);

export default CharacterBranchEdgeComponent;
