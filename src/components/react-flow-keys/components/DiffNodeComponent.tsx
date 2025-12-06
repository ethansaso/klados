import { Handle, Position } from "@xyflow/react";

export default function DiffNodeComponent() {
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
