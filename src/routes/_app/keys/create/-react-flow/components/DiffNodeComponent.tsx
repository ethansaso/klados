import { Handle, NodeProps, Position } from "@xyflow/react";
import { RFDiffNode } from "./types";

export default function DiffNodeComponent({ data }: NodeProps<RFDiffNode>) {
  return (
    <div
      style={{
        padding: "4px 8px",
        borderRadius: "9999px",
        border: "1px dashed #999",
        background: "#f7f7f7",
        fontSize: "11px",
        minWidth: 50,
        textAlign: "center",
      }}
    >
      <em>Split</em>

      <Handle type="target" position={Position.Top} style={{ border: 0 }} />
      <Handle type="source" position={Position.Bottom} style={{ border: 0 }} />
    </div>
  );
}
