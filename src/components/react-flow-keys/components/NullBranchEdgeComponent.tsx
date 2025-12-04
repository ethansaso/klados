import {
  BaseEdge,
  getBezierPath,
  Position,
  type EdgeProps,
} from "@xyflow/react";
import { memo } from "react";
import { RFNullBranchEdge } from "./types";

const NullBranchEdgeComponent = memo((props: EdgeProps<RFNullBranchEdge>) => {
  const { id, sourceX, sourceY, targetX, targetY, markerEnd, data } = props;

  const [path] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition: Position.Right,
    targetX,
    targetY,
    targetPosition: Position.Left,
  });
  return <BaseEdge id={id} path={path} markerEnd={markerEnd} />;
});

export default NullBranchEdgeComponent;
