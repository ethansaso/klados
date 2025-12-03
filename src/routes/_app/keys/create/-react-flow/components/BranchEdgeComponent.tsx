import {
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
  type EdgeProps,
} from "@xyflow/react";
import type { KeyBranchRationale } from "../../../../../../keygen/key-building/types";
import { RFBranchEdge } from "./types";

function formatRationale(rationale: KeyBranchRationale | null): string {
  if (!rationale) return "";

  if (rationale.kind === "character-definition") {
    const charIds = Object.keys(rationale.characters);
    return `char ${charIds.join(",")}`;
  }

  if (rationale.kind === "group-present-absent") {
    const groupIds = Object.values(rationale.groups).map((g) => {
      return `${g.groupId}:${g.status[0]}`; // e.g. "4:p"
    });
    return `group ${groupIds.join(",")}`;
  }

  return "";
}

export default function BranchEdgeComponent(props: EdgeProps<RFBranchEdge>) {
  const { id, sourceX, sourceY, targetX, targetY, markerEnd, data } = props;

  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
  });

  const label = formatRationale(data?.rationale ?? null);

  return (
    <>
      <BaseEdge id={id} path={edgePath} markerEnd={markerEnd} />
      {label && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: "absolute",
              transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
              pointerEvents: "none",
              fontSize: 10,
              background: "rgba(255, 255, 255, 0.85)",
              padding: "2px 4px",
              borderRadius: 4,
              border: "1px solid #ccc",
              whiteSpace: "nowrap",
            }}
          >
            {label}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
}
