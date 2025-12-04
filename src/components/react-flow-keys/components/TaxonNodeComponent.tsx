import { Box, Card, Flex, Text } from "@radix-ui/themes";
import { Handle, NodeProps, Position } from "@xyflow/react";
import { RFTaxonNode } from "./types";

export default function TaxonNodeComponent({ data }: NodeProps<RFTaxonNode>) {
  const n = data.keyNode;
  const { imgUrl, commonName, sciName } = n;

  return (
    <Card className="taxon-node">
      <img
        src={imgUrl ?? "/logos/LogoDotted.svg"}
        alt={commonName ?? sciName}
        loading="lazy"
        style={{ border: "1px solid var(--gray-5)" }}
        onError={(e) => {
          e.currentTarget.onerror = null; // prevent infinite loop
          e.currentTarget.src = "/logos/LogoDotted.svg";
        }}
      />
      <Flex direction="column" flexGrow="1" justify="between">
        <Box>
          <Text as="div" weight="bold" truncate>
            {sciName}
          </Text>
          {commonName && (
            <Text as="div" size="1" mb="1" color="gray" truncate>
              {commonName}
            </Text>
          )}
        </Box>
      </Flex>
      <Handle type="target" position={Position.Left} />
      <Handle type="source" position={Position.Right} />
    </Card>
  );
}
