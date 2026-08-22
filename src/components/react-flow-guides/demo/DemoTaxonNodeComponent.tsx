import { Box, Card, Flex, Text } from "@radix-ui/themes";
import { Handle, type NodeProps, Position } from "@xyflow/react";
import { AnnotationBubbleWrap } from "../../annotations/AnnotationBubbleWrap";
import type { DemoTaxonNode } from "./demoTypes";

export const DemoTaxonNodeComponent = ({ data }: NodeProps<DemoTaxonNode>) => {
  const n = data;
  const { primaryMedia, commonName, sciName } = n;

  return (
    <AnnotationBubbleWrap media={primaryMedia} spacing="2">
      <Card className="demo-taxon-node">
        <img
          src={primaryMedia?.url ?? "/logos/LogoDotted.svg"}
          alt={commonName ?? sciName}
          loading="lazy"
          style={{ border: "1px solid var(--gray-5)" }}
          onError={(e) => {
            e.currentTarget.onerror = null;
            e.currentTarget.src = "/logos/LogoDotted.svg";
          }}
        />

        <Flex direction="column" flexGrow="1" justify="between">
          <Box>
            {commonName ? (
              <>
                <Text as="div" weight="bold" truncate size="2">
                  {commonName}
                </Text>
                <Text as="div" size="1" color="gray" truncate>
                  {sciName}
                </Text>
              </>
            ) : (
              <Text as="div" weight="bold" truncate size="2">
                {sciName}
              </Text>
            )}
          </Box>
        </Flex>
      </Card>
      <Handle type="target" position={Position.Left} />
      <Handle type="source" position={Position.Right} />
    </AnnotationBubbleWrap>
  );
};
