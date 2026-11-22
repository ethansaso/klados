import { Box, Card, Flex, Text } from "@radix-ui/themes";
import { Handle, type NodeProps, Position } from "@xyflow/react";
import { formatTaxonName } from "../../../lib/utils/formatting/formatTaxonName";
import { AnnotationBubbleWrap } from "../../annotations/AnnotationBubbleWrap";
import { MediaImage } from "../../MediaImage";
import { TaxonName } from "../../TaxonName";
import type { RFTaxonNode } from "../editor/data/types";

export default function TaxonNodeViewer({ data }: NodeProps<RFTaxonNode>) {
  const n = data;
  const { primaryMedia, commonName, sciName, rank } = n;

  return (
    <AnnotationBubbleWrap media={primaryMedia} spacing="4">
      <Card className="taxon-node">
        <MediaImage
          media={primaryMedia}
          fallbackSrc="/logos/LogoDotted.svg"
          // Doesn't account for canvas zoom
          sizes="192px"
          alt={commonName ?? (rank ? formatTaxonName(rank, sciName) : sciName)}
          loading="lazy"
          style={{ border: "1px solid var(--gray-5)" }}
        />

        <Flex direction="column" flexGrow="1" justify="between">
          <Box>
            <Text as="div" weight="bold" truncate>
              {rank ? <TaxonName rank={rank} name={sciName} /> : sciName}
            </Text>
            {commonName && (
              <Text as="div" size="1" mb="1" color="gray" truncate>
                {commonName}
              </Text>
            )}
          </Box>
        </Flex>
      </Card>
      <Handle type="target" position={Position.Left} />
      <Handle type="source" position={Position.Right} />
    </AnnotationBubbleWrap>
  );
}
