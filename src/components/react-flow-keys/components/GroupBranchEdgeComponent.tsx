import { Card, Strong, Text } from "@radix-ui/themes";
import {
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
  Position,
  type EdgeProps,
} from "@xyflow/react";
import type { HydratedBranchRationale } from "../../../keygen/hydration/types";
import { RFGroupBranchEdge } from "../data/types";

type GroupStatusMap = Record<string, "present" | "absent">;

function buildGroupStatusMap(
  r: HydratedBranchRationale | null
): GroupStatusMap {
  if (!r || r.kind !== "group-present-absent") return {};

  const map: GroupStatusMap = {};
  for (const g of Object.values(r.groups)) {
    map[g.name] = g.status; // already "present" | "absent"
  }
  return map;
}

export default function GroupBranchEdgeComponent(
  props: EdgeProps<RFGroupBranchEdge>
) {
  const { id, sourceX, sourceY, targetX, targetY, markerEnd, data } = props;

  const [path, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition: Position.Right,
    targetX,
    targetY,
    targetPosition: Position.Left,
  });

  const groups = buildGroupStatusMap(data.rationale);

  const hasGroups = Object.keys(groups).length > 0;

  return (
    <>
      <BaseEdge id={id} path={path} markerEnd={markerEnd} />

      {hasGroups && (
        <EdgeLabelRenderer>
          <Card
            style={{
              position: "absolute",
              transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
              maxWidth: "250px",
              padding: 8,
            }}
          >
            {Object.entries(groups).map(([name, status]) => (
              <Text key={name} size="1" as="div">
                <Strong>{name}</Strong> {status}
              </Text>
            ))}
          </Card>
        </EdgeLabelRenderer>
      )}
    </>
  );
}
