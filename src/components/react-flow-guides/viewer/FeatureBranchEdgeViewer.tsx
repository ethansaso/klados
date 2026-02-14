import { Card, Strong, Text } from "@radix-ui/themes";
import {
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
  Position,
  type EdgeProps,
} from "@xyflow/react";
import type { HydratedBranchRationale } from "../../../keygen/hydration/types";
import type { RFFeatureBranchEdge } from "../editor/data/types";

type FeatureStatusMap = Record<string, "present" | "absent">;

function buildFeatureStatusMap(
  r: HydratedBranchRationale | null,
): FeatureStatusMap {
  if (!r || r.kind !== "feature-present-absent") return {};

  const map: FeatureStatusMap = {};
  for (const g of Object.values(r.features)) {
    map[g.name] = g.status;
  }
  return map;
}

export default function FeatureBranchEdgeViewer(
  props: EdgeProps<RFFeatureBranchEdge>,
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

  const features = buildFeatureStatusMap(data.rationale);
  const hasFeatures = Object.keys(features).length > 0;

  return (
    <>
      <BaseEdge id={id} path={path} markerEnd={markerEnd} />

      {hasFeatures && (
        <EdgeLabelRenderer>
          <Card
            style={{
              position: "absolute",
              transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
              maxWidth: "250px",
              padding: 8,
            }}
          >
            {Object.entries(features).map(([name, status]) => (
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
