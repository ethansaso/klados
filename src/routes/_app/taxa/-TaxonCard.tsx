import { Card, Flex, Text } from "@radix-ui/themes";
import { Link } from "@tanstack/react-router";
import { PiTreeStructure } from "react-icons/pi";
import { TaxonDTO } from "../../../lib/serverFns/taxa/types";
import { capitalizeWord } from "../../../lib/utils/capitalizeWord";

export const TaxonCard = ({ taxon }: { taxon: TaxonDTO }) => {
  return (
    <Card className="taxon-card" asChild>
      <Link to="/taxa/$id" params={{ id: String(taxon.id) }}>
        <img src={taxon.media[0].url} alt={taxon.acceptedName} loading="lazy" />
        <Text as="div" size="1" weight="bold" color="gray">
          {capitalizeWord(taxon.rank)}
        </Text>
        <Text weight="bold">{taxon.acceptedName}</Text>
        <Flex align="center" gap="1" className="summary" asChild>
          <Text as="div" size="1" color="gray">
            <PiTreeStructure />
            {taxon.activeChildCount} child
            {taxon.activeChildCount === 1 ? "" : "ren"}
          </Text>
        </Flex>
      </Link>
    </Card>
  );
};
