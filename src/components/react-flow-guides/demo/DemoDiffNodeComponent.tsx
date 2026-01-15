import { Box, Text } from "@radix-ui/themes";
import { Handle, Position } from "@xyflow/react";
import { PiArrowsSplit } from "react-icons/pi";

export default function DiffNodeComponent() {
  return (
    <Box className="diff-node__wrapper">
      <Box className="diff-node">
        <Text as="div" size="5">
          <PiArrowsSplit />
        </Text>
      </Box>
      <Handle type="target" position={Position.Left} style={{ border: 0 }} />
      <Handle type="source" position={Position.Right} style={{ border: 0 }} />
    </Box>
  );
}
