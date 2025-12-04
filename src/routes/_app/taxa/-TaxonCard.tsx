import { Box, Card, Flex, Text } from "@radix-ui/themes";
import { Link } from "@tanstack/react-router";
import { PiTreeStructure } from "react-icons/pi";
import { TaxonDTO } from "../../../lib/domain/taxa/types";
import { capitalizeFirstLetter } from "../../../lib/utils/casing";

export const TaxonCard = ({ taxon }: { taxon: TaxonDTO }) => {
  const primaryMedia = taxon.media[0];
  return (
    <Card className="taxon-card" asChild>
      <Link to="/taxa/$id" params={{ id: String(taxon.id) }}>
        <img
          src={primaryMedia?.url ?? "/logos/LogoDotted.svg"}
          alt={taxon.acceptedName}
          loading="lazy"
          onError={(e) => {
            e.currentTarget.onerror = null; // prevent infinite loop
            e.currentTarget.src = "/logos/LogoDotted.svg";
          }}
        />
        <Flex direction="column" flexGrow="1" justify="between">
          <Box mb="1">
            <Text as="div" size="1" weight="bold" color="gray">
              {capitalizeFirstLetter(taxon.rank)}
            </Text>
            <Text as="div" weight="bold" truncate>
              {taxon.acceptedName}
            </Text>
            {taxon.preferredCommonName && (
              <Text as="div" size="1" mb="1" color="gray" truncate>
                {taxon.preferredCommonName}
              </Text>
            )}
          </Box>
          <Flex align="center" gap="1" className="summary" asChild>
            <Text as="div" size="1" color="gray">
              <PiTreeStructure />
              {taxon.activeChildCount}{" "}
              {taxon.activeChildCount === 1 ? "subtaxon" : "subtaxa"}
            </Text>
          </Flex>
        </Flex>
      </Link>
    </Card>
  );
};
