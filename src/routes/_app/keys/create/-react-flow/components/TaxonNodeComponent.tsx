import { Handle, NodeProps, Position } from "@xyflow/react";
import { RFTaxonNode } from "./types";

export default function TaxonNodeComponent({ data }: NodeProps<RFTaxonNode>) {
  const node = data.keyNode;

  return (
    <div
      style={{
        padding: "6px 10px",
        borderRadius: "6px",
        border: "1px solid #ccc",
        background: "#fff",
        fontSize: "12px",
        minWidth: 80,
        textAlign: "center",
      }}
    >
      <strong>Taxon {node.id}</strong>

      <Handle type="target" position={Position.Top} style={{ border: 0 }} />
      <Handle type="source" position={Position.Bottom} style={{ border: 0 }} />
    </div>
  );
}
