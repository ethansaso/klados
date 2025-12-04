import { Handle, NodeProps, Position } from "@xyflow/react";
import { RFDiffNode } from "./types";

export default function DiffNodeComponent({}: NodeProps<RFDiffNode>) {
  return (
    <div
      style={{
        padding: "4px 8px",
        borderRadius: "8px",
        border: "1px dashed #888",
        background: "#fafafa",
        fontSize: 11,
        fontStyle: "italic",
        textAlign: "center",
        minWidth: 60,
      }}
    >
      Split
      <Handle type="target" position={Position.Top} style={{ border: 0 }} />
      <Handle type="source" position={Position.Bottom} style={{ border: 0 }} />
    </div>
  );
}
