import { Card, Text } from "@radix-ui/themes";
import { Handle, type NodeProps, Position } from "@xyflow/react";
import type { RFDiffNode } from "../editor/data/types";

export default function DiffNodeViewer({ data }: NodeProps<RFDiffNode>) {
  return (
    <>
      <Card className="diff-node">
        <Text as="div" size="2" color="gray">
          Split
        </Text>
      </Card>
      <Handle type="target" position={Position.Left} />
      <Handle type="source" position={Position.Right} />
    </>
  );
}
